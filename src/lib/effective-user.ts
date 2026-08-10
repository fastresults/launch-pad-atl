// Impersonation-aware "who am I acting as" helper.
//
// AuthContext (src/hooks/use-auth.tsx) swaps `user.id` to the impersonation
// target for React reads, but client-side fetchers historically call
// `supabase.auth.getUser()` directly and filter by the actor's real id. Under
// RLS, admins can read any row, so those queries return the admin's own data
// while the surrounding UI thinks it's showing the target — a display leak.
//
// Every fetcher that filters by `user_id` on the client should route through
// `getEffectiveUserId()` instead of reading `auth.getUser().id` directly, and
// every edge call should go through `invokeEdge()` (src/lib/edge-invoke.ts).
import { supabase } from "@/integrations/supabase/client";

export const IMPERSONATION_KEY = "sl.impersonation.v1";

/** Where to send the admin back to when they exit impersonation. */
export const IMPERSONATION_RETURN_KEY = "sl.impersonation.return.v1";

export function readImpersonationReturnPath(): string {
  try {
    return sessionStorage.getItem(IMPERSONATION_RETURN_KEY) || "/admin/members";
  } catch {
    return "/admin/members";
  }
}

export function clearImpersonationReturnPath() {
  try {
    sessionStorage.removeItem(IMPERSONATION_RETURN_KEY);
  } catch {
    /* no-op */
  }
}

/** Impersonation auto-expires so a forgotten session can't quietly write later. */
export const IMPERSONATION_TTL_MS = 60 * 60 * 1000;

export type StoredImpersonation = {
  userId: string;
  name?: string;
  email?: string;
  logId?: string;
  /** epoch ms when impersonation started */
  startedAt?: number;
};

export function readStoredImpersonation(): StoredImpersonation | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    const raw = sessionStorage.getItem(IMPERSONATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredImpersonation;
    if (!parsed || typeof parsed.userId !== "string" || !parsed.userId) return null;
    if (parsed.startedAt && Date.now() - parsed.startedAt > IMPERSONATION_TTL_MS) {
      sessionStorage.removeItem(IMPERSONATION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearStoredImpersonation() {
  try {
    sessionStorage.removeItem(IMPERSONATION_KEY);
  } catch {
    /* no-op */
  }
}

export function writeStoredImpersonation(t: StoredImpersonation) {
  sessionStorage.setItem(
    IMPERSONATION_KEY,
    JSON.stringify({ ...t, startedAt: t.startedAt ?? Date.now() }),
  );
}

// Cache the actor's admin status for a short window to avoid a round-trip on
// every query. Cleared implicitly by page reload / navigation.
let adminCache: { actorId: string; isAdmin: boolean; ts: number } | null = null;
const ADMIN_CACHE_TTL_MS = 30_000;

async function isActorAdmin(actorId: string): Promise<boolean> {
  const now = Date.now();
  if (adminCache && adminCache.actorId === actorId && now - adminCache.ts < ADMIN_CACHE_TTL_MS) {
    return adminCache.isAdmin;
  }
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", actorId);
    if (error) throw error;
    const roles = (data ?? []).map((r: any) => r.role);
    const isAdmin = roles.includes("admin") || roles.includes("super_admin");
    adminCache = { actorId, isAdmin, ts: now };
    return isAdmin;
  } catch {
    return false;
  }
}

/**
 * Reads the signed-in user from the local session instead of calling
 * `supabase.auth.getUser()`, which is a network round trip to the auth server.
 * Polling queries (3–8s) used to fire one auth request per tick through this
 * path; `getSession()` reads the cached session and refreshes only when the
 * token is actually expiring.
 *
 * This is not a trust boundary: RLS validates the JWT server-side on every
 * request. The client only needs the id/email to shape its own queries.
 */
export async function getSessionUser(): Promise<import("@supabase/supabase-js").User | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

/**
 * Returns the effective user id for client-side data reads/writes:
 * the impersonation target when an admin is impersonating, otherwise the
 * real signed-in user's id. Throws if not signed in.
 */
export async function getEffectiveUserId(): Promise<string> {
  const actor = await getSessionUser();
  if (!actor) throw new Error("Not signed in");
  const impersonation = readStoredImpersonation();
  if (impersonation && (await isActorAdmin(actor.id))) {
    return impersonation.userId;
  }
  return actor.id;
}

/** Returns the real signed-in user's id, ignoring impersonation. Used for
 * audit fields ("set_by", "created_by_actor") and admin-only routes that
 * must always resolve to the actor. */
export async function getActorUserId(): Promise<string> {
  const actor = await getSessionUser();
  if (!actor) throw new Error("Not signed in");
  return actor.id;
}


/** Synchronous check for whether the current session is impersonating. */
export function isImpersonating(): boolean {
  return readStoredImpersonation() !== null;
}

/** Synchronous read of who the session is impersonating (id/name/email), or null. */
export function getImpersonationTarget(): StoredImpersonation | null {
  return readStoredImpersonation();
}

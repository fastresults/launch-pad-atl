// Impersonation-aware "who am I acting as" helper.
//
// AuthContext (src/hooks/use-auth.tsx) swaps `user.id` to the impersonation
// target for React reads, but client-side fetchers historically call
// `supabase.auth.getUser()` directly and filter by the actor's real id. Under
// RLS, admins can read any row, so those queries return the admin's own data
// while the surrounding UI thinks it's showing the target — a display leak.
//
// Every fetcher that filters by `user_id` on the client should route through
// `getEffectiveUserId()` instead of reading `auth.getUser().id` directly.
import { supabase } from "@/integrations/supabase/client";

const IMPERSONATION_KEY = "sl.impersonation.v1";

type StoredImpersonation = { userId: string; name?: string; email?: string; logId?: string };

function readStoredImpersonation(): StoredImpersonation | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    const raw = sessionStorage.getItem(IMPERSONATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredImpersonation;
    return parsed && typeof parsed.userId === "string" && parsed.userId ? parsed : null;
  } catch {
    return null;
  }
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
 * Returns the effective user id for client-side data reads/writes:
 * the impersonation target when an admin is impersonating, otherwise the
 * real signed-in user's id. Throws if not signed in.
 */
export async function getEffectiveUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const actor = data?.user;
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
  const { data } = await supabase.auth.getUser();
  const actor = data?.user;
  if (!actor) throw new Error("Not signed in");
  return actor.id;
}

/** Synchronous check for whether the current session is impersonating. */
export function isImpersonating(): boolean {
  return readStoredImpersonation() !== null;
}

/** Synchronous read of who the session is impersonating (id/name/email), or null. */
export function getImpersonationTarget(): { userId: string; name?: string; email?: string } | null {
  return readStoredImpersonation();
}

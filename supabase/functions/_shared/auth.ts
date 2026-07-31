// JWT + snapshot-ownership helpers shared across AI functions.
// Removes the copy-paste auth blocks that were missing in several endpoints.

import { createClient } from "npm:@supabase/supabase-js@2";
import { resolveOwner } from "./impersonation.ts";


const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

export interface AuthResult {
  userId: string | null;
  /** The JWT-verified caller. Same as `userId` unless impersonation resolved a target. */
  actorId?: string | null;
  impersonating?: boolean;
  error?: Response;
}


export function jsonResponse(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

/**
 * Require a valid JWT. Returns the user id, or a 401 Response in `error`.
 *
 * When `honorImpersonation` is true (the default), an `x-impersonate-user`
 * header is resolved against the caller's admin role and, if allowed, `userId`
 * becomes the target while `actorId` stays the real signed-in admin.
 */
export async function requireUser(
  req: Request,
  cors: Record<string, string>,
  honorImpersonation = true,
): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return { userId: null, error: jsonResponse({ error: "Unauthorized" }, 401, cors) };
  }
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user) {
    return { userId: null, error: jsonResponse({ error: "Unauthorized" }, 401, cors) };
  }
  const actorId = data.user.id;
  if (!honorImpersonation) return { userId: actorId, actorId, impersonating: false };

  const owner = await resolveOwner(req, actorId, userClient, cors);
  if (owner.error) return { userId: null, actorId, error: owner.error };
  return { userId: owner.userId, actorId, impersonating: owner.impersonating };
}


/**
 * Require the caller owns (or is an admin on) the snapshot.
 * `supabase` should be the service-role client.
 */
export async function requireSnapshotOwner(
  supabase: any,
  snapshotId: string,
  userId: string,
  cors: Record<string, string>,
): Promise<{ snapshot: any | null; error?: Response }> {
  const { data: snap } = await supabase
    .from("venture_snapshots")
    .select("*")
    .eq("id", snapshotId)
    .maybeSingle();
  if (!snap) return { snapshot: null, error: jsonResponse({ error: "Snapshot not found" }, 404, cors) };
  if (snap.user_id === userId) return { snapshot: snap };

  // Allow admins through.
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "super_admin"]);
  if ((roles ?? []).length > 0) return { snapshot: snap };

  return { snapshot: null, error: jsonResponse({ error: "Forbidden" }, 403, cors) };
}

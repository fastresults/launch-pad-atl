// Server-side impersonation resolution.
//
// The browser always authenticates as the *actor* (the signed-in admin). When an
// admin is "viewing as" a member, the client attaches `x-impersonate-user: <id>`
// (see src/lib/edge-invoke.ts). Edge functions must never trust that header
// blindly: it is honoured ONLY when the JWT-verified actor holds `admin` or
// `super_admin` in `public.user_roles`. Everyone else gets a 403.
//
// Usage inside a function that already resolved `actorId` from the JWT:
//
//   const owner = await resolveOwner(req, actorId, db);       // db: any client
//   if (owner.error) return owner.error;                       // 403 response
//   const userId = owner.userId;                               // whose data
//
// Persist `userId` in ownership columns and `actorId` in audit columns.

// NOTE: deliberately no import from ./auth.ts — that would be a circular
// dependency (auth.ts imports this module) and the edge bundler fails on it.
function jsonResponse(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

export const IMPERSONATION_HEADER = "x-impersonate-user";

export interface OwnerResult {
  /** Whose data this request should read/write. */
  userId: string;
  /** The real signed-in user (admin when impersonating). */
  actorId: string;
  /** True when the header was honoured. */
  impersonating: boolean;
  error?: Response;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function isAdminUser(db: any, userId: string): Promise<boolean> {
  try {
    const { data, error } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "super_admin"]);
    if (error) return false;
    return (data ?? []).length > 0;
  } catch {
    return false;
  }
}

/**
 * Resolve the effective owner for this request.
 * `db` may be a service-role client or the caller's own client — reading the
 * caller's own roles is permitted by RLS either way.
 */
export async function resolveOwner(
  req: Request,
  actorId: string,
  db: any,
  cors: Record<string, string> = {},
  explicitTarget?: string | null,
): Promise<OwnerResult> {
  const raw = (explicitTarget ?? req.headers.get(IMPERSONATION_HEADER) ?? "").trim();
  if (!raw || raw === actorId) {
    return { userId: actorId, actorId, impersonating: false };
  }
  if (!UUID_RE.test(raw)) {
    return {
      userId: actorId,
      actorId,
      impersonating: false,
      error: jsonResponse({ error: "Invalid impersonation target" }, 400, cors),
    };
  }
  const allowed = await isAdminUser(db, actorId);
  if (!allowed) {
    return {
      userId: actorId,
      actorId,
      impersonating: false,
      error: jsonResponse({ error: "Forbidden: impersonation requires admin" }, 403, cors),
    };
  }
  console.log(`[impersonation] actor=${actorId} acting_as=${raw}`);
  return { userId: raw, actorId, impersonating: true };
}

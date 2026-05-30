import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getAdminBadges = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // gate to admins
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin" || r.role === "super_admin");
    if (!isAdmin) return { reviewPending: 0, applicationsPending: 0, inquiriesNew: 0, membersPending: 0 };

    const { data: adminRoleRows } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "super_admin"] as any);
    const adminIds = Array.from(new Set((adminRoleRows ?? []).map((r) => r.user_id)));

    let membersPendingQuery = supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("member_status", "pending");
    if (adminIds.length > 0) {
      membersPendingQuery = membersPendingQuery.not(
        "user_id",
        "in",
        `(${adminIds.join(",")})`,
      );
    }

    const [
      { count: reviewPending },
      { count: applicationsPending },
      { count: inquiriesNew },
      { count: membersPending },
    ] = await Promise.all([
      supabaseAdmin
        .from("attendee_deliverables")
        .select("id", { count: "exact", head: true })
        .eq("review_status", "pending_review"),
      supabaseAdmin
        .from("founder_applications")
        .select("id", { count: "exact", head: true })
        .in("status", ["applied", "reviewing"]),
      supabaseAdmin
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
      membersPendingQuery,
    ]);

    return {
      reviewPending: reviewPending ?? 0,
      applicationsPending: applicationsPending ?? 0,
      inquiriesNew: inquiriesNew ?? 0,
      membersPending: membersPending ?? 0,
    };
  });


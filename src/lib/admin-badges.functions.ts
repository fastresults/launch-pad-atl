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
    if (!isAdmin) return { reviewPending: 0, applicationsPending: 0, inquiriesNew: 0 };

    const [{ count: reviewPending }, { count: applicationsPending }, { count: inquiriesNew }] = await Promise.all([
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
    ]);

    return {
      reviewPending: reviewPending ?? 0,
      applicationsPending: applicationsPending ?? 0,
      inquiriesNew: inquiriesNew ?? 0,
    };
  });

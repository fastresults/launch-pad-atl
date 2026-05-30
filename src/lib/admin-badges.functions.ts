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
    if (!isAdmin) return { reviewPending: 0 };

    const { count } = await supabaseAdmin
      .from("attendee_deliverables")
      .select("id", { count: "exact", head: true })
      .eq("review_status", "pending_review");

    return { reviewPending: count ?? 0 };
  });

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AppRole = "super_admin" | "admin" | "user";
export type MemberStatus = "pending" | "approved" | "rejected" | "paused";

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      console.error("getMyRoles error:", error);
      return { roles: [] as AppRole[] };
    }
    return { roles: (data ?? []).map((r) => r.role as AppRole) };
  });

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const [rolesRes, profileRes] = await Promise.all([
      supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
      supabaseAdmin
        .from("profiles")
        .select("member_status, approved_via")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    return {
      roles: (rolesRes.data ?? []).map((r) => r.role as AppRole),
      memberStatus: (profileRes.data?.member_status ?? "pending") as MemberStatus,
      approvedVia: (profileRes.data?.approved_via ?? null) as "admin" | "payment" | null,
    };
  });

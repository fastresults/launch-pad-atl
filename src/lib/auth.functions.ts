import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "admin" | "user";
export type MemberStatus = "pending" | "approved" | "rejected" | "paused";

export async function getMyAccount(): Promise<{
  roles: AppRole[];
  memberStatus: MemberStatus;
  approvedVia: "admin" | "payment" | null;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { roles: [], memberStatus: "pending", approvedVia: null };

  const [{ data: rolesData }, { data: profileData }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase
      .from("profiles")
      .select("member_status, approved_via")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return {
    roles: (rolesData ?? []).map((r: { role: string }) => r.role as AppRole),
    memberStatus: ((profileData as any)?.member_status as MemberStatus) ?? "pending",
    approvedVia: ((profileData as any)?.approved_via as "admin" | "payment" | null) ?? null,
  };
}

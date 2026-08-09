import { supabase } from "@/integrations/supabase/client";
import { getImpersonationTarget, getSessionUser } from "@/lib/effective-user";

export type AppRole = "super_admin" | "admin" | "user";
export type MemberStatus = "pending" | "approved" | "rejected" | "paused";

export async function getMyAccount(): Promise<{
  roles: AppRole[];
  memberStatus: MemberStatus;
  approvedVia: "admin" | "payment" | null;
  foundersHubAccess: boolean;
  /** Member status of the impersonated user, when impersonating. */
  targetMemberStatus: MemberStatus | null;
  targetFoundersHubAccess: boolean | null;
}> {
  const user = await getSessionUser();
  if (!user) {
    return {
      roles: [],
      memberStatus: "pending",
      approvedVia: null,
      foundersHubAccess: false,
      targetMemberStatus: null,
      targetFoundersHubAccess: null,
    };
  }

  const [{ data: rolesData }, { data: profileData }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase
      .from("profiles")
      .select("member_status, approved_via, founders_hub_access")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const roles = (rolesData ?? []).map((r: { role: string }) => r.role as AppRole);
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

  // While impersonating, also read the target's gate state so admins can see
  // exactly what the member sees (locked hub, paused, pending) instead of
  // their own admin-privileged view.
  let targetMemberStatus: MemberStatus | null = null;
  let targetFoundersHubAccess: boolean | null = null;
  const target = getImpersonationTarget();
  if (isAdmin && target) {
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("member_status, founders_hub_access")
      .eq("user_id", target.userId)
      .maybeSingle();
    targetMemberStatus = ((targetProfile as any)?.member_status as MemberStatus) ?? "pending";
    targetFoundersHubAccess = !!(targetProfile as any)?.founders_hub_access;
  }

  return {
    roles,
    memberStatus: ((profileData as any)?.member_status as MemberStatus) ?? "pending",
    approvedVia: ((profileData as any)?.approved_via as "admin" | "payment" | null) ?? null,
    foundersHubAccess: !!(profileData as any)?.founders_hub_access,
    targetMemberStatus,
    targetFoundersHubAccess,
  };
}

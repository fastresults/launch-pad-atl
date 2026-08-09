// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { getSessionUser } from "@/lib/effective-user";

export type MemberStatusValue = "pending" | "approved" | "rejected" | "paused";

export type MemberIntake = {
  startup_type: string | null;
  startup_name: string | null;
  one_line_idea: string | null;
  status: string | null;
} | null;

export type MemberRow = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  member_status: MemberStatusValue;
  approved_via: string | null;
  approved_at: string | null;
  created_at: string;
  intake: MemberIntake;
  founders_hub_access: boolean;
  founders_hub_granted_at: string | null;
};


function unwrap<T>(input: any): T {
  if (input && typeof input === "object" && "data" in input && Object.keys(input).length === 1) {
    return input.data as T;
  }
  return (input ?? {}) as T;
}

type ListFilter = {
  status?: MemberStatusValue | "no_intake" | "all";
  search?: string;
};

export async function listMembers(input?: any) {
  const { status, search } = unwrap<ListFilter>(input);

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "user_id, email, display_name, member_status, approved_via, approved_at, created_at, founders_hub_access, founders_hub_granted_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);


  const userIds = (profiles ?? []).map((p: any) => p.user_id);
  let intakeMap = new Map<string, any>();
  if (userIds.length) {
    const { data: intakes } = await supabase
      .from("member_intakes")
      .select("user_id, startup_type, startup_name, one_line_idea, status")
      .in("user_id", userIds);
    intakeMap = new Map((intakes ?? []).map((i: any) => [i.user_id, i]));
  }

  const members: MemberRow[] = (profiles ?? []).map((p: any) => {
    const intake = intakeMap.get(p.user_id) ?? null;
    return {
      user_id: p.user_id,
      email: p.email,
      display_name: p.display_name,
      member_status: (p.member_status ?? "pending") as MemberStatusValue,
      approved_via: p.approved_via,
      approved_at: p.approved_at,
      created_at: p.created_at,
      founders_hub_access: !!p.founders_hub_access,
      founders_hub_granted_at: p.founders_hub_granted_at ?? null,
      intake: intake
        ? {
            startup_type: intake.startup_type,
            startup_name: intake.startup_name,
            one_line_idea: intake.one_line_idea,
            status: intake.status,
          }
        : null,
    };

  });

  const counts = {
    pending: members.filter((m) => m.member_status === "pending").length,
    approved: members.filter((m) => m.member_status === "approved").length,
    paused: members.filter((m) => m.member_status === "paused").length,
    rejected: members.filter((m) => m.member_status === "rejected").length,
    no_intake: members.filter((m) => !m.intake).length,
  };

  let filtered = members;
  if (status && status !== "all") {
    if (status === "no_intake") {
      filtered = members.filter((m) => !m.intake);
    } else {
      filtered = members.filter((m) => m.member_status === status);
    }
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        (m.email ?? "").toLowerCase().includes(q) ||
        (m.display_name ?? "").toLowerCase().includes(q) ||
        (m.intake?.startup_name ?? "").toLowerCase().includes(q) ||
        (m.intake?.one_line_idea ?? "").toLowerCase().includes(q),
    );
  }

  return { members: filtered, counts };
}

export async function getMemberDetail(input: any) {
  const { userId } = unwrap<{ userId: string }>(input);
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function approveMember(input: any) {
  const { userId, via } = unwrap<{ userId: string; via?: "admin" | "payment" }>(input);
  const { error } = await supabase
    .from("profiles")
    .update({
      member_status: "approved",
      approved_via: via ?? "admin",
      approved_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  try {
    const { enqueueTransactionalEmail } = await import("@/lib/email/enqueue");
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (profile?.email) {
      const firstName = (profile.display_name as string | null)?.trim().split(/\s+/)[0] || undefined;
      await enqueueTransactionalEmail({
        templateName: "member-approved",
        recipientEmail: profile.email as string,
        idempotencyKey: `member-approved-${userId}-${Date.now()}`,
        templateData: { firstName, approvedVia: via ?? "admin" },
      });
    }
  } catch (e) {
    console.warn("[approveMember] email enqueue failed:", e);
  }
}

export async function rejectMember(input: any) {
  const { userId, reason } = unwrap<{ userId: string; reason?: string }>(input);
  const patch: Record<string, any> = { member_status: "rejected" };
  if (reason !== undefined) patch.rejected_reason = reason;
  const { error } = await supabase.from("profiles").update(patch).eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function markMemberContacted(input: any) {
  const { userId } = unwrap<{ userId: string }>(input);
  // No dedicated column today — touch updated_at so the row sorts fresh.
  const { error } = await supabase
    .from("profiles")
    .update({ updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function pauseMember(input: any) {
  const { userId, reason } = unwrap<{ userId: string; reason?: string }>(input);
  const patch: Record<string, any> = { member_status: "paused" };
  if (reason !== undefined) patch.rejected_reason = reason;
  const { error } = await supabase.from("profiles").update(patch).eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function restoreMemberToPending(input: any) {
  const { userId } = unwrap<{ userId: string }>(input);
  const { error } = await supabase
    .from("profiles")
    .update({ member_status: "pending", approved_via: null, approved_at: null })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function setFoundersHubAccess(input: any) {
  const { userId, grant } = unwrap<{ userId: string; grant: boolean }>(input);
  const me = await getSessionUser();
  const patch: Record<string, any> = {
    founders_hub_access: grant,
    founders_hub_granted_at: grant ? new Date().toISOString() : null,
    founders_hub_granted_by: grant ? me?.id ?? null : null,
  };
  const { error } = await supabase.from("profiles").update(patch).eq("user_id", userId);
  if (error) throw new Error(error.message);
}


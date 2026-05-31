import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { enqueueTransactionalEmail } from "@/lib/email/enqueue.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role);
  if (!roles.includes("admin") && !roles.includes("super_admin")) {
    throw new Error("Forbidden: admin access required");
  }
}

export type MemberStatusValue = "pending" | "approved" | "rejected" | "paused";

export type MemberRow = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  member_status: MemberStatusValue;
  approved_at: string | null;
  approved_via: "admin" | "payment" | null;
  created_at: string;
  intake: {
    id: string;
    startup_type: string;
    startup_name: string | null;
    one_line_idea: string;
    supporting_info: string | null;
    status: string;
    submitted_at: string;
    admin_notes: string | null;
  } | null;
};

export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        status: z.enum(["pending", "approved", "rejected", "paused", "no_intake"]).optional(),
        search: z.string().trim().max(120).optional(),
      })
      .optional()
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select(
        "user_id, email, display_name, member_status, approved_at, approved_via, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const { data: intakes } = await supabaseAdmin
      .from("member_intakes")
      .select(
        "id, user_id, startup_type, startup_name, one_line_idea, supporting_info, status, submitted_at, admin_notes",
      );
    const intakeByUser = new Map<string, NonNullable<MemberRow["intake"]>>();
    for (const i of intakes ?? []) intakeByUser.set(i.user_id, i as any);

    // Filter out admins from this list — they bypass the gate.
    const { data: adminRoles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "super_admin"] as any);
    const adminIds = new Set((adminRoles ?? []).map((r) => r.user_id));

    let rows: MemberRow[] = (profiles ?? [])
      .filter((p) => !adminIds.has(p.user_id))
      .map((p) => ({
        user_id: p.user_id,
        email: p.email,
        display_name: p.display_name,
        member_status: p.member_status as MemberRow["member_status"],
        approved_at: p.approved_at,
        approved_via: p.approved_via as MemberRow["approved_via"],
        created_at: p.created_at,
        intake: intakeByUser.get(p.user_id) ?? null,
      }));

    if (data?.status === "no_intake") {
      rows = rows.filter((r) => !r.intake);
    } else if (data?.status) {
      rows = rows.filter((r) => r.member_status === data.status);
    }

    if (data?.search) {
      const s = data.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.email ?? "").toLowerCase().includes(s) ||
          (r.display_name ?? "").toLowerCase().includes(s) ||
          (r.intake?.startup_name ?? "").toLowerCase().includes(s),
      );
    }

    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      paused: 0,
      no_intake: 0,
    };
    for (const p of profiles ?? []) {
      if (adminIds.has(p.user_id)) continue;
      const status = p.member_status as keyof typeof counts;
      if (status in counts) counts[status]++;
      if (!intakeByUser.has(p.user_id)) counts.no_intake++;
    }

    return { members: rows, counts };
  });

export const getMemberDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const [{ data: profile }, { data: intake }, { data: registrations }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select(
            "user_id, email, display_name, member_status, approved_at, approved_via, rejected_reason, created_at",
          )
          .eq("user_id", data.userId)
          .maybeSingle(),
        supabaseAdmin
          .from("member_intakes")
          .select("*")
          .eq("user_id", data.userId)
          .maybeSingle(),
        supabaseAdmin
          .from("workshop_registrations")
          .select("id, status, assigned_tier, cohort_id, created_at, paid_at")
          .eq("user_id", data.userId)
          .order("created_at", { ascending: false }),
      ]);
    if (!profile) throw new Error("Member not found");
    return { profile, intake, registrations: registrations ?? [] };
  });

export const approveMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name, member_status")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (!profile) throw new Error("Member not found");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        member_status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: context.userId,
        approved_via: "admin",
        rejected_reason: null,
      })
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("member_intakes")
      .update({
        status: "converted",
        reviewed_at: new Date().toISOString(),
        reviewer_id: context.userId,
      })
      .eq("user_id", data.userId);

    if (profile.email && profile.member_status !== "approved") {
      enqueueTransactionalEmail({
        templateName: "member-approved",
        recipientEmail: profile.email,
        idempotencyKey: `member-approved:${data.userId}`,
        templateData: {
          firstName: profile.display_name?.split(" ")[0] ?? null,
          approvedVia: "admin",
        },
      }).catch((e) => console.error("member-approved email failed", e));
    }

    return { ok: true };
  });

export const rejectMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        reason: z.string().trim().max(1000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        member_status: "rejected",
        rejected_reason: data.reason ?? null,
        approved_at: null,
        approved_via: null,
      })
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("member_intakes")
      .update({
        status: "closed",
        reviewed_at: new Date().toISOString(),
        reviewer_id: context.userId,
      })
      .eq("user_id", data.userId);
    return { ok: true };
  });

export const markMemberContacted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        notes: z.string().trim().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("member_intakes")
      .update({
        status: "contacted",
        reviewed_at: new Date().toISOString(),
        reviewer_id: context.userId,
        ...(data.notes ? { admin_notes: data.notes } : {}),
      })
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const pauseMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        reason: z.string().trim().max(1000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        member_status: "paused",
        rejected_reason: data.reason ?? null,
      })
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const restoreMemberToPending = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        member_status: "pending",
        rejected_reason: null,
      })
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("member_intakes")
      .update({ status: "submitted", reviewed_at: null, reviewer_id: null })
      .eq("user_id", data.userId);
    return { ok: true };
  });

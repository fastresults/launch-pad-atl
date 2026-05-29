import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RegistrationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  business_idea: z.string().trim().min(10).max(2000),
  industry: z.string().trim().min(1).max(80),
  stage: z.enum(["idea", "early", "existing"]),
  referral_source: z.string().trim().max(120).optional().or(z.literal("")),
  tier_interest: z.enum(["founders", "cohort"]).optional(),
  cohort_id: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const createRegistration = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => RegistrationSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: inserted, error } = await supabaseAdmin
      .from("workshop_registrations")
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        business_idea: data.business_idea,
        industry: data.industry,
        stage: data.stage,
        referral_source: data.referral_source || null,
        tier_interest: data.tier_interest ?? null,
        cohort_id: data.cohort_id ?? null,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("[registrations] insert failed", error);
      throw new Error("Could not save your registration. Please try again.");
    }
    return { ok: true as const, id: (inserted as { id: string }).id };
  });

async function ensureSuperAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error("Could not verify permissions.");
  const isSuper = (data ?? []).some((r: { role: string }) => r.role === "super_admin");
  if (!isSuper) throw new Error("Forbidden: super admin only.");
}

const ConfirmInput = z.object({ registration_id: z.string().uuid() });

export const confirmRegistrationPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ConfirmInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.userId);

    const { data: reg, error: rErr } = await supabaseAdmin
      .from("workshop_registrations")
      .select("id, cohort_id, tier_interest, status")
      .eq("id", data.registration_id)
      .single();
    if (rErr || !reg) throw new Error("Registration not found.");
    const r = reg as { id: string; cohort_id: string | null; tier_interest: string | null; status: string };
    if (!r.cohort_id) throw new Error("Registration has no cohort assigned.");
    if (r.status === "paid" || r.status === "confirmed") {
      return { ok: true as const, alreadyPaid: true };
    }

    const requested = r.tier_interest === "cohort" ? "cohort" : "founders";

    const { data: result, error: fnErr } = await supabaseAdmin.rpc(
      "reserve_cohort_seat" as never,
      {
        _registration_id: r.id,
        _cohort_id: r.cohort_id,
        _requested_tier: requested,
      } as never,
    );
    if (fnErr) throw new Error(fnErr.message);
    const row = Array.isArray(result) ? result[0] : result;
    return {
      ok: true as const,
      alreadyPaid: false,
      assigned_tier: (row as { assigned_tier: string }).assigned_tier,
      price_cents: (row as { price_cents: number }).price_cents,
    };
  });

const MarkRefundedInput = z.object({ registration_id: z.string().uuid() });

export const markRegistrationRefunded = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => MarkRefundedInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("workshop_registrations")
      .update({ status: "refunded" })
      .eq("id", data.registration_id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// --- Super-admin test harness helpers ---

const TestInput = z.object({
  cohort_id: z.string().min(1),
  count: z.number().int().min(1).max(50),
});

export const simulatePaidRegistrations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TestInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.userId);
    const created: string[] = [];
    for (let i = 0; i < data.count; i++) {
      const stamp = Date.now() + i;
      const { data: ins, error } = await supabaseAdmin
        .from("workshop_registrations")
        .insert({
          name: `Test Attendee ${stamp}`,
          email: `test+${stamp}@example.com`,
          business_idea: "Simulated test registration for seat counting.",
          industry: "Other",
          stage: "idea",
          referral_source: "__test__",
          tier_interest: "founders",
          cohort_id: data.cohort_id,
        })
        .select("id")
        .single();
      if (error || !ins) throw new Error(error?.message ?? "Insert failed");
      const id = (ins as { id: string }).id;

      const { error: fnErr } = await supabaseAdmin.rpc(
        "reserve_cohort_seat" as never,
        { _registration_id: id, _cohort_id: data.cohort_id, _requested_tier: "founders" } as never,
      );
      if (fnErr) {
        // Roll back this test row if the cohort is full so the count stays accurate.
        await supabaseAdmin.from("workshop_registrations").delete().eq("id", id);
        throw new Error(fnErr.message);
      }
      created.push(id);
    }
    return { ok: true as const, created };
  });

const ResetInput = z.object({ cohort_id: z.string().min(1) });

export const resetTestRegistrations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ResetInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.userId);
    const { error, count } = await supabaseAdmin
      .from("workshop_registrations")
      .delete({ count: "exact" })
      .eq("cohort_id", data.cohort_id)
      .eq("referral_source", "__test__");
    if (error) throw new Error(error.message);
    return { ok: true as const, deleted: count ?? 0 };
  });

const ListRegInput = z.object({ cohort_id: z.string().min(1), limit: z.number().int().min(1).max(100).optional() });

export const listCohortRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListRegInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.userId);
    const { data: rows, error } = await supabaseAdmin
      .from("workshop_registrations")
      .select("id, name, email, status, tier_interest, assigned_tier, price_paid_cents, referral_source, created_at, paid_at")
      .eq("cohort_id", data.cohort_id)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 25);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

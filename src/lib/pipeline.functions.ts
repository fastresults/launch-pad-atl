import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { loadFounderContext } from "@/lib/founderMemory.server";

// ===== Auth helpers =====
async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error("Role lookup failed");
  const roles = (data ?? []).map((r) => r.role);
  if (!roles.includes("admin") && !roles.includes("super_admin")) {
    throw new Error("Forbidden: admin access required");
  }
  return roles as string[];
}

async function assertSuperAdmin(userId: string) {
  const roles = await assertAdmin(userId);
  if (!roles.includes("super_admin")) {
    throw new Error("Forbidden: super_admin access required");
  }
}

// ===== Admin listings =====
export const listAttendees = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email, display_name, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const userIds = (profiles ?? []).map((p) => p.user_id);
    const [{ data: ap }, { data: dl }] = await Promise.all([
      supabaseAdmin
        .from("attendee_profiles")
        .select("user_id, business_name, industry, stage, intake_completed_at")
        .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
      supabaseAdmin
        .from("attendee_deliverables")
        .select("user_id, review_status, publish_status")
        .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
    ]);

    const apMap = new Map((ap ?? []).map((r) => [r.user_id, r]));
    const counts = new Map<string, { pending: number; published: number }>();
    for (const r of dl ?? []) {
      const c = counts.get(r.user_id) ?? { pending: 0, published: 0 };
      if (r.review_status === "pending_review") c.pending += 1;
      if (r.publish_status === "published") c.published += 1;
      counts.set(r.user_id, c);
    }

    return {
      attendees: (profiles ?? []).map((p) => ({
        ...p,
        attendee: apMap.get(p.user_id) ?? null,
        counts: counts.get(p.user_id) ?? { pending: 0, published: 0 },
      })),
    };
  });

export const getAttendeeDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const [{ data: profile }, { data: attendee }, { data: documents }, { data: goals }, { data: progress }, { data: deliverables }, { data: runs }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("*").eq("user_id", data.userId).maybeSingle(),
        supabaseAdmin.from("attendee_profiles").select("*").eq("user_id", data.userId).maybeSingle(),
        supabaseAdmin.from("attendee_documents").select("*").eq("user_id", data.userId).order("created_at", { ascending: false }),
        supabaseAdmin.from("attendee_goals").select("*").eq("user_id", data.userId).order("horizon", { ascending: true }),
        supabaseAdmin.from("attendee_progress").select("*").eq("user_id", data.userId),
        supabaseAdmin
          .from("attendee_deliverables")
          .select("*, deliverable_types(label, description, stage_label, sort_order)")
          .eq("user_id", data.userId)
          .order("deliverable_types(sort_order)", { ascending: true }),
        supabaseAdmin.from("ai_pipeline_runs").select("*").eq("user_id", data.userId).order("created_at", { ascending: false }).limit(20),
      ]);
    return {
      profile,
      attendee,
      documents: documents ?? [],
      goals: goals ?? [],
      progress: progress ?? [],
      deliverables: deliverables ?? [],
      runs: runs ?? [],
    };
  });

export const listReviewQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("attendee_deliverables")
      .select("*, deliverable_types(label, stage_label), profiles!inner(email, display_name)")
      .eq("review_status", "pending_review")
      .order("updated_at", { ascending: false });
    if (error) {
      // profiles join may fail without explicit FK; fall back
      const { data: rows } = await supabaseAdmin
        .from("attendee_deliverables")
        .select("*, deliverable_types(label, stage_label)")
        .eq("review_status", "pending_review")
        .order("updated_at", { ascending: false });
      const ids = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("user_id, email, display_name")
        .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
      const pmap = new Map((profs ?? []).map((p) => [p.user_id, p]));
      return { queue: (rows ?? []).map((r) => ({ ...r, profile: pmap.get(r.user_id) ?? null })) };
    }
    return { queue: data ?? [] };
  });

// ===== AI pipeline =====
type DeliverableType = {
  key: string;
  label: string;
  description: string | null;
  stage_label: string | null;
  default_model: string;
  depends_on_keys: string[];
  sort_order: number;
};

async function loadDeliverableTypes(keys?: string[]): Promise<DeliverableType[]> {
  let q = supabaseAdmin
    .from("deliverable_types")
    .select("key, label, description, stage_label, default_model, depends_on_keys, sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (keys && keys.length) q = q.in("key", keys);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as DeliverableType[];
}

// Topological sort by depends_on_keys
function orderByDeps(types: DeliverableType[]): DeliverableType[] {
  const map = new Map(types.map((t) => [t.key, t]));
  const visited = new Set<string>();
  const out: DeliverableType[] = [];
  function visit(t: DeliverableType) {
    if (visited.has(t.key)) return;
    visited.add(t.key);
    for (const dep of t.depends_on_keys ?? []) {
      const d = map.get(dep);
      if (d) visit(d);
    }
    out.push(t);
  }
  for (const t of types) visit(t);
  return out;
}

async function buildAttendeeContext(userId: string) {
  const [{ data: prof }, { data: docs }, { data: goals }, founderContext] = await Promise.all([
    supabaseAdmin.from("attendee_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabaseAdmin.from("attendee_documents").select("kind, original_name").eq("user_id", userId),
    supabaseAdmin.from("attendee_goals").select("horizon, title, description").eq("user_id", userId),
    loadFounderContext(userId),
  ]);
  return { profile: prof, documents: docs ?? [], goals: goals ?? [], founderContext };
}

const DeliverableOutputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  sections: z.array(z.object({ heading: z.string(), body_markdown: z.string() })),
  action_items: z.array(z.string()).optional(),
});

async function runStep(args: {
  type: DeliverableType;
  runId: string;
  userId: string;
  attendeeCtx: Awaited<ReturnType<typeof buildAttendeeContext>>;
  upstream: Record<string, unknown>;
  triggeredBy: string;
}) {
  const { type, runId, userId, attendeeCtx, upstream, triggeredBy } = args;
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  // Mark step running
  const { data: stepRow, error: stepErr } = await supabaseAdmin
    .from("ai_pipeline_steps")
    .upsert(
      {
        run_id: runId,
        user_id: userId,
        deliverable_key: type.key,
        status: "running",
        model: type.default_model,
        started_at: new Date().toISOString(),
        input_snapshot: { attendee: attendeeCtx, upstream_keys: Object.keys(upstream), founder_context: attendeeCtx.founderContext },
      },
      { onConflict: "run_id,deliverable_key" },
    )
    .select("id")
    .single();
  if (stepErr) throw new Error(stepErr.message);

  try {
    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway(type.default_model);

    const prompt = [
      `You are producing the deliverable "${type.label}" for a workshop attendee.`,
      type.description ? `Purpose: ${type.description}` : "",
      `Stage: ${type.stage_label ?? "general"}.`,
      ``,
      attendeeCtx.founderContext,
      ``,
      `# Attendee profile`,
      JSON.stringify(attendeeCtx.profile, null, 2),
      ``,
      `# Attendee uploaded documents`,
      JSON.stringify(attendeeCtx.documents, null, 2),
      ``,
      `# Attendee goals`,
      JSON.stringify(attendeeCtx.goals, null, 2),
      ``,
      `# Upstream deliverables (use to inform this one)`,
      JSON.stringify(upstream, null, 2),
      ``,
      `Produce a complete, specific, customized deliverable. Output JSON only.`,
    ].join("\n");

    const { output } = await generateText({
      model,
      output: Output.object({ schema: DeliverableOutputSchema }),
      prompt,
    });

    const now = new Date().toISOString();
    await supabaseAdmin
      .from("ai_pipeline_steps")
      .update({
        status: "completed",
        raw_output: output,
        finished_at: now,
      })
      .eq("id", stepRow.id);

    // Upsert into attendee_deliverables: write content_ai; only update content_current
    // if not previously admin-overridden.
    const { data: existing } = await supabaseAdmin
      .from("attendee_deliverables")
      .select("id, content_source")
      .eq("user_id", userId)
      .eq("deliverable_key", type.key)
      .maybeSingle();

    const isOverridden = existing?.content_source === "admin_override";
    const patch: Record<string, unknown> = {
      content_ai: output,
      ai_generated_at: now,
      review_status: "pending_review",
      publish_status: "unpublished",
      last_run_id: runId,
    };
    if (!isOverridden) patch.content_current = output;

    let deliverableId: string;
    if (existing) {
      await supabaseAdmin.from("attendee_deliverables").update(patch as never).eq("id", existing.id);
      deliverableId = existing.id;
    } else {
      const { data: inserted, error: insErr } = await supabaseAdmin
        .from("attendee_deliverables")
        .insert({
          user_id: userId,
          deliverable_key: type.key,
          ...patch,
        })
        .select("id")
        .single();
      if (insErr) throw new Error(insErr.message);
      deliverableId = inserted.id;
    }

    await supabaseAdmin.from("deliverable_revisions").insert({
      deliverable_id: deliverableId,
      user_id: userId,
      deliverable_key: type.key,
      action: "generated",
      actor: triggeredBy,
      source: "ai",
      after: output,
    });

    return output;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabaseAdmin
      .from("ai_pipeline_steps")
      .update({ status: "failed", error: msg, finished_at: new Date().toISOString() })
      .eq("id", stepRow.id);
    throw e;
  }
}

const TriggerInput = z.object({
  userId: z.string().uuid(),
  deliverableKeys: z.array(z.string()).optional(),
  force: z.boolean().optional(),
});

export const triggerPipeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TriggerInput.parse(i))
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context.userId);

    const types = orderByDeps(await loadDeliverableTypes(data.deliverableKeys));
    if (!types.length) throw new Error("No deliverable types selected");

    const { data: run, error: runErr } = await supabaseAdmin
      .from("ai_pipeline_runs")
      .insert({
        user_id: data.userId,
        triggered_by: context.userId,
        status: "running",
        started_at: new Date().toISOString(),
        options: { deliverableKeys: data.deliverableKeys ?? null, force: !!data.force },
      })
      .select("id")
      .single();
    if (runErr) throw new Error(runErr.message);

    const attendeeCtx = await buildAttendeeContext(data.userId);
    const outputs: Record<string, unknown> = {};
    let failed = 0;
    for (const t of types) {
      const upstream: Record<string, unknown> = {};
      for (const dep of t.depends_on_keys ?? []) {
        if (outputs[dep]) upstream[dep] = outputs[dep];
      }
      try {
        const out = await runStep({
          type: t,
          runId: run.id,
          userId: data.userId,
          attendeeCtx,
          upstream,
          triggeredBy: context.userId,
        });
        outputs[t.key] = out;
      } catch (e) {
        failed += 1;
        console.error(`[pipeline] step ${t.key} failed:`, e);
      }
    }

    const finalStatus = failed === 0 ? "completed" : failed === types.length ? "failed" : "partial";
    await supabaseAdmin
      .from("ai_pipeline_runs")
      .update({ status: finalStatus, finished_at: new Date().toISOString() })
      .eq("id", run.id);

    return { runId: run.id, totalSteps: types.length, failed };
  });

const RegenInput = z.object({
  userId: z.string().uuid(),
  key: z.string().min(1).max(80),
  guidance: z.string().max(2000).optional(),
});

export const regenerateDeliverable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RegenInput.parse(i))
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context.userId);
    const types = await loadDeliverableTypes([data.key]);
    if (!types.length) throw new Error("Unknown deliverable");
    const t = types[0];

    const { data: run } = await supabaseAdmin
      .from("ai_pipeline_runs")
      .insert({
        user_id: data.userId,
        triggered_by: context.userId,
        status: "running",
        started_at: new Date().toISOString(),
        options: { single: data.key, guidance: data.guidance ?? null },
      })
      .select("id")
      .single();

    const attendeeCtx = await buildAttendeeContext(data.userId);
    const upstream: Record<string, unknown> = {};
    if (data.guidance) upstream["__guidance__"] = data.guidance;
    for (const dep of t.depends_on_keys ?? []) {
      const { data: r } = await supabaseAdmin
        .from("attendee_deliverables")
        .select("content_current")
        .eq("user_id", data.userId)
        .eq("deliverable_key", dep)
        .maybeSingle();
      if (r?.content_current) upstream[dep] = r.content_current;
    }

    await runStep({
      type: t,
      runId: run!.id,
      userId: data.userId,
      attendeeCtx,
      upstream,
      triggeredBy: context.userId,
    });

    await supabaseAdmin
      .from("ai_pipeline_runs")
      .update({ status: "completed", finished_at: new Date().toISOString() })
      .eq("id", run!.id);

    return { runId: run!.id };
  });

// ===== Admin edit / review / publish =====
const UpdateContentInput = z.object({
  userId: z.string().uuid(),
  key: z.string().min(1).max(80),
  content: z.unknown(),
});

export const updateDeliverableContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateContentInput.parse(i))
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context.userId);
    const { data: existing } = await supabaseAdmin
      .from("attendee_deliverables")
      .select("id, content_current")
      .eq("user_id", data.userId)
      .eq("deliverable_key", data.key)
      .maybeSingle();
    if (!existing) throw new Error("Deliverable not found");

    await supabaseAdmin
      .from("attendee_deliverables")
      .update({
        content_current: data.content as never,
        content_source: "admin_override",
        admin_edited_at: new Date().toISOString(),
        admin_edited_by: context.userId,
      })
      .eq("id", existing.id);

    await supabaseAdmin.from("deliverable_revisions").insert({
      deliverable_id: existing.id,
      user_id: data.userId,
      deliverable_key: data.key,
      action: "edited",
      actor: context.userId,
      source: "admin",
      before: existing.content_current,
      after: data.content as never,
    });

    return { ok: true };
  });

export const revertDeliverableToAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ userId: z.string().uuid(), key: z.string().min(1).max(80) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context.userId);
    const { data: row } = await supabaseAdmin
      .from("attendee_deliverables")
      .select("id, content_current, content_ai")
      .eq("user_id", data.userId)
      .eq("deliverable_key", data.key)
      .maybeSingle();
    if (!row) throw new Error("Not found");
    if (!row.content_ai) throw new Error("No AI version on file");
    await supabaseAdmin
      .from("attendee_deliverables")
      .update({
        content_current: row.content_ai,
        content_source: "ai",
        admin_edited_at: null,
        admin_edited_by: null,
      })
      .eq("id", row.id);
    await supabaseAdmin.from("deliverable_revisions").insert({
      deliverable_id: row.id,
      user_id: data.userId,
      deliverable_key: data.key,
      action: "reverted",
      actor: context.userId,
      source: "admin",
      before: row.content_current,
      after: row.content_ai,
    });
    return { ok: true };
  });

const ReviewInput = z.object({
  userId: z.string().uuid(),
  key: z.string().min(1).max(80),
  decision: z.enum(["approve", "request_changes", "reject"]),
  notes: z.string().max(2000).optional(),
});

export const reviewDeliverable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ReviewInput.parse(i))
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context.userId);
    const { data: row } = await supabaseAdmin
      .from("attendee_deliverables")
      .select("id")
      .eq("user_id", data.userId)
      .eq("deliverable_key", data.key)
      .maybeSingle();
    if (!row) throw new Error("Not found");

    const map = {
      approve: "approved",
      request_changes: "changes_requested",
      reject: "rejected",
    } as const;

    const patch: Record<string, unknown> = {
      review_status: map[data.decision],
      reviewer_notes: data.notes ?? null,
    };
    if (data.decision === "approve") {
      patch.approved_at = new Date().toISOString();
      patch.approved_by = context.userId;
    }
    if (data.decision === "reject") {
      patch.publish_status = "unpublished";
    }

    await supabaseAdmin.from("attendee_deliverables").update(patch as never).eq("id", row.id);
    await supabaseAdmin.from("deliverable_revisions").insert({
      deliverable_id: row.id,
      user_id: data.userId,
      deliverable_key: data.key,
      action: data.decision === "approve" ? "approved" : data.decision === "reject" ? "rejected" : "changes_requested",
      actor: context.userId,
      source: "admin",
      notes: data.notes ?? null,
    });

    return { ok: true };
  });

const PublishInput = z.object({
  userId: z.string().uuid(),
  key: z.string().min(1).max(80),
  when: z.union([
    z.literal("now"),
    z.object({ scheduledAt: z.string().datetime() }),
  ]),
});

export const publishDeliverable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PublishInput.parse(i))
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context.userId);
    const { data: row } = await supabaseAdmin
      .from("attendee_deliverables")
      .select("id, review_status")
      .eq("user_id", data.userId)
      .eq("deliverable_key", data.key)
      .maybeSingle();
    if (!row) throw new Error("Not found");
    if (row.review_status !== "approved") {
      throw new Error("Deliverable must be approved before publishing");
    }

    if (data.when === "now") {
      await supabaseAdmin
        .from("attendee_deliverables")
        .update({
          publish_status: "published",
          publish_at: new Date().toISOString(),
          published_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      await supabaseAdmin.from("deliverable_revisions").insert({
        deliverable_id: row.id,
        user_id: data.userId,
        deliverable_key: data.key,
        action: "published",
        actor: context.userId,
        source: "admin",
      });
    } else {
      await supabaseAdmin
        .from("attendee_deliverables")
        .update({
          publish_status: "scheduled",
          publish_at: data.when.scheduledAt,
          published_at: null,
        })
        .eq("id", row.id);
      await supabaseAdmin.from("deliverable_revisions").insert({
        deliverable_id: row.id,
        user_id: data.userId,
        deliverable_key: data.key,
        action: "scheduled",
        actor: context.userId,
        source: "admin",
        notes: `publish_at=${data.when.scheduledAt}`,
      });
    }
    return { ok: true };
  });

export const unpublishDeliverable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        key: z.string().min(1).max(80),
        reason: z.string().max(2000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context.userId);
    const { data: row } = await supabaseAdmin
      .from("attendee_deliverables")
      .select("id")
      .eq("user_id", data.userId)
      .eq("deliverable_key", data.key)
      .maybeSingle();
    if (!row) throw new Error("Not found");
    await supabaseAdmin
      .from("attendee_deliverables")
      .update({ publish_status: "unpublished_manual", publish_at: null })
      .eq("id", row.id);
    await supabaseAdmin.from("deliverable_revisions").insert({
      deliverable_id: row.id,
      user_id: data.userId,
      deliverable_key: data.key,
      action: "unpublished",
      actor: context.userId,
      source: "admin",
      notes: data.reason ?? null,
    });
    return { ok: true };
  });

export const listDeliverableRevisions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ userId: z.string().uuid(), key: z.string().min(1).max(80) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { data: rows, error } = await supabaseAdmin
      .from("deliverable_revisions")
      .select("*")
      .eq("user_id", data.userId)
      .eq("deliverable_key", data.key)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { revisions: rows ?? [] };
  });

export const listDeliverableTypes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("deliverable_types")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return { types: data ?? [] };
  });

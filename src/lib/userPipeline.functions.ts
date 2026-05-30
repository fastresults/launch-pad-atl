import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { loadFounderContext } from "@/lib/founderMemory.server";

// Per-user concurrency guard (best-effort; resets on worker recycle).
const RUNNING: Map<string, number> = new Map();
const MAX_CONCURRENT_PER_USER = 5;

type DeliverableType = {
  key: string;
  label: string;
  description: string | null;
  stage_label: string | null;
  stage_n: number | null;
  sort_order: number;
  default_model: string;
  depends_on_keys: string[];
  requires_context_keys: string[];
  produces_context_key: string | null;
  user_can_trigger: boolean;
  auto_runnable: boolean;
};

async function loadAllTypes(): Promise<DeliverableType[]> {
  const { data, error } = await supabaseAdmin
    .from("deliverable_types")
    .select(
      "key, label, description, stage_label, stage_n, sort_order, default_model, depends_on_keys, requires_context_keys, produces_context_key, user_can_trigger, auto_runnable",
    )
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as DeliverableType[];
}

// ===== Per-user context =====
async function buildContext(userId: string) {
  const [{ data: profile }, { data: brief }, { data: filing }, { data: goals }, { data: intakes }, { data: deliverables }, founderContext] = await Promise.all([
    supabaseAdmin.from("attendee_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabaseAdmin.from("attendee_business_brief").select("*").eq("user_id", userId).maybeSingle(),
    supabaseAdmin
      .from("attendee_filing_info")
      .select("legal_first_name,legal_last_name,city,state,postal_code,country,llc_name,registered_agent_name,registered_agent_address,business_purpose,ssn_last4")
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdmin.from("attendee_goals").select("horizon,title,description").eq("user_id", userId),
    supabaseAdmin.from("attendee_stage_intake").select("deliverable_key,intake").eq("user_id", userId),
    supabaseAdmin
      .from("attendee_deliverables")
      .select("deliverable_key, content_current, review_status, publish_status, ai_generated_at")
      .eq("user_id", userId),
    loadFounderContext(userId),
  ]);

  const intakeMap: Record<string, Record<string, string>> = {};
  for (const r of intakes ?? []) intakeMap[r.deliverable_key as string] = (r.intake ?? {}) as Record<string, string>;

  const deliverableMap: Record<string, unknown> = {};
  for (const d of deliverables ?? []) {
    if (d.content_current) deliverableMap[d.deliverable_key as string] = d.content_current;
  }

  return {
    profile: profile ?? null,
    brief: brief ?? null,
    filing: filing ?? null, // filing here intentionally omits full SSN; only last4 included
    goals: goals ?? [],
    intakes: intakeMap,
    deliverables: deliverableMap,
    founderContext,
  };
}

// ===== Output schema (same shape as admin pipeline so the existing UI renders it) =====
const DeliverableOutputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  sections: z.array(z.object({ heading: z.string(), body_markdown: z.string() })),
  action_items: z.array(z.string()).optional(),
  needs_input: z
    .array(
      z.object({
        deliverable_key: z.string().optional(),
        field: z.string(),
        question: z.string(),
      }),
    )
    .optional(),
});

type Ctx = Awaited<ReturnType<typeof buildContext>>;

async function runOne(args: {
  type: DeliverableType;
  ctx: Ctx;
  runId: string;
  userId: string;
  triggeredBy: string;
}) {
  const { type, ctx, runId, userId, triggeredBy } = args;
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

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
        input_snapshot: { hasBrief: !!ctx.brief, intakeKeys: Object.keys(ctx.intakes), upstreamKeys: Object.keys(ctx.deliverables), founder_context: ctx.founderContext },
      },
      { onConflict: "run_id,deliverable_key" },
    )
    .select("id")
    .single();
  if (stepErr) throw new Error(stepErr.message);

  try {
    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway(type.default_model);

    const upstream: Record<string, unknown> = {};
    for (const dep of type.depends_on_keys ?? []) {
      if (ctx.deliverables[dep]) upstream[dep] = ctx.deliverables[dep];
    }

    const intakeForThis = ctx.intakes[type.key] ?? {};
    const prompt = [
      `You are producing the deliverable "${type.label}" for a workshop attendee.`,
      type.description ? `Purpose: ${type.description}` : "",
      `Stage: ${type.stage_label ?? "general"}.`,
      ``,
      ctx.founderContext,
      ``,
      `# Business Brief (the most important context)`,
      JSON.stringify(ctx.brief ?? {}, null, 2),
      ``,
      `# Attendee profile`,
      JSON.stringify(ctx.profile ?? {}, null, 2),
      ``,
      `# Filing / legal context (no full SSN included)`,
      JSON.stringify(ctx.filing ?? {}, null, 2),
      ``,
      `# Attendee goals`,
      JSON.stringify(ctx.goals, null, 2),
      ``,
      `# Specific intake answers for THIS deliverable`,
      JSON.stringify(intakeForThis, null, 2),
      ``,
      `# Upstream deliverables (already completed; use them to inform this one)`,
      JSON.stringify(upstream, null, 2),
      ``,
      `Produce a specific, ready-to-use deliverable in JSON. If critical input is missing and you cannot reasonably proceed, populate "needs_input" with one or more {field, question} entries instead of inventing data — but still produce the best partial draft you can in "sections".`,
    ].join("\n");

    const { output } = await generateText({
      model,
      output: Output.object({ schema: DeliverableOutputSchema }),
      prompt,
    });

    const now = new Date().toISOString();
    await supabaseAdmin
      .from("ai_pipeline_steps")
      .update({ status: "completed", raw_output: output, finished_at: now })
      .eq("id", stepRow.id);

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
        .insert({ user_id: userId, deliverable_key: type.key, ...patch })
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
      source: triggeredBy === userId ? "user" : "admin",
      after: output,
    });

    // Update in-memory context so subsequent steps see this output
    ctx.deliverables[type.key] = output;
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

// Topological order
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

async function assertAdminish(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role as string);
  return roles.includes("admin") || roles.includes("super_admin");
}

// ===== Public APIs =====

export const getMyWorkflow = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const [types, ctx] = await Promise.all([loadAllTypes(), buildContext(userId)]);
    const items = types.map((t) => {
      const generated = !!ctx.deliverables[t.key];
      const depsMet = (t.depends_on_keys ?? []).every((d) => !!ctx.deliverables[d]);
      const briefReady = (ctx.brief?.completeness_score ?? 0) >= 6; // basic gate
      return {
        key: t.key,
        label: t.label,
        description: t.description,
        stage_label: t.stage_label,
        stage_n: t.stage_n,
        sort_order: t.sort_order,
        depends_on_keys: t.depends_on_keys,
        user_can_trigger: t.user_can_trigger,
        generated,
        deps_met: depsMet,
        ready: depsMet && briefReady,
      };
    });
    return {
      brief: ctx.brief,
      filingPresent: !!ctx.filing,
      intakeKeys: Object.keys(ctx.intakes),
      items,
    };
  });

const RunOneInput = z.object({ key: z.string().min(1).max(80), runUpstream: z.boolean().optional() });

export const runMyDeliverable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RunOneInput.parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const current = RUNNING.get(userId) ?? 0;
    if (current >= MAX_CONCURRENT_PER_USER) throw new Error("Too many AI runs in flight. Wait a moment and try again.");
    RUNNING.set(userId, current + 1);
    try {
      const types = await loadAllTypes();
      const map = new Map(types.map((t) => [t.key, t]));
      const target = map.get(data.key);
      if (!target) throw new Error("Unknown deliverable");
      if (!target.user_can_trigger) throw new Error("This deliverable can only be triggered by an admin");

      const ctx = await buildContext(userId);
      // Choose set of types to run
      let toRun: DeliverableType[] = [target];
      if (data.runUpstream) {
        const needed = new Set<string>();
        function walk(k: string) {
          if (needed.has(k)) return;
          needed.add(k);
          const t = map.get(k);
          for (const d of t?.depends_on_keys ?? []) walk(d);
        }
        walk(target.key);
        toRun = orderByDeps(Array.from(needed).map((k) => map.get(k)!).filter(Boolean));
        // Skip already-generated upstreams
        toRun = toRun.filter((t) => t.key === target.key || !ctx.deliverables[t.key]);
      }

      const { data: run } = await supabaseAdmin
        .from("ai_pipeline_runs")
        .insert({
          user_id: userId,
          triggered_by: userId,
          status: "running",
          started_at: new Date().toISOString(),
          options: { single: data.key, runUpstream: !!data.runUpstream, count: toRun.length },
        })
        .select("id")
        .single();

      let failed = 0;
      for (const t of toRun) {
        try {
          await runOne({ type: t, ctx, runId: run!.id, userId, triggeredBy: userId });
        } catch (e) {
          failed += 1;
          console.error(`[user-pipeline] ${t.key} failed:`, e);
          break; // stop on first error so user sees what blocked them
        }
      }

      const finalStatus = failed === 0 ? "completed" : "partial";
      await supabaseAdmin
        .from("ai_pipeline_runs")
        .update({ status: finalStatus, finished_at: new Date().toISOString() })
        .eq("id", run!.id);

      return { runId: run!.id, total: toRun.length, failed };
    } finally {
      const c = RUNNING.get(userId) ?? 1;
      RUNNING.set(userId, Math.max(0, c - 1));
    }
  });

export const runMyRemaining = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const types = await loadAllTypes();
    const ctx = await buildContext(userId);
    if ((ctx.brief?.completeness_score ?? 0) < 6) {
      throw new Error("Please complete your Business Brief (at least 6 fields) before running the full workflow.");
    }
    const remaining = orderByDeps(types).filter((t) => t.user_can_trigger && t.auto_runnable && !ctx.deliverables[t.key]);
    if (!remaining.length) return { runId: null, total: 0, failed: 0 };

    const { data: run } = await supabaseAdmin
      .from("ai_pipeline_runs")
      .insert({
        user_id: userId,
        triggered_by: userId,
        status: "running",
        started_at: new Date().toISOString(),
        options: { bulk: true, count: remaining.length },
      })
      .select("id")
      .single();

    let failed = 0;
    for (const t of remaining) {
      // Re-check deps in case a previous failure left a gap
      const depsMet = (t.depends_on_keys ?? []).every((d) => !!ctx.deliverables[d]);
      if (!depsMet) continue;
      try {
        await runOne({ type: t, ctx, runId: run!.id, userId, triggeredBy: userId });
      } catch (e) {
        failed += 1;
        console.error(`[user-pipeline:bulk] ${t.key} failed:`, e);
      }
    }

    const finalStatus = failed === 0 ? "completed" : failed === remaining.length ? "failed" : "partial";
    await supabaseAdmin
      .from("ai_pipeline_runs")
      .update({ status: finalStatus, finished_at: new Date().toISOString() })
      .eq("id", run!.id);

    return { runId: run!.id, total: remaining.length, failed };
  });

// Admin variant — same loop, scoped to an arbitrary user
const AdminRunInput = z.object({
  userId: z.string().uuid(),
  key: z.string().min(1).max(80).optional(),
  runUpstream: z.boolean().optional(),
  bulk: z.boolean().optional(),
});

export const adminRunForUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AdminRunInput.parse(i))
  .handler(async ({ context, data }) => {
    const isAdmin = await assertAdminish(context.userId);
    if (!isAdmin) throw new Error("Forbidden");
    const types = await loadAllTypes();
    const map = new Map(types.map((t) => [t.key, t]));
    const ctx = await buildContext(data.userId);

    let toRun: DeliverableType[] = [];
    if (data.bulk) {
      toRun = orderByDeps(types).filter((t) => t.auto_runnable && !ctx.deliverables[t.key]);
    } else if (data.key) {
      const target = map.get(data.key);
      if (!target) throw new Error("Unknown deliverable");
      if (data.runUpstream) {
        const needed = new Set<string>();
        function walk(k: string) {
          if (needed.has(k)) return;
          needed.add(k);
          const t = map.get(k);
          for (const d of t?.depends_on_keys ?? []) walk(d);
        }
        walk(target.key);
        toRun = orderByDeps(Array.from(needed).map((k) => map.get(k)!));
        toRun = toRun.filter((t) => t.key === target.key || !ctx.deliverables[t.key]);
      } else {
        toRun = [target];
      }
    } else {
      throw new Error("Must specify key or bulk");
    }

    const { data: run } = await supabaseAdmin
      .from("ai_pipeline_runs")
      .insert({
        user_id: data.userId,
        triggered_by: context.userId,
        status: "running",
        started_at: new Date().toISOString(),
        options: { admin: true, key: data.key ?? null, bulk: !!data.bulk, count: toRun.length },
      })
      .select("id")
      .single();

    let failed = 0;
    for (const t of toRun) {
      try {
        await runOne({ type: t, ctx, runId: run!.id, userId: data.userId, triggeredBy: context.userId });
      } catch (e) {
        failed += 1;
        console.error(`[admin-pipeline] ${t.key} failed:`, e);
        if (!data.bulk) break;
      }
    }

    await supabaseAdmin
      .from("ai_pipeline_runs")
      .update({
        status: failed === 0 ? "completed" : failed === toRun.length ? "failed" : "partial",
        finished_at: new Date().toISOString(),
      })
      .eq("id", run!.id);
    return { runId: run!.id, total: toRun.length, failed };
  });

// Recent run/step status for the live activity feed
export const getMyRecentRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: runs } = await supabase
      .from("ai_pipeline_runs")
      .select("id,status,started_at,finished_at,options")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    const ids = (runs ?? []).map((r) => r.id);
    const { data: steps } = ids.length
      ? await supabase
          .from("ai_pipeline_steps")
          .select("run_id,deliverable_key,status,error,started_at,finished_at")
          .in("run_id", ids)
          .order("created_at", { ascending: false })
      : { data: [] };
    return { runs: runs ?? [], steps: steps ?? [] };
  });

// Admin: read another user's workflow grid
const AdminWorkflowInput = z.object({ userId: z.string().uuid() });
export const adminGetUserWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AdminWorkflowInput.parse(i))
  .handler(async ({ context, data }) => {
    const isAdmin = await assertAdminish(context.userId);
    if (!isAdmin) throw new Error("Forbidden");
    const [types, ctx] = await Promise.all([loadAllTypes(), buildContext(data.userId)]);
    const items = types.map((t) => {
      const generated = !!ctx.deliverables[t.key];
      const depsMet = (t.depends_on_keys ?? []).every((d) => !!ctx.deliverables[d]);
      return {
        key: t.key,
        label: t.label,
        description: t.description,
        stage_label: t.stage_label,
        stage_n: t.stage_n,
        sort_order: t.sort_order,
        depends_on_keys: t.depends_on_keys,
        user_can_trigger: t.user_can_trigger,
        generated,
        deps_met: depsMet,
        ready: depsMet,
      };
    });
    return {
      brief: ctx.brief,
      filingPresent: !!ctx.filing,
      intakeKeys: Object.keys(ctx.intakes),
      items,
    };
  });


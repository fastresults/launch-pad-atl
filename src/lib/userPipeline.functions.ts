// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

function unwrap<T>(input: any): T {
  if (input && typeof input === "object" && "data" in input && Object.keys(input).length === 1) {
    return input.data as T;
  }
  return (input ?? {}) as T;
}

async function uid() {
  return (await supabase.auth.getUser()).data.user!.id;
}

async function buildWorkflow(userId: string) {
  const [briefRes, filingRes, typesRes, delivRes] = await Promise.all([
    supabase
      .from("attendee_business_brief")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("attendee_filing_info")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("deliverable_types")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("attendee_deliverables")
      .select("deliverable_key, review_status, publish_status, content_current, hero_image_path, hero_image_status")
      .eq("user_id", userId),
  ]);

  const generatedKeys = new Set<string>();
  const imageReadyKeys = new Set<string>();
  const imageStatusByKey = new Map<string, string>();
  for (const d of delivRes.data ?? []) {
    if (d.content_current && Object.keys(d.content_current ?? {}).length > 0) {
      generatedKeys.add(d.deliverable_key);
    }
    if (d.hero_image_path) imageReadyKeys.add(d.deliverable_key);
    if (d.hero_image_status) imageStatusByKey.set(d.deliverable_key, d.hero_image_status);
  }

  const items = (typesRes.data ?? []).map((t: any) => {
    const deps = (t.depends_on_keys ?? []) as string[];
    const deps_met = deps.every((k) => generatedKeys.has(k));
    const image_ready = imageReadyKeys.has(t.key);
    const raw = imageStatusByKey.get(t.key) ?? null;
    const image_status: "idle" | "generating" | "ready" | "failed" =
      image_ready ? "ready" : raw === "generating" ? "generating" : raw === "failed" ? "failed" : "idle";
    return {
      key: t.key,
      label: t.label,
      description: t.description,
      stage_n: t.stage_n,
      stage_label: t.stage_label,
      bonus: !!t.bonus,
      user_can_trigger: t.user_can_trigger !== false,
      generated: generatedKeys.has(t.key),
      deps_met,
      image_ready,
      image_status,
    };
  });


  return {
    brief: briefRes.data ?? null,
    filingPresent: !!filingRes.data,
    items,
  };
}

export async function getMyWorkflow() {
  return buildWorkflow(await uid());
}

export async function adminGetUserWorkflow(input: any) {
  const { userId } = unwrap<{ userId: string }>(input);
  if (!userId) return { brief: null, filingPresent: false, items: [] };
  return buildWorkflow(userId);
}

async function invokeRun(payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("dashboard-pipeline-run", {
    body: payload,
  });
  if (error) throw new Error(error.message);
  if (data && data.ok === false) throw new Error(data.error ?? "Run failed");
  return data;
}

export async function runMyDeliverable(input: any) {
  const { key, runUpstream, feedback, tags } = unwrap<{ key: string; runUpstream?: boolean; feedback?: string; tags?: string[] }>(input);
  await invokeRun({ key, runUpstream: !!runUpstream, feedback, tags });
  return { queued: true };
}

export async function runMyDeliverableAssessment(input: any) {
  const { key, feedback, tags } = unwrap<{ key: string; feedback?: string; tags?: string[] }>(input);
  const { data, error } = await supabase.functions.invoke("attendee-generate-assessment", {
    body: { key, feedback, tags },
  });
  if (error) throw new Error(error.message);
  if (data && data.error) throw new Error(data.error);
  return data;
}


export async function runMyRemaining() {
  await invokeRun({ bulk: true });
  return { queued: true };
}

export async function forceRunMyRemaining() {
  let totalDone = 0;
  let totalFailed = 0;
  let staleRunsReset = 0;
  let remaining = 1;
  let runs = 0;

  while (remaining > 0 && runs < 12) {
    const result = await invokeRun({ bulk: true, forceRun: true, maxDocs: 3 });
    runs += 1;
    totalDone += Number(result?.done ?? 0);
    totalFailed += Number(result?.failed ?? 0);
    staleRunsReset += Number(result?.staleRunsReset ?? 0);
    remaining = Number(result?.remaining ?? 0);
    if (Number(result?.attempted ?? 0) === 0) break;
  }

  return { ok: true, done: totalDone, failed: totalFailed, remaining, staleRunsReset, runs };
}

export async function adminRunForUser(input: any) {
  const { userId, key, runUpstream, bulk } = unwrap<{
    userId: string;
    key?: string;
    runUpstream?: boolean;
    bulk?: boolean;
    forceRun?: boolean;
  }>(input);
  await invokeRun({ userId, key, runUpstream: !!runUpstream, bulk: !!bulk, forceRun: !!forceRun, maxDocs: forceRun ? 3 : undefined });
  return { total: 1, failed: 0 };
}

export async function getMyRecentRuns() {
  const { data } = await supabase
    .from("ai_pipeline_runs")
    .select("*")
    .eq("user_id", await uid())
    .order("created_at", { ascending: false })
    .limit(10);
  return data ?? [];
}

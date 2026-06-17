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
      .select("deliverable_key, review_status, publish_status, content_current")
      .eq("user_id", userId),
  ]);

  const generatedKeys = new Set<string>();
  for (const d of delivRes.data ?? []) {
    if (d.content_current && Object.keys(d.content_current ?? {}).length > 0) {
      generatedKeys.add(d.deliverable_key);
    }
  }

  const items = (typesRes.data ?? []).map((t: any) => {
    const deps = (t.depends_on_keys ?? []) as string[];
    const deps_met = deps.every((k) => generatedKeys.has(k));
    return {
      key: t.key,
      label: t.label,
      description: t.description,
      stage_n: t.stage_n,
      stage_label: t.stage_label,
      generated: generatedKeys.has(t.key),
      deps_met,
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

async function queueRun(userId: string, options: Record<string, unknown>) {
  const { error } = await supabase
    .from("ai_pipeline_runs")
    .insert({ user_id: userId, status: "queued", options: options as any });
  if (error) throw new Error(error.message);
}

export async function runMyDeliverable(input: any) {
  const { key } = unwrap<{ key: string }>(input);
  await queueRun(await uid(), { key });
}

export async function runMyRemaining() {
  await queueRun(await uid(), { bulk: true });
}

export async function adminRunForUser(input: any) {
  const { userId, key, runUpstream, bulk } = unwrap<{
    userId: string;
    key?: string;
    runUpstream?: boolean;
    bulk?: boolean;
  }>(input);
  await queueRun(userId, { key, runUpstream, bulk });
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

// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import type { BriefKey } from "@/lib/workflow";
export type { BriefKey };

import { getEffectiveUserId } from "@/lib/effective-user";
import { invokeEdge } from "@/lib/edge-invoke";

async function uid() { return await getEffectiveUserId(); }

export async function getMyBrief() {
  const { data } = await supabase.from("attendee_business_brief").select("*").eq("user_id", await uid()).maybeSingle();
  return data ?? {};
}
export async function updateBriefField(data: { key: BriefKey; value: string }) {
  const userId = await uid();
  const { error } = await supabase.from("attendee_business_brief").upsert({ user_id: userId, [data.key]: data.value }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}
export async function resetMyBrief() {
  const userId = await uid();
  const { BRIEF_FIELD_KEYS } = await import("@/lib/brief-progress");
  const wipe: Record<string, string> = {};
  for (const k of BRIEF_FIELD_KEYS) wipe[k] = "";
  const { error } = await supabase.from("attendee_business_brief").upsert({ user_id: userId, ...wipe, completeness_score: 0 }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}
export async function adminGetBrief(data: { userId: string }) {
  const { data: row } = await supabase.from("attendee_business_brief").select("*").eq("user_id", data.userId).maybeSingle();
  return row ?? {};
}
export type CheckpointAnswer = { label: string; value: string };
export type CheckpointSummary = { summary: string; bullets: string[]; cached?: boolean };

export async function summarizeBriefBlock(args: {
  block: string | number;
  title?: string;
  answers?: CheckpointAnswer[];
  kind?: "qa" | "founder" | "market";
  content?: string;
}): Promise<CheckpointSummary> {
  const { data, error } = await invokeEdge("brief-summarize-block", {
    body: {
      title: args.title ?? `Block ${args.block}`,
      kind: args.kind ?? "qa",
      answers: args.answers ?? [],
    },
  });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return {
    summary: (data as any)?.summary ?? "",
    bullets: Array.isArray((data as any)?.bullets) ? (data as any).bullets : [],
  };
}

export type BriefPrefillSuggestion = {
  answer: string;
  source_filename: string;
  source_snippet: string;
  confidence: "high" | "medium" | "low";
};

export type BriefPrefillResponse = {
  suggestions: Record<BriefKey, BriefPrefillSuggestion>;
  sourceFiles: string[];
  warnings: string[];
};

export async function prefillBriefFromDocs(files: File[]): Promise<BriefPrefillResponse> {
  const form = new FormData();
  for (const f of files) form.append("files", f, f.name);
  const { data, error } = await invokeEdge("brief-prefill", { body: form });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as BriefPrefillResponse;
}


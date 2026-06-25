// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import type { BriefKey } from "@/lib/workflow";
export type { BriefKey };

async function uid() { return (await supabase.auth.getUser()).data.user!.id; }

export async function getMyBrief() {
  const { data } = await supabase.from("attendee_business_brief").select("*").eq("user_id", await uid()).maybeSingle();
  return data ?? {};
}
export async function updateBriefField(data: { key: BriefKey; value: string }) {
  const userId = await uid();
  const { error } = await supabase.from("attendee_business_brief").upsert({ user_id: userId, [data.key]: data.value }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}
export async function adminGetBrief(data: { userId: string }) {
  const { data: row } = await supabase.from("attendee_business_brief").select("*").eq("user_id", data.userId).maybeSingle();
  return row ?? {};
}
export async function summarizeBriefBlock(_data: { block: string; content: string }) {
  return { summary: "" };
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
  const { data, error } = await supabase.functions.invoke("brief-prefill", { body: form });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as BriefPrefillResponse;
}


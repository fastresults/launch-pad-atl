import { supabase } from "@/integrations/supabase/client";

async function uid() { return (await supabase.auth.getUser()).data.user!.id; }

export interface ExtractedFounder { name?: string; bio?: string; experience?: string }

export async function getFounderProfile() {
  const { data } = await supabase.from("founder_profiles").select("*").eq("user_id", await uid()).maybeSingle();
  return data ?? {};
}
export async function upsertFounderProfile(data: any) {
  const { error } = await supabase.from("founder_profiles").upsert({ ...data, user_id: await uid() }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}
export async function extractFounderFromText(_data: { text: string }) { return {}; }
export async function getMarketProfile() {
  const { data } = await supabase.from("market_profiles").select("*").eq("user_id", await uid()).maybeSingle();
  return data ?? {};
}
export async function upsertMarketProfile(data: any) {
  const { error } = await supabase.from("market_profiles").upsert({ ...data, user_id: await uid() }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}
export async function summarizeFounderProfile(_data: any) { return { summary: "" }; }
export async function summarizeMarketProfile(_data: any) { return { summary: "" }; }
export async function createResumeUploadUrl(_data: { filename: string }) { return { uploadUrl: "", path: "" }; }

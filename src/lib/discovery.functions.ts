// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

async function uid() { return (await supabase.auth.getUser()).data.user!.id; }

export interface ExtractedFounder { name?: string; bio?: string; experience?: string }

export async function getFounderProfile() {
  const { data } = await supabase.from("attendee_founder_profile").select("*").eq("user_id", await uid()).maybeSingle();
  return { profile: data ?? null };
}
export async function upsertFounderProfile(data: any) {
  const payload = data?.data ?? data;
  const { error } = await supabase.from("attendee_founder_profile").upsert({ ...payload, user_id: await uid() }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}
export async function extractFounderFromText(input: any) {
  const payload = input?.data ?? input ?? {};
  const { data, error } = await supabase.functions.invoke("founder-extract", { body: payload });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return { extracted: (data as any)?.extracted ?? {}, note: (data as any)?.note ?? null };
}
export async function getMarketProfile() {
  const { data } = await supabase.from("attendee_market_profile").select("*").eq("user_id", await uid()).maybeSingle();
  return data ?? {};
}
export async function upsertMarketProfile(data: any) {
  const payload = data?.data ?? data;
  const { error } = await supabase.from("attendee_market_profile").upsert({ ...payload, user_id: await uid() }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

async function callSummarize(title: string, kind: "founder" | "market", answers: Array<{label: string; value: string}>) {
  const { data, error } = await supabase.functions.invoke("brief-summarize-block", {
    body: { title, kind, answers },
  });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return {
    summary: (data as any)?.summary ?? "",
    bullets: Array.isArray((data as any)?.bullets) ? (data as any).bullets : [],
  };
}

export async function summarizeFounderProfile() {
  const { profile: row } = await getFounderProfile();
  const ex = ((row as any)?.extracted ?? {}) as Record<string, any>;
  const roles = Array.isArray(ex.roles)
    ? ex.roles.map((r: any) => `${r.title}${r.company ? ` @ ${r.company}` : ""}`).join("; ")
    : "";
  const answers = [
    { label: "Headline", value: String(ex.headline ?? "") },
    { label: "Years of experience", value: ex.years_experience ? String(ex.years_experience) : "" },
    { label: "Roles", value: roles },
    { label: "Skills", value: Array.isArray(ex.skills) ? ex.skills.join(", ") : "" },
    { label: "Industries", value: Array.isArray(ex.industries) ? ex.industries.join(", ") : "" },
    { label: "Wins", value: Array.isArray(ex.wins) ? ex.wins.join("; ") : "" },
    { label: "LinkedIn", value: String(row?.linkedin_url ?? "") },
    { label: "Why you're the right person", value: String(row?.right_person_reason ?? "") },
    { label: "Your unfair advantage", value: String(row?.unfair_advantage ?? "") },
  ];
  return callSummarize("About you", "founder", answers);
}

export async function summarizeMarketProfile() {
  const row = await getMarketProfile();
  const answers = [
    { label: "Industry", value: String(row?.industry ?? "") },
    { label: "Customer type", value: String(row?.customer_type ?? "") },
    { label: "Geography", value: String(row?.geography ?? "") },
    { label: "Channels", value: Array.isArray(row?.channels) ? row.channels.join(", ") : "" },
    { label: "Archetype", value: Array.isArray(row?.archetype) ? row.archetype.join(", ") : "" },
    { label: "Market note", value: String(row?.market_note ?? "") },
  ];
  return callSummarize("Your market & model", "market", answers);
}

export async function createResumeUploadUrl(input: { filename: string; mime?: string } | { data: { filename: string; mime?: string } }) {
  const payload: any = (input as any)?.data ?? input;
  const filename = String(payload?.filename ?? "resume");
  const userId = await uid();
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${Date.now()}-${safe}`;
  const { data, error } = await supabase.storage
    .from("attendee-docs")
    .createSignedUploadUrl(path);
  if (error) throw new Error(error.message);
  return { path: data.path, signedUrl: data.signedUrl, token: data.token };
}

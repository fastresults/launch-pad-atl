import { supabase } from "@/integrations/supabase/client";

export type BrainCitation = { n: number; kind: string; source_ref: string | null; title: string };
export type BrainMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations: BrainCitation[];
  created_at: string;
};

export async function loadBrainHistory(userId: string): Promise<BrainMessage[]> {
  const { data, error } = await supabase
    .from("founder_brain_messages")
    .select("id, role, content, citations, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    role: r.role as BrainMessage["role"],
    content: r.content,
    citations: (r.citations as unknown as BrainCitation[]) ?? [],
    created_at: r.created_at,
  }));
}

export async function clearBrainHistory(userId: string): Promise<void> {
  const { error } = await supabase.from("founder_brain_messages").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function sendBrainMessage(
  message: string,
): Promise<{ answer: string; citations: BrainCitation[] }> {
  const { data, error } = await supabase.functions.invoke("brain-chat", { body: { message } });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return { answer: (data as any).answer, citations: (data as any).citations ?? [] };
}

export type BrainIndexingJob = {
  id: string;
  status: "queued" | "running" | "done" | "failed";
  total_sources: number;
  total_chunks: number;
  embedded_chunks: number;
  failed_chunks: number;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export async function rebuildBrainMemory(): Promise<{ jobId: string }> {
  const { data, error } = await supabase.functions.invoke("brain-reindex", { body: {} });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  const jobId = (data as any).jobId as string | undefined;
  if (!jobId) throw new Error("No jobId returned");
  return { jobId };
}

export async function pollBrainJob(jobId: string): Promise<BrainIndexingJob> {
  const { data, error } = await supabase.functions.invoke("brain-reindex-status", {
    method: "GET" as any,
    // supabase-js doesn't support query params on invoke; fall back to fetch below when needed.
    body: undefined,
    headers: {},
  } as any).catch(() => ({ data: null, error: new Error("invoke-failed") } as any));

  // The invoke helper doesn't easily send query params, so use a direct fetch for reliability.
  if (!data || (data as any)?.error) {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL;
    const ANON = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/brain-reindex-status?jobId=${encodeURIComponent(jobId)}`, {
      headers: { apikey: ANON, Authorization: `Bearer ${token ?? ANON}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error ?? `Status ${res.status}`);
    return json as BrainIndexingJob;
  }
  if (error) throw error;
  return data as BrainIndexingJob;
}

export async function getLatestBrainJob(userId: string): Promise<BrainIndexingJob | null> {
  const { data, error } = await supabase
    .from("brain_indexing_jobs" as any)
    .select("id, status, total_sources, total_chunks, embedded_chunks, failed_chunks, error_message, started_at, finished_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data as unknown as BrainIndexingJob) ?? null;
}

export async function saveBrainNote(userId: string, content: string, source: "text" | "voice" | "chat" = "text") {
  const clean = content.trim();
  if (!clean) return null;
  const { data, error } = await supabase
    .from("founder_brain_notes")
    .insert({ user_id: userId, content: clean, source })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function listBrainNotes(userId: string) {
  const { data, error } = await supabase
    .from("founder_brain_notes")
    .select("id, content, created_at, source")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function deleteBrainNote(id: string) {
  const { error } = await supabase.from("founder_brain_notes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getBrainStatus(userId: string) {
  const [{ count: memCount }, { count: noteCount }, { data: delivs }] = await Promise.all([
    supabase.from("founder_brain_memory").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("founder_brain_notes").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("attendee_deliverables")
      .select("deliverable_key, content_current, deep_assessment_status, hero_image_status")
      .eq("user_id", userId),
  ]);
  const rows = delivs ?? [];
  const generated = rows.filter((r: any) => r.content_current && Object.keys(r.content_current).length).length;
  const assessed = rows.filter((r: any) => r.deep_assessment_status === "complete").length;
  const heroReady = rows.filter((r: any) => r.hero_image_status === "ready").length;
  return {
    memoryChunks: memCount ?? 0,
    notes: noteCount ?? 0,
    totalAssets: rows.length,
    generated,
    assessed,
    heroReady,
  };
}

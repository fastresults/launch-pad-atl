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

export async function rebuildBrainMemory(): Promise<{ sources: number; chunks: number }> {
  const { data, error } = await supabase.functions.invoke("brain-reindex", { body: {} });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return { sources: (data as any).sources ?? 0, chunks: (data as any).chunks ?? 0 };
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

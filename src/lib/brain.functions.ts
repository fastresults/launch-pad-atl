import { supabase } from "@/integrations/supabase/client";
import { invokeEdge } from "@/lib/edge-invoke";

export type BrainCitation = { n: number; kind: string; source_ref: string | null; title: string };
export type BrainMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations: BrainCitation[];
  created_at: string;
};

export type BrainVenture = {
  id: string;
  company_name: string | null;
  updated_at: string | null;
};

export async function listBrainVentures(userId: string): Promise<BrainVenture[]> {
  const { data, error } = await supabase
    .from("venture_snapshots")
    .select("id, company_name, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as BrainVenture[];
}

export async function loadBrainHistory(userId: string, snapshotId: string | null): Promise<BrainMessage[]> {
  let q = supabase
    .from("founder_brain_messages")
    .select("id, role, content, citations, created_at")
    .eq("user_id", userId);
  q = snapshotId ? q.eq("snapshot_id", snapshotId) : q.is("snapshot_id", null);
  const { data, error } = await q.order("created_at", { ascending: true }).limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    role: r.role as BrainMessage["role"],
    content: r.content,
    citations: (r.citations as unknown as BrainCitation[]) ?? [],
    created_at: r.created_at,
  }));
}

export async function clearBrainHistory(userId: string, snapshotId: string | null): Promise<void> {
  let q = supabase.from("founder_brain_messages").delete().eq("user_id", userId);
  q = snapshotId ? q.eq("snapshot_id", snapshotId) : q.is("snapshot_id", null);
  const { error } = await q;
  if (error) throw new Error(error.message);
}

export async function sendBrainMessage(
  message: string,
  snapshotId: string | null,
): Promise<{ answer: string; citations: BrainCitation[] }> {
  const { data, error } = await invokeEdge("brain-chat", { body: { message, snapshotId } });
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

export async function rebuildBrainMemory(snapshotId: string | null, ownerId?: string): Promise<{ jobId: string }> {
  const { data, error } = await invokeEdge("brain-reindex", { body: { snapshotId, ownerId } });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  const jobId = (data as any).jobId as string | undefined;
  if (!jobId) throw new Error("No jobId returned");
  return { jobId };
}

export async function pollBrainJob(jobId: string): Promise<BrainIndexingJob> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL;
  const ANON = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/brain-reindex-status?jobId=${encodeURIComponent(jobId)}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${token ?? ANON}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? `Status ${res.status}`);
  return json as BrainIndexingJob;
}

export async function getLatestBrainJob(userId: string, snapshotId: string | null): Promise<BrainIndexingJob | null> {
  let q = supabase
    .from("brain_indexing_jobs" as any)
    .select("id, status, total_sources, total_chunks, embedded_chunks, failed_chunks, error_message, started_at, finished_at, created_at")
    .eq("user_id", userId);
  q = snapshotId ? q.eq("snapshot_id", snapshotId) : q.is("snapshot_id", null);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) return null;
  return (data as unknown as BrainIndexingJob) ?? null;
}

export async function saveBrainNote(
  userId: string,
  content: string,
  snapshotId: string | null,
  source: "text" | "voice" | "chat" | "file" = "text",
) {
  const clean = content.trim();
  if (!clean) return null;
  const { data, error } = await supabase
    .from("founder_brain_notes")
    .insert({ user_id: userId, snapshot_id: snapshotId, content: clean, source })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

/** Ask the AI gateway to compress `content` (a chat answer or freeform text)
 *  into a saved-note shape: 7-word title + bullet list. Falls back to a naive
 *  local title + single bullet if the gateway is unavailable, so saving never
 *  fully fails on the user. Returns the final markdown to persist. */
export async function formatContentAsNote(content: string, question?: string): Promise<string> {
  const raw = content.trim();
  if (!raw) return "";
  try {
    const { data, error } = await invokeEdge("brain-note-format", {
      body: { content: raw, question: question?.trim() ?? "" },
    });
    if (error) throw error;
    const title = String((data as any)?.title ?? "").trim();
    const bullets = Array.isArray((data as any)?.bullets)
      ? ((data as any).bullets as unknown[])
          .map((b) => String(b ?? "").trim())
          .filter(Boolean)
      : [];
    if (title && bullets.length) {
      return `**${title}**\n\n${bullets.map((b) => `- ${b}`).join("\n")}`;
    }
    if (title) return `**${title}**\n\n- ${raw.slice(0, 400)}`;
  } catch { /* fall through to naive */ }
  const naiveTitle = raw
    .replace(/[#*_`>\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 7)
    .join(" ") || "Saved Note";
  return `**${naiveTitle}**\n\n- ${raw.slice(0, 400)}`;
}

export async function listBrainNotes(userId: string, snapshotId: string | null) {
  let q = supabase
    .from("founder_brain_notes")
    .select("id, content, created_at, source")
    .eq("user_id", userId);
  q = snapshotId ? q.eq("snapshot_id", snapshotId) : q.is("snapshot_id", null);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function deleteBrainNote(id: string) {
  const { error } = await supabase.from("founder_brain_notes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function purgeGeneratedAssets(
  userId: string,
  snapshotId: string | null,
): Promise<{
  deliverables_deleted: number;
  memory_chunks_deleted: number;
  notes_deleted?: number;
  messages_deleted?: number;
  indexing_jobs_deleted: number;
}> {
  const { data, error } = await supabase.rpc("purge_founder_generated_assets" as any, {
    _user_id: userId,
    _snapshot_id: snapshotId,
  });
  if (error) throw new Error(error.message);
  return data as any;
}

/** Detects legacy, unscoped memory that can pollute a selected venture.
 *  Correctly scoped rows are considered current even when their titles are
 *  framework/output names like `budget_pro_forma` rather than the company name. */
export async function detectVentureMismatch(
  userId: string,
  snapshotId: string | null,
): Promise<{
  mismatch: boolean;
  currentCompany: string | null;
  staleTitles: string[];
}> {
  if (!snapshotId) return { mismatch: false, currentCompany: null, staleTitles: [] };
  const [{ data: snap }, { data: legacyMem }] = await Promise.all([
    supabase.from("venture_snapshots").select("company_name").eq("id", snapshotId).maybeSingle(),
    supabase
      .from("founder_brain_memory")
      .select("title")
      .eq("user_id", userId)
      .is("snapshot_id", null)
      .in("kind", ["deliverable", "assessment"])
      .limit(50),
  ]);
  const titles = (legacyMem ?? []).map((r: any) => (r?.title ?? "").toString().trim()).filter(Boolean);
  if (!titles.length) {
    return { mismatch: false, currentCompany: (snap as any)?.company_name ?? null, staleTitles: [] };
  }
  return {
    mismatch: true,
    currentCompany: (snap as any)?.company_name ?? null,
    staleTitles: titles.slice(0, 5),
  };
}

export async function getBrainStatus(userId: string, snapshotId: string | null) {
  let memQ = supabase.from("founder_brain_memory").select("id", { count: "exact", head: true }).eq("user_id", userId);
  memQ = snapshotId ? memQ.eq("snapshot_id", snapshotId) : memQ.is("snapshot_id", null);
  let noteQ = supabase.from("founder_brain_notes").select("id", { count: "exact", head: true }).eq("user_id", userId);
  noteQ = snapshotId ? noteQ.eq("snapshot_id", snapshotId) : noteQ.is("snapshot_id", null);
  let matQ = supabase.from("brain_materials" as any).select("id", { count: "exact", head: true }).eq("user_id", userId);
  matQ = snapshotId ? matQ.eq("snapshot_id", snapshotId) : matQ.is("snapshot_id", null);

  // The current workflow writes assets to venture_documents (snapshot-scoped).
  // Legacy accounts kept theirs in attendee_deliverables (user-scoped). When
  // we have a snapshot, prefer venture_documents; otherwise fall back so the
  // status card still works for pre-migration users.
  const vdocsQ = snapshotId
    ? supabase
        .from("venture_documents")
        .select("status, content, deep_assessment_status, hero_image_status")
        .eq("snapshot_id", snapshotId)
    : Promise.resolve({ data: [] as any[] });

  const [{ count: memCount }, { count: noteCount }, { count: matCount }, vdocsRes, { data: delivs }] = await Promise.all([
    memQ,
    noteQ,
    matQ,
    vdocsQ,
    supabase
      .from("attendee_deliverables")
      .select("deliverable_key, content_current, deep_assessment_status, hero_image_status")
      .eq("user_id", userId),
  ]);

  const vdocs = (vdocsRes as any)?.data ?? [];
  const delivRows = delivs ?? [];

  let totalAssets = 0;
  let generated = 0;
  let assessed = 0;
  let heroReady = 0;

  if (vdocs.length > 0) {
    totalAssets = vdocs.length;
    generated = vdocs.filter((r: any) => r.status === "complete" && r.content && String(r.content).trim().length > 0).length;
    assessed = vdocs.filter((r: any) => r.deep_assessment_status === "complete").length;
    heroReady = vdocs.filter((r: any) => r.hero_image_status === "ready").length;
  } else {
    totalAssets = delivRows.length;
    generated = delivRows.filter((r: any) => r.content_current && Object.keys(r.content_current).length).length;
    assessed = delivRows.filter((r: any) => r.deep_assessment_status === "complete").length;
    heroReady = delivRows.filter((r: any) => r.hero_image_status === "ready").length;
  }

  return {
    memoryChunks: memCount ?? 0,
    notes: noteCount ?? 0,
    materials: matCount ?? 0,
    totalAssets,
    generated,
    assessed,
    heroReady,
  };
}

// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { payloadError } from "@/lib/edge-errors";
import { getEffectiveUserId } from "@/lib/effective-user";
import { invokeEdge } from "@/lib/edge-invoke";

function unwrap<T>(input: any): T {
  if (input && typeof input === "object" && "data" in input && Object.keys(input).length === 1) {
    return input.data as T;
  }
  return (input ?? {}) as T;
}

async function uid() {
  return await getEffectiveUserId();
}


export type SnapshotStatus = "input" | "enriching" | "review" | "generating" | "complete" | "archived";

export interface VentureSnapshot {
  id: string;
  user_id: string;
  company_name: string | null;
  website_url: string | null;
  business_concept: string | null;
  differentiation_statement: string | null;
  founder_name: string | null;
  founder_email: string | null;
  founder_phone: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  market_scope: "local" | "regional" | "national" | "international" | null;
  industry: string | null;
  sub_industry: string | null;
  track: string | null;
  scraped_content: string | null;
  competitor_data: any;
  market_research: string | null;
  extracted_data: any;
  research_artifacts: any[] | null;
  research_brief: any;
  status: SnapshotStatus;
  enrichment_progress: { stage?: string; progress?: number; message?: string; updatedAt?: string } | null;
  concept_summary: string | null;
  value_proposition: string | null;
  concept_status: "draft" | "refining" | "locked";
  concept_locked_at: string | null;
  concept_iterations: any[];
  epiphany_runs: any[];
  saved_enhancements: any[];
  brand_tokens: any;
  source_materials?: {
    documents?: Array<{ filename?: string; text?: string; charCount?: number }>;
    urls?: Array<{ url?: string; title?: string | null; text?: string; charCount?: number }>;
    conceptDraft?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface VentureDocumentType {
  type: string;
  name: string;
  description: string;
  category: string;
  sort_order: number;
  dependencies: string[];
  estimated_minutes: number;
  icon: string | null;
  free_tier: boolean;
}

export interface VentureDocument {
  id: string;
  snapshot_id: string;
  document_type: string;
  status: "pending" | "generating" | "complete" | "failed";
  content: string | null;
  word_count: number | null;
  quality_score: number | null;
  version: number;
  metadata: any;
  content_version_history: any[];
  updated_at: string;
}

export async function listSnapshots(): Promise<VentureSnapshot[]> {
  const { data, error } = await supabase
    .from("venture_snapshots")
    .select("*")
    .eq("user_id", await uid())
    .order("is_favorite", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  const snaps = (data ?? []) as VentureSnapshot[];
  if (snaps.length === 0) return snaps;

  const ids = snaps.map((s) => s.id);
  const { data: docs } = await supabase
    .from("venture_documents")
    .select("snapshot_id,status")
    .in("snapshot_id", ids)
    .eq("status", "complete");
  const counts = new Map<string, number>();
  for (const d of (docs ?? []) as { snapshot_id: string }[]) {
    counts.set(d.snapshot_id, (counts.get(d.snapshot_id) ?? 0) + 1);
  }
  return snaps.map((s) => ({ ...(s as any), doc_count: counts.get(s.id) ?? 0 })) as VentureSnapshot[];
}

/**
 * How many ventures this founder already has. Used by the new-venture intake
 * to decide whether prior memory should auto-attach (first venture) or be
 * offered opt-in (venture #2 and beyond, so nothing bleeds across builds).
 */
export async function countSnapshots(): Promise<number> {
  const { count, error } = await supabase
    .from("venture_snapshots")
    .select("id", { count: "exact", head: true })
    .eq("user_id", await uid());
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function setFavorite(input: any): Promise<void> {
  const { id, is_favorite } = unwrap<{ id: string; is_favorite: boolean }>(input);
  const { error } = await supabase
    .from("venture_snapshots")
    .update({ is_favorite })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function unarchiveSnapshot(input: any): Promise<void> {
  const { id } = unwrap<{ id: string }>(input);
  // Decide where to restore to: complete if any docs exist, else review if extracted_data, else enriching
  const { data: snap } = await supabase
    .from("venture_snapshots")
    .select("extracted_data")
    .eq("id", id)
    .maybeSingle();
  const { count: docCount } = await supabase
    .from("venture_documents")
    .select("id", { count: "exact", head: true })
    .eq("snapshot_id", id)
    .eq("status", "complete");
  const nextStatus =
    (docCount ?? 0) > 0
      ? "complete"
      : snap?.extracted_data && Object.keys(snap.extracted_data).length > 0
        ? "review"
        : "enriching";
  const { error } = await supabase
    .from("venture_snapshots")
    .update({ status: nextStatus })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getSnapshot(input: any): Promise<VentureSnapshot | null> {
  const { id } = unwrap<{ id: string }>(input);
  const { data, error } = await supabase
    .from("venture_snapshots")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as VentureSnapshot | null;
}

export async function createSnapshot(input: any): Promise<{ id: string }> {
  const {
    company_name,
    website_url,
    business_concept,
    differentiation_statement,
    founder_name,
    founder_email,
    founder_phone,
    city,
    region,
    country,
    market_scope,
    industry,
    sub_industry,
    track,
    source_materials,
  } = unwrap<{
    company_name?: string;
    website_url?: string;
    business_concept: string;
    differentiation_statement?: string;
    founder_name?: string;
    founder_email?: string;
    founder_phone?: string;
    city?: string;
    region?: string;
    country?: string;
    market_scope?: "local" | "regional" | "national" | "international";
    industry?: string;
    sub_industry?: string;
    track?: string;
    source_materials?: {
      documents?: Array<{ filename?: string; text?: string }>;
      urls?: Array<{ url?: string; title?: string | null; text?: string }>;
      conceptDraft?: string;
    };
  }>(input);

  // Cap each text and overall payload so the row stays sane.
  const PER_TEXT_CAP = 40_000;
  const TOTAL_CAP = 150_000;
  let used = 0;
  const trim = (s: unknown) => {
    if (typeof s !== "string") return "";
    let t = s.length > PER_TEXT_CAP ? s.slice(0, PER_TEXT_CAP) : s;
    if (used + t.length > TOTAL_CAP) t = t.slice(0, Math.max(0, TOTAL_CAP - used));
    used += t.length;
    return t;
  };
  const cleanedSources = source_materials
    ? {
        documents: (source_materials.documents ?? [])
          .map((d) => ({ filename: d.filename ?? "document", text: trim(d.text), charCount: (d.text ?? "").length }))
          .filter((d) => d.text.length > 0),
        urls: (source_materials.urls ?? [])
          .map((u) => ({ url: u.url ?? "", title: u.title ?? null, text: trim(u.text), charCount: (u.text ?? "").length }))
          .filter((u) => u.text.length > 0),
        conceptDraft: typeof source_materials.conceptDraft === "string" ? source_materials.conceptDraft.slice(0, 8_000) : "",
      }
    : null;

  const { data, error } = await supabase
    .from("venture_snapshots")
    .insert({
      user_id: await uid(),
      company_name: company_name ?? null,
      website_url: website_url ?? null,
      business_concept,
      differentiation_statement: differentiation_statement ?? null,
      founder_name: founder_name ?? null,
      founder_email: founder_email ?? null,
      founder_phone: founder_phone ?? null,
      city: city ?? null,
      region: region ?? null,
      country: country ?? null,
      market_scope: market_scope ?? null,
      industry: industry ?? null,
      sub_industry: sub_industry ?? null,
      track: track ?? null,
      source_materials: cleanedSources,
      status: "enriching",
      enrichment_progress: { stage: "queued", progress: 0, message: "Queued", updatedAt: new Date().toISOString() },
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // Fire-and-forget deep research enrichment
  void invokeEdge("venture-deep-research", { body: { snapshotId: data.id } });

  return { id: data.id };
}

export async function appendSnapshotSources(input: any): Promise<void> {
  const { id, source_materials } = unwrap<{
    id: string;
    source_materials?: {
      documents?: Array<{ filename?: string; text?: string }>;
      urls?: Array<{ url?: string; title?: string | null; text?: string }>;
      conceptDraft?: string;
    };
  }>(input);

  const { data: snap, error: loadErr } = await supabase
    .from("venture_snapshots")
    .select("source_materials,business_concept")
    .eq("id", id)
    .eq("user_id", await uid())
    .maybeSingle();
  if (loadErr) throw new Error(loadErr.message);
  if (!snap) throw new Error("Startup not found");

  const existing = snap.source_materials ?? {};
  const PER_TEXT_CAP = 40_000;
  const TOTAL_CAP = 180_000;
  let used = 0;
  const trim = (s: unknown) => {
    if (typeof s !== "string") return "";
    let t = s.trim();
    if (t.length > PER_TEXT_CAP) t = t.slice(0, PER_TEXT_CAP);
    if (used + t.length > TOTAL_CAP) t = t.slice(0, Math.max(0, TOTAL_CAP - used));
    used += t.length;
    return t;
  };

  const seenDocs = new Set<string>();
  const documents = [...(existing.documents ?? []), ...(source_materials?.documents ?? [])]
    .map((d: any) => ({ filename: d.filename ?? "document", text: trim(d.text), charCount: (d.text ?? "").length }))
    .filter((d) => {
      const key = `${d.filename}:${d.text.slice(0, 200)}`;
      if (!d.text || seenDocs.has(key)) return false;
      seenDocs.add(key);
      return true;
    });

  const seenUrls = new Set<string>();
  const urls = [...(existing.urls ?? []), ...(source_materials?.urls ?? [])]
    .map((u: any) => ({ url: u.url ?? "", title: u.title ?? null, text: trim(u.text), charCount: (u.text ?? "").length }))
    .filter((u) => {
      const key = u.url || `${u.title}:${u.text.slice(0, 200)}`;
      if (!u.text || seenUrls.has(key)) return false;
      seenUrls.add(key);
      return true;
    });

  const conceptDraft =
    typeof source_materials?.conceptDraft === "string" && source_materials.conceptDraft.trim()
      ? source_materials.conceptDraft.trim().slice(0, 8_000)
      : typeof existing.conceptDraft === "string" && existing.conceptDraft.trim()
        ? existing.conceptDraft.trim().slice(0, 8_000)
        : (snap.business_concept ?? "").slice(0, 8_000);

  const { error } = await supabase
    .from("venture_snapshots")
    .update({
      source_materials: { documents, urls, conceptDraft },
      status: "enriching",
      enrichment_progress: {
        stage: "queued",
        progress: 0,
        message: "Rebuilding your brief from the source documents",
        updatedAt: new Date().toISOString(),
      },
    })
    .eq("id", id)
    .eq("user_id", await uid());
  if (error) throw new Error(error.message);

  void invokeEdge("venture-deep-research", { body: { snapshotId: id } });
}


export async function updateFounderContext(input: any): Promise<void> {
  const { id, ...patch } = unwrap<{
    id: string;
    founder_name?: string;
    founder_email?: string;
    founder_phone?: string;
    city?: string;
    region?: string;
    country?: string;
    market_scope?: string;
    industry?: string;
    sub_industry?: string;
    track?: string;
  }>(input);
  const { error } = await supabase.from("venture_snapshots").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateExtractedData(input: any): Promise<void> {
  const { id, extracted_data } = unwrap<{ id: string; extracted_data: any }>(input);
  const { error } = await supabase
    .from("venture_snapshots")
    .update({ extracted_data, status: "review" })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function advanceToGenerate(input: any): Promise<void> {
  const { id } = unwrap<{ id: string }>(input);
  const { error } = await supabase
    .from("venture_snapshots")
    .update({ status: "generating" })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function archiveSnapshot(input: any): Promise<void> {
  const { id } = unwrap<{ id: string }>(input);
  const { error } = await supabase
    .from("venture_snapshots")
    .update({ status: "archived" })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteSnapshot(input: any): Promise<void> {
  const { id } = unwrap<{ id: string }>(input);
  const userId = await uid().catch(() => undefined);
  const { error } = await supabase.from("venture_snapshots").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (userId) await resetWorkspaceIfEmpty(userId);
}

/**
 * If the user has zero ventures remaining, wipe all venture-derived founder/brief
 * data so the next venture starts from a clean slate. Best-effort: surfaces but
 * does not throw on RPC failure so the delete itself is still reported as success.
 */
export async function resetWorkspaceIfEmpty(userId: string): Promise<boolean> {
  try {
    const { count, error: cntErr } = await supabase
      .from("venture_snapshots")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (cntErr) throw cntErr;
    if ((count ?? 0) > 0) return false;
    const { error: rpcErr } = await supabase.rpc("reset_founder_workspace", { _user_id: userId });
    if (rpcErr) throw rpcErr;
    try {
      window.dispatchEvent(new CustomEvent("venture-sources:changed"));
      window.dispatchEvent(new CustomEvent("founder-workspace:reset"));
    } catch {}
    return true;
  } catch (e) {
    console.warn("[resetWorkspaceIfEmpty] failed:", e);
    return false;
  }
}

export async function retryEnrichment(input: any): Promise<void> {
  const { id } = unwrap<{ id: string }>(input);
  const { error } = await supabase
    .from("venture_snapshots")
    .update({
      status: "enriching",
      enrichment_progress: { stage: "queued", progress: 0, message: "Retrying", updatedAt: new Date().toISOString() },
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  void invokeEdge("venture-deep-research", { body: { snapshotId: id } });
}

export async function listDocumentTypes(): Promise<VentureDocumentType[]> {
  const { data, error } = await supabase
    .from("venture_document_types")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as VentureDocumentType[];
}

export async function listSnapshotDocuments(input: any): Promise<VentureDocument[]> {
  const { snapshotId } = unwrap<{ snapshotId: string }>(input);
  const { data, error } = await supabase
    .from("venture_documents")
    .select("*")
    .eq("snapshot_id", snapshotId);
  if (error) throw new Error(error.message);
  return (data ?? []) as VentureDocument[];
}

export async function getVentureDocumentById(input: any): Promise<VentureDocument | null> {
  const { id } = unwrap<{ id: string }>(input);
  if (!id) return null;
  const { data, error } = await supabase
    .from("venture_documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as VentureDocument | null;
}

export async function findVentureDocumentByLabel(input: any): Promise<VentureDocument | null> {
  const { label } = unwrap<{ label: string }>(input);
  if (!label) return null;
  // Normalize: strip ".docx" and " (v2)" suffixes, lowercase, spaces -> underscores
  const normalized = label
    .replace(/\.docx$/i, "")
    .replace(/\s*\(v\d+\)\s*$/i, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  const userId = await uid();
  const { data: snaps } = await supabase
    .from("venture_snapshots")
    .select("id")
    .eq("user_id", userId);
  const ids = (snaps ?? []).map((s: any) => s.id);
  if (ids.length === 0) return null;
  const { data, error } = await supabase
    .from("venture_documents")
    .select("*")
    .in("snapshot_id", ids)
    .eq("document_type", normalized)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as VentureDocument | null;
}

export async function generateDocument(input: any): Promise<void> {
  const { snapshotId, documentType, rewriteFeedback, rewriteTags, intakeAnswers } = unwrap<{
    snapshotId: string;
    documentType: string;
    rewriteFeedback?: string;
    rewriteTags?: string[];
    intakeAnswers?: Record<string, any>;
  }>(input);
  const { data, error } = await invokeEdge("venture-generate-document", {
    body: { snapshotId, documentType, rewriteFeedback, rewriteTags, intakeAnswers },
  });
  if (error) throw new Error(error.message);
  if (data && data.ok === false) throw payloadError(data, "Generation failed");
}

export async function generateDeepAssessment(input: any): Promise<void> {
  const { snapshotId, documentType, feedback, tags } = unwrap<{
    snapshotId: string;
    documentType: string;
    feedback?: string;
    tags?: string[];
  }>(input);
  const { data, error } = await invokeEdge("venture-generate-assessment", {
    body: { snapshotId, documentType, feedback, tags },
  });
  if (error) throw new Error(error.message);
  if (data && data.ok === false) throw payloadError(data, "Deep assessment failed");
}

export async function bulkGenerate(input: any): Promise<{ ok?: boolean; jobId?: string; category?: string | null }> {
  const { snapshotId, category, retryOnly, days, sprintOnly } = unwrap<{ snapshotId: string; category?: string | null; retryOnly?: boolean; days?: number[]; sprintOnly?: boolean }>(input);

  const { data, error } = await invokeEdge("venture-bulk-generate", {
    body: {
      snapshotId,
      category: category ?? null,
      retryOnly: retryOnly === true,
      days: Array.isArray(days) && days.length ? days : undefined,
      sprintOnly: sprintOnly === true ? true : undefined,
    },
  });

  if (error) {
    // Edge function may return a structured error like "unlock_required".
    const ctx = (error as any)?.context;
    if (ctx?.body) {
      try {
        const parsed = typeof ctx.body === "string" ? JSON.parse(ctx.body) : ctx.body;
        if (parsed?.error === "unlock_required") throw new Error("unlock_required");
      } catch (_e) { /* fall through */ }
    }
    throw new Error(error.message);
  }
  if (data && (data as any).error === "unlock_required") throw new Error("unlock_required");
  return data ?? {};
}

export async function hasBulkUnlockGrant(input: any): Promise<boolean> {
  const { snapshotId } = unwrap<{ snapshotId: string }>(input);
  const userId = await uid();
  const { data } = await supabase
    .from("bulk_unlock_grants")
    .select("id")
    .eq("user_id", userId)
    .eq("snapshot_id", snapshotId)
    .is("revoked_at", null)
    .maybeSingle();
  return !!data;
}

export async function verifyBulkUnlock(input: any): Promise<boolean> {
  const { snapshotId, code } = unwrap<{ snapshotId: string; code: string }>(input);
  const userId = await uid();
  const { data, error } = await supabase.rpc("verify_bulk_unlock", {
    _user_id: userId,
    _snapshot_id: snapshotId,
    _code: code,
  });
  if (error) throw new Error(error.message);
  return data === true;
}

export async function adminSetBulkUnlockDefault(input: any): Promise<void> {
  const { code } = unwrap<{ code: string }>(input);
  const { error } = await supabase.rpc("admin_set_bulk_unlock_default", { _code: code });
  if (error) throw new Error(error.message);
}

export async function adminClearBulkUnlockDefault(): Promise<void> {
  const { error } = await supabase.rpc("admin_clear_bulk_unlock_default");
  if (error) throw new Error(error.message);
}

export async function adminSetUserBulkUnlock(input: any): Promise<void> {
  const { userId, code } = unwrap<{ userId: string; code: string }>(input);
  const { error } = await supabase.rpc("admin_set_user_bulk_unlock", { _user_id: userId, _code: code });
  if (error) throw new Error(error.message);
}

export async function adminClearUserBulkUnlock(input: any): Promise<void> {
  const { userId } = unwrap<{ userId: string }>(input);
  const { error } = await supabase.rpc("admin_clear_user_bulk_unlock", { _user_id: userId });
  if (error) throw new Error(error.message);
}

export async function adminListUserBulkUnlocks(): Promise<Array<{ user_id: string; updated_at: string; email: string | null; display_name: string | null }>> {
  const { data: codes } = await supabase
    .from("bulk_unlock_codes")
    .select("user_id, updated_at")
    .is("revoked_at", null)
    .order("updated_at", { ascending: false });
  const list = codes ?? [];
  if (list.length === 0) return [];
  const ids = list.map((r: any) => r.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, email, display_name")
    .in("user_id", ids);
  const byId = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
  return list.map((r: any) => ({
    user_id: r.user_id,
    updated_at: r.updated_at,
    email: byId.get(r.user_id)?.email ?? null,
    display_name: byId.get(r.user_id)?.display_name ?? null,
  }));
}

export async function adminHasBulkUnlockDefault(): Promise<boolean> {
  const { data } = await supabase
    .from("site_settings")
    .select("key")
    .eq("key", "bulk_unlock_default")
    .maybeSingle();
  return !!data;
}


export async function getActiveJob(input: any) {
  const { snapshotId } = unwrap<{ snapshotId: string }>(input);
  const { data, error } = await supabase
    .from("venture_generation_jobs")
    .select("*")
    .eq("snapshot_id", snapshotId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function cancelJob(input: any): Promise<void> {
  const { jobId } = unwrap<{ jobId: string }>(input);
  const { error } = await supabase
    .from("venture_generation_jobs")
    .update({ cancel_requested: true })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
}

export async function listFailures(input: any) {
  const { snapshotId } = unwrap<{ snapshotId: string }>(input);
  const { data, error } = await supabase
    .from("venture_generation_failures")
    .select("*")
    .eq("snapshot_id", snapshotId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Assets that are waiting on the founder (e.g. Brand Wizard not locked).
// These are never retried automatically — they need an action first.
export async function listBlockedDocs(input: any) {
  const { snapshotId } = unwrap<{ snapshotId: string }>(input);
  const { data, error } = await supabase
    .from("venture_documents")
    .select("document_type, blocked_reason")
    .eq("snapshot_id", snapshotId)
    .not("blocked_reason", "is", null)
    .neq("status", "complete");
  if (error) throw new Error(error.message);
  return (data ?? []) as { document_type: string; blocked_reason: string }[];
}


// Admin
export async function adminListSnapshots() {
  const { data, error } = await supabase
    .from("venture_snapshots")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as VentureSnapshot[];
}

// Admin-only hard delete. RLS already allows DELETE for is_admin(auth.uid()),
// and FK cascades clean up venture_documents / venture_generation_jobs /
// venture_generation_failures. We best-effort wipe the snapshot's storage
// prefix in venture-doc-images first so we don't orphan files.
export async function adminDeleteSnapshot(input: any): Promise<void> {
  const { id } = unwrap<{ id: string }>(input);
  if (!id) throw new Error("Missing snapshot id");

  // Fetch owner so we can target the storage prefix `{user_id}/{snapshot_id}/`.
  const { data: snap, error: fetchErr } = await supabase
    .from("venture_snapshots")
    .select("user_id, status")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!snap) throw new Error("Venture not found");
  // Admin force-delete: allow even if a job is in flight. FK cascades clean up
  // venture_generation_jobs / failures so an orphaned job row won't linger.

  // Best-effort storage cleanup. Storage RLS allows admins to remove via the
  // existing storage policies; failures here are non-fatal — the row delete is
  // what matters for the user-visible list.
  try {
    const prefix = `${snap.user_id}/${id}`;
    const { data: files } = await supabase.storage
      .from("venture-doc-images")
      .list(prefix, { limit: 1000 });
    const paths: string[] = [];
    if (files?.length) {
      // list returns immediate children; walk one level for document_type folders.
      for (const entry of files) {
        if (entry.name && entry.name.endsWith(".png")) {
          paths.push(`${prefix}/${entry.name}`);
        } else if (entry.name) {
          const { data: sub } = await supabase.storage
            .from("venture-doc-images")
            .list(`${prefix}/${entry.name}`, { limit: 1000 });
          for (const s of sub ?? []) paths.push(`${prefix}/${entry.name}/${s.name}`);
        }
      }
    }
    if (paths.length) await supabase.storage.from("venture-doc-images").remove(paths);
  } catch (e) {
    console.warn("[adminDeleteSnapshot] storage cleanup failed:", e);
  }

  const { error: delErr } = await supabase
    .from("venture_snapshots")
    .delete()
    .eq("id", id);
  if (delErr) throw new Error(delErr.message);
  if (snap.user_id) await resetWorkspaceIfEmpty(snap.user_id);
}


// Concept refinement gateway
export async function refineConcept(input: any): Promise<any> {
  const { snapshotId, action, payload } = unwrap<{ snapshotId: string; action: string; payload?: any }>(input);
  const { data, error } = await invokeEdge("venture-concept-refine", {
    body: { snapshot_id: snapshotId, action, payload },
  });
  if (error) {
    // Surface gateway-side message when present
    const msg = (data as any)?.error || error.message;
    throw new Error(msg);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
}

export async function generateBrandAsset(input: any): Promise<any> {
  // Forward the whole payload — whitelisting fields here silently dropped
  // upload bodies (variant / dataUrl / filename) before they reached the server.
  const payload = unwrap<any>(input);
  const { data, error } = await invokeEdge("venture-brand-assets", {
    body: { ...payload },
  });



  if (error) {
    const msg = (data as any)?.error || error.message;
    throw new Error(msg);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
}




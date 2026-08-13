// One shared library for venture source documents.
//
// Every drop zone in the app — Brief prefill, Founder identity, Hub.new,
// Hub.$snapshotId source recovery — uploads through `uploadVentureSource` so a
// founder only ever uploads a file once. Files persist in `attendee_documents`
// with a cached `extracted_text` blob (filled server-side by the
// `venture-source-extract` edge function), and can be reattached to a venture
// at any point via `attachSourcesToSnapshot`.
//
// `snapshot_id` may be NULL while a file is "orphaned" (uploaded during Brief
// prefill before a venture exists). Once a venture is created we re-tag.
import { supabase } from "@/integrations/supabase/client";

// F10: notify the React layer that founder context may have changed so
// `useCanonicalContext` can refetch. We dispatch a window CustomEvent rather
// than import TanStack Query here — keeps this lib framework-agnostic.
const VENTURE_SOURCES_CHANGED_EVENT = "venture-sources:changed";
function notifySourcesChanged() {
  if (typeof window !== "undefined") {
    try { window.dispatchEvent(new CustomEvent(VENTURE_SOURCES_CHANGED_EVENT)); } catch { /* noop */ }
  }
}
export { VENTURE_SOURCES_CHANGED_EVENT };

export type VentureSourceKind = "founder_bio" | "brief_source" | "venture_source" | "other";

export interface VentureSource {
  id: string;
  user_id: string;
  storage_path: string;
  original_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  kind: string | null;
  snapshot_id: string | null;
  used_in_brief: boolean;
  extracted_text: string | null;
  extracted_at: string | null;
  extraction_error: string | null;
  created_at: string;
}

import { getEffectiveUserId } from "@/lib/effective-user";
import { invokeEdge } from "@/lib/edge-invoke";

async function uid() {
  return await getEffectiveUserId();
}


const KIND_FOLDER: Record<string, string> = {
  founder_bio: "founder",
  brief_source: "brief",
  venture_source: "venture",
  other: "misc",
};

/**
 * Upload a file to attendee-docs storage and create an attendee_documents row.
 * Kicks off server-side text extraction (fire-and-forget). Returns the row;
 * caller can poll `extracted_at` if it needs the text immediately.
 */
export async function uploadVentureSource(opts: {
  file: File;
  snapshotId?: string | null;
  kind?: VentureSourceKind;
  usedInBrief?: boolean;
  /** Wait for extraction to finish before returning (default true, ~4 min ceiling). */
  waitForExtraction?: boolean;
  /** Called on each poll while extraction is still running. */
  onExtractionTick?: (elapsedMs: number) => void;
}): Promise<VentureSource> {
  const { file, snapshotId = null, kind = "venture_source", usedInBrief = false } = opts;
  const userId = await uid();
  const folder = KIND_FOLDER[kind] ?? "misc";
  const scope = snapshotId ?? "unassigned";
  const path = `${userId}/${folder}/${scope}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${file.name}`;

  const { error: upErr } = await supabase.storage
    .from("attendee-docs")
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (upErr) throw new Error(upErr.message);

  const { data: row, error: insErr } = await supabase
    .from("attendee_documents")
    .insert({
      user_id: userId,
      storage_path: path,
      original_name: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
      kind,
      snapshot_id: snapshotId,
      used_in_brief: usedInBrief,
    })
    .select("*")
    .single();
  if (insErr) throw new Error(insErr.message);

  // Fire extraction. We don't fail the upload if the function call fails — the
  // row exists, and the user can retry from the UI.
  const extractPromise = supabase.functions
    .invoke("venture-source-extract", { body: { documentId: row.id } })
    .catch((e) => ({ error: e }));

  const waitForExtraction = opts.waitForExtraction !== false;
  if (waitForExtraction) {
    // Big PDFs routinely take 60-120s to transcribe. Poll the row until the
    // server marks it done instead of racing a short timer — a timeout is not
    // a read failure, and treating it as one used to strand the founder's
    // primary brief with "Couldn't read file" while extraction was still live.
    void extractPromise;
    const fresh = await waitForExtractedText(row.id);
    if (fresh) { notifySourcesChanged(); return fresh; }
  }
  notifySourcesChanged();
  return row as VentureSource;
}

/** How long we'll wait for a server-side extraction before giving up. */
export const EXTRACTION_POLL_CEILING_MS = 240_000;

/**
 * Poll a document row until extraction finishes (text or error recorded), or
 * the ceiling is hit. Returns the freshest row we saw, or null.
 */
export async function waitForExtractedText(
  documentId: string,
  opts: { ceilingMs?: number; intervalMs?: number; onTick?: (row: VentureSource, elapsedMs: number) => void } = {},
): Promise<VentureSource | null> {
  const ceiling = opts.ceilingMs ?? EXTRACTION_POLL_CEILING_MS;
  const interval = opts.intervalMs ?? 2000;
  const started = Date.now();
  let last: VentureSource | null = null;
  for (;;) {
    const { data } = await supabase
      .from("attendee_documents").select("*").eq("id", documentId).maybeSingle();
    if (data) {
      last = data as VentureSource;
      opts.onTick?.(last, Date.now() - started);
      const done = !!last.extracted_at || !!last.extraction_error || !!(last.extracted_text ?? "").trim();
      if (done) return last;
    }
    if (Date.now() - started >= ceiling) return last;
    await new Promise((r) => setTimeout(r, interval));
  }
}

/**
 * Re-check a stuck document before spending another extraction pass. If the
 * row already carries text (common — the first pass finished after the UI
 * gave up), we return it as-is; otherwise we re-invoke extraction and wait.
 */
export async function recoverOrRetryExtraction(documentId: string): Promise<VentureSource | null> {
  const { data } = await supabase
    .from("attendee_documents").select("*").eq("id", documentId).maybeSingle();
  const row = (data ?? null) as VentureSource | null;
  if (row && (row.extracted_text ?? "").trim()) { notifySourcesChanged(); return row; }
  void supabase.functions.invoke("venture-source-extract", { body: { documentId } }).catch(() => {});
  const fresh = await waitForExtractedText(documentId);
  notifySourcesChanged();
  return fresh ?? row;
}

/** List documents owned by the current user, optionally scoped. */
export async function listVentureSources(opts: {
  snapshotId?: string | null;
  /** When set, returns only files uploaded for the Startup Brief (snapshot_id NULL, used_in_brief true). */
  briefOnly?: boolean;
  /** When set, returns ONLY orphans (snapshot_id NULL) — used by hub.new's "reuse a file" picker. */
  orphansOnly?: boolean;
} = {}): Promise<VentureSource[]> {
  const userId = await uid();
  let q = supabase.from("attendee_documents").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (opts.snapshotId !== undefined && opts.snapshotId !== null) q = q.eq("snapshot_id", opts.snapshotId);
  if (opts.orphansOnly) q = q.is("snapshot_id", null);
  if (opts.briefOnly) q = q.eq("used_in_brief", true).is("snapshot_id", null);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as VentureSource[];
}

/**
 * Sources that already belong to another venture, grouped by that venture.
 * Used by hub.new's explicit "reuse from another venture" picker — these are
 * never auto-selected, and reusing one COPIES it (see `copySourceToSnapshot`).
 */
export async function listSourcesByOtherVentures(): Promise<
  Array<{ snapshotId: string; ventureName: string; sources: VentureSource[] }>
> {
  const userId = await uid();
  const { data, error } = await supabase
    .from("attendee_documents")
    .select("*")
    .eq("user_id", userId)
    .not("snapshot_id", "is", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as VentureSource[];
  if (!rows.length) return [];

  const snapshotIds = Array.from(new Set(rows.map((r) => r.snapshot_id).filter(Boolean))) as string[];
  const { data: snaps } = await supabase
    .from("venture_snapshots")
    .select("id, company_name")
    .in("id", snapshotIds);
  const nameById = new Map((snaps ?? []).map((s: any) => [s.id, s.company_name || "Untitled venture"]));

  const grouped = new Map<string, VentureSource[]>();
  for (const r of rows) {
    if (!r.snapshot_id) continue;
    // Only readable sources are worth reusing.
    if (!(r.extracted_text ?? "").trim()) continue;
    const list = grouped.get(r.snapshot_id) ?? [];
    list.push(r);
    grouped.set(r.snapshot_id, list);
  }
  return Array.from(grouped.entries()).map(([snapshotId, sources]) => ({
    snapshotId,
    ventureName: nameById.get(snapshotId) ?? "Untitled venture",
    sources,
  }));
}

/**
 * Copy an existing source into another scope WITHOUT moving it. Creates a new
 * `attendee_documents` row that points at the same storage object and carries
 * the cached extracted text, so the original venture keeps its memory intact.
 */
export async function copySourceToSnapshot(opts: {
  documentId: string;
  snapshotId?: string | null;
}): Promise<VentureSource> {
  const userId = await uid();
  const { data: src, error: readErr } = await supabase
    .from("attendee_documents")
    .select("*")
    .eq("id", opts.documentId)
    .eq("user_id", userId)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  if (!src) throw new Error("Source not found");

  const { data: row, error: insErr } = await supabase
    .from("attendee_documents")
    .insert({
      user_id: userId,
      storage_path: src.storage_path,
      original_name: src.original_name,
      mime_type: src.mime_type,
      size_bytes: src.size_bytes,
      kind: src.kind,
      snapshot_id: opts.snapshotId ?? null,
      used_in_brief: false,
      extracted_text: src.extracted_text,
      extracted_at: src.extracted_at,
    })
    .select("*")
    .single();
  if (insErr) throw new Error(insErr.message);
  notifySourcesChanged();
  return row as VentureSource;
}

/**
 * Attach documents to a venture.
 *
 * Rules that protect Second Brain scoping:
 * - Rows already attached to another venture are COPIED, never moved.
 * - Founder-level rows (founder bio, Startup Brief captures) are COPIED so a
 *   second venture doesn't strip them from the first / from the brief.
 * - Plain unassigned uploads are re-tagged in place.
 */
export async function attachSourcesToSnapshot(opts: { documentIds: string[]; snapshotId: string }): Promise<void> {
  if (!opts.documentIds.length) return;
  const userId = await uid();
  const { data, error: readErr } = await supabase
    .from("attendee_documents")
    .select("*")
    .in("id", opts.documentIds)
    .eq("user_id", userId);
  if (readErr) throw new Error(readErr.message);
  const rows = (data ?? []) as VentureSource[];

  const retagIds: string[] = [];
  const copyIds: string[] = [];
  for (const r of rows) {
    if (r.snapshot_id) {
      if (r.snapshot_id !== opts.snapshotId) copyIds.push(r.id);
      continue;
    }
    if (r.kind === "founder_bio" || r.kind === "brief_source" || r.used_in_brief) copyIds.push(r.id);
    else retagIds.push(r.id);
  }

  if (retagIds.length) {
    const { error } = await supabase
      .from("attendee_documents")
      .update({ snapshot_id: opts.snapshotId })
      .in("id", retagIds)
      .is("snapshot_id", null)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  }
  for (const id of copyIds) {
    await copySourceToSnapshot({ documentId: id, snapshotId: opts.snapshotId });
  }
  notifySourcesChanged();
}

export async function deleteVentureSource(id: string): Promise<void> {
  const userId = await uid();
  const { data: row } = await supabase
    .from("attendee_documents").select("storage_path").eq("id", id).eq("user_id", userId).maybeSingle();
  if (row?.storage_path) {
    // A storage object can be shared by copies across ventures — only remove
    // the file when this is the last row referencing it.
    const { count } = await supabase
      .from("attendee_documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("storage_path", row.storage_path);
    if ((count ?? 1) <= 1) {
      await supabase.storage.from("attendee-docs").remove([row.storage_path]).catch(() => {});
    }
  }
  const { error } = await supabase.from("attendee_documents").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  notifySourcesChanged();
}

/** Manually retry extraction for a file. */
export async function retryExtraction(documentId: string): Promise<void> {
  const { error } = await invokeEdge("venture-source-extract", { body: { documentId } });
  if (error) throw new Error(error.message);
  notifySourcesChanged();
}

/**
 * Rewrite the `Intent:` header line inside a URL-capture markdown source
 * so the founder can flip a saved chip between "own" and "pattern" without
 * re-scraping. Only affects `attendee_documents.extracted_text` — the stored
 * markdown file in storage is not rewritten (the extracted_text is what
 * downstream synthesis reads).
 */
export async function updateVentureSourceIntent(
  documentId: string,
  intent: "own" | "pattern",
): Promise<VentureSource> {
  const userId = await uid();
  const { data: row, error: readErr } = await supabase
    .from("attendee_documents")
    .select("*")
    .eq("id", documentId)
    .eq("user_id", userId)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  if (!row) throw new Error("Source not found");
  const current = (row.extracted_text ?? "") as string;
  let next: string;
  if (/^Intent:\s*(own|pattern)\b/im.test(current)) {
    next = current.replace(/^Intent:\s*(own|pattern)\b.*$/im, `Intent: ${intent}`);
  } else {
    // Insert the Intent line right after a leading "Source:" line if present,
    // otherwise prepend it above the body.
    if (/^Source:\s*\S+/im.test(current)) {
      next = current.replace(/^(Source:\s*\S+.*)$/im, `$1\nIntent: ${intent}`);
    } else {
      next = `Intent: ${intent}\n\n${current}`;
    }
  }
  const { data: updated, error: upErr } = await supabase
    .from("attendee_documents")
    .update({ extracted_text: next })
    .eq("id", documentId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (upErr) throw new Error(upErr.message);
  notifySourcesChanged();
  return updated as VentureSource;
}


/**
 * Build the source_materials payload for createSnapshot from a set of
 * attendee_documents rows. Skips files without extracted text.
 */
export function sourcesToSnapshotPayload(sources: VentureSource[], conceptDraft = ""): {
  documents: Array<{ filename: string; text: string }>;
  urls: Array<{ url: string; title: string | null; text: string }>;
  conceptDraft: string;
} {
  return {
    documents: sources
      .filter((s) => (s.extracted_text ?? "").trim().length > 0)
      .map((s) => ({ filename: s.original_name, text: s.extracted_text ?? "" })),
    urls: [],
    conceptDraft,
  };
}

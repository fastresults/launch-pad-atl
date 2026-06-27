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

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
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
  /** Wait for extraction to finish before returning (default true, max 30s). */
  waitForExtraction?: boolean;
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
    await Promise.race([extractPromise, new Promise((r) => setTimeout(r, 30_000))]);
    const fresh = await supabase
      .from("attendee_documents").select("*").eq("id", row.id).maybeSingle();
    if (fresh.data) { notifySourcesChanged(); return fresh.data as VentureSource; }
  }
  notifySourcesChanged();
  return row as VentureSource;
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

/** Re-tag a set of (orphan) documents onto a venture. */
export async function attachSourcesToSnapshot(opts: { documentIds: string[]; snapshotId: string }): Promise<void> {
  if (!opts.documentIds.length) return;
  const { error } = await supabase
    .from("attendee_documents")
    .update({ snapshot_id: opts.snapshotId })
    .in("id", opts.documentIds)
    .eq("user_id", await uid());
  if (error) throw new Error(error.message);
  notifySourcesChanged();
}

export async function deleteVentureSource(id: string): Promise<void> {
  const userId = await uid();
  const { data: row } = await supabase
    .from("attendee_documents").select("storage_path").eq("id", id).eq("user_id", userId).maybeSingle();
  if (row?.storage_path) {
    await supabase.storage.from("attendee-docs").remove([row.storage_path]).catch(() => {});
  }
  const { error } = await supabase.from("attendee_documents").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  notifySourcesChanged();
}

/** Manually retry extraction for a file. */
export async function retryExtraction(documentId: string): Promise<void> {
  const { error } = await supabase.functions.invoke("venture-source-extract", { body: { documentId } });
  if (error) throw new Error(error.message);
  notifySourcesChanged();
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

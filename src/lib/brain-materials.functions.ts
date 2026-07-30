import { supabase } from "@/integrations/supabase/client";

export type BrainMaterialStatus =
  | "queued"
  | "uploading"
  | "reading"
  | "understanding"
  | "indexing"
  | "ready"
  | "failed";

export type BrainMaterial = {
  id: string;
  title: string;
  source_type: "file" | "link";
  mime_type: string | null;
  byte_size: number | null;
  storage_bucket: string | null;
  storage_path: string | null;
  source_url: string | null;
  extracted_text: string | null;
  summary: string | null;
  key_points: string[];
  tags: string[];
  doc_kind: string | null;
  status: BrainMaterialStatus;
  chunk_count: number;
  error_message: string | null;
  created_at: string;
};

export const MATERIAL_MAX_BYTES = 25 * 1024 * 1024;

const TABLE = "brain_materials" as any;

function normalize(row: any): BrainMaterial {
  return {
    ...row,
    key_points: Array.isArray(row?.key_points) ? row.key_points.map((p: unknown) => String(p ?? "")) : [],
    tags: Array.isArray(row?.tags) ? row.tags : [],
  } as BrainMaterial;
}

export async function listBrainMaterials(userId: string, snapshotId: string | null): Promise<BrainMaterial[]> {
  let q = supabase.from(TABLE).select("*").eq("user_id", userId);
  q = snapshotId ? q.eq("snapshot_id", snapshotId) : q.is("snapshot_id", null);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalize);
}

function readableError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  if (/jwt|401|not signed in|missing auth/i.test(raw)) {
    return "Your session expired — sign in again, then retry.";
  }
  return raw || "Something went wrong.";
}

/** Kick off ingest. On failure the row is flipped to `failed` so the card can
 * show the real reason and offer Retry instead of spinning on "Queued". */
async function startIngest(materialId: string, ownerId?: string | null) {
  try {
    const { data, error } = await supabase.functions.invoke("brain-material-ingest", {
      body: { materialId, ownerId: ownerId ?? undefined },
    });
    if (error) throw error;
    if (data && typeof data === "object" && "error" in (data as any) && (data as any).error) {
      throw new Error(String((data as any).error));
    }
  } catch (err) {
    const message = readableError(err);
    await supabase.from(TABLE).update({ status: "failed", error_message: message }).eq("id", materialId);
    throw new Error(message);
  }
}


/** Upload one file, create its row, and kick off AI extraction + indexing. */
export async function uploadBrainMaterial(
  userId: string,
  file: File,
  snapshotId: string | null,
): Promise<BrainMaterial> {
  if (file.size > MATERIAL_MAX_BYTES) {
    throw new Error(`${file.name} is larger than 25MB.`);
  }
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${userId}/brain/${snapshotId ?? "account"}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 6)}-${safeName}`;

  const { error: upErr } = await supabase.storage
    .from("attendee-docs")
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (upErr) throw new Error(`Upload failed: ${readableError(upErr)}`);

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      snapshot_id: snapshotId,
      title: file.name,
      source_type: "file",
      mime_type: file.type || null,
      byte_size: file.size,
      storage_bucket: "attendee-docs",
      storage_path: path,
      status: "queued",
    })
    .select("*")
    .single();
  if (error) throw new Error(`Couldn't save ${file.name}: ${readableError(error)}`);

  const row = data as any;
  // Awaited: a failed kickoff now marks the row failed and surfaces the reason.
  await startIngest(row.id, userId);
  return normalize(row);

}

/** Add a public URL as a material. */
export async function addBrainMaterialLink(
  userId: string,
  url: string,
  snapshotId: string | null,
): Promise<BrainMaterial> {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    throw new Error("That doesn't look like a valid link.");
  }
  if (!/^https?:$/.test(parsed.protocol)) throw new Error("Only http and https links work here.");

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      snapshot_id: snapshotId,
      title: parsed.hostname + parsed.pathname.replace(/\/$/, ""),
      source_type: "link",
      source_url: parsed.toString(),
      status: "queued",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const row = data as any;
  startIngest(row.id).catch(() => { /* retryable from the card */ });
  return normalize(row);
}

export async function retryBrainMaterial(materialId: string): Promise<void> {
  await supabase.from(TABLE).update({ status: "queued", error_message: null }).eq("id", materialId);
  await startIngest(materialId);
}

export async function renameBrainMaterial(materialId: string, title: string): Promise<void> {
  const clean = title.trim().slice(0, 120);
  if (!clean) return;
  const { error } = await supabase.from(TABLE).update({ title: clean }).eq("id", materialId);
  if (error) throw new Error(error.message);
}

/** Remove a material: its memory chunks, its stored file, then the row. */
export async function deleteBrainMaterial(material: BrainMaterial): Promise<void> {
  await supabase.from("founder_brain_memory").delete().eq("kind", "material").eq("source_ref", material.id);
  if (material.storage_path) {
    await supabase.storage
      .from(material.storage_bucket || "attendee-docs")
      .remove([material.storage_path])
      .catch(() => { /* orphaned file is harmless */ });
  }
  const { error } = await supabase.from(TABLE).delete().eq("id", material.id);
  if (error) throw new Error(error.message);
}

export async function getBrainMaterialUrl(material: BrainMaterial): Promise<string | null> {
  if (material.source_type === "link") return material.source_url;
  if (!material.storage_path) return null;
  const { data, error } = await supabase.storage
    .from(material.storage_bucket || "attendee-docs")
    .createSignedUrl(material.storage_path, 300);
  if (error) return null;
  return data?.signedUrl ?? null;
}

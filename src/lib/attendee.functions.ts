// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { getEffectiveUserId } from "@/lib/effective-user";

async function uid() {
  return await getEffectiveUserId();
}


export async function getMyProfile() {
  const { data } = await supabase
    .from("attendee_profiles")
    .select("*")
    .eq("user_id", await uid())
    .maybeSingle();
  return data;
}

export async function upsertMyProfile(data: any) {
  const { error } = await supabase
    .from("attendee_profiles")
    .upsert({ ...data, user_id: await uid() }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

export async function listMyDocuments() {
  const { data } = await supabase
    .from("attendee_documents")
    .select("*")
    .eq("user_id", await uid())
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function createDocumentUploadUrl(data: {
  filename: string;
  contentType: string;
  snapshotId?: string | null;
}) {
  const folder = data.snapshotId ?? "unassigned";
  // Sanitize: Supabase storage rejects many non-ASCII characters (em dashes, smart quotes, etc.)
  const safeName = data.filename
    .normalize("NFKD")
    .replace(/[\u2010-\u2015]/g, "-") // various dashes → hyphen
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\x20-\x7E]/g, "") // strip remaining non-ASCII
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim() || "file";
  const path = `${await uid()}/${folder}/${Date.now()}-${safeName}`;
  const { data: res, error } = await supabase.storage
    .from("attendee-docs")
    .createSignedUploadUrl(path);
  if (error) throw new Error(error.message);
  return { uploadUrl: res.signedUrl, path };
}

export async function finalizeDocument(data: {
  path: string;
  label: string;
  contentType?: string;
  size?: number;
  kind?: string;
  sourceVentureDocumentId?: string | null;
  snapshotId?: string | null;
}) {
  const { error } = await supabase.from("attendee_documents").insert({
    user_id: await uid(),
    storage_path: data.path,
    original_name: data.label,
    mime_type: data.contentType ?? null,
    size_bytes: data.size ?? null,
    kind: data.kind ?? "other",
    source_venture_document_id: data.sourceVentureDocumentId ?? null,
    snapshot_id: data.snapshotId ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function updateDocumentVenture(data: { id: string; snapshotId: string | null }) {
  const { error } = await supabase
    .from("attendee_documents")
    .update({ snapshot_id: data.snapshotId })
    .eq("id", data.id)
    .eq("user_id", await uid());
  if (error) throw new Error(error.message);
}

export async function deleteMyDocument(data: { id: string }) {
  const { error } = await supabase
    .from("attendee_documents")
    .delete()
    .eq("id", data.id)
    .eq("user_id", await uid());
  if (error) throw new Error(error.message);
}

export async function getDocumentDownloadUrl(data: { path: string }) {
  const { data: res, error } = await supabase.storage
    .from("attendee-docs")
    .createSignedUrl(data.path, 3600);
  if (error) throw new Error(error.message);
  return { url: res.signedUrl };
}

export async function listMyGoals() {
  const { data } = await supabase
    .from("attendee_goals")
    .select("*")
    .eq("user_id", await uid())
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function upsertGoal(data: any) {
  const { error } = await supabase
    .from("attendee_goals")
    .upsert({ ...data, user_id: await uid() });
  if (error) throw new Error(error.message);
}

export async function deleteGoal(data: { id: string }) {
  const { error } = await supabase
    .from("attendee_goals")
    .delete()
    .eq("id", data.id)
    .eq("user_id", await uid());
  if (error) throw new Error(error.message);
}

export async function getMyProgress() {
  const { data } = await supabase
    .from("attendee_progress")
    .select("*")
    .eq("user_id", await uid());
  return data ?? [];
}

export async function updateModuleProgress(data: { module_key: string; completed: boolean }) {
  const { error } = await supabase
    .from("attendee_progress")
    .upsert(
      { user_id: await uid(), module_key: data.module_key, completed: data.completed },
      { onConflict: "user_id,module_key" },
    );
  if (error) throw new Error(error.message);
}

export async function listMyDeliverables() {
  const { data } = await supabase
    .from("attendee_deliverables")
    .select("*")
    .eq("user_id", await uid())
    .order("updated_at", { ascending: false });
  return data ?? [];
}

export async function getMyDeliverable(data: { key: string }) {
  const { data: row } = await supabase
    .from("attendee_deliverables")
    .select("*")
    .eq("user_id", await uid())
    .eq("deliverable_key", data.key)
    .maybeSingle();
  return row;
}

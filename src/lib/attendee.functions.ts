// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

async function uid() {
  return (await supabase.auth.getUser()).data.user!.id;
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

export async function createDocumentUploadUrl(data: { filename: string; contentType: string }) {
  const path = `${await uid()}/${Date.now()}-${data.filename}`;
  const { data: res, error } = await supabase.storage
    .from("attendee-docs")
    .createSignedUploadUrl(path);
  if (error) throw new Error(error.message);
  return { uploadUrl: res.signedUrl, path };
}

export async function finalizeDocument(data: { path: string; label: string; contentType?: string; size?: number; kind?: string }) {
  const { error } = await supabase.from("attendee_documents").insert({
    user_id: await uid(),
    storage_path: data.path,
    original_name: data.label,
    mime_type: data.contentType ?? null,
    size_bytes: data.size ?? null,
    kind: data.kind ?? "other",
  });
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

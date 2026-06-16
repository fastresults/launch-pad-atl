import { supabase } from "@/integrations/supabase/client";

async function uid() {
  return (await supabase.auth.getUser()).data.user!.id;
}

export async function getMyProfile() {
  const { data } = await supabase.from("members").select("*").eq("user_id", await uid()).maybeSingle();
  return data;
}

export async function upsertMyProfile(data: any) {
  const { error } = await supabase.from("members").upsert({ ...data, user_id: await uid() });
  if (error) throw new Error(error.message);
}

export async function listMyDocuments() {
  const { data } = await supabase.from("member_documents").select("*").eq("user_id", await uid()).order("created_at", { ascending: false });
  return data ?? [];
}

export async function createDocumentUploadUrl(data: { filename: string; contentType: string }) {
  const path = `${await uid()}/${Date.now()}-${data.filename}`;
  const { data: res, error } = await supabase.storage.from("member-documents").createSignedUploadUrl(path);
  if (error) throw new Error(error.message);
  return { uploadUrl: res.signedUrl, path };
}

export async function finalizeDocument(data: { path: string; label: string }) {
  const { error } = await supabase.from("member_documents").insert({ user_id: await uid(), path: data.path, label: data.label });
  if (error) throw new Error(error.message);
}

export async function deleteMyDocument(data: { id: string }) {
  const { error } = await supabase.from("member_documents").delete().eq("id", data.id).eq("user_id", await uid());
  if (error) throw new Error(error.message);
}

export async function getDocumentDownloadUrl(data: { path: string }) {
  const { data: res, error } = await supabase.storage.from("member-documents").createSignedUrl(data.path, 3600);
  if (error) throw new Error(error.message);
  return { url: res.signedUrl };
}

export async function listMyGoals() {
  const { data } = await supabase.from("member_goals").select("*").eq("user_id", await uid()).order("sort_order", { ascending: true });
  return data ?? [];
}

export async function upsertGoal(data: any) {
  const { error } = await supabase.from("member_goals").upsert({ ...data, user_id: await uid() });
  if (error) throw new Error(error.message);
}

export async function deleteGoal(data: { id: string }) {
  const { error } = await supabase.from("member_goals").delete().eq("id", data.id).eq("user_id", await uid());
  if (error) throw new Error(error.message);
}

export async function getMyProgress() {
  const { data } = await supabase.from("member_progress").select("*").eq("user_id", await uid());
  return data ?? [];
}

export async function updateModuleProgress(data: { module_key: string; completed: boolean }) {
  const { error } = await supabase.from("member_progress").upsert({ user_id: await uid(), module_key: data.module_key, completed: data.completed });
  if (error) throw new Error(error.message);
}

export async function listMyDeliverables() {
  const { data } = await supabase.from("member_deliverables").select("*").eq("user_id", await uid()).order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getMyDeliverable(data: { key: string }) {
  const { data: row } = await supabase.from("member_deliverables").select("*").eq("user_id", await uid()).eq("key", data.key).maybeSingle();
  return row;
}

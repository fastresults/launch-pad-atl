import { supabase } from "@/integrations/supabase/client";

async function uid() { return (await supabase.auth.getUser()).data.user!.id; }

export async function listMedia(data?: { folderId?: string }) {
  let q = supabase.from("media_items").select("*").eq("user_id", await uid()).order("created_at", { ascending: false });
  if (data?.folderId) q = q.eq("folder_id", data.folderId);
  const { data: rows } = await q;
  return rows ?? [];
}
export async function listFolders() {
  const { data } = await supabase.from("media_folders").select("*").eq("user_id", await uid()).order("name", { ascending: true });
  return data ?? [];
}
export async function createFolder(data: { name: string }) {
  const { error } = await supabase.from("media_folders").insert({ user_id: await uid(), name: data.name });
  if (error) throw new Error(error.message);
}
export async function renameFolder(data: { id: string; name: string }) {
  const { error } = await supabase.from("media_folders").update({ name: data.name }).eq("id", data.id);
  if (error) throw new Error(error.message);
}
export async function deleteFolder(data: { id: string }) {
  const { error } = await supabase.from("media_folders").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
}
export async function listCollections() {
  const { data } = await supabase.from("media_collections").select("*").eq("user_id", await uid()).order("name", { ascending: true });
  return data ?? [];
}
export async function createCollection(data: { name: string }) {
  const { error } = await supabase.from("media_collections").insert({ user_id: await uid(), name: data.name });
  if (error) throw new Error(error.message);
}
export async function toggleCollectionItem(data: { collectionId: string; mediaId: string }) {
  const { data: existing } = await supabase.from("media_collection_items").select("id").eq("collection_id", data.collectionId).eq("media_id", data.mediaId).maybeSingle();
  if (existing) {
    await supabase.from("media_collection_items").delete().eq("id", existing.id);
  } else {
    await supabase.from("media_collection_items").insert({ collection_id: data.collectionId, media_id: data.mediaId });
  }
}
export async function createSignedUploadUrl(data: { filename: string; contentType: string }) {
  const path = `${await uid()}/${Date.now()}-${data.filename}`;
  const { data: res, error } = await supabase.storage.from("media").createSignedUploadUrl(path);
  if (error) throw new Error(error.message);
  return { uploadUrl: res.signedUrl, path };
}
export async function finalizeUpload(data: { path: string; filename: string; contentType: string; folderId?: string }) {
  const { error } = await supabase.from("media_items").insert({ user_id: await uid(), path: data.path, filename: data.filename, content_type: data.contentType, folder_id: data.folderId ?? null });
  if (error) throw new Error(error.message);
}

export async function getAssetSignedUrl(data: { path: string }) {
  const { data: res, error } = await supabase.storage.from("media").createSignedUrl(data.path, 3600);
  if (error) throw new Error(error.message);
  return { url: res.signedUrl };
}
export async function updateAsset(data: { id: string; [key: string]: any }) {
  const { id, ...rest } = data;
  const { error } = await supabase.from("media_items").update(rest).eq("id", id);
  if (error) throw new Error(error.message);
}
export async function deleteAsset(data: { id: string; path: string }) {
  await supabase.storage.from("media").remove([data.path]);
  const { error } = await supabase.from("media_items").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
}
export async function pushAssetsToUsers(_data: any) { return; }
export async function listAttendeesForPush() { return []; }
export async function reprocessAi(_data: any) { return; }

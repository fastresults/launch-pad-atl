// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

async function uid() {
  return (await supabase.auth.getUser()).data.user!.id;
}

export async function listMedia(data?: { folderId?: string }) {
  let q = supabase
    .from("media_assets")
    .select("*")
    .eq("owner_user_id", await uid())
    .order("created_at", { ascending: false });
  if (data?.folderId) q = q.eq("folder_id", data.folderId);
  const { data: rows } = await q;
  return rows ?? [];
}

export async function listFolders() {
  const { data } = await supabase
    .from("media_folders")
    .select("*")
    .eq("owner_user_id", await uid())
    .order("name", { ascending: true });
  return data ?? [];
}

export async function createFolder(data: { name: string }) {
  const userId = await uid();
  const { error } = await supabase
    .from("media_folders")
    .insert({ owner_user_id: userId, scope: "user", name: data.name, created_by: userId });
  if (error) throw new Error(error.message);
}

export async function renameFolder(data: { id: string; name: string }) {
  const { error } = await supabase
    .from("media_folders")
    .update({ name: data.name })
    .eq("id", data.id);
  if (error) throw new Error(error.message);
}

export async function deleteFolder(data: { id: string }) {
  const { error } = await supabase.from("media_folders").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
}

export async function listCollections() {
  const { data } = await supabase
    .from("media_collections")
    .select("*")
    .eq("owner_user_id", await uid())
    .order("name", { ascending: true });
  return data ?? [];
}

export async function createCollection(data: { name: string }) {
  const userId = await uid();
  const { error } = await supabase
    .from("media_collections")
    .insert({ owner_user_id: userId, scope: "user", name: data.name, created_by: userId });
  if (error) throw new Error(error.message);
}

export async function toggleCollectionItem(data: { collectionId: string; mediaId: string }) {
  const { data: existing } = await supabase
    .from("media_collection_items")
    .select("collection_id, asset_id")
    .eq("collection_id", data.collectionId)
    .eq("asset_id", data.mediaId)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("media_collection_items")
      .delete()
      .eq("collection_id", data.collectionId)
      .eq("asset_id", data.mediaId);
  } else {
    await supabase
      .from("media_collection_items")
      .insert({ collection_id: data.collectionId, asset_id: data.mediaId });
  }
}

export async function createSignedUploadUrl(data: { filename: string; contentType: string }) {
  const path = `${await uid()}/${Date.now()}-${data.filename}`;
  const { data: res, error } = await supabase.storage
    .from("user-media")
    .createSignedUploadUrl(path);
  if (error) throw new Error(error.message);
  return { uploadUrl: res.signedUrl, path };
}

export async function finalizeUpload(data: {
  path: string;
  filename: string;
  contentType: string;
  folderId?: string;
  size?: number;
}) {
  const userId = await uid();
  const { error } = await supabase.from("media_assets").insert({
    owner_user_id: userId,
    scope: "user",
    storage_bucket: "user-media",
    storage_path: data.path,
    original_name: data.filename,
    mime_type: data.contentType,
    folder_id: data.folderId ?? null,
    size_bytes: data.size ?? null,
    upload_status: "complete",
    created_by: userId,
  });
  if (error) throw new Error(error.message);
}

export async function getAssetSignedUrl(data: { path: string; bucket?: string }) {
  const bucket = data.bucket ?? "user-media";
  const { data: res, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(data.path, 3600);
  if (error) throw new Error(error.message);
  return { url: res.signedUrl };
}

export async function updateAsset(data: { id: string; [key: string]: any }) {
  const { id, ...rest } = data;
  const { error } = await supabase.from("media_assets").update(rest).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAsset(data: { id: string; path: string; bucket?: string }) {
  const bucket = data.bucket ?? "user-media";
  await supabase.storage.from(bucket).remove([data.path]);
  const { error } = await supabase.from("media_assets").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
}

export async function pushAssetsToUsers(_data: any) {
  return;
}
export async function listAttendeesForPush() {
  return [];
}
export async function reprocessAi(_data: any) {
  return;
}

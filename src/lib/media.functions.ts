// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { getEffectiveUserId } from "@/lib/effective-user";

async function uid() {
  try {
    return await getEffectiveUserId();
  } catch {
    throw new Error("You must be signed in to upload media.");
  }
}


type Scope = "master" | "user";

function bucketForScope(scope: Scope = "user") {
  return scope === "master" ? "master-media" : "user-media";
}

function safeFilename(filename: string) {
  return (filename || "upload")
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160) || "upload";
}

function mediaTypeFor(contentType: string, filename: string) {
  const mime = (contentType || "").toLowerCase();
  const name = (filename || "").toLowerCase();
  if (mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)$/.test(name)) return "image";
  if (mime.startsWith("video/") || /\.(mp4|mov|webm|m4v|avi)$/.test(name)) return "video";
  if (mime.startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg|flac)$/.test(name)) return "audio";
  if (
    mime.includes("pdf") ||
    mime.includes("document") ||
    mime.includes("text/") ||
    /\.(pdf|docx?|xlsx?|pptx?|txt|csv|md|rtf)$/.test(name)
  ) {
    return "document";
  }
  return "other";
}

export async function listMedia(data?: { scope?: Scope; ownerUserId?: string | null; folderId?: string; collectionId?: string }) {
  const userId = await uid();
  const scope = data?.scope ?? "user";

  let assetIds: string[] | null = null;
  if (data?.collectionId) {
    const { data: items, error: itemError } = await supabase
      .from("media_collection_items")
      .select("asset_id")
      .eq("collection_id", data.collectionId);
    if (itemError) throw new Error(itemError.message);
    assetIds = (items ?? []).map((item) => item.asset_id);
    if (assetIds.length === 0) return [];
  }

  let q = supabase
    .from("media_assets")
    .select("*")
    .eq("scope", scope)
    .order("created_at", { ascending: false });

  if (scope === "master") {
    q = q.is("owner_user_id", null);
  } else {
    q = q.eq("owner_user_id", data?.ownerUserId ?? userId);
  }

  if (data?.folderId) q = q.eq("folder_id", data.folderId);
  if (assetIds) q = q.in("id", assetIds);

  const { data: rows, error } = await q;
  if (error) throw new Error(error.message);
  return rows ?? [];
}

export async function listFolders(data?: { scope?: Scope; ownerUserId?: string | null }) {
  const userId = await uid();
  const scope = data?.scope ?? "user";
  let q = supabase
    .from("media_folders")
    .select("*")
    .eq("scope", scope)
    .order("name", { ascending: true });

  if (scope === "master") {
    q = q.is("owner_user_id", null);
  } else {
    q = q.eq("owner_user_id", data?.ownerUserId ?? userId);
  }

  const { data: rows, error } = await q;
  if (error) throw new Error(error.message);
  return rows ?? [];
}

export async function createFolder(data: { name: string; scope?: Scope; ownerUserId?: string | null }) {
  const userId = await uid();
  const scope = data.scope ?? "user";
  const { error } = await supabase
    .from("media_folders")
    .insert({
      owner_user_id: scope === "master" ? null : data.ownerUserId ?? userId,
      scope,
      name: data.name,
      created_by: userId,
    });
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

export async function listCollections(data?: { scope?: Scope; ownerUserId?: string | null }) {
  const userId = await uid();
  const scope = data?.scope ?? "user";
  let q = supabase
    .from("media_collections")
    .select("*")
    .eq("scope", scope)
    .order("name", { ascending: true });

  if (scope === "master") {
    q = q.is("owner_user_id", null);
  } else {
    q = q.eq("owner_user_id", data?.ownerUserId ?? userId);
  }

  const { data: rows, error } = await q;
  if (error) throw new Error(error.message);
  return rows ?? [];
}

export async function createCollection(data: { name: string; scope?: Scope; ownerUserId?: string | null }) {
  const userId = await uid();
  const scope = data.scope ?? "user";
  const { error } = await supabase
    .from("media_collections")
    .insert({
      owner_user_id: scope === "master" ? null : data.ownerUserId ?? userId,
      scope,
      name: data.name,
      created_by: userId,
    });
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

export async function createSignedUploadUrl(data: { filename: string; contentType: string; scope?: Scope; ownerUserId?: string | null }) {
  const userId = await uid();
  const scope = data.scope ?? "user";
  const bucket = bucketForScope(scope);
  const safeName = safeFilename(data.filename);
  const root = scope === "master" ? "master" : data.ownerUserId ?? userId;
  const path = `${root}/${Date.now()}-${safeName}`;
  const { data: res, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);
  if (error) throw new Error(error.message);
  return { uploadUrl: res.signedUrl, path, bucket };
}

export async function finalizeUpload(data: {
  path: string;
  filename: string;
  contentType: string;
  folderId?: string;
  size?: number;
  scope?: Scope;
  ownerUserId?: string | null;
  bucket?: string;
}) {
  const userId = await uid();
  const scope = data.scope ?? "user";
  const { error } = await supabase.from("media_assets").insert({
    owner_user_id: scope === "master" ? null : data.ownerUserId ?? userId,
    scope,
    storage_bucket: data.bucket ?? bucketForScope(scope),
    storage_path: data.path,
    original_name: data.filename,
    mime_type: data.contentType,
    media_type: mediaTypeFor(data.contentType, data.filename),
    folder_id: data.folderId ?? null,
    size_bytes: data.size ?? null,
    upload_status: "ready",
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

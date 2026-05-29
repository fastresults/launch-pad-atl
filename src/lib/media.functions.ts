import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const MAX_BYTES = 100 * 1024 * 1024;

function mediaTypeOf(mime: string): "document" | "image" | "audio" | "video" | "other" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  if (
    mime === "application/pdf" ||
    mime.startsWith("text/") ||
    mime.includes("word") ||
    mime.includes("officedocument") ||
    mime.includes("msword")
  )
    return "document";
  return "other";
}

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin.rpc("is_admin", { _user_id: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

async function assertCanAccess(userId: string, scope: "master" | "user", ownerUserId: string | null) {
  if (scope === "user" && ownerUserId === userId) return;
  await assertAdmin(userId);
}

// ===== List =====
const ListInput = z.object({
  scope: z.enum(["master", "user"]),
  ownerUserId: z.string().uuid().optional().nullable(),
  folderId: z.string().uuid().optional().nullable(),
  collectionId: z.string().uuid().optional().nullable(),
  mediaType: z.enum(["document", "image", "audio", "video", "other"]).optional().nullable(),
  search: z.string().trim().max(200).optional().nullable(),
});

export const listMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListInput.parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    await assertCanAccess(userId, data.scope, data.ownerUserId ?? null);

    let query = supabaseAdmin
      .from("media_assets")
      .select("*")
      .eq("scope", data.scope)
      .order("created_at", { ascending: false })
      .limit(500);

    if (data.scope === "user") query = query.eq("owner_user_id", data.ownerUserId!);
    if (data.folderId === null) query = query.is("folder_id", null);
    else if (data.folderId) query = query.eq("folder_id", data.folderId);
    if (data.mediaType) query = query.eq("media_type", data.mediaType);
    if (data.search) query = query.ilike("original_name", `%${data.search}%`);

    if (data.collectionId) {
      const { data: items, error: e2 } = await supabaseAdmin
        .from("media_collection_items")
        .select("asset_id")
        .eq("collection_id", data.collectionId);
      if (e2) throw new Error(e2.message);
      const ids = items?.map((i) => i.asset_id) ?? [];
      if (ids.length === 0) return { assets: [] };
      query = query.in("id", ids);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { assets: rows ?? [] };
  });

// ===== Folders =====
const ScopeOwner = z.object({
  scope: z.enum(["master", "user"]),
  ownerUserId: z.string().uuid().optional().nullable(),
});

export const listFolders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ScopeOwner.parse(i))
  .handler(async ({ context, data }) => {
    await assertCanAccess(context.userId, data.scope, data.ownerUserId ?? null);
    let q = supabaseAdmin.from("media_folders").select("*").eq("scope", data.scope).order("name");
    if (data.scope === "user") q = q.eq("owner_user_id", data.ownerUserId!);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { folders: rows ?? [] };
  });

export const createFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    ScopeOwner.extend({
      name: z.string().trim().min(1).max(120),
      parentId: z.string().uuid().nullable().optional(),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertCanAccess(context.userId, data.scope, data.ownerUserId ?? null);
    const { data: row, error } = await supabaseAdmin
      .from("media_folders")
      .insert({
        scope: data.scope,
        owner_user_id: data.scope === "user" ? data.ownerUserId! : null,
        parent_id: data.parentId ?? null,
        name: data.name,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { folder: row };
  });

export const renameFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(120) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { data: f, error: e1 } = await supabaseAdmin
      .from("media_folders")
      .select("scope, owner_user_id")
      .eq("id", data.id)
      .single();
    if (e1) throw new Error(e1.message);
    await assertCanAccess(context.userId, f.scope, f.owner_user_id);
    const { error } = await supabaseAdmin
      .from("media_folders")
      .update({ name: data.name })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: f, error: e1 } = await supabaseAdmin
      .from("media_folders")
      .select("scope, owner_user_id")
      .eq("id", data.id)
      .single();
    if (e1) throw new Error(e1.message);
    await assertCanAccess(context.userId, f.scope, f.owner_user_id);
    const { error } = await supabaseAdmin.from("media_folders").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===== Collections =====
export const listCollections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ScopeOwner.parse(i))
  .handler(async ({ context, data }) => {
    await assertCanAccess(context.userId, data.scope, data.ownerUserId ?? null);
    let q = supabaseAdmin.from("media_collections").select("*").eq("scope", data.scope).order("name");
    if (data.scope === "user") q = q.eq("owner_user_id", data.ownerUserId!);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { collections: rows ?? [] };
  });

export const createCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    ScopeOwner.extend({ name: z.string().trim().min(1).max(120) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertCanAccess(context.userId, data.scope, data.ownerUserId ?? null);
    const { data: row, error } = await supabaseAdmin
      .from("media_collections")
      .insert({
        scope: data.scope,
        owner_user_id: data.scope === "user" ? data.ownerUserId! : null,
        name: data.name,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { collection: row };
  });

export const toggleCollectionItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        collectionId: z.string().uuid(),
        assetId: z.string().uuid(),
        action: z.enum(["add", "remove"]),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { data: c, error: e1 } = await supabaseAdmin
      .from("media_collections")
      .select("scope, owner_user_id")
      .eq("id", data.collectionId)
      .single();
    if (e1) throw new Error(e1.message);
    await assertCanAccess(context.userId, c.scope, c.owner_user_id);
    if (data.action === "add") {
      const { error } = await supabaseAdmin
        .from("media_collection_items")
        .upsert({ collection_id: data.collectionId, asset_id: data.assetId });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("media_collection_items")
        .delete()
        .eq("collection_id", data.collectionId)
        .eq("asset_id", data.assetId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ===== Upload flow =====
const UploadInput = z.object({
  scope: z.enum(["master", "user"]),
  ownerUserId: z.string().uuid().optional().nullable(),
  folderId: z.string().uuid().nullable().optional(),
  filename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120),
  sizeBytes: z.number().int().min(0).max(MAX_BYTES),
});

export const createSignedUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UploadInput.parse(i))
  .handler(async ({ context, data }) => {
    await assertCanAccess(context.userId, data.scope, data.ownerUserId ?? null);
    const bucket = data.scope === "master" ? "master-media" : "user-media";
    const uid = crypto.randomUUID();
    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path =
      data.scope === "master"
        ? `master/${uid}-${safeName}`
        : `${data.ownerUserId}/${uid}-${safeName}`;

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(path);
    if (signErr) throw new Error(signErr.message);

    const { data: row, error: insErr } = await supabaseAdmin
      .from("media_assets")
      .insert({
        scope: data.scope,
        owner_user_id: data.scope === "user" ? data.ownerUserId! : null,
        folder_id: data.folderId ?? null,
        storage_bucket: bucket,
        storage_path: path,
        original_name: data.filename,
        title: data.filename,
        mime_type: data.mimeType,
        size_bytes: data.sizeBytes,
        media_type: mediaTypeOf(data.mimeType),
        upload_status: "pending",
        ai_status: "pending",
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (insErr) throw new Error(insErr.message);

    return { asset: row, uploadUrl: signed.signedUrl, token: signed.token, path };
  });

export const finalizeUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ assetId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: asset, error } = await supabaseAdmin
      .from("media_assets")
      .select("*")
      .eq("id", data.assetId)
      .single();
    if (error) throw new Error(error.message);
    await assertCanAccess(context.userId, asset.scope, asset.owner_user_id);

    const { error: upErr } = await supabaseAdmin
      .from("media_assets")
      .update({ upload_status: "ready" })
      .eq("id", data.assetId);
    if (upErr) throw new Error(upErr.message);

    // Fire-and-forget AI processing (don't block client)
    processAiForAsset(data.assetId).catch((e) => console.error("AI processing failed", e));

    return { ok: true };
  });

// ===== Signed download =====
export const getAssetSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ assetId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: asset, error } = await supabaseAdmin
      .from("media_assets")
      .select("*")
      .eq("id", data.assetId)
      .single();
    if (error) throw new Error(error.message);
    await assertCanAccess(context.userId, asset.scope, asset.owner_user_id);

    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from(asset.storage_bucket)
      .createSignedUrl(asset.storage_path, 3600);
    if (sErr) throw new Error(sErr.message);
    return { url: signed.signedUrl, asset };
  });

// ===== Update / delete =====
export const updateAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().trim().max(200).optional(),
        description: z.string().trim().max(4000).optional(),
        tags: z.array(z.string().trim().max(60)).max(30).optional(),
        folderId: z.string().uuid().nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { data: asset, error } = await supabaseAdmin
      .from("media_assets")
      .select("scope, owner_user_id")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    await assertCanAccess(context.userId, asset.scope, asset.owner_user_id);

    const patch: {
      title?: string;
      description?: string;
      tags?: string[];
      folder_id?: string | null;
    } = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.tags !== undefined) patch.tags = data.tags;
    if (data.folderId !== undefined) patch.folder_id = data.folderId;

    const { error: e2 } = await supabaseAdmin.from("media_assets").update(patch).eq("id", data.id);
    if (e2) throw new Error(e2.message);
    return { ok: true };
  });

export const deleteAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: asset, error } = await supabaseAdmin
      .from("media_assets")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    await assertCanAccess(context.userId, asset.scope, asset.owner_user_id);

    await supabaseAdmin.storage.from(asset.storage_bucket).remove([asset.storage_path]);
    if (asset.thumbnail_path) {
      await supabaseAdmin.storage.from(asset.storage_bucket).remove([asset.thumbnail_path]);
    }
    const { error: e2 } = await supabaseAdmin.from("media_assets").delete().eq("id", data.id);
    if (e2) throw new Error(e2.message);
    return { ok: true };
  });

// ===== Admin push =====
export const pushAssetsToUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        sourceAssetIds: z.array(z.string().uuid()).min(1).max(50),
        targetUserIds: z.array(z.string().uuid()).min(1).max(100),
        note: z.string().trim().max(500).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);

    const { data: sources, error } = await supabaseAdmin
      .from("media_assets")
      .select("*")
      .in("id", data.sourceAssetIds);
    if (error) throw new Error(error.message);
    if (!sources || sources.length === 0) throw new Error("No source assets found");

    const results: { ok: number; failed: number; errors: string[] } = { ok: 0, failed: 0, errors: [] };

    for (const src of sources) {
      for (const targetUid of data.targetUserIds) {
        try {
          const uid = crypto.randomUUID();
          const safeName = src.original_name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const newPath = `${targetUid}/${uid}-${safeName}`;

          // Download from source bucket and upload to user-media
          const { data: file, error: dErr } = await supabaseAdmin.storage
            .from(src.storage_bucket)
            .download(src.storage_path);
          if (dErr) throw new Error(dErr.message);

          const { error: uErr } = await supabaseAdmin.storage
            .from("user-media")
            .upload(newPath, file, { contentType: src.mime_type, upsert: false });
          if (uErr) throw new Error(uErr.message);

          const { data: newAsset, error: iErr } = await supabaseAdmin
            .from("media_assets")
            .insert({
              scope: "user",
              owner_user_id: targetUid,
              folder_id: null,
              storage_bucket: "user-media",
              storage_path: newPath,
              original_name: src.original_name,
              title: src.title ?? src.original_name,
              description: src.description,
              mime_type: src.mime_type,
              size_bytes: src.size_bytes,
              media_type: src.media_type,
              tags: src.tags,
              ai_status: src.ai_status,
              ai_summary: src.ai_summary,
              ai_transcript: src.ai_transcript,
              ai_tags: src.ai_tags,
              upload_status: "ready",
              pushed_from_asset_id: src.id,
              pushed_by: context.userId,
              pushed_at: new Date().toISOString(),
              created_by: context.userId,
            })
            .select("id")
            .single();
          if (iErr) throw new Error(iErr.message);

          await supabaseAdmin.from("media_push_log").insert({
            source_asset_id: src.id,
            target_asset_id: newAsset.id,
            target_user_id: targetUid,
            admin_id: context.userId,
            note: data.note ?? null,
          });
          results.ok++;
        } catch (e) {
          results.failed++;
          results.errors.push(`${src.original_name} → ${targetUid}: ${(e as Error).message}`);
        }
      }
    }
    return results;
  });

// ===== Admin: list users for push picker =====
export const listAttendeesForPush = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email, display_name")
      .order("display_name");
    if (error) throw new Error(error.message);
    return { attendees: data ?? [] };
  });

// ===== AI processing =====
export const reprocessAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ assetId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: asset, error } = await supabaseAdmin
      .from("media_assets")
      .select("scope, owner_user_id")
      .eq("id", data.assetId)
      .single();
    if (error) throw new Error(error.message);
    await assertCanAccess(context.userId, asset.scope, asset.owner_user_id);
    await processAiForAsset(data.assetId);
    return { ok: true };
  });

async function processAiForAsset(assetId: string) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return;

  const { data: asset } = await supabaseAdmin
    .from("media_assets")
    .select("*")
    .eq("id", assetId)
    .single();
  if (!asset) return;

  await supabaseAdmin
    .from("media_assets")
    .update({ ai_status: "processing", ai_error: null })
    .eq("id", assetId);

  try {
    if (asset.media_type === "image") {
      const { data: signed } = await supabaseAdmin.storage
        .from(asset.storage_bucket)
        .createSignedUrl(asset.storage_path, 600);
      if (!signed) throw new Error("No signed URL");

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                'You analyze images for a media library. Return JSON: {"summary": "1-2 sentence alt-text style description", "tags": ["tag1","tag2",...up to 8 short single-word lowercase tags]}',
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Analyze this image." },
                { type: "image_url", image_url: { url: signed.signedUrl } },
              ],
            },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) throw new Error(`AI ${res.status}: ${await res.text()}`);
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content) as { summary?: string; tags?: string[] };
      await supabaseAdmin
        .from("media_assets")
        .update({
          ai_status: "ready",
          ai_summary: parsed.summary ?? null,
          ai_tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 12) : [],
        })
        .eq("id", assetId);
    } else {
      // Non-image AI processing requires multimodal/file APIs not yet wired; mark skipped.
      await supabaseAdmin
        .from("media_assets")
        .update({
          ai_status: "skipped",
          ai_error: "AI processing for this file type is not yet enabled.",
        })
        .eq("id", assetId);
    }
  } catch (e) {
    await supabaseAdmin
      .from("media_assets")
      .update({ ai_status: "failed", ai_error: (e as Error).message })
      .eq("id", assetId);
  }
}

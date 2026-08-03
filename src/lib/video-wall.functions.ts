// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { getActorUserId } from "@/lib/effective-user";

export const VIDEO_WALL_BUCKET = "founder-videos";

export type VideoWallSettings = {
  enabled: boolean;
  heading: string;
  subheading: string;
};

export const DEFAULT_VIDEO_WALL_SETTINGS: VideoWallSettings = {
  enabled: true,
  heading: "Founders in their own words",
  subheading: "Short stories from people who started right here.",
};

export type VideoWallEntry = {
  id: string;
  founder_name: string;
  city: string | null;
  founder_role: string | null;
  startup_name: string | null;
  quote: string | null;
  video_bucket: string;
  video_path: string;
  poster_bucket: string | null;
  poster_path: string | null;
  duration_seconds: number | null;
  sort_order: number;
  is_live: boolean;
  created_at: string;
  updated_at: string;
};

export type VideoWallEntryWithUrls = VideoWallEntry & {
  video_url: string | null;
  poster_url: string | null;
};

/* ------------------------------------------------------------------ public */

export type PublicVideoWall = {
  settings: VideoWallSettings;
  items: Array<{
    id: string;
    founder_name: string;
    city: string | null;
    founder_role: string | null;
    startup_name: string | null;
    quote: string | null;
    duration_seconds: number | null;
    video_url: string | null;
    poster_url: string | null;
  }>;
};

/** Public read goes through an edge function so signed URLs work for anonymous visitors. */
export async function getPublicVideoWall(): Promise<PublicVideoWall> {
  const { data, error } = await supabase.functions.invoke("founder-video-wall", {
    body: {},
  });
  if (error) throw new Error(error.message);
  return {
    settings: { ...DEFAULT_VIDEO_WALL_SETTINGS, ...(data?.settings ?? {}) },
    items: (data?.items ?? []).filter((i: any) => !!i.video_url),
  };
}

/* ------------------------------------------------------------------- admin */

async function signUrl(bucket: string, path: string, expiresIn = 3600) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = await supabase.storage
    .from(bucket || VIDEO_WALL_BUCKET)
    .createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

export async function listAllVideoWallEntries(): Promise<VideoWallEntryWithUrls[]> {
  const { data, error } = await supabase
    .from("founder_video_wall")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return Promise.all(
    (data ?? []).map(async (r: VideoWallEntry) => ({
      ...r,
      video_url: await signUrl(r.video_bucket, r.video_path),
      poster_url: r.poster_path
        ? await signUrl(r.poster_bucket || r.video_bucket, r.poster_path)
        : null,
    })),
  );
}

export async function getVideoWallSettings(): Promise<VideoWallSettings> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "founder_video_wall")
    .maybeSingle();
  return { ...DEFAULT_VIDEO_WALL_SETTINGS, ...((data?.value as any) ?? {}) };
}

export async function updateVideoWallSettings(input: Partial<VideoWallSettings>) {
  const merged = { ...(await getVideoWallSettings()), ...input };
  const { error } = await supabase.from("site_settings").upsert(
    { key: "founder_video_wall", value: merged as any, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
  if (error) throw new Error(error.message);
  return merged;
}

export async function uploadVideoWallFile(file: File, kind: "video" | "poster") {
  const ext = file.name.split(".").pop() ?? (kind === "video" ? "mp4" : "jpg");
  const path = `wall/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(VIDEO_WALL_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return { bucket: VIDEO_WALL_BUCKET, path };
}

export async function createVideoWallEntry(input: Partial<VideoWallEntry>) {
  const userId = await getActorUserId().catch(() => null);
  const { data, error } = await supabase
    .from("founder_video_wall")
    .insert({
      founder_name: input.founder_name ?? "",
      city: input.city ?? null,
      founder_role: input.founder_role ?? null,
      startup_name: input.startup_name ?? null,
      quote: input.quote ?? null,
      video_bucket: input.video_bucket ?? VIDEO_WALL_BUCKET,
      video_path: input.video_path ?? "",
      poster_bucket: input.poster_bucket ?? null,
      poster_path: input.poster_path ?? null,
      duration_seconds: input.duration_seconds ?? null,
      sort_order: input.sort_order ?? 0,
      is_live: input.is_live ?? false,
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateVideoWallEntry(id: string, input: Partial<VideoWallEntry>) {
  const { error } = await supabase.from("founder_video_wall").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteVideoWallEntry(id: string) {
  const { data: row } = await supabase
    .from("founder_video_wall")
    .select("video_bucket, video_path, poster_bucket, poster_path")
    .eq("id", id)
    .maybeSingle();
  if (row?.video_path && !/^https?:\/\//i.test(row.video_path)) {
    await supabase.storage.from(row.video_bucket || VIDEO_WALL_BUCKET).remove([row.video_path]);
  }
  if (row?.poster_path && !/^https?:\/\//i.test(row.poster_path)) {
    await supabase.storage
      .from(row.poster_bucket || row.video_bucket || VIDEO_WALL_BUCKET)
      .remove([row.poster_path]);
  }
  const { error } = await supabase.from("founder_video_wall").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function reorderVideoWall(order: Array<{ id: string; sort_order: number }>) {
  for (const { id, sort_order } of order) {
    await supabase.from("founder_video_wall").update({ sort_order }).eq("id", id);
  }
}

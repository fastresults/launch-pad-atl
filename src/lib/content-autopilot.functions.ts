// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { getEffectiveUserId } from "@/lib/effective-user";
import { invokeEdge } from "@/lib/edge-invoke";


export type AdAspect = "1:1" | "4:5" | "9:16";

export type ContentPost = {
  id: string;
  snapshot_id: string;
  week: number;
  day: string | null;
  platform: string | null;
  pillar: string | null;
  format: string | null;
  hook: string | null;
  body: string | null;
  cta: string | null;
  hashtags: string[] | null;
  asset_notes: string | null;
  best_time: string | null;
};

export type ContentAd = {
  id: string;
  snapshot_id: string;
  post_id: string;
  aspect: AdAspect;
  art_direction: string;
  storage_path: string;
  signed_url: string | null;
  width: number | null;
  height: number | null;
  canvas_plan: any;
  qa_status: string | null;
  qa_notes: any;
  last_feedback: string | null;
  last_headline: string | null;
  last_logo_size: "sm" | "md" | "lg" | null;
  model_used: string | null;
  updated_at: string | null;
  is_selected: boolean;
};

async function invoke<T = any>(name: string, body: any): Promise<T> {
  const { data, error } = await invokeEdge(name, { body });
  if (error) throw error;
  if ((data as any)?.error) {
    const err: any = new Error((data as any).error);
    if ((data as any).code) err.code = (data as any).code;
    if ((data as any).upstreamStatus) err.status = (data as any).upstreamStatus;
    throw err;
  }
  return data as T;
}


// -------- Calendar parsing --------
export async function parseCalendarPosts(snapshotId: string) {
  return invoke<{ count: number }>("venture-parse-content-calendar", {
    action: "parse", snapshotId,
  });
}

export async function listCalendarPosts(snapshotId: string): Promise<ContentPost[]> {
  const res = await invoke<{ posts: ContentPost[] }>("venture-parse-content-calendar", {
    action: "list", snapshotId,
  });
  return res.posts ?? [];
}

// Ask the AI to draft the next week of posts and append them to the calendar.
export async function planNextWeek(snapshotId: string, week: number) {
  return invoke<{ count: number; posts: ContentPost[] }>("venture-parse-content-calendar", {
    action: "plan-next-week", snapshotId, week,
  });
}





// -------- Ads --------
export async function listContentAds(snapshotId: string): Promise<ContentAd[]> {
  const res = await invoke<{ ads: ContentAd[] }>("venture-content-ad", {
    action: "list", snapshotId,
  });
  return res.ads ?? [];
}

export async function deleteContentAd(snapshotId: string, adId: string) {
  return invoke("venture-content-ad", { action: "delete", snapshotId, adId });
}

export async function generateContentAd(
  snapshotId: string,
  postId: string,
  aspect: AdAspect,
  direction: string,
  opts?: {
    feedback?: string;
    signatureIntensity?: "subtle" | "balanced" | "bold";
    signaturePlacement?: string;
    signatureMinCoveragePct?: number;
    paletteOverride?: { surface?: string; ink?: string; accent?: string; signature?: string };
    headlineOverride?: { mode: "auto" | "custom" | "none"; text?: string };
    logoSize?: "sm" | "md" | "lg";
    posterLayout?: string;
  },
) {
  return invoke("venture-content-ad", {
    action: "generate",
    snapshotId,
    postId,
    aspect,
    direction,
    ...opts,
  });
}

// -------- Progress --------
export type ContentProgress = {
  snapshot_id: string;
  current_step: number;
  selected_weeks: number[];
  art_direction: string | null;
  poster_layout?: string | null;
  default_aspects: AdAspect[];
  launch_status: Record<string, { live?: boolean }>;
};

async function getUserId(): Promise<string> {
  return await getEffectiveUserId();
}


export async function getContentProgress(snapshotId: string): Promise<ContentProgress | null> {
  const { data, error } = await supabase
    .from("venture_content_progress")
    .select("*")
    .eq("snapshot_id", snapshotId)
    .maybeSingle();
  if (error) throw error;
  return data as ContentProgress | null;
}

export async function upsertContentProgress(
  snapshotId: string,
  patch: Partial<ContentProgress>,
): Promise<ContentProgress> {
  const uid = await getUserId();
  const { data, error } = await supabase
    .from("venture_content_progress")
    .upsert({ snapshot_id: snapshotId, user_id: uid, ...patch }, { onConflict: "snapshot_id" })
    .select()
    .single();
  if (error) throw error;
  return data as ContentProgress;
}

// Group posts by week
export function groupPostsByWeek(posts: ContentPost[]): Map<number, ContentPost[]> {
  const m = new Map<number, ContentPost[]>();
  for (const p of posts) {
    if (!m.has(p.week)) m.set(p.week, []);
    m.get(p.week)!.push(p);
  }
  return m;
}

// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { getActorUserId } from "@/lib/effective-user";

export type TestimonialSliderSettings = {
  enabled: boolean;
  heading: string;
  subheading: string;
  pause_seconds: number;
  autoplay: boolean;
  start_muted: boolean;
  loop: boolean;
  show_on_mobile: boolean;
  scroll_speed_px_s: number;
  direction: "left" | "right";
};

export const DEFAULT_TESTIMONIAL_SETTINGS: TestimonialSliderSettings = {
  enabled: true,
  heading: "Founders who walked out ready",
  subheading: "Real founders. Real Monday-morning starts.",
  pause_seconds: 2,
  autoplay: true,
  start_muted: true,
  loop: true,
  show_on_mobile: true,
  scroll_speed_px_s: 40,
  direction: "left",
};

export type Testimonial = {
  id: string;
  founder_name: string;
  founder_role: string | null;
  startup_name: string | null;
  quote: string | null;
  video_bucket: string;
  video_path: string;
  poster_bucket: string | null;
  poster_path: string | null;
  duration_seconds: number | null;
  sort_order: number;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
};

export type TestimonialWithUrls = Testimonial & {
  video_url: string | null;
  poster_url: string | null;
};

async function signUrl(bucket: string, path: string, expiresIn = 3600): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (!bucket) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data?.signedUrl ?? null;
}

async function withUrls(rows: Testimonial[]): Promise<TestimonialWithUrls[]> {
  return Promise.all(
    rows.map(async (r) => ({
      ...r,
      video_url: await signUrl(r.video_bucket, r.video_path),
      poster_url: r.poster_path ? await signUrl(r.poster_bucket || r.video_bucket, r.poster_path) : null,
    })),
  );
}

export async function getTestimonialSettings(): Promise<TestimonialSliderSettings> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "testimonial_slider")
    .maybeSingle();
  const v = (data?.value as Partial<TestimonialSliderSettings>) ?? {};
  return { ...DEFAULT_TESTIMONIAL_SETTINGS, ...v };
}

export async function updateTestimonialSettings(input: Partial<TestimonialSliderSettings>) {
  const current = await getTestimonialSettings();
  const merged = { ...current, ...input };
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: "testimonial_slider", value: merged as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  return merged;
}

export async function listPublishedTestimonials(): Promise<TestimonialWithUrls[]> {
  const { data, error } = await supabase
    .from("video_testimonials")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return withUrls((data ?? []) as Testimonial[]);
}

export async function listAllTestimonials(): Promise<TestimonialWithUrls[]> {
  const { data, error } = await supabase
    .from("video_testimonials")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return withUrls((data ?? []) as Testimonial[]);
}

export async function createSignedTestimonialUpload(filename: string) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `testimonials/${Date.now()}-${safe}`;
  const { data, error } = await supabase.storage
    .from("master-media")
    .createSignedUploadUrl(path);
  if (error) throw new Error(error.message);
  return { uploadUrl: data.signedUrl, path, token: data.token };
}

export async function uploadTestimonialFile(file: File, kind: "video" | "poster") {
  const ext = file.name.split(".").pop() ?? (kind === "video" ? "mp4" : "jpg");
  const path = `testimonials/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from("master-media")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return { bucket: "master-media", path };
}

export async function createTestimonial(input: Partial<Testimonial>) {
  // Audit field: always the real signed-in actor, never the impersonated member.
  const userId = await getActorUserId().catch(() => null);
  const { data, error } = await supabase
    .from("video_testimonials")
    .insert({
      founder_name: input.founder_name ?? "",
      founder_role: input.founder_role ?? null,
      startup_name: input.startup_name ?? null,
      quote: input.quote ?? null,
      video_bucket: input.video_bucket ?? "master-media",
      video_path: input.video_path ?? "",
      poster_bucket: input.poster_bucket ?? null,
      poster_path: input.poster_path ?? null,
      duration_seconds: input.duration_seconds ?? null,
      sort_order: input.sort_order ?? 0,
      status: input.status ?? "draft",
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateTestimonial(id: string, input: Partial<Testimonial>) {
  const { error } = await supabase
    .from("video_testimonials")
    .update(input)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTestimonial(id: string) {
  // Best-effort cleanup of storage objects
  const { data: row } = await supabase
    .from("video_testimonials")
    .select("video_bucket, video_path, poster_bucket, poster_path")
    .eq("id", id)
    .maybeSingle();
  if (row?.video_path) {
    await supabase.storage.from(row.video_bucket || "master-media").remove([row.video_path]);
  }
  if (row?.poster_path) {
    await supabase.storage.from(row.poster_bucket || row.video_bucket || "master-media").remove([row.poster_path]);
  }
  const { error } = await supabase.from("video_testimonials").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function reorderTestimonials(order: Array<{ id: string; sort_order: number }>) {
  // Sequential updates — small lists.
  for (const { id, sort_order } of order) {
    await supabase.from("video_testimonials").update({ sort_order }).eq("id", id);
  }
}

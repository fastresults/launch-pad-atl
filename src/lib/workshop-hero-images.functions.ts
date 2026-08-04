// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { scenePrompt } from "@/lib/workshop-pains";

export const HERO_IMAGE_BUCKET = "workshop-hero-images";

/** Premium tier first — it's what the shipped set was generated on. */
export const HERO_IMAGE_MODELS = [
  { id: "google/gemini-3-pro-image", label: "Gemini 3 Pro Image (premium)" },
  { id: "google/gemini-3.1-flash-image", label: "Gemini 3.1 Flash Image (fast)" },
  { id: "openai/gpt-image-2", label: "GPT Image 2" },
] as const;

export type HeroImageStatus = "draft" | "published" | "archived";

export type HeroImageRow = {
  id: string;
  workshop_slug: string;
  pain_id: string;
  storage_path: string;
  image_url: string;
  prompt: string;
  subject: string | null;
  screens: boolean;
  model: string | null;
  source: string;
  status: HeroImageStatus;
  created_by: string | null;
  created_at: string;
};

/**
 * The shipped prompts are already composed (subject + shared look). The studio
 * only lets you edit the subject, so pull it back out of the stored prompt.
 */
export function subjectFromPrompt(prompt: string): string {
  const cut = prompt.indexOf(". Cinematic editorial photograph");
  return cut === -1 ? prompt : prompt.slice(0, cut);
}

/** True when the stored prompt used the screens-allowed rule. */
export function screensFromPrompt(prompt: string): boolean {
  return prompt.includes("on-screen content is recognizable by shape only");
}

export function composeHeroPrompt(subject: string, screens: boolean): string {
  return scenePrompt(subject, { screens });
}

/** Every row for a workshop, newest first (drafts, published and archived). */
export async function listHeroImages(workshopSlug: string): Promise<HeroImageRow[]> {
  const { data, error } = await supabase
    .from("workshop_hero_images")
    .select("*")
    .eq("workshop_slug", workshopSlug)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as HeroImageRow[];
}

/** Published overrides for one workshop — what the public hero actually shows. */
export async function listPublishedHeroImages(
  workshopSlug: string,
): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("workshop_hero_images")
    .select("pain_id, image_url")
    .eq("workshop_slug", workshopSlug)
    .eq("status", "published");
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.pain_id] = row.image_url;
  return map;
}

/**
 * Generate a new draft image. Pass `prompt` to send an edited full prompt
 * verbatim; otherwise the subject is wrapped in the shared cinematic recipe.
 */
export async function generateHeroImage(input: {
  workshopSlug: string;
  painId: string;
  subject: string;
  screens: boolean;
  model: string;
  prompt?: string;
}): Promise<HeroImageRow> {
  const { data, error } = await supabase.functions.invoke("workshop-hero-image-generate", {
    body: input,
  });
  if (error) {
    const detail = await error.context?.json?.().catch(() => null);
    throw new Error(detail?.error ?? error.message);
  }
  if (data?.error) throw new Error(data.error);
  return data.image as HeroImageRow;
}

/** Put a draft (or an archived take) live, archiving whatever was published. */
export async function publishHeroImage(row: HeroImageRow): Promise<void> {
  const { error: archiveErr } = await supabase
    .from("workshop_hero_images")
    .update({ status: "archived" })
    .eq("workshop_slug", row.workshop_slug)
    .eq("pain_id", row.pain_id)
    .eq("status", "published");
  if (archiveErr) throw archiveErr;

  const { error } = await supabase
    .from("workshop_hero_images")
    .update({ status: "published" })
    .eq("id", row.id);
  if (error) throw error;
}

/** Drop the override so the bundled image comes back. */
export async function revertHeroImage(row: HeroImageRow): Promise<void> {
  const { error } = await supabase
    .from("workshop_hero_images")
    .update({ status: "archived" })
    .eq("id", row.id);
  if (error) throw error;
}

/** Remove a take entirely, file included. */
export async function deleteHeroImage(row: HeroImageRow): Promise<void> {
  await supabase.storage.from(HERO_IMAGE_BUCKET).remove([row.storage_path]);
  const { error } = await supabase.from("workshop_hero_images").delete().eq("id", row.id);
  if (error) throw error;
}

/** Escape hatch: upload your own picture for a pain. */
export async function uploadHeroImage(input: {
  workshopSlug: string;
  painId: string;
  file: File;
}): Promise<HeroImageRow> {
  const ext = input.file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${input.workshopSlug}/${input.painId}/upload-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(HERO_IMAGE_BUCKET)
    .upload(path, input.file, { contentType: input.file.type, upsert: true });
  if (upErr) throw upErr;

  const { data: signed, error: signErr } = await supabase.storage
    .from(HERO_IMAGE_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (signErr) throw signErr;

  const { data: userRes } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("workshop_hero_images")
    .insert({
      workshop_slug: input.workshopSlug,
      pain_id: input.painId,
      storage_path: path,
      image_url: signed.signedUrl,
      prompt: `Uploaded manually — ${input.file.name}`,
      subject: null,
      screens: false,
      model: null,
      source: "upload",
      status: "draft",
      created_by: userRes?.user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as HeroImageRow;
}

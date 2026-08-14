// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { getEffectiveUserId } from "@/lib/effective-user";
import { invokeEdge } from "@/lib/edge-invoke";


export type BrandKit = {
  id: string;
  snapshot_id: string;
  user_id: string;
  /** "auto" = provisional kit we inferred from finished assets. */
  status: "draft" | "locked" | "auto";

  step: number;
  dna: any;
  palette: any | null;
  typography: any | null;
  moodboard: any[];
  logos: any[];
  voice: any | null;
  guide_markdown: string | null;
  locked_at: string | null;
};

export async function getBrandKit(snapshotId: string): Promise<BrandKit | null> {
  const { data, error } = await supabase
    .from("venture_brand_kits")
    .select("*")
    .eq("snapshot_id", snapshotId)
    .maybeSingle();
  if (error) throw error;
  return data as BrandKit | null;
}

export async function upsertBrandKit(snapshotId: string, patch: Partial<BrandKit>): Promise<BrandKit> {
  const uid = await getEffectiveUserId();

  const { data, error } = await supabase
    .from("venture_brand_kits")
    .upsert(
      { snapshot_id: snapshotId, user_id: uid, ...patch },
      { onConflict: "snapshot_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data as BrandKit;
}

async function callWizard(body: any) {
  const { data, error } = await invokeEdge("venture-brand-wizard", { body });
  if (error) throw new Error(error.message || "Brand wizard request failed");
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function fetchPaletteOptions(snapshotId: string) {
  return callWizard({ action: "palettes", snapshotId });
}

export async function fetchTypographyOptions(snapshotId: string) {
  return callWizard({ action: "typography", snapshotId });
}

export async function generateStyleGuide(snapshotId: string) {
  return callWizard({ action: "styleguide", snapshotId });
}

export async function extractExistingBrand(
  snapshotId: string,
  payload: { websiteUrl?: string; logos?: { dataUrl: string; filename: string }[]; voiceNotes?: string },
) {
  return callWizard({ action: "extract-existing", snapshotId, ...payload });
}

/** Admin control: flip the kit between locked and draft without touching its content. */
export async function setBrandKitLock(snapshotId: string, locked: boolean): Promise<BrandKit> {
  const { data, error } = await supabase
    .from("venture_brand_kits")
    .update({ status: locked ? "locked" : "draft", locked_at: locked ? new Date().toISOString() : null })
    .eq("snapshot_id", snapshotId)
    .select()
    .single();
  if (error) throw error;
  return data as BrandKit;
}

export async function resetBrandKit(snapshotId: string): Promise<void> {
  const { error } = await supabase
    .from("venture_brand_kits")
    .delete()
    .eq("snapshot_id", snapshotId);
  if (error) throw error;
}

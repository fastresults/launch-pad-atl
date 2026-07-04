// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { getEffectiveUserId } from "@/lib/effective-user";
import type { AssetType } from "@/lib/creative-vibes";


export type BrandAsset = {
  id: string;
  user_id: string;
  asset_type: AssetType;
  platform: string | null;
  aspect_ratio: string | null;
  width: number | null;
  height: number | null;
  storage_path: string;
  signed_url: string | null;
  signed_url_expires_at: string | null;
  vibe: string | null;
  color_mood: string | null;
  prompt_used: string | null;
  model_used: string | null;
  is_selected: boolean;
  created_at: string;
  updated_at: string;
};

async function call(body: any) {
  const { data, error } = await supabase.functions.invoke("brand-creative", { body });
  if (error) throw new Error(error.message || "Creative request failed");
  if (data && typeof data === "object" && "error" in data && data.error) {
    const err: any = new Error(data.error);
    err.code = (data as any).code;
    err.reason = (data as any).reason;
    err.upstreamStatus = (data as any).upstreamStatus;
    throw err;
  }
  return data;
}

export async function generateVariations(input: {
  assetType: AssetType;
  vibe: string;
  colorMood: string;
  subject: string;
  brandName?: string;
  platform?: string | null;
  width: number;
  height: number;
  count?: number;
}): Promise<{ variations: BrandAsset[]; partial_error?: string }> {
  const data = await call({ action: "generate", ...input });
  return {
    variations: (data?.variations ?? []) as BrandAsset[],
    partial_error: data?.partial_error,
  };
}

export async function selectVariation(assetId: string, clearSiblings = true): Promise<BrandAsset> {
  const data = await call({ action: "select", assetId, clearSiblings });
  return data.asset as BrandAsset;
}

export async function deleteAsset(assetId: string): Promise<void> {
  await call({ action: "delete", assetId });
}

export async function listBrandAssets(): Promise<BrandAsset[]> {
  let uid: string;
  try { uid = await getEffectiveUserId(); } catch { return []; }

  const { data, error } = await supabase
    .from("social_brand_assets")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BrandAsset[];
}

export async function listSelectedAssets(): Promise<BrandAsset[]> {
  let uid: string;
  try { uid = await getEffectiveUserId(); } catch { return []; }

  const { data, error } = await supabase
    .from("social_brand_assets")
    .select("*")
    .eq("user_id", uid)
    .eq("is_selected", true);
  if (error) throw error;
  return (data ?? []) as BrandAsset[];
}

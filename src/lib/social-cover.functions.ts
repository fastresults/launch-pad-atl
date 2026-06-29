// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export type SocialAsset = {
  id: string;
  snapshot_id: string;
  user_id: string;
  platform: string;
  asset_kind: string;
  art_direction: string;
  storage_path: string;
  signed_url: string | null;
  signed_url_expires_at: string | null;
  width: number;
  height: number;
  prompt_used: string | null;
  model_used: string | null;
  brand_kit_locked_at: string | null;
  is_selected: boolean;
  created_at: string;
};

async function call(body: any) {
  const { data, error } = await supabase.functions.invoke("venture-social-cover", { body });
  if (error) throw new Error(error.message || "Social cover request failed");
  if (data?.error) {
    const err: any = new Error(data.error);
    err.code = data.code;
    throw err;
  }
  return data;
}

export async function listSocialAssets(snapshotId: string): Promise<SocialAsset[]> {
  const data = await call({ action: "list", snapshotId });
  return (data?.assets ?? []) as SocialAsset[];
}

export async function generateSocialCover(input: {
  snapshotId: string;
  platform: string;
  asset: string;
  direction: string;
}): Promise<SocialAsset> {
  const data = await call({ action: "generate", ...input });
  return data.asset as SocialAsset;
}

export async function selectSocialAsset(snapshotId: string, assetId: string): Promise<SocialAsset> {
  const data = await call({ action: "select", snapshotId, assetId });
  return data.asset as SocialAsset;
}

export async function deleteSocialAsset(snapshotId: string, assetId: string): Promise<void> {
  await call({ action: "delete", snapshotId, assetId });
}

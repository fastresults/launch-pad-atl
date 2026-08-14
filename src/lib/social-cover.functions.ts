// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { invokeEdge } from "@/lib/edge-invoke";

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
  updated_at?: string;
  canvas_plan?: any;
  qa_status?: string | null;
  qa_notes?: any;
  last_feedback?: string | null;
  last_headline?: string | null;
  last_logo_size?: "sm" | "md" | "lg" | null;
};

async function call(body: any) {
  const { data, error } = await invokeEdge("venture-social-cover", { body });
  if (error) throw new Error(error.message || "Social cover request failed");
  if (data?.error) {
    const err: any = new Error(data.error);
    err.code = data.code;
    err.reason = data.reason;
    err.details = data.details;
    err.upstreamStatus = data.upstreamStatus;
    throw err;
  }
  return data;
}

export async function listSocialAssets(snapshotId: string): Promise<SocialAsset[]> {
  const data = await call({ action: "list", snapshotId });
  return (data?.assets ?? []) as SocialAsset[];
}

export type PaletteOverride = {
  surface?: string;
  ink?: string;
  accent?: string;
  signature?: string;
};

export type HeadlineOverride = { mode: "auto" | "custom" | "none"; text?: string };

export async function generateSocialCover(input: {
  snapshotId: string;
  platform: string;
  asset: string;
  direction: string;
  feedback?: string;
  signatureIntensity?: "subtle" | "balanced" | "bold";
  signaturePlacement?:
    | "auto" | "anchor_block" | "sidebar_stripe" | "duotone_wash"
    | "focal_shape" | "corner_mark" | "framed_border";
  signatureMinCoveragePct?: number;
  paletteOverride?: PaletteOverride;
  headlineOverride?: HeadlineOverride;
  logoSize?: "sm" | "md" | "lg";
  /** Exact Form × Tone logo pick; null = let the AI select. */
  markPick?: { form: string; tone: string } | null;
  sceneOverride?: string;
  refreshScenes?: boolean;
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

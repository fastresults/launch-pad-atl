// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { invokeEdge } from "@/lib/edge-invoke";

export type StylePreview = {
  id: string;
  snapshot_id: string;
  direction: "editorial" | "photographic" | "geometric" | "illustrative";
  signed_url: string | null;
  canvas_plan: { surface?: string; ink?: string; accent?: string; signature?: string; displaySignature?: string; signatureMinCoveragePct?: number } | null;
  qa_status: string | null;
  qa_notes?: any;
  last_feedback: string | null;
  last_headline?: string | null;
  last_logo_size?: "sm" | "md" | "lg" | null;
  updated_at: string;
};

async function call(body: any) {
  const { data, error } = await invokeEdge("venture-style-preview", { body });
  if (error) throw new Error(error.message || "Style preview request failed");
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

export async function listStylePreviews(snapshotId: string): Promise<StylePreview[]> {
  const data = await call({ action: "list", snapshotId });
  return (data?.previews ?? []) as StylePreview[];
}

export async function generateStylePreview(input: {
  snapshotId: string;
  direction: string;
  feedback?: string;
  signatureIntensity?: "subtle" | "balanced" | "bold";
  signaturePlacement?:
    | "auto" | "anchor_block" | "sidebar_stripe" | "duotone_wash"
    | "focal_shape" | "corner_mark" | "framed_border";
  signatureMinCoveragePct?: number;
  paletteOverride?: { surface?: string; ink?: string; accent?: string; signature?: string };
  headlineOverride?: { mode: "auto" | "custom" | "none"; text?: string };
  logoSize?: "sm" | "md" | "lg";
  sceneOverride?: string;
  refreshScenes?: boolean;
}): Promise<StylePreview> {
  const data = await call({ action: "generate", ...input });
  return data.preview as StylePreview;
}

export async function deleteStylePreview(snapshotId: string, direction: string): Promise<void> {
  await call({ action: "delete", snapshotId, direction });
}

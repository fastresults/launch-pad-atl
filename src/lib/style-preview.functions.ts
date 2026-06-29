// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export type StylePreview = {
  id: string;
  snapshot_id: string;
  direction: "editorial" | "photographic" | "geometric" | "illustrative";
  signed_url: string | null;
  canvas_plan: { surface?: string; ink?: string; accent?: string } | null;
  qa_status: string | null;
  last_feedback: string | null;
  updated_at: string;
};

async function call(body: any) {
  const { data, error } = await supabase.functions.invoke("venture-style-preview", { body });
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
}): Promise<StylePreview> {
  const data = await call({ action: "generate", ...input });
  return data.preview as StylePreview;
}

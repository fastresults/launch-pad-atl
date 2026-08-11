// Talks to the venture-creative-review edge function. Same dual front door as
// ops: the share link authenticates with its token, the hub with the session.
import { supabase } from "@/integrations/supabase/client";
import type { OpsAuth } from "@/lib/ops.functions";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  "https://hflfxytqrlkobhuugsca.supabase.co";
const ENDPOINT = `${SUPABASE_URL}/functions/v1/venture-creative-review`;

export type CreativeState =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "ready_to_publish";

export type CreativeReview = {
  id: string;
  snapshot_id: string;
  asset_kind: string;
  asset_ref: string;
  label: string | null;
  preview_path: string | null;
  previewUrl: string | null;
  state: CreativeState;
  submitted_at: string | null;
  submitted_by: string | null;
  decided_at: string | null;
  decided_by: string | null;
  last_comment: string | null;
  published_at: string | null;
};

export type CreativeReviewEvent = {
  id: string;
  review_id: string;
  from_state: CreativeState | null;
  to_state: CreativeState;
  actor_kind: "client" | "agency";
  actor_name: string | null;
  comment: string | null;
  created_at: string;
};

export const CREATIVE_STATE_LABEL: Record<CreativeState, string> = {
  draft: "Draft",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  ready_to_publish: "Ready to publish",
};

export const CREATIVE_STATE_CLASS: Record<CreativeState, string> = {
  draft: "bg-muted text-muted-foreground",
  in_review: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  changes_requested: "bg-destructive/15 text-destructive",
  approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  ready_to_publish: "bg-primary/15 text-primary",
};

export const CREATIVE_KIND_LABEL: Record<string, string> = {
  logo: "Logo",
  brand_kit: "Brand identity",
  collateral: "Collateral",
  social: "Social kit",
  content_ad: "Ad creative",
};

async function call(auth: OpsAuth, payload: Record<string, unknown>) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const body: Record<string, unknown> = { ...payload };

  if (auth.kind === "share") {
    body.token = auth.token;
    if (auth.password) body.password = auth.password;
  } else {
    body.snapshotId = auth.snapshotId;
    const { data } = await supabase.auth.getSession();
    const jwt = data.session?.access_token;
    if (jwt) headers.Authorization = `Bearer ${jwt}`;
  }

  const res = await fetch(ENDPOINT, { method: "POST", headers, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(json?.error ?? "Creative sign-off is unavailable right now.");
    err.code = json?.code;
    throw err;
  }
  return json;
}

export async function fetchCreativeReviews(auth: OpsAuth): Promise<{
  items: CreativeReview[];
  events: CreativeReviewEvent[];
  viewerKind: "client" | "agency";
}> {
  const body = await call(auth, { action: "list" });
  return {
    items: body.items ?? [],
    events: body.events ?? [],
    viewerKind: (body.viewerKind ?? "client") as "client" | "agency",
  };
}

export const submitCreative = (auth: OpsAuth, reviewId: string, comment?: string) =>
  call(auth, { action: "submit", reviewId, comment: comment ?? "" });

export const approveCreative = (auth: OpsAuth, reviewId: string, comment?: string, actorName?: string) =>
  call(auth, { action: "approve", reviewId, comment: comment ?? "", actorName });

export const requestCreativeChanges = (auth: OpsAuth, reviewId: string, comment: string, actorName?: string) =>
  call(auth, { action: "request_changes", reviewId, comment, actorName });

export const publishCreative = (auth: OpsAuth, reviewId: string) =>
  call(auth, { action: "publish", reviewId });

export const unpublishCreative = (auth: OpsAuth, reviewId: string) =>
  call(auth, { action: "unpublish", reviewId });

export const resetCreative = (auth: OpsAuth, reviewId: string) =>
  call(auth, { action: "reset", reviewId });

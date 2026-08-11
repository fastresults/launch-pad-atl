// Talks to the venture-ops edge function. Two front doors, one endpoint:
// the share link authenticates with its token, the hub authenticates with the
// signed-in user's session and a snapshotId.
import { supabase } from "@/integrations/supabase/client";
import type {
  DeliveryMode, DeliveryStatus, OpsOwnerKind, OpsRunway, OpsStatus,
} from "@/lib/ops-runway";
import type { PlatformRequest } from "@/lib/ops-platform";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  "https://hflfxytqrlkobhuugsca.supabase.co";
const ENDPOINT = `${SUPABASE_URL}/functions/v1/venture-ops`;

/** How the caller proves it may touch this venture's runway. */
export type OpsAuth =
  | { kind: "share"; token: string; password?: string }
  | { kind: "hub"; snapshotId: string };

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
    const err: any = new Error(json?.error ?? "The operations runway is unavailable right now.");
    err.code = json?.code;
    throw err;
  }
  return json;
}

export async function fetchOpsRunway(auth: OpsAuth): Promise<OpsRunway> {
  const body = await call(auth, { action: "list" });
  return {
    tasks: body.tasks ?? [],
    notes: body.notes ?? [],
    updates: body.updates ?? [],
    state: body.state ?? null,
    canEdit: body.canEdit !== false,
    viewerKind: (body.viewerKind ?? "client") as OpsOwnerKind,
    platformRequest: (body.platformRequest ?? null) as PlatformRequest | null,
    ventureName: (body.ventureName ?? null) as string | null,
  };
}

/** Founder asks Startup Labs to run the runway on the retainer. */
export const requestEngagement = (
  auth: OpsAuth,
  input: { name: string; email: string; phone?: string; startPref?: string; notes?: string },
) => call(auth, { action: "request_engagement", ...input });

/** Founder raises their hand for a platform build (marketplace, matching, booking…). */
export const requestPlatformBuild = (
  auth: OpsAuth,
  input: { description: string; audience?: string; deadline?: string; contact?: string },
) => call(auth, { action: "request_platform_build", ...input });


/** Agency moves a platform request along the pipeline. */
export const setPlatformRequestStatus = (auth: OpsAuth, requestId: string, status: string) =>
  call(auth, { action: "set_platform_request_status", requestId, status });

export const setOpsStatus = (auth: OpsAuth, taskId: string, status: OpsStatus) =>
  call(auth, { action: "set_status", taskId, status });

export const setOpsOwner = (auth: OpsAuth, taskId: string, ownerKind: OpsOwnerKind, ownerName?: string | null) =>
  call(auth, { action: "set_owner", taskId, ownerKind, ownerName: ownerName ?? null });

export const setOpsDue = (auth: OpsAuth, taskId: string, dueAt: string | null) =>
  call(auth, { action: "set_due", taskId, dueAt });

export const setOpsProof = (auth: OpsAuth, taskId: string, proofUrl: string) =>
  call(auth, { action: "set_proof", taskId, proofUrl });

export const addOpsNote = (auth: OpsAuth, taskId: string, body: string, authorName?: string | null) =>
  call(auth, { action: "add_note", taskId, body, authorName: authorName ?? null });

/** Push a step down the queue without marking it failed. */
export const snoozeOpsTask = (auth: OpsAuth, taskId: string, days = 3) =>
  call(auth, { action: "snooze", taskId, days });

export const unsnoozeOpsTask = (auth: OpsAuth, taskId: string) =>
  call(auth, { action: "snooze", taskId, until: null });

/** Remember that this venture has seen the first-run walkthrough. */
export const dismissOpsIntro = (auth: OpsAuth) => call(auth, { action: "dismiss_intro" });

/** Agency-only: flip whether the client can drive the runway from their link. */
export const setClientEditing = (auth: OpsAuth, enabled: boolean) =>
  call(auth, { action: "set_client_editing", enabled });

// ---------------------------------------------------------------- delivery

/** Choose (or change) who executes the runway. Rewrites ownership across steps. */
export const setDeliveryMode = (auth: OpsAuth, mode: DeliveryMode, setBy?: string | null) =>
  call(auth, { action: "set_delivery_mode", mode, setBy: setBy ?? null });

/** Remember the hourly rate the founder valued their own time at. */
export const setBlendedRate = (auth: OpsAuth, rateCents: number) =>
  call(auth, { action: "set_rate", rateCents });

export const assignOpsTask = (auth: OpsAuth, taskId: string, name: string | null) =>
  call(auth, { action: "assign", taskId, assigneeName: name });

export const setOpsCommittedDate = (auth: OpsAuth, taskId: string, committedAt: string | null) =>
  call(auth, { action: "set_committed_date", taskId, committedAt });

export const setOpsDeliveryStatus = (auth: OpsAuth, taskId: string, deliveryStatus: DeliveryStatus) =>
  call(auth, { action: "set_delivery_status", taskId, deliveryStatus });

export const attachOpsWorkProduct = (
  auth: OpsAuth, taskId: string, url: string | null, label?: string | null,
) => call(auth, { action: "attach_work_product", taskId, url, label: label ?? null });

export const postOpsUpdate = (
  auth: OpsAuth, body: string, opts: { taskId?: string | null; visibleToClient?: boolean; authorName?: string | null } = {},
) => call(auth, {
  action: "post_update",
  body,
  taskId: opts.taskId ?? null,
  visibleToClient: opts.visibleToClient !== false,
  authorName: opts.authorName ?? null,
});

/** Client asks Adam's team to take one step off their plate. */
export const requestOpsHandoff = (auth: OpsAuth, taskId: string, note?: string) =>
  call(auth, { action: "request_handoff", taskId, note: note ?? null });

/** Client approves delivered work, or sends it back with a reason. */
export const reviewOpsWorkProduct = (
  auth: OpsAuth, taskId: string, review: "approved" | "changes_requested", note?: string,
) => call(auth, { action: "review_work_product", taskId, review, note: note ?? null });

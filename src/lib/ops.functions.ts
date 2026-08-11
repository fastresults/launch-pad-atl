// Talks to the venture-ops edge function. Two front doors, one endpoint:
// the share link authenticates with its token, the hub authenticates with the
// signed-in user's session and a snapshotId.
import { supabase } from "@/integrations/supabase/client";
import type { OpsOwnerKind, OpsRunway, OpsStatus } from "@/lib/ops-runway";

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
    state: body.state ?? null,
    canEdit: body.canEdit !== false,
    viewerKind: (body.viewerKind ?? "client") as OpsOwnerKind,
  };
}

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

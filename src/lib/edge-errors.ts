import { toast } from "sonner";

/**
 * Extract HTTP status from a Supabase functions.invoke() error.
 * FunctionsHttpError carries the Response on `.context`.
 */
export function edgeStatus(err: any): number | null {
  if (!err) return null;
  const ctx = (err as any).context;
  if (ctx && typeof ctx.status === "number") return ctx.status;
  const msg = String((err as any).message ?? err ?? "");
  const m = msg.match(/\b(4\d\d|5\d\d)\b/);
  return m ? Number(m[1]) : null;
}

/**
 * User-friendly message for a Supabase edge function error, with a next step.
 * Prefer this over raw `err.message` in toasts on the Content Hub.
 */
export function edgeErrorMessage(err: any, fallback = "Something went wrong. Please try again."): string {
  const code = (err as any)?.code;
  if (code === "UPSTREAM_TIMEOUT") {
    return "The image model took too long. Retry — it usually succeeds on the second pass.";
  }
  if (code === "WORKER_LIMIT" || code === "RENDER_TIMEOUT") {
    return "The render ran out of time. Retry — we'll finish it with a lighter pass.";
  }
  if (code === "PAYMENT_REQUIRED" || code === "AI_CREDIT_LIMIT_REACHED") {
    return "AI credits are exhausted for this workspace. Add credits and retry.";
  }
  if (code === "BRAND_NOT_LOCKED") {
    return "Lock the Brand Wizard before generating ads.";
  }
  const status = edgeStatus(err);
  if (status === 401) {
    return "Your session expired. Please sign in again and retry.";
  }

  if (status === 403) {
    return "You don't have access to run this action. Try signing out and back in, or retry in a moment.";
  }
  if (status === 429) {
    return "You're doing that a lot. Wait a few seconds and try again.";
  }
  if (status === 504 || status === 408) {
    return "The request timed out. Please retry — the model may just be slow right now.";
  }
  if (status && status >= 500) {
    return "The service is having trouble. Please retry in a moment.";
  }
  const msg = (err as any)?.message;
  return typeof msg === "string" && msg.length > 0 ? msg : fallback;
}

/** Show a user-friendly toast for an edge function error. */
export function toastEdgeError(err: any, fallback?: string) {
  toast.error(edgeErrorMessage(err, fallback));
}

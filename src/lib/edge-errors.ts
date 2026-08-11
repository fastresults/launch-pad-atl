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
    return "Generation is paused — our team has been notified. Try again shortly.";
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

/**
 * AI capacity failures (402 / 429 / credit limits) are handled by a branded
 * modal instead of a red toast. AiCapacityProvider registers the handler at
 * app start; when it claims the error, no toast is shown.
 */
type CapacityHandler = (err: any) => boolean;
let capacityHandler: CapacityHandler | null = null;

export function registerCapacityHandler(handler: CapacityHandler | null) {
  capacityHandler = handler;
}

/** Show a user-friendly toast for an edge function error. */
export function toastEdgeError(err: any, fallback?: string) {
  if (capacityHandler?.(err)) return;
  toast.error(edgeErrorMessage(err, fallback));
}

/**
 * Build an Error from a 200 payload that reports failure (`{ ok: false }`),
 * carrying `code`/`providers` so capacity walls keep their provider
 * attribution instead of degrading to a bare message string.
 */
export function payloadError(payload: any, fallback = "Request failed"): Error {
  const message = typeof payload?.error === "string" && payload.error ? payload.error : fallback;
  return Object.assign(new Error(message), {
    code: payload?.code,
    providers: payload?.providers,
    status: payload?.upstreamStatus ?? payload?.gatewayStatus,
  });
}



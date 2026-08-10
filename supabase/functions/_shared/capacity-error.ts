// Shared "who ran out of capacity" attribution for AI failures.
//
// The browser only ever sees a status code, so every AI edge function must say
// WHICH provider blocked the call. The client renders these fields directly in
// the friendly capacity notice (provider chips), so keep the shape stable.

export type CapacityProviderId =
  | "openai"
  | "google"
  | "anthropic"
  | "xai"
  | "perplexity"
  | "lovable";

export interface CapacityProvider {
  id: CapacityProviderId;
  label: string;
  /** What the provider was doing when it hit the wall, e.g. "image generation". */
  capability?: string;
}

export interface CapacityErrorBody {
  error: string;
  code: "PAYMENT_REQUIRED" | "AI_CREDIT_LIMIT_REACHED" | "RATE_LIMITED";
  reason?: string;
  upstreamStatus?: number;
  providers: CapacityProvider[];
}

const LABELS: Record<CapacityProviderId, string> = {
  openai: "OpenAI",
  google: "Google",
  anthropic: "Anthropic",
  xai: "xAI",
  perplexity: "Perplexity",
  lovable: "Lovable AI capacity",
};

/** Map a gateway model id (`vendor/model`) to a provider id. */
export function providerFromModel(model?: string | null): CapacityProviderId | null {
  const vendor = String(model ?? "").split("/")[0]?.toLowerCase();
  if (!vendor) return null;
  if (vendor === "openai") return "openai";
  if (vendor === "google") return "google";
  if (vendor === "anthropic") return "anthropic";
  if (vendor === "x-ai" || vendor === "xai") return "xai";
  if (vendor === "perplexity") return "perplexity";
  return null;
}

export function capacityProvider(
  idOrModel: string | null | undefined,
  capability?: string,
): CapacityProvider {
  const id = (["openai", "google", "anthropic", "xai", "perplexity", "lovable"] as const)
    .find((p) => p === String(idOrModel ?? "").toLowerCase())
    ?? providerFromModel(idOrModel)
    ?? "lovable";
  return { id, label: LABELS[id], capability };
}

/** True when this error is an AI capacity wall rather than a normal failure. */
export function isCapacityFailure(e: any): boolean {
  const status = Number(e?.status ?? e?.upstreamStatus ?? 0);
  if (status === 402 || status === 429) return true;
  if (status === 403 && e?.code === "credit_limit_reached") return true;
  const code = String(e?.code ?? "");
  return code === "PAYMENT_REQUIRED" || code === "AI_CREDIT_LIMIT_REACHED" || code === "RATE_LIMITED";
}

/**
 * Build the error body an edge function should return when an AI call was
 * blocked by capacity. `model` is the gateway model id that was being called
 * (or a provider id for direct third-party calls, e.g. "perplexity").
 */
export function capacityErrorBody(
  e: any,
  opts: { model?: string | null; capability?: string; providers?: CapacityProvider[] } = {},
): CapacityErrorBody | null {
  if (!isCapacityFailure(e)) return null;

  const status = Number(e?.status ?? e?.upstreamStatus ?? 0);
  const workspaceCap =
    e?.code === "credit_limit_reached" || e?.code === "AI_CREDIT_LIMIT_REACHED" || status === 403;

  const code: CapacityErrorBody["code"] =
    status === 429 || e?.code === "RATE_LIMITED"
      ? "RATE_LIMITED"
      : workspaceCap
        ? "AI_CREDIT_LIMIT_REACHED"
        : "PAYMENT_REQUIRED";

  const providers = opts.providers?.length
    ? opts.providers
    : [
        workspaceCap
          ? capacityProvider("lovable", opts.capability)
          : capacityProvider(opts.model ?? null, opts.capability),
      ];

  return {
    error: typeof e?.message === "string" && e.message ? e.message : "AI capacity reached",
    code,
    reason: workspaceCap ? "workspace_credit_limit" : status === 429 ? "rate_limited" : "ai_credits_exhausted",
    upstreamStatus: status || undefined,
    providers,
  };
}

/** De-duplicate a provider list (bulk runs can hit several providers). */
export function mergeProviders(list: CapacityProvider[]): CapacityProvider[] {
  const seen = new Map<string, CapacityProvider>();
  for (const p of list) {
    const key = `${p.id}:${p.capability ?? ""}`;
    if (!seen.has(key)) seen.set(key, p);
  }
  return [...seen.values()];
}

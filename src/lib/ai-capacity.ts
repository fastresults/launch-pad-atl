// Client-side classification of "AI capacity" failures + the notice submission.
//
// Capacity failures are the one class of AI error we never want to show as a
// raw red toast: the founder did nothing wrong, and the fix is on our side.
// Everything here feeds the branded AiCapacityDialog.

import { supabase } from "@/integrations/supabase/client";
import { getEffectiveUserId } from "@/lib/effective-user";
import { enqueueTransactionalEmail } from "@/lib/email/enqueue";

const ADMIN_NOTIFY_EMAIL = "fastresults@gmail.com";

export type CapacityProviderId =
  | "openai"
  | "google"
  | "anthropic"
  | "xai"
  | "perplexity"
  | "lovable";

export type CapacityProvider = {
  id: CapacityProviderId;
  label: string;
  capability?: string;
};

export type CapacityKind = "credits" | "rate_limit";

export type CapacityInfo = {
  kind: CapacityKind;
  code: string;
  providers: CapacityProvider[];
  message?: string;
};

const PROVIDER_IDS: CapacityProviderId[] = [
  "openai",
  "google",
  "anthropic",
  "xai",
  "perplexity",
  "lovable",
];

const PROVIDER_LABELS: Record<CapacityProviderId, string> = {
  openai: "OpenAI",
  google: "Google",
  anthropic: "Anthropic",
  xai: "xAI",
  perplexity: "Perplexity",
  lovable: "Lovable AI capacity",
};

function normalizeProvider(raw: any): CapacityProvider | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    const id = PROVIDER_IDS.find((p) => p === raw.toLowerCase());
    return id ? { id, label: PROVIDER_LABELS[id] } : null;
  }
  const id = PROVIDER_IDS.find((p) => p === String(raw.id ?? "").toLowerCase());
  if (!id) return null;
  return {
    id,
    label: typeof raw.label === "string" && raw.label ? raw.label : PROVIDER_LABELS[id],
    capability: typeof raw.capability === "string" ? raw.capability : undefined,
  };
}

function statusFrom(err: any): number | null {
  const direct = Number(err?.status ?? err?.upstreamStatus ?? 0);
  if (direct) return direct;
  const ctx = err?.context;
  if (ctx && typeof ctx.status === "number") return ctx.status;
  const m = String(err?.message ?? err ?? "").match(/\b(4\d\d|5\d\d)\b/);
  return m ? Number(m[1]) : null;
}

/**
 * Returns capacity details when this error/payload is an AI capacity wall,
 * otherwise null. Accepts an Error from `invokeEdge` (which carries the parsed
 * body fields) or a 200 payload that reports a capacity code.
 */
export function parseCapacityError(input: any): CapacityInfo | null {
  if (!input) return null;

  const code = String(input.code ?? "");
  const status = statusFrom(input);
  const text = String(input.message ?? input.error ?? "").toLowerCase();

  const isRate = code === "RATE_LIMITED" || status === 429;
  const isCredits =
    code === "PAYMENT_REQUIRED" ||
    code === "AI_CREDIT_LIMIT_REACHED" ||
    code === "credit_limit_reached" ||
    status === 402 ||
    text.includes("credits exhausted") ||
    text.includes("credit limit");

  if (!isRate && !isCredits) return null;

  const providers = (Array.isArray(input.providers) ? input.providers : [])
    .map(normalizeProvider)
    .filter(Boolean) as CapacityProvider[];

  return {
    kind: isCredits ? "credits" : "rate_limit",
    code: code || (isCredits ? "PAYMENT_REQUIRED" : "RATE_LIMITED"),
    providers,
    message: typeof input.message === "string" ? input.message : undefined,
  };
}

/** Convenience for callers that get a 200 payload carrying a capacity code. */
export function capacityFromPayload(payload: any): CapacityInfo | null {
  return parseCapacityError(payload);
}

export function providerSummary(providers: CapacityProvider[]): string {
  if (!providers.length) return "AI capacity";
  return providers.map((p) => p.label).join(", ");
}

export type CapacityNoticeInput = {
  contextLabel?: string;
  snapshotId?: string | null;
  code?: string;
  providers: CapacityProvider[];
  note?: string;
};

/** Has this founder already reported a capacity issue in the last 24h? */
export async function recentNoticeAt(): Promise<string | null> {
  try {
    const userId = await getEffectiveUserId();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("ai_capacity_notices")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as any)?.created_at ?? null;
  } catch {
    return null;
  }
}

/** Record the notice and alert the team. */
export async function sendCapacityNotice(input: CapacityNoticeInput): Promise<void> {
  const userId = await getEffectiveUserId();
  const providerLabels = input.providers.map((p) => p.label);

  const { data, error } = await supabase
    .from("ai_capacity_notices")
    .insert({
      user_id: userId,
      snapshot_id: input.snapshotId ?? null,
      context_label: input.contextLabel ?? null,
      error_code: input.code ?? null,
      providers: providerLabels,
      note: input.note?.trim() || null,
    })
    .select("id")
    .single();

  if (error) throw error;

  const subjectProviders = providerLabels.length ? providerLabels.join(", ") : "unknown provider";
  try {
    await enqueueTransactionalEmail({
      templateName: "inquiry-admin-notification",
      recipientEmail: ADMIN_NOTIFY_EMAIL,
      idempotencyKey: `ai-capacity-${(data as any)?.id}`,
      templateData: {
        fromName: "AI capacity notice",
        fromEmail: ADMIN_NOTIFY_EMAIL,
        subject: `AI capacity — ${subjectProviders}`,
        message: [
          `Provider(s) at limit: ${subjectProviders}`,
          `Blocked step: ${input.contextLabel ?? "unknown"}`,
          `Error code: ${input.code ?? "unknown"}`,
          `Founder user id: ${userId}`,
          input.snapshotId ? `Venture: ${input.snapshotId}` : null,
          input.note?.trim() ? `Note: ${input.note.trim()}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    });
  } catch (e) {
    console.warn("[ai-capacity] admin email enqueue failed", e);
  }
}

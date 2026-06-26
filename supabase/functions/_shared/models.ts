// Centralized model identifiers. Edit here once to bump models project-wide.
// Every Edge Function that hits the AI Gateway should import from this file
// instead of inlining `google/gemini-...` strings. Tier helpers translate
// `deliverable_types.default_model` / `model_tier` columns into a concrete id.

export const MODELS = {
  /** Primary generation workhorse — balanced cost/quality. */
  flash: "google/gemini-3-flash-preview",
  /** Cheap, structured-output friendly; use for brain/summarization/extraction. */
  flashLite: "google/gemini-3.1-flash-lite",
  /** Highest-rigor reasoning — strategic decks, deep assessments, financial models. */
  pro: "google/gemini-3-pro-preview",
  /** Image generation (standard quality, Nano Banana). */
  flashImage: "google/gemini-3.1-flash-image",
  /** Image generation (Pro / Nano Banana Pro) — for hero artwork. */
  proImage: "google/gemini-3-pro-image",
  /** STT default (used via /v1/audio/transcriptions). */
  stt: "openai/gpt-4o-mini-transcribe",
} as const;

export type ModelTier = "pro" | "flash" | "lite";

/** Translate a deliverable_types row's tier/default_model into a concrete id. */
export function modelForTier(
  tier: string | null | undefined,
  fallback: string = MODELS.flash,
): string {
  switch ((tier ?? "").toLowerCase()) {
    case "pro":
    case "gemini-pro":
    case "google/gemini-3-pro-preview":
    case "google/gemini-3.1-pro-preview":
      return MODELS.pro;
    case "lite":
    case "flash-lite":
    case "google/gemini-3.1-flash-lite":
      return MODELS.flashLite;
    case "flash":
    case "google/gemini-3-flash-preview":
    case "google/gemini-2.5-flash":
    case "google/gemini-3.5-flash":
      return MODELS.flash;
    default:
      // If the caller passed a vendor/model id we don't recognize, honor it as-is.
      if (typeof tier === "string" && tier.includes("/")) return tier;
      return fallback;
  }
}

// Turns a concept brief into an art-directed Higgsfield prompt.
//
// The failure mode this file exists to prevent: generic "AI logo" output —
// gradient blobs, 3D bevels, mockups on business cards, and invented lettering.
// Every constraint below is load-bearing. The prompt leads with the HUMAN TRUTH
// so the mark depicts something felt, not a clip-art noun.

export interface ConceptBrief {
  /** Short name for the direction, e.g. "Steady Hands". */
  name?: string;
  /** The human truth behind the business — who it serves and what it changes. */
  humanTruth?: string;
  /** The specific craft/design move: what makes this mark clever. */
  craftMove?: string;
  /** Concrete imagery to build from. */
  imagery?: string;
  /** Adjectives describing the intended feel. */
  mood?: string;
}

export interface BrandContext {
  /** Brand/venture name, for context only — it must NOT be drawn. */
  brandName?: string;
  /** What the business actually does, in one line. */
  positioning?: string;
  /** Hex values from the locked palette. */
  palette?: string[];
  /** Moodboard direction, summarised. */
  moodboard?: string;
  /** Brand personality adjectives. */
  personality?: string[];
}

const NEGATIVE = [
  "text", "letters", "lettering", "words", "typography", "wordmark", "watermark", "signature",
  "mockup", "business card", "stationery", "packaging", "billboard", "storefront", "product shot",
  "3d render", "bevel", "emboss", "extrusion", "glossy", "metallic", "chrome", "reflection",
  "drop shadow", "gradient mesh", "glow", "lens flare", "bokeh", "photograph", "photorealistic",
  "clip art", "stock icon", "generic swoosh", "globe", "handshake", "lightbulb", "puzzle piece",
  "gear icon", "rocket ship", "checkmark badge", "cluttered", "busy", "multiple logos",
  "grid lines", "guide lines", "construction marks", "border", "frame", "noise", "texture",
].join(", ");

function hexList(palette?: string[]): string {
  const hexes = (palette ?? []).filter((c) => /^#[0-9a-f]{3,8}$/i.test(c)).slice(0, 3);
  if (!hexes.length) return "a deep near-black ink colour on pure white";
  if (hexes.length === 1) return `${hexes[0]} on pure white`;
  return `${hexes[0]} as the dominant colour, with ${hexes.slice(1).join(" and ")} used sparingly as accents, on pure white`;
}

function clean(value?: string): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : null;
}

/**
 * Builds the positive prompt for one concept.
 * Deliberately written as an art director's brief to a designer, not a tag soup.
 */
export function buildLogoRenderPrompt(brief: ConceptBrief, brand: BrandContext): string {
  const lines: string[] = [];

  lines.push(
    "An award-winning logo mark by a world-class identity designer — the kind of work that gets posted to Dribbble's award-winning identity feed and wins a design award.",
  );

  const truth = clean(brief.humanTruth);
  if (truth) {
    lines.push(`The mark exists to express one human truth: ${truth}. Every line in the symbol should serve that feeling rather than illustrate an object literally.`);
  }

  const positioning = clean(brand.positioning);
  if (positioning) lines.push(`The business: ${positioning}.`);

  const craft = clean(brief.craftMove);
  if (craft) {
    lines.push(`The design move that makes this mark memorable: ${craft}. Execute it with confidence and restraint — one idea, resolved perfectly.`);
  }

  const imagery = clean(brief.imagery);
  if (imagery) lines.push(`Visual starting point: ${imagery}, abstracted and simplified until only the essential form remains.`);

  const mood = clean(brief.mood) ?? (brand.personality ?? []).join(", ");
  if (clean(mood)) lines.push(`Feeling: ${mood}.`);

  const moodboard = clean(brand.moodboard);
  if (moodboard) lines.push(`Consistent with the brand's visual world: ${moodboard}.`);

  lines.push(`Colour: ${hexList(brand.palette)}. Flat solid fills only — no gradients, no shading.`);

  lines.push(
    "Format: a single centred symbol on a plain solid white background, generous even margins, perfectly balanced optical weight. Flat 2D vector illustration style with crisp clean edges and confident geometry. Organic, hand-refined curves — not mechanically grid-snapped. It must read instantly at 24 pixels and hold up at billboard scale, and stay legible as a solid one-colour silhouette.",
  );

  lines.push(
    "Absolutely no text, letters, words, or lettering anywhere in the image. No mockups, no cards, no packaging, no 3D, no shadows, no glow, no photographic elements. The symbol only.",
  );

  return lines.join("\n\n");
}

export function logoNegativePrompt(): string {
  return NEGATIVE;
}

/** Stable per-concept seed so re-renders of the same brief stay in family. */
export function seedForConcept(directionId: string): number {
  let hash = 2166136261;
  for (let i = 0; i < directionId.length; i++) {
    hash ^= directionId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 2_147_483_647;
}

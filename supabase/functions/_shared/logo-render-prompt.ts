// Stage 4 of the Logo Studio — the render brief.
//
// The prompt is composed in a fixed order that mirrors how the pipeline reads
// the venture: BUSINESS first (what this actually is), then the CRAFT SPEC read
// from the founder's inspiration marks (how it must be built), then the single
// concept idea. Anything that is not one of those three is noise and is kept
// out deliberately.

import { craftSpecBlock, type CraftSpec } from "./logo-reference-read.ts";
import type { BusinessProfile } from "./logo-business-read.ts";

export interface ConceptBrief {
  name?: string;
  /** The one-sentence shape idea a designer could draw from. */
  idea?: string;
  /** The single drawing move that creates the mark. */
  craftMove?: string;
  /** The concrete thing from the business the form is built on. */
  imagery?: string;
  logoType?: string;
}

export interface BrandContext {
  brandName?: string;
  palette?: string[];
  moodboard?: string;
  personality?: string[];
}

const NEGATIVE = [
  "text", "letters", "lettering", "words", "typography", "wordmark", "watermark", "signature",
  "mockup", "business card", "stationery", "packaging", "billboard", "storefront", "product shot",
  "3d render", "bevel", "emboss", "extrusion", "glossy", "metallic", "chrome", "reflection",
  "drop shadow", "gradient", "gradient mesh", "glow", "lens flare", "bokeh", "photograph", "photorealistic",
  "clip art", "stock icon", "generic swoosh", "globe", "handshake", "lightbulb", "puzzle piece",
  "gear icon", "rocket ship", "checkmark badge", "sunburst seal", "laurel wreath", "shield badge",
  "cluttered", "busy", "multiple logos", "grid lines", "guide lines", "construction marks",
  "border", "frame", "noise", "texture", "sketch", "hand drawn wobble",
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
 * Builds the positive prompt for one concept. Written as an art director's
 * brief to a designer, in the pipeline's own reading order.
 */
export function buildLogoRenderPrompt(
  brief: ConceptBrief,
  brand: BrandContext,
  profile?: BusinessProfile | null,
  spec?: CraftSpec | null,
  correction?: string | null,
): string {
  const lines: string[] = [];

  lines.push(
    "A single award-winning logo mark by a world-class identity designer — the standard of work published in a design annual.",
  );

  if (profile) {
    lines.push(
      `THE BUSINESS: ${profile.category}${profile.what_is_sold ? ` — ${profile.what_is_sold}` : ""}. Customer: ${profile.customer || "unstated"}. The mark must read as belonging to this business and nothing else.${profile.must_communicate ? ` It must communicate: ${profile.must_communicate}.` : ""}`,
    );
    if (profile.symbol_vocabulary.length) {
      lines.push(`Build the form from the real world of this work: ${profile.symbol_vocabulary.join(", ")}. Abstract it — never illustrate it literally.`);
    }
    if (profile.cliche_blacklist.length) {
      lines.push(`NEVER use any of these category clichés: ${profile.cliche_blacklist.join(", ")}.`);
    }
    if (profile.register) lines.push(`Register: ${profile.register}.`);
  }

  if (spec) {
    lines.push(`HOW IT MUST BE BUILT (matched to the founder's own reference marks):\n${craftSpecBlock(spec)}`);
  }

  const idea = clean(brief.idea);
  if (idea) lines.push(`THE CONCEPT: ${idea}`);

  const craft = clean(brief.craftMove);
  if (craft) lines.push(`The single drawing move that creates the mark: ${craft}. Execute it with confidence and restraint — one idea, resolved perfectly.`);

  const imagery = clean(brief.imagery);
  if (imagery) lines.push(`Form starting point: ${imagery}, abstracted until only the essential shape remains.`);

  const personality = (brand.personality ?? []).join(", ");
  if (clean(personality)) lines.push(`Feeling: ${personality}.`);

  const moodboard = clean(brand.moodboard);
  if (moodboard) lines.push(`Consistent with the brand's visual world: ${moodboard}.`);

  lines.push(`Colour: ${hexList(brand.palette)}. Flat solid fills only — no gradients, no shading.`);

  lines.push(
    "Format: one centred symbol on a plain solid white background, generous even margins, perfectly balanced optical weight. Flat 2D vector illustration with crisp clean edges and confident, hand-refined curves — not mechanically grid-snapped, not wobbly. It must read instantly at 24 pixels, hold up at billboard scale, and stay legible as a solid one-colour silhouette.",
  );

  lines.push(
    "Absolutely no text, letters, words, or lettering anywhere in the image. No mockups, no cards, no packaging, no 3D, no shadows, no glow, no photographic elements. The symbol only.",
  );

  const fix = clean(correction ?? undefined);
  if (fix) lines.push(`THE PREVIOUS ATTEMPT WAS REJECTED BY THE JURY. Fix exactly this and change nothing else: ${fix}`);

  return lines.join("\n\n");
}

export function logoNegativePrompt(): string {
  return NEGATIVE;
}

/** Stable per-concept seed so re-renders of the same brief stay in family. */
export function seedForConcept(directionId: string, salt = 0): number {
  let hash = 2166136261;
  const key = `${directionId}:${salt}`;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 2_147_483_647;
}

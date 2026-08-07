// Stage 4 of the Logo Studio — the render brief.
//
// The brief opens with ONE composed emblem sentence — the same shape as an art
// director's written brief — because image models flatten labelled checklists
// into a mood average. Constraints still exist, they just stop leading.

import type { CraftSpec } from "./logo-reference-read.ts";
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
  headingFont?: string;
  bodyFont?: string;
  /** How many live moodboard tiles are attached as vision references. */
  moodboardTileCount?: number;
  /** How many founder inspiration marks are attached as vision references. */
  referenceCount?: number;
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

function hexes(palette?: string[]): string[] {
  return (palette ?? []).filter((c) => typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c)).slice(0, 3);
}

function paletteClause(palette?: string[]): string {
  const list = hexes(palette);
  if (!list.length) return "a single deep near-black ink on pure white";
  if (list.length === 1) return `a one-colour palette of ${list[0]} on pure white`;
  return `a palette led by ${list[0]}, with ${list.slice(1).join(" and ")} used sparingly as a single accent, on pure white`;
}

function clean(value?: string): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : null;
}

function constructionClause(spec?: CraftSpec | null): string {
  if (!spec) return "clean, sophisticated lines with confident, hand-refined curves";
  return [
    `${spec.construction} construction`,
    clean(spec.stroke_character) ? `${spec.stroke_character} strokes` : "",
    clean(spec.corner_and_terminals) ? spec.corner_and_terminals : "",
    clean(spec.symmetry) ? `${spec.symmetry} balance` : "",
    `abstraction level ${spec.abstraction} of 5`,
    `no more than ${spec.element_count} distinct elements`,
  ].filter(Boolean).join(", ");
}

/**
 * Builds the positive prompt for one concept: one emblem sentence first,
 * short hard constraints after.
 */
export function buildLogoRenderPrompt(
  brief: ConceptBrief,
  brand: BrandContext,
  profile?: BusinessProfile | null,
  spec?: CraftSpec | null,
  correction?: string | null,
): string {
  const lines: string[] = [];

  const symbol =
    clean(brief.idea) ??
    clean(brief.imagery) ??
    (profile?.symbol_vocabulary?.length
      ? `an integrated symbol built from ${profile.symbol_vocabulary.slice(0, 2).join(" and ")}`
      : "a single integrated abstract symbol");

  const differentiator = clean(profile?.must_communicate ?? undefined);
  const vibe = [clean(profile?.register ?? undefined), ...(brand.personality ?? [])]
    .filter(Boolean).slice(0, 4).join(", ") || "confident, credible, premium";

  // The one composed emblem sentence.
  lines.push(
    [
      `A centered, balanced graphic vector emblem featuring ${symbol}.`,
      `The design must have ${constructionClause(spec)}${
        differentiator ? `, and include a stylized element representing ${differentiator}` : ""
      }.`,
      `Use ${paletteClause(brand.palette)}, ${spec?.colour_count ?? 2} ink(s) maximum, flat solid fills only.`,
      `The vibe must be ${vibe}.`,
      `The logo must have high scalability and readability at 24 pixels${
        brand.headingFont ? `, and must sit comfortably beside ${brand.headingFont} type` : ""
      }.`,
    ].join(" "),
  );

  const craft = clean(brief.craftMove);
  if (craft) lines.push(`The single drawing move that creates the mark: ${craft}. Execute it with restraint — one idea, resolved perfectly.`);

  // Vision reference roles, stated in attachment order.
  const refCount = brand.referenceCount ?? 0;
  const tileCount = brand.moodboardTileCount ?? 0;
  if (refCount || tileCount) {
    const parts: string[] = [];
    if (refCount) parts.push(`The first ${refCount} attached image(s) are the founder's inspiration marks — they define HOW this is built (proportion, stroke, abstraction, counterform). Never echo their subject matter.`);
    if (tileCount) parts.push(`The following ${tileCount} attached image(s) are the brand's live moodboard — they define the WORLD this mark lives in (colour temperature, texture, softness). Never copy their imagery.`);
    lines.push(parts.join(" "));
  }

  if (profile) {
    lines.push(
      `Context: ${profile.category}${profile.what_is_sold ? ` — ${profile.what_is_sold}` : ""}, for ${profile.customer || "its customers"}. The mark must read as belonging to this business and nothing else.`,
    );
    if (profile.cliche_blacklist.length) {
      lines.push(`NEVER use any of these category clichés: ${profile.cliche_blacklist.join(", ")}.`);
    }
  }

  if (spec?.avoid?.length) lines.push(`Structurally avoid: ${spec.avoid.join("; ")}.`);
  if (clean(spec?.shared_quality ?? undefined)) lines.push(`Inherit this above all: ${spec!.shared_quality}.`);

  const moodboard = clean(brand.moodboard);
  if (moodboard) lines.push(`Brand mood in words: ${moodboard}.`);

  lines.push(
    "Format: one centred symbol on a plain solid white background, generous even margins, perfectly balanced optical weight. Flat 2D vector illustration with crisp clean edges — not mechanically grid-snapped, not wobbly. It must hold up as a solid one-colour silhouette.",
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

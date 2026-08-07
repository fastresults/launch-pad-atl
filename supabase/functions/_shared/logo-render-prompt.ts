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
  /** The literal subject a stranger would name on sight. */
  readsAs?: string;
  /** What the mark means, in human terms. */
  meaning?: string;
  /** The additional true idea the form carries beyond its literal subject. */
  secondRead?: string;
  /** The shared law all three marks in this set obey. */
  setLaw?: string;
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
  "text", "letters", "lettering", "words", "typography", "wordmark", "monogram", "initials",
  "watermark", "signature", "caption", "label",
  "mockup", "business card", "stationery", "packaging", "billboard", "storefront", "product shot",
  "3d render", "bevel", "emboss", "extrusion", "glossy", "metallic", "chrome", "reflection",
  "drop shadow", "gradient", "gradient mesh", "glow", "lens flare", "bokeh", "photograph", "photorealistic",
  "clip art", "stock icon", "generic swoosh", "decorative swoosh", "sparkle", "highlight arc",
  "filler leaf", "stray dots", "confetti",
  "globe", "handshake", "lightbulb", "puzzle piece",
  "gear icon", "rocket ship", "checkmark badge", "sunburst seal", "laurel wreath", "shield badge",
  "cluttered", "busy", "multiple logos", "detached elements", "floating parts",
  "grid lines", "guide lines", "construction marks",
  "border", "frame", "noise", "texture", "sketch", "hand drawn wobble", "lumpy contour",
  "uneven stroke", "random tapering", "asymmetric mistake",
].join(", ");

function hexes(palette?: string[]): string[] {
  return (palette ?? []).filter((c) => typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c)).slice(0, 3);
}

function paletteClause(palette?: string[]): string {
  const list = hexes(palette);
  if (!list.length) return "a single deep near-black ink on pure white";
  if (list.length === 1) return `a one-colour palette of ${list[0]} on pure white`;
  const [dominant, secondary, accent] = list;
  return [
    `a palette with assigned roles on pure white: ${dominant} is DOMINANT and carries the structure of the mark`,
    secondary ? `${secondary} is SECONDARY and carries the supporting mass` : "",
    accent ? `${accent} is the ACCENT and is used ONCE, on the single element that carries the meaning (the human figure or the focal subject) — never on decoration or an outline` : "",
    "no single colour may swallow the mark; the accent must be the first thing the eye lands on",
  ].filter(Boolean).join(", ");
}

function clean(value?: string): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : null;
}

function constructionClause(spec?: CraftSpec | null): string {
  if (!spec) return "confident geometric construction with deliberate, evenly-modulated curves";
  return [
    `${spec.construction} construction`,
    clean(spec.stroke_character) ? `${spec.stroke_character} strokes` : "",
    clean(spec.corner_and_terminals) ? spec.corner_and_terminals : "",
    clean(spec.symmetry) ? `${spec.symmetry} balance` : "",
    `abstraction level ${spec.abstraction} of 5`,
  ].filter(Boolean).join(", ");
}

/**
 * Builds the positive prompt for one concept.
 *
 * Order is deliberate: image models weight the head and the tail of a prompt
 * most, so the absolute rules (no lettering, one fused form, silhouette read)
 * sit first and are repeated last. Everything measurable is stated as a count
 * or a test, never as an adjective — "clean sophisticated lines" is exactly the
 * kind of unmeasurable instruction that produced lumpy, assembled slop.
 */
export function buildLogoRenderPrompt(
  brief: ConceptBrief,
  brand: BrandContext,
  profile?: BusinessProfile | null,
  spec?: CraftSpec | null,
  correction?: string | null,
): string {
  const lines: string[] = [];

  const subject =
    clean(brief.readsAs) ??
    clean(brief.imagery) ??
    (profile?.meaning_symbols?.length
      ? `a stylized ${String(profile.meaning_symbols[0]).split("=")[0].trim()}`
      : profile?.symbol_vocabulary?.length
        ? `a stylized ${profile.symbol_vocabulary.slice(0, 2).join(" fused with a ")}`
        : "a stylized, instantly nameable subject drawn from this business");
  const shapeIdea = clean(brief.idea);

  const differentiator = clean(profile?.must_communicate ?? undefined);
  const vibe = [clean(profile?.register ?? undefined), ...(brand.personality ?? [])]
    .filter(Boolean).slice(0, 4).join(", ") || "confident, credible, premium";
  const shapeCount = Math.max(1, Math.min(4, Number(spec?.element_count ?? 2)));

  // 1. The absolute rule, first.
  lines.push("ABSOLUTE RULE: this image contains NO letters, NO words, NO lettering, NO monogram, NO initials of any kind. A symbol only.");

  // 2. The one composed emblem sentence — the subject is always a nameable thing.
  lines.push(
    [
      `A centered, balanced graphic vector emblem depicting ${subject}.`,
      shapeIdea ? `Drawn as: ${shapeIdea}.` : "",
      `The design must have ${constructionClause(spec)}${
        differentiator ? `, and include a stylized element representing ${differentiator}` : ""
      }.`,
      `Use ${paletteClause(brand.palette)}, ${spec?.colour_count ?? 2} ink(s) maximum, flat solid fills only.`,
      `The vibe must be ${vibe}.`,
      brand.headingFont ? `It must sit comfortably beside ${brand.headingFont} type.` : "",
    ].filter(Boolean).join(" "),
  );

  // 2b. Meaning — this mark must be ABOUT something, not decoration.
  const meaning = clean(brief.meaning) ?? clean(profile?.emotional_promise ?? undefined);
  const secondRead = clean(brief.secondRead);
  lines.push(
    [
      `MEANING: this mark must carry a human idea, not decoration.${meaning ? ` It must communicate: ${meaning}.` : ""}`,
      profile?.human_truth ? `The moment it speaks to: ${profile.human_truth}.` : "",
      secondRead ? `SECOND READ: beyond its literal subject the form must also carry this idea, built into the drawing itself: ${secondRead}.` : "",
      `RECOGNISABILITY: a stranger who knows nothing about this company must be able to name what they are looking at in three words — and the words must contain a subject ("${subject}"), not a shape description. An abstract ribbon, swirl, spiral, wave or infinity loop is a FAILED mark here.`,
    ].filter(Boolean).join(" "),
  );

  // 2c. Human presence — props describe a facility, figures describe a life.
  const figures = clean(profile?.human_figures ?? undefined);
  if (figures && figures.toLowerCase() !== "none") {
    lines.push(
      `HUMAN PRESENCE: the mark must contain human figures or an unmistakable human gesture — ${figures}. Draw them as simple, dignified, stylised silhouettes fused into the main form, never as detached icons standing beside it, never with facial features. A mark made only of objects (a gate, a lamp, a table, a building) describes a facility; this mark must describe a life.`,
    );
  }

  // 2d. The set law — all marks in this run obey the same construction rules.
  const setLaw = clean(brief.setLaw);
  if (setLaw) {
    lines.push(
      `SET LAW (identical across every mark in this set — obey it exactly, vary only the subject): ${setLaw}`,
    );
  }

  // 3. Fusion — the failure mode that separates an agency mark from an AI collage.
  lines.push(
    `FUSION: the mark is ONE continuous, connected form. Every part must physically touch, share a contour, share a tangent, or be cut out of another part as a counterform. Elements that merely sit near each other, overlap loosely, or float apart are a FAILED mark. Draw exactly ${shapeCount} closed shape${shapeCount === 1 ? "" : "s"} and no more.`,
  );

  // 4. Curve quality — measurable, not adjectival.
  lines.push(
    "CURVE QUALITY: every curve is deliberate and evenly weighted — consistent stroke width, or one single deliberate modulation axis applied consistently. No wobble, no random tapering, no lumpy or sagging contours, no accidental asymmetry, no bulging joins. Corners and terminals are cut cleanly and identically across the whole mark.",
  );

  // 5. No filler.
  lines.push(
    "NO DECORATION: every stroke must carry meaning. No stray swooshes, sparkles, highlight arcs, orbiting dots, filler leaves, or accent flourishes added for balance. If a shape can be removed without losing the idea, it must not be drawn.",
  );

  // 6. A countable detail cap, then the silhouette test as the closing check.
  lines.push(
    "DETAIL CAP: no interior stroke may be thinner than one twelfth of the mark's overall width. No repeated micro-texture of any kind — no ruled lines, hatching, stippling, scrollwork, filigree, fringe, feathering or engraved shading. Every interior gap must be at least as wide as the strokes around it. SILHOUETTE TEST: filled solid black and reduced to 24 pixels, the mark must still read as the same distinct subject — counterforms stay open, gaps stay visible, nothing closes up or turns to mush.",
  );

  const craft = clean(brief.craftMove);
  if (craft) lines.push(`The single drawing move that creates the mark: ${craft}. Execute that one move with restraint — one idea, resolved perfectly, nothing added around it.`);

  // Vision reference roles, stated in attachment order.
  const refCount = brand.referenceCount ?? 0;
  const tileCount = brand.moodboardTileCount ?? 0;
  if (refCount || tileCount) {
    const parts: string[] = [];
    if (refCount) parts.push(`The first ${refCount} attached image(s) are the founder's inspiration marks — they define HOW this is built (proportion, stroke, abstraction, counterform, curve discipline). Match their level of craft. Never echo their subject matter.`);
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
    "Format: one centred symbol on a plain solid white background, generous even margins, perfectly balanced optical weight. Flat 2D vector illustration with crisp clean edges — not mechanically grid-snapped, not wobbly. No mockups, no cards, no packaging, no 3D, no shadows, no glow, no photographic elements.",
  );

  const fix = clean(correction ?? undefined);
  if (fix) lines.push(`THE PREVIOUS ATTEMPT WAS REJECTED. Fix exactly this and change nothing else: ${fix}`);

  // Repeat the absolute rule last — models weight the tail heavily.
  lines.push("Repeat: absolutely no text, letters, words, numerals or lettering anywhere in the image. One fused symbol only.");

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

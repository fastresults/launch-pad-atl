// Brand art direction — the creative brief every collateral piece obeys.
//
// The old compositor drew every brand the same way. Here a creative-director
// pass picks ONE house style for the venture (from a curated set, each with its
// own grid, scale, ink and material rules), and that record is saved so the
// whole kit — and every future regeneration — stays in the same voice.

import { aiFetch } from "./ai-fetch.ts";
import { MODELS } from "./models.ts";

export type Archetype =
  | "swiss_editorial"
  | "luxury_serif"
  | "modern_corporate"
  | "warm_craft"
  | "technical_precision";

export type ArtDirection = {
  archetype: Archetype;
  rationale: string;
  /** Layout grid, expressed as ratios of the page's short edge. */
  grid: { columns: number; gutter: number; marginRatio: number; baseline: number };
  /** Modular type scale. */
  scale: { base: number; ratio: number };
  type: {
    displayTracking: number; // em
    labelTracking: number; // em
    bodyLeading: number;
    caseLabels: "upper" | "sentence";
  };
  ink: {
    /** Which pieces get an inverted (solid colour) primary surface. */
    invert: string[];
    accentBudget: number; // 0-1, share of a page the accent may touch
    hairline: number; // stroke width at 150dpi
    ruleWeight: number;
  };
  material: {
    paper: "bright_white" | "warm_white" | "soft_grey" | "ivory";
    grain: number; // 0-1
    radius: number;
  };
  motif: {
    kind: "rule_cap" | "corner_notch" | "dot_grid" | "diagonal_cut" | "none";
    scale: number;
  };
};

const ARCHETYPES: Record<Archetype, Omit<ArtDirection, "archetype" | "rationale">> = {
  swiss_editorial: {
    grid: { columns: 12, gutter: 0.022, marginRatio: 0.085, baseline: 8 },
    scale: { base: 20, ratio: 1.333 },
    type: { displayTracking: -0.02, labelTracking: 0.16, bodyLeading: 1.55, caseLabels: "upper" },
    ink: { invert: ["business_card", "presentation"], accentBudget: 0.08, hairline: 1, ruleWeight: 3 },
    material: { paper: "bright_white", grain: 0.05, radius: 0 },
    motif: { kind: "rule_cap", scale: 1 },
  },
  luxury_serif: {
    grid: { columns: 8, gutter: 0.03, marginRatio: 0.115, baseline: 9 },
    scale: { base: 21, ratio: 1.414 },
    type: { displayTracking: 0.005, labelTracking: 0.28, bodyLeading: 1.7, caseLabels: "upper" },
    ink: { invert: ["business_card", "notecard", "presentation"], accentBudget: 0.05, hairline: 0.75, ruleWeight: 1.25 },
    material: { paper: "ivory", grain: 0.09, radius: 0 },
    motif: { kind: "corner_notch", scale: 0.8 },
  },
  modern_corporate: {
    grid: { columns: 12, gutter: 0.02, marginRatio: 0.075, baseline: 8 },
    scale: { base: 20, ratio: 1.25 },
    type: { displayTracking: -0.012, labelTracking: 0.12, bodyLeading: 1.6, caseLabels: "upper" },
    ink: { invert: ["presentation"], accentBudget: 0.12, hairline: 1, ruleWeight: 4 },
    material: { paper: "bright_white", grain: 0.03, radius: 6 },
    motif: { kind: "diagonal_cut", scale: 1 },
  },
  warm_craft: {
    grid: { columns: 6, gutter: 0.035, marginRatio: 0.1, baseline: 9 },
    scale: { base: 20, ratio: 1.2 },
    type: { displayTracking: -0.005, labelTracking: 0.2, bodyLeading: 1.68, caseLabels: "sentence" },
    ink: { invert: ["notecard"], accentBudget: 0.14, hairline: 1.25, ruleWeight: 2 },
    material: { paper: "warm_white", grain: 0.13, radius: 14 },
    motif: { kind: "dot_grid", scale: 1.1 },
  },
  technical_precision: {
    grid: { columns: 16, gutter: 0.016, marginRatio: 0.07, baseline: 6 },
    scale: { base: 19, ratio: 1.2 },
    type: { displayTracking: -0.025, labelTracking: 0.22, bodyLeading: 1.5, caseLabels: "upper" },
    ink: { invert: ["business_card", "presentation"], accentBudget: 0.1, hairline: 0.75, ruleWeight: 2 },
    material: { paper: "soft_grey", grain: 0.04, radius: 2 },
    motif: { kind: "dot_grid", scale: 0.7 },
  },
};

export const PAPER_TONE: Record<ArtDirection["material"]["paper"], string> = {
  bright_white: "#FFFFFF",
  warm_white: "#FBF8F3",
  soft_grey: "#F4F5F7",
  ivory: "#FAF6EC",
};

export function archetypeSpec(a: Archetype): ArtDirection {
  const base = ARCHETYPES[a] ?? ARCHETYPES.swiss_editorial;
  return { archetype: a in ARCHETYPES ? a : "swiss_editorial", rationale: "", ...structuredClone(base) };
}

/** Modular step: `step(ad, 0)` is body size, positive steps go bigger. */
export function step(ad: ArtDirection, n: number): number {
  return ad.scale.base * Math.pow(ad.scale.ratio, n);
}

/** Snap a y position to the baseline grid so pieces align across the set. */
export function snap(ad: ArtDirection, y: number): number {
  const b = ad.grid.baseline;
  return Math.round(y / b) * b;
}

export type PageGrid = {
  W: number; H: number; M: number; colW: number; gutter: number;
  col: (i: number) => number;
  span: (n: number) => number;
  content: number;
};

/** Page geometry derived from the art direction, not from magic numbers. */
export function gridFor(ad: ArtDirection, W: number, H: number): PageGrid {
  const short = Math.min(W, H);
  const M = Math.round(short * ad.grid.marginRatio);
  const content = W - M * 2;
  const gutter = Math.round(short * ad.grid.gutter);
  const cols = ad.grid.columns;
  const colW = (content - gutter * (cols - 1)) / cols;
  return {
    W, H, M, colW, gutter, content,
    col: (i: number) => M + i * (colW + gutter),
    span: (n: number) => n * colW + Math.max(0, n - 1) * gutter,
  };
}

const SYSTEM = `You are the creative director of a top-tier brand agency choosing the house style for a
new identity's printed and office collateral. You pick ONE archetype from a fixed
set and justify it in one sentence. You never invent new archetypes.

Archetypes:
- swiss_editorial: objective grid, huge negative space, tight display tracking. For modern, design-literate, urban brands.
- luxury_serif: generous margins, wide small-caps labels, hairline rules, ivory stock. For premium, care, legal, hospitality, wellness.
- modern_corporate: confident, dense, blue-chip. For B2B, services, finance, healthcare admin, logistics.
- warm_craft: softer radii, warmer paper, sentence-case labels. For food, makers, family businesses, local trades.
- technical_precision: fine rules, dense column grid, small type. For engineering, software, data, industrial.

Return strict JSON only.`;

type DirectorInput = {
  company: string;
  tagline?: string | null;
  category?: string | null;
  audience?: string | null;
  voice?: string | null;
  colors: Record<string, string>;
  fonts: { heading?: string | null; body?: string | null };
};

/** Ask the director for an archetype, then hydrate the full locked spec. */
export async function directArt(input: DirectorInput): Promise<ArtDirection> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  const fallback = (): ArtDirection => {
    const heading = (input.fonts?.heading ?? "").toLowerCase();
    const serif = /(serif|playfair|lora|garamond|baskerv|crimson|spectral|cormorant|domine|bitter)/.test(heading);
    const a: Archetype = serif ? "luxury_serif" : "modern_corporate";
    const spec = archetypeSpec(a);
    spec.rationale = "Chosen from the brand's typography while the director pass was unavailable.";
    return spec;
  };
  if (!key) return fallback();

  try {
    const res = await aiFetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
        body: JSON.stringify({
          model: MODELS.flashLite,
          messages: [
            { role: "system", content: SYSTEM },
            {
              role: "user",
              content: JSON.stringify({
                company: input.company,
                tagline: input.tagline ?? null,
                category: input.category ?? null,
                audience: input.audience ?? null,
                voice: input.voice ?? null,
                palette: input.colors,
                typography: input.fonts,
                respond_with: {
                  archetype: "one of swiss_editorial | luxury_serif | modern_corporate | warm_craft | technical_precision",
                  rationale: "one sentence, max 24 words, naming what about this brand drove the choice",
                  accent_budget: "number 0.04-0.16 — how much accent colour the set should carry",
                  paper: "bright_white | warm_white | soft_grey | ivory",
                  motif: "rule_cap | corner_notch | dot_grid | diagonal_cut | none",
                },
              }),
            },
          ],
          response_format: { type: "json_object" },
        }),
      },
      { timeoutMs: 25_000, retries: 1 },
    );
    if (!res.ok) return fallback();
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw.replace(/^```json\s*|```$/g, "").trim());

    const spec = archetypeSpec(parsed.archetype);
    spec.rationale = String(parsed.rationale ?? "").slice(0, 220);
    const budget = Number(parsed.accent_budget);
    if (budget >= 0.02 && budget <= 0.25) spec.ink.accentBudget = budget;
    if (parsed.paper && parsed.paper in PAPER_TONE) spec.material.paper = parsed.paper;
    const motifs = ["rule_cap", "corner_notch", "dot_grid", "diagonal_cut", "none"];
    if (motifs.includes(parsed.motif)) spec.motif.kind = parsed.motif;
    return spec;
  } catch {
    return fallback();
  }
}

/** Re-hydrate a saved record so later code edits to an archetype still apply. */
export function hydrate(saved: unknown): ArtDirection | null {
  const s = saved as Partial<ArtDirection> | null;
  if (!s?.archetype) return null;
  const spec = archetypeSpec(s.archetype);
  spec.rationale = s.rationale ?? "";
  if (s.ink?.accentBudget) spec.ink.accentBudget = s.ink.accentBudget;
  if (s.material?.paper && s.material.paper in PAPER_TONE) spec.material.paper = s.material.paper;
  if (s.motif?.kind) spec.motif.kind = s.motif.kind;
  return spec;
}

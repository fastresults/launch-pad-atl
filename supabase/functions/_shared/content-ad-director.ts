// Content ad director — builds a synthetic AssetSpec for the 1:1 / 4:5 / 9:16
// social-ad aspect and delegates prompt construction to the shared cover-art
// director. The post's Hook is injected as a verbatim custom headline unless
// the founder has explicitly overridden or suppressed it.

import type { AssetSpec, ArtDirectionId } from "./social-platform-specs.ts";
import type { CanvasPlan } from "./canvas-plan.ts";
import { buildCoverArtPrompt, type HeadlineOverride } from "./cover-art-director.ts";

export type AdAspect = "1:1" | "4:5" | "9:16";

type Kit = Record<string, any>;

export function specForAspect(aspect: AdAspect): AssetSpec {
  if (aspect === "1:1") {
    return {
      kind: "pinned_post" as any,
      label: "Square social ad",
      width: 1080,
      height: 1080,
      guidance: "1:1 feed ad — thumb-stopping focal composition, thumbnail-legible at 240px",
      modelSize: "1024x1024",
    } as AssetSpec;
  }
  if (aspect === "4:5") {
    return {
      kind: "pinned_post" as any,
      label: "Portrait social ad",
      width: 1080,
      height: 1350,
      guidance: "4:5 feed ad — vertical composition, focal element upper two-thirds, 8% safe inset",
      modelSize: "1024x1536",
    } as AssetSpec;
  }
  return {
    kind: "story_cover" as any,
    label: "Story / Reel ad",
    width: 1080,
    height: 1920,
    guidance: "9:16 story ad — top 15% and bottom 20% reserved for platform UI, focal in the middle safe zone",
    modelSize: "1024x1536",
  } as AssetSpec;
}

// Per-aspect soft caps for the on-image headline. The SVG compositor tiers by
// length (1–4 lines) and shrinks font size, so we allow generous caps here and
// only trim at natural clause boundaries when a headline is truly excessive.
// Display budgets: what actually fits the poster column at a readable size.
const HEADLINE_CAP: Record<AdAspect, number> = { "1:1": 62, "4:5": 70, "9:16": 76 };

// Length-safe headline sanitizer. Never appends an ellipsis and never chops
// mid-word. If the raw string exceeds `cap`, prefer trimming at the last clause
// boundary (comma, em-dash, colon, semicolon) inside the cap; otherwise back off
// to the last whole-word boundary. The SVG layer handles wrapping/sizing.
export const DANGLING_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "nor", "so", "yet", "of", "to", "in", "on", "at", "by",
  "for", "with", "from", "into", "onto", "over", "under", "about", "as", "than", "that", "which",
  "who", "whom", "whose", "is", "are", "was", "were", "be", "been", "being", "has", "have", "had",
  "will", "would", "can", "could", "should", "may", "might", "must", "do", "does", "did", "your",
  "our", "their", "its", "his", "her", "my", "not", "no", "if", "when", "while", "because", "how",
  "why", "what", "you", "we", "they", "it",
]);

/** Drop trailing function words so a shortened line never ends mid-thought. */
export function trimDangling(s: string): string {
  let out = s.replace(/[\s,;:.!?\-–—("']+$/g, "");
  for (let i = 0; i < 4; i++) {
    const words = out.split(/\s+/).filter(Boolean);
    if (words.length <= 2) break;
    const last = words[words.length - 1].toLowerCase().replace(/[^a-z'’-]/g, "");
    if (!DANGLING_WORDS.has(last)) break;
    out = words.slice(0, -1).join(" ");
  }
  return out.replace(/[\s,;:.!?\-–—("']+$/g, "");
}

export function truncateHeadline(raw: string, cap: number): string {
  const s = (raw || "").trim().replace(/\s+/g, " ");
  if (s.length <= cap) return trimDangling(s);
  const hard = s.slice(0, cap);
  // Prefer a full sentence, then a clause boundary, then a whole word.
  const sentence = Math.max(hard.lastIndexOf(". "), hard.lastIndexOf("? "), hard.lastIndexOf("! "));
  if (sentence >= Math.floor(cap * 0.4)) return trimDangling(hard.slice(0, sentence));
  const clause = Math.max(
    hard.lastIndexOf(", "),
    hard.lastIndexOf(" — "),
    hard.lastIndexOf(" – "),
    hard.lastIndexOf(": "),
    hard.lastIndexOf("; "),
  );
  if (clause >= Math.floor(cap * 0.5)) return trimDangling(hard.slice(0, clause));
  const lastSpace = hard.lastIndexOf(" ");
  const stem = lastSpace >= Math.floor(cap * 0.5) ? hard.slice(0, lastSpace) : hard;
  return trimDangling(stem);
}

// Resolve the headline the ad should carry. Rules:
//  - Founder explicit override always wins (custom text or 'none' = no text)
//  - Otherwise use the post's Hook, word-safely truncated to the aspect cap
//  - If neither, fall back to the cover-art auto headline
export function resolveAdHeadline(
  postHook: string | null | undefined,
  founderOverride?: HeadlineOverride,
  aspect: AdAspect = "1:1",
): HeadlineOverride {
  const cap = HEADLINE_CAP[aspect] ?? 60;
  if (founderOverride?.mode === "none") return { mode: "none" };
  if (founderOverride?.mode === "custom" && founderOverride.text?.trim()) {
    return { mode: "custom", text: truncateHeadline(founderOverride.text, cap) };
  }
  const hook = truncateHeadline(postHook || "", cap);
  if (hook) return { mode: "custom", text: hook };
  return { mode: "auto" };
}


export function buildContentAdPrompt(args: {
  aspect: AdAspect;
  direction: ArtDirectionId;
  kit: Kit;
  ctx: any;
  plan: CanvasPlan;
  post: {
    id?: string | null;
    pillar?: string | null;
    platform?: string | null;
    format?: string | null;
    hook?: string | null;
    body?: string | null;
    cta?: string | null;
    asset_notes?: string | null;
  };
  hasLogoImage?: boolean;
  retryNote?: string;
  userFeedback?: string;
  variationSeed?: string;
  headlineOverride?: HeadlineOverride;
  logoZone?: { widthPct: number; heightPct: number; corner: "top-left" | "bottom-right" | "center" };
  serverRenderedHeadline?: boolean;
  posterLayout?: string;
}): string {
  const { aspect, post } = args;
  const asset = specForAspect(aspect);
  const resolvedHeadline = resolveAdHeadline(post.hook, args.headlineOverride, aspect);


  // Post-specific brief appended as extra art-direction context.
  const postBrief = [
    `\n## AD CONTENT BRIEF (governs the scene mood — subordinate to Scene Directive and Canvas plan)`,
    post.pillar && `- Content pillar: ${post.pillar}`,
    post.platform && `- Target platform: ${post.platform}`,
    post.format && `- Post format: ${post.format}`,
    post.cta && `- Underlying call-to-action (do NOT render as text on the canvas — this is context only): ${post.cta}`,
    post.asset_notes && `- Asset notes from the calendar: ${post.asset_notes}`,
    post.body && `- Caption context (do NOT render on canvas — background context only): ${String(post.body).slice(0, 400)}`,
  ].filter(Boolean).join("\n");

  const reserved = args.posterLayout === "centered-plate"
    ? "the CENTER third of the canvas"
    : "the BOTTOM 45% of the canvas";
  const posterBrief = `
## EDITORIAL POSTER PHOTOGRAPHY (highest priority after brand palette)
This image is the photographic plate of a magazine-quality poster. All typography is typeset
server-side afterwards — render ZERO letters, numerals, glyphs, signage, captions or watermarks.
- Treat it as one cinematic, single-subject photograph: real people or real environments, natural
  light (golden hour, window light, or soft overcast), shallow depth of field, filmic grain.
- Composition must leave ${reserved} as calm, low-detail negative space (sky, wall, water, table,
  shadow, or soft bokeh) so display type can sit there legibly. Do not center the subject there.
- No collage, no illustration, no 3D render, no flat vector shapes, no UI mockups, no stock-photo
  clichés (handshakes in suits, thumbs-up, generic laptops on white desks).
- Colour grade the photograph toward the brand palette; avoid saturated colours outside it.
- Keep the far bottom-right corner quiet — a small vector mark is composited there. Do not paint any
  box, plate, chip, badge or panel anywhere on the image.`;


  const base = buildCoverArtPrompt({
    platform: post.platform || "Social",
    asset,
    direction: args.direction,
    kit: args.kit,
    ctx: args.ctx,
    plan: args.plan,
    hasLogoImage: args.hasLogoImage,
    retryNote: args.retryNote,
    userFeedback: args.userFeedback,
    variationSeed: args.variationSeed,
    headlineOverride: resolvedHeadline,
    logoZone: args.logoZone,
    serverRenderedHeadline: args.serverRenderedHeadline,
    sceneSignal: {
      // Stable per-post discriminator so retries land on the same scene; add
      // the variationSeed so "regenerate" rotates to a fresh scene.
      discriminator: `${post.id ?? "post"}|${aspect}|${args.variationSeed ?? ""}`,
      pillar: post.pillar,
      format: post.format,
      assetNotes: post.asset_notes,
    },
  });

  return `${base}\n${postBrief}\n${posterBrief}\n`;
}

// Re-export for callers that need to know the finally-rendered headline text.
export function resolveFinalAdHeadline(
  postHook: string | null | undefined,
  founderOverride?: HeadlineOverride,
  aspect: AdAspect = "1:1",
): { text: string; suppress: boolean } {
  const r = resolveAdHeadline(postHook, founderOverride, aspect);
  if (r.mode === "none") return { text: "", suppress: true };
  if (r.mode === "custom") return { text: r.text || "", suppress: false };
  return { text: "", suppress: false };
}

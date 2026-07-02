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

// Per-aspect soft caps for the on-image headline. Longer aspects afford more.
const HEADLINE_CAP: Record<AdAspect, number> = { "1:1": 60, "4:5": 70, "9:16": 80 };

// Word-safe truncator: cap length, then back off to the last whole-word boundary
// so headlines never get chopped mid-word ("It's not th"). Adds an ellipsis only
// when we actually removed content.
export function truncateHeadline(raw: string, cap: number): string {
  const s = (raw || "").trim().replace(/\s+/g, " ");
  if (s.length <= cap) return s;
  const hard = s.slice(0, cap);
  // Prefer breaking on the last space in the hard slice; fall back to the hard cut.
  const lastSpace = hard.lastIndexOf(" ");
  const stem = lastSpace >= Math.floor(cap * 0.5) ? hard.slice(0, lastSpace) : hard;
  // Strip trailing punctuation before appending the ellipsis for a clean read.
  return stem.replace(/[\s,;:.!?\-–—(]+$/g, "") + "…";
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
  });

  return `${base}\n${postBrief}\n`;
}

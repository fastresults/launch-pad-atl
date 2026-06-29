// Builds an agency-grade cover art prompt that fuses locked brand kit
// (palette roles, typography, voice, logo) with venture context.

import type { AssetSpec, ArtDirectionId } from "./social-platform-specs.ts";

type Kit = {
  palette?: any;
  typography?: any;
  voice?: any;
  logos?: any[];
  dna?: any;
};

const DIRECTION_BRIEF: Record<ArtDirectionId, string> = {
  editorial:
    "EDITORIAL direction. Magazine-grade type-led layout. One bold headline using the heading typeface, set tight and confident. 60%+ negative space. Subtle rule lines allowed. No photography, no illustration of objects. Composition feels like a Wallpaper* or Kinfolk spread.",
  photographic:
    "PHOTOGRAPHIC direction. Single cinematic photo-real subject relevant to this venture, shallow depth of field, natural light. Apply a soft duotone overlay tinted toward the brand primary color. No type overlays unless the asset is a thumbnail or pinned card.",
  geometric:
    "GEOMETRIC direction. Bauhaus discipline. Bold flat shapes (circles, arcs, rectangles) composed from EXACTLY two brand palette colors plus the background. No gradients. No outlines. Confident asymmetry. Optional small type lockup.",
  illustrative:
    "ILLUSTRATIVE direction. Flat vector illustration in brand colors of a single concept that represents the venture. No gradients. No stock-AI tropes. Clean line work, generous negative space, custom-feeling.",
};

const UNIVERSAL_RULES = `
COMPOSITION & QUALITY RULES (non-negotiable):
- One dominant focal element. Generous negative space. Reject clutter.
- Use AT MOST two colors from the brand palette plus background. Never use all roles.
- Reserve a safe inset (>=8% of shortest side) free of critical content for platform UI overlays.
- Logo placement: leave a clean rectangular zone in a non-focal corner so the venture's logo can be composited later. Do NOT redraw or invent a logo.
- Forbidden: gradients-by-default, emoji, neon swirls, generic "tech mesh", abstract glowing orbs, fake screenshots, watermarks, text artifacts, stock-AI clichés, ANY readable text other than the single approved headline (if specified for the direction).
- If text is rendered, it must use the brand heading typeface family and meet WCAG AA contrast against the background.
- Output must look like a senior agency art director made it, not a stock generator.
`;

function paletteBlock(kit: Kit) {
  const c = kit?.palette?.colors ?? {};
  const lines = Object.entries(c)
    .filter(([, v]) => typeof v === "string")
    .map(([k, v]) => `  - ${k}: ${v}`)
    .join("\n");
  return lines || "  (no palette locked)";
}

function typoBlock(kit: Kit) {
  const t = kit?.typography ?? {};
  const h = t.heading?.family ?? "—";
  const b = t.body?.family ?? "—";
  return `  - Heading: ${h}\n  - Body: ${b}`;
}

function logoBlock(kit: Kit) {
  const logos = Array.isArray(kit?.logos) ? kit!.logos! : [];
  const primary = logos.find((l: any) => l?.is_primary) ?? logos[0];
  if (!primary) return "  (no logo uploaded)";
  return `  - Primary logo present (do not redraw). Treat the venture as already having this mark; leave room for it.`;
}

function ventureBlock(ctx: any) {
  const brain = ctx?.brain ?? {};
  const name = brain?.identity?.company_name ?? ctx?.snap?.company_name ?? "the venture";
  const oneLiner = brain?.identity?.one_liner ?? "";
  const customer = brain?.customer ?? "";
  const diff = (brain?.differentiators ?? []).slice(0, 3).join("; ");
  return [
    `  - Name: ${name}`,
    oneLiner && `  - One-liner: ${oneLiner}`,
    customer && `  - Customer: ${customer}`,
    diff && `  - Differentiators: ${diff}`,
  ].filter(Boolean).join("\n");
}

export function buildCoverArtPrompt(args: {
  platform: string;
  asset: AssetSpec;
  direction: ArtDirectionId;
  kit: Kit;
  ctx: any;
}): string {
  const { platform, asset, direction, kit, ctx } = args;
  const brief = DIRECTION_BRIEF[direction];
  const palette = paletteBlock(kit);
  const typo = typoBlock(kit);
  const logo = logoBlock(kit);
  const venture = ventureBlock(ctx);
  const dims = `${asset.width}x${asset.height} (${asset.guidance})`;

  return `You are an award-winning senior art director at a top creative agency producing a launch-grade ${platform} ${asset.label} for the brand below.

## Locked brand kit (authoritative — use these EXACT colors and typefaces, no substitutions)
Palette roles:
${palette}
Typography:
${typo}
Logo:
${logo}

## Venture context
${venture}

## Asset spec
  - Platform: ${platform}
  - Asset: ${asset.label}
  - Target dimensions: ${dims}

## Art direction
${brief}
${UNIVERSAL_RULES}

Deliver a single finished image that an agency would ship to a paying client today.`;
}

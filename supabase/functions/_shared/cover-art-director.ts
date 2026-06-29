// Builds an agency-grade cover art prompt that fuses the LOCKED brand kit
// (palette roles, typography, voice, logo) with venture context.
// Designed to be paired with multimodal image input: the caller passes the
// primary logo PNG to the image model so it composes around the actual mark
// rather than redrawing one.

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
    "EDITORIAL — Magazine-grade type-led layout in the tradition of Wallpaper*, Apartamento, It's Nice That, and Pentagram editorial work. ONE confident headline set in the brand heading family, tight tracking, ranged left. ≥60% negative space. Optional 1px rule lines, a small folio mark, an italic deck. No photography, no illustration of objects, no decorative flourishes. The composition should look like a printed spread, not a web banner.",
  photographic:
    "PHOTOGRAPHIC — One cinematic, photo-real subject relevant to this venture, in the tradition of Annie Leibovitz editorial, Joe McNally environmental portraits, or Steve McCurry — natural light, shallow depth of field, real-camera physics. Apply a subtle duotone graded toward the brand primary. NO type overlay unless the spec explicitly requires a headline. Avoid stock-people-smiling-at-laptop tropes, avoid HDR, avoid AI-skin shine.",
  geometric:
    "GEOMETRIC — Bauhaus Dessau / Sagmeister / Paula Scher discipline. Bold flat shapes (circles, arcs, rectangles, triangles) using EXACTLY two palette roles plus the background. No gradients, no outlines, no drop shadows. Confident asymmetry, mathematical alignment. The composition should read as a printed poster.",
  illustrative:
    "ILLUSTRATIVE — Flat custom vector illustration in the tradition of Malika Favre, Christoph Niemann, or Tom Froese. Single conceptual image that represents the venture, two-tone or three-tone using only the locked palette, clean closed shapes, no gradients, no textures, generous negative space. Avoid generic 'tech illustration' people, avoid isometric tropes.",
};

const BANNED = `
HARD BANS (any of these = failure, regenerate without it):
- Generic AI tropes: "tech mesh", glowing orbs, neon swirls, abstract data lines, particle clouds, holographic anything.
- Fake screenshots, fake UI, fake app mockups, fake dashboards.
- Watermarks, signature glyphs, copyright marks, made-up logos.
- ANY readable text other than the single approved headline (when the asset spec calls for one). No tagline. No URL. No "Lorem". No gibberish letterforms.
- Isometric office workers, stock smiling founders, handshake cliches, lightbulbs, rocket ships, puzzle pieces.
- Heavy gradients, drop shadows, bevels, lens flares, glossy reflections.
- Reproductions or redraws of the attached logo. The attached logo is placed by us, not redrawn by you.
`;

const QUALITY = `
QUALITY BAR (an award jury would accept this):
- One dominant focal element. ≥60% negative space.
- Use AT MOST two palette roles + the background. Never use all roles at once.
- Typography (when present) must use the brand heading family, tight tracking, real type hierarchy, optical alignment.
- WCAG AA contrast (≥4.5:1) between any text and its background.
- Crisp edges, no AI-blur, no muddy color, no halftone artifacts.
- Looks like work from Pentagram, Collins, Mother NY, Order, or Wolff Olins — not a stock generator.
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
  return `  - Heading family: ${h}\n  - Body family: ${b}`;
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

function headlineFor(ctx: any): string {
  const brain = ctx?.brain ?? {};
  return (
    brain?.identity?.tagline ||
    brain?.identity?.one_liner ||
    ctx?.snap?.tagline ||
    ctx?.snap?.one_liner ||
    ""
  ).slice(0, 64);
}

// ------- Per-asset composition systems -------

function assetSystem(asset: AssetSpec, hasLogoImage: boolean, headline: string): string {
  const kind = asset.kind;
  const ratio = `${asset.width}:${asset.height}`;

  if (kind === "avatar") {
    return `AVATAR SYSTEM
- The attached image #1 is the venture's official logo. Place it perfectly centered, occupying ~70% of the canvas shortest side.
- Background: a single flat color drawn from the brand palette (prefer 'bg' if it contrasts with the logo; otherwise 'primary' or 'fg' — whichever yields ≥4.5:1 contrast against the logo's dominant ink).
- No additional shapes, type, gradients, or decorations. Just the logo on color.
- Logo pixels MUST be preserved — do not stylize, recolor, redraw, crop, or distort the mark.
- Output a perfect square at ${asset.width}x${asset.height}.`;
  }

  if (kind === "banner" || kind === "header" || kind === "channel_art") {
    return `BANNER / HEADER SYSTEM (${ratio})
- Treat the canvas as a 12-column print grid. Critical content lives in columns 2–8 (left-anchored); columns 9–12 stay quiet for platform UI overlap.
- Reserve a clean rectangular zone in a non-focal corner (bottom-right or upper-right) for our logo composite — do NOT place the attached logo into the image; just leave room.
- If a headline is rendered, use the brand heading family, set ranged left, max two lines, headline candidate: "${headline || "(use venture name only)"}".
- Strict safe inset of 8% on all sides — no critical content in the bleed.
- ${asset.guidance}`;
  }

  if (kind === "thumbnail" || kind === "video_poster" || kind === "vertical_pin") {
    return `THUMBNAIL / POSTER SYSTEM (${ratio})
- One bold focal subject occupies the upper two-thirds. Headline (3–5 words) anchors the lower third, set in the brand heading family.
- High contrast — readable as a 240px-wide thumbnail in a feed.
- Headline candidate: "${headline || "(use venture name)"}". Trim to fit.
- ${asset.guidance}`;
  }

  // pinned_post, story_cover, etc.
  return `POST / COVER SYSTEM (${ratio})
- Treat as a single editorial frame. One focal element, ≥60% negative space.
- Optional type lockup uses the brand heading family.
- Reserve an 8% safe inset on all sides for platform UI.
- ${asset.guidance}`;
}

// ------- Public builders -------

export function buildCoverArtPrompt(args: {
  platform: string;
  asset: AssetSpec;
  direction: ArtDirectionId;
  kit: Kit;
  ctx: any;
  hasLogoImage?: boolean;
}): string {
  const { platform, asset, direction, kit, ctx, hasLogoImage = true } = args;
  const brief = DIRECTION_BRIEF[direction];
  const palette = paletteBlock(kit);
  const typo = typoBlock(kit);
  const venture = ventureBlock(ctx);
  const headline = headlineFor(ctx);
  const system = assetSystem(asset, hasLogoImage, headline);
  const dims = `${asset.width}x${asset.height} (${asset.guidance})`;

  const references = hasLogoImage
    ? `## Attached reference images (authoritative — honor exactly)
- Image #1: the venture's official logo. Use its colors and forms as-is. Do NOT redraw. For non-avatar assets, leave clean rectangular space so we can composite this exact logo on top later.
- Image #2 (if present): brand palette swatch tile — these are the ONLY colors permitted in the composition.
- Image #3 (if present): brand typography specimen — match this typographic voice if you render any text.`
    : `## Reference imagery
- No logo file was uploaded; do NOT invent a logo. Compose around a clean reserved rectangle in a non-focal corner.`;

  return `You are an award-winning senior art director at Pentagram / Collins / Mother NY shipping a launch-day ${platform} ${asset.label} for the venture below. Anything that wouldn't pass a creative director's desk on a paying client engagement is unacceptable.

${references}

## Locked brand kit (authoritative — exact colors, exact typefaces, no substitutions)
Palette roles:
${palette}
Typography:
${typo}

## Venture context
${venture}

## Asset spec
  - Platform: ${platform}
  - Asset: ${asset.label}
  - Target dimensions: ${dims}

## Composition system
${system}

## Art direction
${brief}
${QUALITY}
${BANNED}

Deliver a single finished image at the spec'd aspect that a senior art director would ship to a paying client today.`;
}

// Deterministic prompt used specifically for avatars when paired with the
// uploaded logo as image #1. Image generator must preserve the logo's pixels.
export function buildAvatarPrompt(args: {
  platform: string;
  asset: AssetSpec;
  kit: Kit;
}): string {
  const { platform, asset, kit } = args;
  const palette = kit?.palette?.colors ?? {};
  const bg = palette.bg || palette.background || "#FFFFFF";
  const primary = palette.primary || palette.accent || "#111111";
  return `You are placing the venture's official logo (attached as image #1) onto a profile avatar for ${platform}.

NON-NEGOTIABLE:
- PRESERVE THE LOGO PIXELS EXACTLY. Do not redraw, recolor, restyle, crop, distort, or "improve" the logo. Treat it as a placed asset.
- Center the logo on a perfectly square canvas at ${asset.width}x${asset.height}.
- The logo occupies ~70% of the canvas shortest side, with even padding on all four sides.
- Background: a single flat solid color selected from the brand palette below for maximum contrast with the logo. Prefer ${bg}; if the logo is light or near-white, use ${primary} instead. No gradients, no patterns, no shadows, no glow, no decorations, no text.

Brand palette (use exactly one of these as the solid background):
${Object.entries(palette).map(([k, v]) => `  - ${k}: ${v}`).join("\n")}

Output a single PNG: the logo, exactly as provided, centered on the chosen solid background.`;
}

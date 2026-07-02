// Builds an agency-grade cover art prompt that fuses the LOCKED brand kit
// (palette roles, typography, voice, logo) with venture context.
// Designed to be paired with multimodal image input: the caller passes the
// primary logo PNG to the image model so it composes around the actual mark
// rather than redrawing one.

import type { AssetSpec, ArtDirectionId } from "./social-platform-specs.ts";
import type { CanvasPlan } from "./canvas-plan.ts";

type Kit = {
  palette?: any;
  typography?: any;
  voice?: any;
  logos?: any[];
  dna?: any;
};

const DIRECTION_BRIEF: Record<ArtDirectionId, string> = {
  editorial:
    "EDITORIAL — Magazine-grade type-led layout in the tradition of Wallpaper*, Apartamento, It's Nice That, and Pentagram editorial work. ONE confident headline set in the brand heading family, tight tracking, ranged left. ≥55% negative space. The brand signature color anchors the composition as a confident solid block, full-bleed sidebar, folio stripe, or large flat mark — never a hairline. Optional 1px rule lines and a small folio mark. No photography, no illustration of objects. The composition should look like a printed spread.",
  photographic:
    "PHOTOGRAPHIC — One cinematic, photo-real subject relevant to this venture, in the tradition of Annie Leibovitz editorial, Joe McNally environmental portraits, or Steve McCurry — natural light, shallow depth of field, real-camera physics. Apply a confident duotone grade pushed toward the brand SIGNATURE color: the duotone midtones MUST read clearly as the signature hue, not as neutral gray. If the subject is monochrome, add a confident signature-colored gradient wash or a flat signature color block behind the subject covering ≥25% of the canvas. The final image, viewed at thumbnail size, must not be mistakable for grayscale. NO type overlay unless the spec explicitly requires a headline. Avoid stock-people-smiling-at-laptop tropes, avoid HDR, avoid AI-skin shine.",
  geometric:
    "GEOMETRIC — Bauhaus Dessau / Sagmeister / Paula Scher discipline. Bold flat shapes (circles, arcs, rectangles, triangles). At least one major focal shape is filled with the brand SIGNATURE color and occupies a substantial portion of the canvas. No gradients, no outlines, no drop shadows. Confident asymmetry, mathematical alignment.",
  illustrative:
    "ILLUSTRATIVE — Flat custom vector illustration in the tradition of Malika Favre, Christoph Niemann, or Tom Froese. Single conceptual image that represents the venture, two-tone or three-tone using only the locked palette. At least one major shape uses the SIGNATURE color as fill — not as a thin outline. Clean closed shapes, no gradients, no textures, generous negative space.",
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
- Dark text on dark surfaces. Light text on light surfaces. ANY foreground/background pair below 4.5:1 contrast.
- Using a color that is not one of: surface, ink, signature, or accent from the canvas plan.
- Composition with NO visible signature color, or where signature is reduced to a hairline / 1px stroke / barely-there mark = failure.
- If the final image, viewed at 240px thumbnail size, could be mistaken for grayscale or for a 2-color black-and-white render, it is a failure.
`;


const QUALITY = `
QUALITY BAR (an award jury would accept this):
- One dominant focal element. ≥55% negative space.
- Use ONLY the four hex colors named in the canvas plan: surface (background), ink (text/marks), signature (the brand hue — MUST be visibly present as a confident shape/block/wash in its exact named hex), and accent (one supporting color, used sparingly).
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

function ventureBlock(ctx: any, headlineOverride?: HeadlineOverride) {
  const brain = ctx?.brain ?? {};
  const name = brain?.identity?.company_name ?? ctx?.snap?.company_name ?? "the venture";
  const oneLiner = brain?.identity?.one_liner ?? "";
  const customer = brain?.customer ?? "";
  const diff = (brain?.differentiators ?? []).slice(0, 3).join("; ");
  // When the founder is overriding the on-image headline (custom or none),
  // do NOT show competing copy to the model — it will render the one-liner
  // instead of the requested custom text.
  const hideCopy = headlineOverride?.mode === "custom" || headlineOverride?.mode === "none";
  return [
    `  - Name: ${name}`,
    !hideCopy && oneLiner && `  - One-liner: ${oneLiner}`,
    customer && `  - Customer: ${customer}`,
    diff && `  - Differentiators: ${diff}`,
  ].filter(Boolean).join("\n");
}


export type HeadlineOverride = { mode: "auto" | "custom" | "none"; text?: string };

export function autoHeadline(ctx: any): string {
  const brain = ctx?.brain ?? {};
  return (
    brain?.identity?.tagline ||
    brain?.identity?.one_liner ||
    ctx?.snap?.tagline ||
    ctx?.snap?.one_liner ||
    ""
  ).slice(0, 64);
}


// Resolves the final headline to render on the image.
// Returns { text, suppress } — when suppress=true the composition must be
// rendered with zero glyphs anywhere on the canvas.
export function resolveHeadline(
  ctx: any,
  override?: HeadlineOverride,
): { text: string; suppress: boolean } {
  if (override?.mode === "none") return { text: "", suppress: true };
  if (override?.mode === "custom") {
    return { text: (override.text || "").trim().slice(0, 64), suppress: false };
  }
  return { text: autoHeadline(ctx), suppress: false };
}

// ------- Per-asset composition systems -------



function assetSystem(
  asset: AssetSpec,
  hasLogoImage: boolean,
  headline: string,
  suppressHeadline: boolean,
  isCustomHeadline: boolean,
  logoZone?: { widthPct: number; heightPct: number; corner: "top-left" | "bottom-right" | "center" },
): string {
  const kind = asset.kind;
  const ratio = `${asset.width}:${asset.height}`;

  const suppressBlock = `- HEADLINE POLICY (STRICT): DO NOT render any headline, tagline, subhead, URL, callout, sticker, or lettering anywhere on the canvas. Zero glyphs. Zero words. Zero numbers. The composition must work as a pure image plus the reserved logo zone only.`;
  const verbatimNote = (h: string) =>
    isCustomHeadline
      ? `- HEADLINE (verbatim, exact wording, no substitutions, no rewrites, no punctuation changes): "${h}". Set in the brand heading family, ranged left, max two lines. This is the ONLY text permitted on the canvas apart from the reserved logo zone.`
      : `- If a headline is rendered, use the brand heading family, set ranged left, max two lines, headline candidate: "${h || "(use venture name only)"}".`;

  // Compose a size-aware reserved-zone directive when the compositor has
  // told us exactly how much canvas the logo will occupy.
  const zone = (defaultCorner: "top-left" | "bottom-right", defaultW: number, defaultH: number) => {
    const w = logoZone?.widthPct ?? defaultW;
    const h = logoZone?.heightPct ?? defaultH;
    const corner = (logoZone?.corner === "center" ? defaultCorner : (logoZone?.corner ?? defaultCorner));
    return `- RESERVED LOGO ZONE: the ${corner} ~${w}% × ${h}% rectangle (with ~5% inset from both edges) MUST remain a completely clean, empty area filled with the surface color — no type, no shapes, no texture, no gradient, no detail. We will server-side composite the venture's actual logo into that exact area after generation. This zone is intentionally sized so the logo reads at a glance; do NOT shrink or crowd it. Compose the rest of the canvas so the reserved rectangle reads as intentional negative space, not as a hole.
- Do NOT redraw, recreate, or paint the logo yourself anywhere on the canvas.`;
  };

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
${zone("bottom-right", 16, 16)}
${suppressHeadline ? suppressBlock : verbatimNote(headline)}
- Strict safe inset of 8% on all sides — no critical content in the bleed.
- ${asset.guidance}`;
  }

  if (kind === "thumbnail" || kind === "video_poster" || kind === "vertical_pin") {
    return `THUMBNAIL / POSTER SYSTEM (${ratio})
- One bold focal subject occupies the upper two-thirds.${suppressHeadline ? " Composition must resolve without any text lockup." : " Headline (3–5 words) anchors the lower third, set in the brand heading family."}
${zone("top-left", 22, 22)}
- High contrast — readable as a 240px-wide thumbnail in a feed.
${suppressHeadline ? suppressBlock : `- HEADLINE (${isCustomHeadline ? "verbatim, exact wording, no substitutions" : "candidate"}): "${headline || "(use venture name)"}". Trim to fit${isCustomHeadline ? " ONLY by wrapping — never by rephrasing" : ""}.`}
- ${asset.guidance}`;
  }

  // pinned_post, story_cover, etc.
  return `POST / COVER SYSTEM (${ratio})
- Treat as a single editorial frame. One focal element, ≥60% negative space.
${suppressHeadline ? suppressBlock : "- Optional type lockup uses the brand heading family." + (isCustomHeadline ? ` HEADLINE (verbatim, exact wording): "${headline}". Do not rephrase.` : "")}
${zone("top-left", 24, 24)}
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
  plan: CanvasPlan;
  hasLogoImage?: boolean;
  retryNote?: string;
  userFeedback?: string;
  variationSeed?: string;
  headlineOverride?: HeadlineOverride;
}): string {
  const { platform, asset, direction, kit, ctx, plan, hasLogoImage = true, retryNote, userFeedback, variationSeed, headlineOverride } = args;
  const brief = DIRECTION_BRIEF[direction];
  const palette = paletteBlock(kit);
  const typo = typoBlock(kit);
  const { text: headline, suppress: suppressHeadline } = resolveHeadline(ctx, headlineOverride);
  const isCustomHeadline = headlineOverride?.mode === "custom" && !!headline;
  const venture = ventureBlock(ctx, headlineOverride);
  const system = assetSystem(asset, hasLogoImage, headline, suppressHeadline, isCustomHeadline);
  const dims = `${asset.width}x${asset.height} (${asset.guidance})`;

  // Auto-derived tagline the model must NOT paint when the founder has taken
  // manual control of the on-image text.
  const autoTag = autoHeadline(ctx);
  const primaryTextObjective = isCustomHeadline
    ? `\n## PRIMARY TEXT OBJECTIVE (READ FIRST — OVERRIDES ALL OTHER COPY GUIDANCE)\nThe ONLY lettering permitted anywhere on this canvas is the exact string:\n    "${headline}"\nRender it verbatim. No substitutions. No rewrites. No punctuation changes. No additional words, subheads, taglines, URLs, hashtags, or captions.\nFORBIDDEN TEXT: do NOT render "${autoTag}" or any paraphrase, translation, abbreviation, or restatement of it anywhere on the canvas.\n`
    : suppressHeadline
    ? `\n## PRIMARY TEXT OBJECTIVE (READ FIRST — OVERRIDES ALL OTHER COPY GUIDANCE)\nZERO lettering on this canvas. No headline, no tagline, no subhead, no URL, no callout, no caption, no watermark. Zero glyphs. Zero words. Zero numbers.\nFORBIDDEN TEXT: do NOT render "${autoTag}" or any paraphrase of it.\n`
    : "";


  const forbiddenLines = plan.forbiddenPairs.slice(0, 6).map(
    (p) => `  - Never place ${p.fg} on ${p.bg} (only ${p.ratio}:1 — illegible).`,
  ).join("\n") || "  - (none flagged)";

  const references = hasLogoImage
    ? `## Attached reference images (authoritative — honor exactly)
- Image #1: the venture's official logo. Use its colors and forms as-is. Do NOT redraw. For non-avatar assets, leave clean rectangular space so we can composite this exact logo on top later.
- Image #2: the canvas palette tile. The FOUR colors in this tile (surface, ink, signature, accent) are the ONLY colors permitted in the composition. No other colors. No tints. No gradients between them.`
    : `## Reference imagery
- No logo file was uploaded; do NOT invent a logo. Compose around a clean reserved rectangle in a non-focal corner.`;

  const feedbackBlock = userFeedback && userFeedback.trim()
    ? `\n## Founder feedback on the previous version (BINDING — honor every note)\nThe founder reviewed the last render and said:\n"""${userFeedback.trim().slice(0, 600)}"""\nTreat this as binding art-direction notes from the client. Apply every note unless it would violate the canvas plan or contrast rules above (those always win).\n`
    : "";

  const retryBlock = retryNote
    ? `\n## Previous attempt was rejected\n${retryNote}\nDo NOT repeat that mistake.\n`
    : "";

  return `You are an award-winning senior art director at Pentagram / Collins / Mother NY shipping a launch-day ${platform} ${asset.label} for the venture below. Anything that wouldn't pass a creative director's desk on a paying client engagement is unacceptable.

${references}
${primaryTextObjective}

## Canvas plan (NON-NEGOTIABLE — exactly these four hex values, used as specified)
- Background surface: ${plan.surface}  ← the entire background fills with this exact hex
- Ink (all text, logo marks, lines): ${plan.ink}  ← AA-legible on the surface
- SIGNATURE brand color (MUST be visibly present): ${plan.displaySignature}  ← cover ≥${plan.signatureMinCoveragePct}% of the canvas. Use this EXACT hex — do not darken it toward black, do not desaturate it toward gray.
- Accent (one supporting color, used sparingly): ${plan.accent}
- Brand signature INTENSITY: ${plan.signatureIntensity.toUpperCase()} (drives coverage target of ${plan.signatureMinCoveragePct}%)
- Brand signature PLACEMENT (${plan.signaturePlacement}): ${plan.signaturePlacementBrief} Never reduce the signature to a hairline, 1px stroke, or tiny dot.
- Forbidden pairings detected in this palette:
${forbiddenLines}

## Locked brand kit (for typography reference only — colors are governed by the canvas plan above)
Palette roles available in the brand kit (reference, not a license to use them all):
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
${feedbackBlock}${retryBlock}${variationSeed ? `\n## Variation seed\nSeed: ${variationSeed}. Use this to meaningfully vary composition, focal placement, and texture from any prior attempt while keeping every rule above.\n` : ""}
Deliver a single finished image at the spec'd aspect that a senior art director would ship to a paying client today. Background MUST be exactly ${plan.surface}. Any rendered glyphs, marks, or text MUST be exactly ${plan.ink}. The SIGNATURE color ${plan.displaySignature} MUST cover ≥${plan.signatureMinCoveragePct}% of the canvas as a confident shape (not a hairline). The only permitted secondary accent is ${plan.accent}. If the result reads as black-and-white at thumbnail size, you have failed.`;
}


// Deterministic avatar prompt: the surface color is decided server-side by
// measuring contrast against the logo's actual dominant ink, then passed in.
export function buildAvatarPrompt(args: {
  platform: string;
  asset: AssetSpec;
  surfaceHex: string;
  userFeedback?: string;
  retryNote?: string;
  variationSeed?: string;
}): string {
  const { platform, asset, surfaceHex, userFeedback, retryNote, variationSeed } = args;
  const feedbackBlock = userFeedback && userFeedback.trim()
    ? `\nFounder feedback on previous version (BINDING — apply unless it conflicts with logo preservation): """${userFeedback.trim().slice(0, 400)}"""\n`
    : "";
  const retryBlock = retryNote ? `\nRetry note: ${retryNote}\n` : "";
  const seedBlock = variationSeed ? `\nVariation seed: ${variationSeed} (vary subtle non-logo details across regenerations).\n` : "";
  return `You are placing the venture's official logo (attached as image #1) onto a profile avatar for ${platform}.

NON-NEGOTIABLE:
- PRESERVE THE LOGO PIXELS EXACTLY. Do not redraw, recolor, restyle, crop, distort, or "improve" the logo. Treat it as a placed asset.
- Center the logo on a perfectly square canvas at ${asset.width}x${asset.height}.
- The logo occupies ~70% of the canvas shortest side, with even padding on all four sides.
- Background: a single flat solid color, EXACTLY ${surfaceHex}. No gradients, no patterns, no shadows, no glow, no decorations, no text. This color was chosen server-side to guarantee maximum contrast against the logo — do not override it.
${feedbackBlock}${retryBlock}${seedBlock}
Output a single PNG: the logo, exactly as provided, centered on a solid ${surfaceHex} background.`;
}

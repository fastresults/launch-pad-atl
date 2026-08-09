// Editorial poster compositor. Layers the generated photograph, a soft gradient
// scrim (never an opaque band), a three-part type lockup rendered in real brand
// fonts, and the vector logo. Output is an SVG so text stays crisp at any size.
//
// Art direction rules enforced here:
//  1. Ink color and scrim strength are derived from the ACTUAL pixels behind
//     the type block, not from the brand plan, and must clear 4.5:1.
//  2. One margin scale (`safeInset`) drives left / right / bottom padding and
//     the logo inset, with a guaranteed gap between type and mark.
//  3. The logo is vector ink — recolored for contrast, never on a plate.

import type { CanvasPlan } from "./canvas-plan.ts";
import type { AdAspect } from "./content-ad-director.ts";
import { type LogoSize, buildVectorInkLogoPng } from "./logo-compositor.ts";
import { loadPosterFonts } from "./poster-fonts.ts";
import { PlateSampler, contrastOf, relLuminance } from "./plate-sample.ts";

export type PosterLayout = "bottom-scrim" | "centered-plate" | "edge-rule";

export const POSTER_LAYOUTS: { id: PosterLayout; label: string; blurb: string }[] = [
  { id: "bottom-scrim", label: "Bottom scrim", blurb: "Cinematic gradient, type anchored bottom-left" },
  { id: "centered-plate", label: "Centered plate", blurb: "Soft brand plate, type centered" },
  { id: "edge-rule", label: "Edge rule", blurb: "Accent rule at the left edge, type stacked" },
];

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type SvgArgs = {
  baseImageB64: string;
  /** Raw PNG bytes of the same plate — enables pixel sampling. */
  basePngBytes?: Uint8Array | null;
  baseMime?: string;
  width: number;
  height: number;
  plan: CanvasPlan;
  aspect: AdAspect;
  layout?: PosterLayout;
  kicker?: string | null;
  headline?: string | null;
  ctaLine?: string | null;
  /** Fallback raster logo (used only when the vector path is unavailable). */
  logoDataUrl?: string | null;
  /** Source SVG of the brand mark — preferred, recolored as vector ink. */
  logoSvgText?: string | null;
  logoBytes?: Uint8Array | null;
  logoAspect?: number | null;
  logoSize?: LogoSize;
  logoCorner?: "top-left" | "bottom-right";
  /** Share of canvas height reserved for the type band (campaign-level lock). */
  bandRatio?: number | null;

};

export type PosterMetrics = {
  headline_contrast: number | null;
  kicker_contrast: number | null;
  logo_contrast: number | null;
  logo_plate: false;
  logo_corner: Corner | null;
  logo_ink: string | null;
  ink: string | null;
  scrim_alpha: number | null;
  safe_inset_pct: number;
  sampled: boolean;
  /** number of rendered headline lines */
  headline_lines: number;
  /** false when copy had to be dropped to stay inside the safe area */
  headline_fits: boolean;
  /** widest rendered line as a % of the available text column */
  longest_line_pct: number | null;
  /** measured contrast of the CTA affordance */
  cta_contrast?: number | null;
  /** resolved type-band share of canvas height */
  band_ratio?: number | null;
  /** why the logo corner was chosen (saliency read) */
  logo_placement?: { edge: number; skin_pct: number; face_avoided: boolean } | null;

};


const enc = new TextEncoder();

function escapeXml(v: string): string {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function hex(v: string | null | undefined, fallback: string): string {
  const m = String(v || "").trim().match(/^#?([0-9a-fA-F]{6})$/);
  return m ? `#${m[1].toUpperCase()}` : fallback;
}

function rgb(h: string): [number, number, number] {
  const s = hex(h, "#0B0F19").slice(1);
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

function lum(h: string): number {
  const [r, g, b] = rgb(h);
  return relLuminance(r, g, b);
}

function contrast(a: string, b: string): number {
  return contrastOf(lum(a), lum(b));
}

/** Mean color after laying `alpha` of `overlay` over `base` rgb. */
function blendLum(base: [number, number, number], overlay: string, alpha: number): number {
  const o = rgb(overlay);
  const a = Math.max(0, Math.min(1, alpha));
  return relLuminance(
    base[0] * (1 - a) + o[0] * a,
    base[1] * (1 - a) + o[1] * a,
    base[2] * (1 - a) + o[2] * a,
  );
}

// ---------- type fitting ----------

function charUnits(s: string): number {
  let out = 0;
  for (const ch of s) {
    if (ch === " ") { out += 0.30; continue; }
    if (/[,.;:!|'’`]/.test(ch)) out += 0.26;
    else if (/[ilI1jt]/.test(ch)) out += 0.32;
    else if (/[mwMW]/.test(ch)) out += 0.92;
    else if (/[A-Z]/.test(ch)) out += 0.68;
    else out += 0.54;
  }
  return out;
}

// The estimator is approximate; bias it wide so its error can only make lines
// shorter than reality, never wider (a wide error is a clipped poster).
const WIDTH_SAFETY = 1.05;

function estWidth(s: string, size: number): number {
  return charUnits(s) * size * WIDTH_SAFETY;
}

/**
 * Break a token that cannot fit the column: first at existing hyphens / slashes
 * (so "Administrator-as-a-Service" splits cleanly), then character-by-character
 * as a last resort. Never returns a fragment wider than `maxW`.
 */
function splitLongToken(word: string, size: number, maxW: number): string[] {
  if (estWidth(word, size) <= maxW) return [word];
  const parts = word.split(/(?<=[-–—/])/).filter(Boolean);
  if (parts.length > 1) return parts.flatMap((p) => splitLongToken(p, size, maxW));
  const out: string[] = [];
  let cur = "";
  for (const ch of word) {
    if (cur && estWidth(cur + ch, size) > maxW) { out.push(cur); cur = ch; }
    else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

function wrap(text: string, size: number, maxW: number, maxLines: number): string[] | null {
  const tokens = text
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((w) => splitLongToken(w, size, maxW));
  const lines: string[] = [];
  let cur = "";
  for (const w of tokens) {
    const glue = cur && /[-–—/]$/.test(cur) ? "" : " ";
    const next = cur ? `${cur}${glue}${w}` : w;
    if (estWidth(next, size) <= maxW) cur = next;
    else {
      if (cur) lines.push(cur);
      if (lines.length >= maxLines) return null;
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (!lines.length || lines.length > maxLines) return null;
  return lines;
}

type Fitted = {
  lines: string[];
  size: number;
  lineHeight: number;
  /** false when the type had to be clamped and copy was dropped. */
  fits: boolean;
  /** widest rendered line as a percentage of the available column. */
  longestPct: number;
};

function longestPctOf(lines: string[], size: number, maxW: number): number {
  const widest = lines.reduce((m, l) => Math.max(m, estWidth(l, size)), 0);
  return Number(((widest / Math.max(1, maxW)) * 100).toFixed(1));
}

function fitDisplay(text: string, maxW: number, minDim: number, maxLines: number, maxBlockH: number): Fitted | null {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return null;
  const s = minDim / 1080;
  const max = Math.round(96 * s);
  const min = Math.round(30 * s);
  const floor = Math.max(12, Math.round(20 * s));

  // Editorial posters breathe: prefer a setting that leaves a margin of air at
  // the end of the longest line (and two lines over three) rather than the
  // largest size that merely fits inside the column.
  let widest: Fitted | null = null;   // biggest type that fits at all
  let relaxed: Fitted | null = null;  // fits with a little air (<=92%)
  let preferred: Fitted | null = null; // two lines, generous air (<=88%)
  const idealLines = Math.min(2, maxLines);

  for (let size = max; size >= min; size -= 2) {
    const lines = wrap(clean, size, maxW, maxLines);
    if (!lines) continue;
    const lineHeight = Math.round(size * 1.12);
    // Shrink the type before letting the block run past its height budget.
    if (lines.length * lineHeight > maxBlockH) continue;
    const cand: Fitted = { lines, size, lineHeight, fits: true, longestPct: longestPctOf(lines, size, maxW) };
    if (!widest) widest = cand;
    if (!relaxed && cand.longestPct <= 92) relaxed = cand;
    if (!preferred && cand.longestPct <= 88 && cand.lines.length <= idealLines) preferred = cand;
    if (preferred) break;
  }
  if (preferred || relaxed || widest) return preferred ?? relaxed ?? widest!;


  // Nothing fit at the comfortable range — keep shrinking, and allow one extra
  // line, before we ever consider dropping copy.
  for (let size = min - 1; size >= floor; size -= 1) {
    const lines = wrap(clean, size, maxW, maxLines + 1);
    if (!lines) continue;
    const lineHeight = Math.round(size * 1.12);
    if (lines.length * lineHeight > maxBlockH) continue;
    return { lines, size, lineHeight, fits: true, longestPct: longestPctOf(lines, size, maxW) };
  }

  // Last resort: typeset at the floor and clamp the number of lines. Every line
  // is still width-safe (splitLongToken guarantees it) — we drop copy rather
  // than draw anything past the margin, and flag the poster as not fitting.
  const lineHeight = Math.round(floor * 1.12);
  const heightCap = Math.max(1, Math.floor(maxBlockH / lineHeight));
  const all = wrap(clean, floor, maxW, 999) ?? [clean];
  const cap = Math.max(1, Math.min(maxLines + 1, heightCap));
  const lines = all.slice(0, cap);
  return {
    lines,
    size: floor,
    lineHeight,
    fits: lines.length === all.length,
    longestPct: longestPctOf(lines, floor, maxW),
  };
}

function maxHeadlineLines(aspect: AdAspect): number {
  return aspect === "1:1" ? 3 : 4;
}

/** Shrink a single-line element (kicker / CTA) until it clears the column. */
function fitSingleLine(text: string, baseSize: number, maxW: number, trackingEm = 0): number {
  if (!text) return baseSize;
  const widthAt = (s: number) => estWidth(text, s) + text.length * s * trackingEm;
  let size = baseSize;
  while (size > 8 && widthAt(size) > maxW) size -= 1;
  return size;
}



// ---------- margin scale ----------

/** One inset drives left, right, bottom and the logo. */
function safeInsetFor(W: number, H: number): number {
  const minDim = Math.min(W, H);
  const frac = H > W * 1.1 ? 0.08 : W > H * 1.1 ? 0.06 : 0.07;
  return Math.round(minDim * frac);
}

// ---------- type band ----------

/**
 * Share of canvas height reserved for the type lockup. Fixed per aspect so the
 * photographic brief and the compositor agree on the same reserved zone.
 */
export const BAND_RATIO: Record<AdAspect, number> = { "1:1": 0.38, "4:5": 0.42, "9:16": 0.34 };

/** Cap on the brand mark's height as a share of the short edge. */
const LOGO_HEIGHT_CAP: Record<AdAspect, number> = { "1:1": 0.11, "4:5": 0.09, "9:16": 0.09 };

// ---------- vertical rhythm ----------

const RHYTHM = {
  kickerToHead: 0.8, // × kicker size
  headToRule: 0.6, // × headline size
  ruleToCta: 1.1, // × cta size
};


// ---------- logo ----------

function logoBox(
  W: number,
  H: number,
  logoAspect: number,
  size: LogoSize,
  corner: Corner,
  inset: number,
  heightCapFrac = 0.11,
) {
  const tiers = { sm: { h: 0.085, w: 0.24, maxW: 0.38 }, md: { h: 0.12, w: 0.32, maxW: 0.48 }, lg: { h: 0.17, w: 0.42, maxW: 0.60 } } as const;
  const t = tiers[size || "sm"] ?? tiers.sm;
  const short = Math.min(W, H);
  const a = Math.max(0.2, logoAspect || 1);
  let boxW: number;
  let boxH: number;
  if (a >= 2) {
    boxW = Math.min(Math.round(short * t.w), Math.round(W * t.maxW));
    boxH = Math.max(1, Math.round(boxW / a));
  } else {
    boxH = Math.round(short * t.h);
    boxW = Math.round(boxH * a);
  }
  // A poster has one hero. The mark is a signature, never a second headline —
  // clamp it to a fixed share of the short edge regardless of the size tier.
  const capH = Math.round(short * heightCapFrac);
  const capW = Math.round(W * 0.30);
  if (boxH > capH) { boxH = capH; boxW = Math.max(1, Math.round(capH * a)); }
  if (boxW > capW) { boxW = capW; boxH = Math.max(1, Math.round(capW / a)); }
  const x = corner.endsWith("right") ? W - boxW - inset : inset;
  const y = corner.startsWith("bottom") ? H - boxH - inset : inset;
  return { x, y, boxW, boxH };
}


type Rect = { x: number; y: number; w: number; h: number };

function intersects(a: Rect, b: Rect, guard: number): boolean {
  return !(
    a.x + a.w + guard <= b.x ||
    b.x + b.w + guard <= a.x ||
    a.y + a.h + guard <= b.y ||
    b.y + b.h + guard <= a.y
  );
}

// ---------- compositor ----------

export async function buildContentAdSvgBytes(args: SvgArgs): Promise<{ bytes: Uint8Array; metrics: PosterMetrics }> {
  const W = Math.max(1, Math.round(args.width || 1080));
  const H = Math.max(1, Math.round(args.height || 1080));
  const minDim = Math.min(W, H);
  const layout: PosterLayout = args.layout ?? "bottom-scrim";
  const surface = hex(args.plan.surface, "#0B0F19");
  const planInk = hex(args.plan.ink, "#0B0F19");
  const signature = hex(args.plan.displaySignature || args.plan.signature, "#C29B46");
  const accent = hex(args.plan.accent, signature);
  const inset = safeInsetFor(W, H);

  const sampler = PlateSampler.from(args.basePngBytes, W, H);

  const metrics: PosterMetrics = {
    headline_contrast: null,
    kicker_contrast: null,
    logo_contrast: null,
    logo_plate: false,
    logo_corner: null,
    logo_ink: null,
    ink: null,
    scrim_alpha: null,
    safe_inset_pct: Number(((inset / minDim) * 100).toFixed(1)),
    sampled: sampler.available,
    headline_lines: 0,
    headline_fits: true,
    longest_line_pct: null,
  };


  const headlineText = (args.headline || "").trim();
  const kickerText = (args.kicker || "").trim();
  const ctaText = (args.ctaLine || "").trim();
  const hasType = !!(headlineText || kickerText || ctaText);

  const fonts = hasType ? await loadPosterFonts() : null;

  const mime = args.baseMime || "image/png";
  const imageHref = `data:${mime};base64,${args.baseImageB64}`;

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">`);
  if (fonts?.styleBlock) parts.push(fonts.styleBlock);

  const defs: string[] = [];
  parts.push(`<image href="${imageHref}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>`);

  let typeRect: Rect | null = null;

  if (hasType) {
    const centered = layout === "centered-plate";
    const ruleGutter = layout === "edge-rule" ? Math.round(minDim * 0.045) : 0;
    const textLeft = inset + ruleGutter;
    const textW = W - textLeft - inset;

    // Single-line elements shrink to the column rather than run past it.
    const kickerSize = fitSingleLine(kickerText.toUpperCase(), Math.round(minDim * 0.026), textW, 0.22);
    const ctaSize = fitSingleLine(ctaText, Math.round(minDim * 0.030), textW, 0.02);

    // The type band is a FIXED share of the canvas, matching the reserved zone
    // the photographic brief asked for. Sizing the band to the copy is what
    // produced a hard slab edge cutting through the subject.
    const bandRatio = args.bandRatio ?? BAND_RATIO[args.aspect] ?? 0.38;
    const bandH = Math.round(H * bandRatio);
    const maxBlockH = centered ? Math.round(H * 0.52) : Math.max(Math.round(minDim * 0.2), bandH - Math.round(inset * 1.4));

    // Budget the headline against the fixed-height elements around it.
    const fixedH =
      (kickerText ? Math.round(kickerSize * (1 + RHYTHM.kickerToHead)) : 0) +
      (ctaText ? Math.round(ctaSize * (1 + RHYTHM.ruleToCta)) + Math.round(ctaSize * 1.9) : 0);
    const head = headlineText
      ? fitDisplay(headlineText, textW, minDim, maxHeadlineLines(args.aspect), Math.max(minDim * 0.12, maxBlockH - fixedH))
      : null;

    if (head) {
      metrics.headline_lines = head.lines.length;
      metrics.headline_fits = head.fits;
      metrics.longest_line_pct = head.longestPct;
    }


    const headH = head ? head.lines.length * head.lineHeight : 0;
    const gapKicker = kickerText ? Math.round(kickerSize * RHYTHM.kickerToHead) : 0;
    const gapHeadCta = ctaText && head ? Math.round(head.size * RHYTHM.headToRule) : 0;
    const kickerH = kickerText ? kickerSize : 0;
    // The CTA is now a real affordance (outlined pill + chevron), not a caption.
    const ctaPillH = ctaText ? Math.round(ctaSize * 2.3) : 0;
    const blockH = kickerH + gapKicker + headH + gapHeadCta + ctaPillH;

    const blockTop = centered
      ? Math.round((H - blockH) / 2)
      : H - inset - blockH;
    typeRect = { x: centered ? inset : textLeft, y: blockTop, w: textW, h: blockH };

    // --- measured contrast: sample what is actually behind the type ---
    const sample = sampler.sample(typeRect.x, typeRect.y, typeRect.w, typeRect.h, W, H);
    const baseRgb: [number, number, number] = sample ? sample.rgb : rgb(surface);

    const WHITE = "#FFFFFF";
    const DARK = lum(planInk) < 0.28 ? planInk : "#0B0F19";

    // Try increasing overlay strengths until the winning ink clears 4.5:1.
    const steps = centered ? [0.72, 0.80, 0.88, 0.94] : [0.62, 0.74, 0.84, 0.92];
    let chosenAlpha = steps[0];
    let ink = WHITE;
    let bgLum = blendLum(baseRgb, surface, chosenAlpha);
    let best = 0;
    for (const a of steps) {
      const l = blendLum(baseRgb, surface, a);
      const cw = contrastOf(lum(WHITE), l);
      const cd = contrastOf(lum(DARK), l);
      const pick = cw >= cd ? WHITE : DARK;
      const ratio = Math.max(cw, cd);
      if (ratio > best) { best = ratio; chosenAlpha = a; ink = pick; bgLum = l; }
      if (ratio >= 4.5) break;
    }
    metrics.headline_contrast = Number(best.toFixed(2));
    metrics.ink = ink;
    metrics.scrim_alpha = Number(chosenAlpha.toFixed(2));

    // --- scrim / plate ---
    // Feathered ramp: the veil reaches full strength only at the very bottom
    // and dies to zero well above the type, so there is no perceptible edge.
    const scrimH = centered ? 0 : Math.min(H, Math.round(bandH * 1.55));
    const scrimStops: [number, number][] = [];
    if (!centered) {
      const k = chosenAlpha / 0.62;
      scrimStops.push(
        [0.00, Math.min(0.97, 0.94 * k)],
        [0.28, Math.min(0.95, 0.86 * k)],
        [0.52, Math.min(0.88, 0.62 * k)],
        [0.72, Math.min(0.66, 0.34 * k)],
        [0.88, Math.min(0.34, 0.13 * k)],
        [1.00, 0],
      );
    }
    /** Veil opacity at a canvas y, following the ramp above (0 outside it). */
    const alphaAtY = (yy: number): number => {
      if (centered) return chosenAlpha;
      if (!scrimH) return 0;
      const t = Math.max(0, Math.min(1, (H - yy) / scrimH));
      for (let i = 1; i < scrimStops.length; i++) {
        const [o0, a0] = scrimStops[i - 1];
        const [o1, a1] = scrimStops[i];
        if (t <= o1) {
          const f = o1 === o0 ? 0 : (t - o0) / (o1 - o0);
          return a0 + (a1 - a0) * f;
        }
      }
      return 0;
    };

    if (centered) {
      const plateW = Math.min(W - inset * 2, Math.round(W * 0.86));
      const plateH = Math.min(H - inset * 2, blockH + inset * 2);
      const plateX = Math.round((W - plateW) / 2);
      const plateY = Math.round((H - plateH) / 2);
      parts.push(
        `<rect x="${plateX}" y="${plateY}" width="${plateW}" height="${plateH}" rx="${Math.round(minDim * 0.012)}" fill="${surface}" opacity="${chosenAlpha.toFixed(2)}"/>`,
      );
    } else {
      defs.push(
        `<linearGradient id="scrim" x1="0" y1="1" x2="0" y2="0">` +
        scrimStops
          .map(([o, a]) => `<stop offset="${o}" stop-color="${surface}" stop-opacity="${a.toFixed(3)}"/>`)
          .join("") +
        `</linearGradient>`,
      );
      parts.push(`<rect x="0" y="${H - scrimH}" width="${W}" height="${scrimH}" fill="url(#scrim)"/>`);
      if (layout === "edge-rule") {
        const ruleW = Math.max(3, Math.round(minDim * 0.006));
        parts.push(`<rect x="${inset}" y="${blockTop}" width="${ruleW}" height="${blockH}" fill="${accent}" opacity="0.95"/>`);
      }
    }

    // --- per-line legibility: the kicker sits at the TOP of the block, where
    // the ramp is weakest, so judge it on its own pixels, not the block mean.
    let kickerColor = signature;
    if (kickerText) {
      const kRect = { x: typeRect.x, y: blockTop, w: textW, h: Math.round(kickerSize * 1.3) };
      const kSample = sampler.sample(kRect.x, kRect.y, kRect.w, kRect.h, W, H);
      const kBase: [number, number, number] = kSample ? kSample.rgb : baseRgb;
      const kAlpha = alphaAtY(blockTop + kickerSize * 0.5);
      let kLum = blendLum(kBase, surface, kAlpha);
      let kRatio = contrastOf(lum(signature), kLum);
      if (kRatio < 3) {
        // Lift the ramp locally rather than abandoning the brand gold.
        const lift = Math.min(0.9, Math.max(0.25, 0.72 - kAlpha));
        defs.push(
          `<linearGradient id="kickerLift" x1="0" y1="1" x2="0" y2="0">` +
          `<stop offset="0" stop-color="${surface}" stop-opacity="${lift.toFixed(3)}"/>` +
          `<stop offset="0.55" stop-color="${surface}" stop-opacity="${(lift * 0.6).toFixed(3)}"/>` +
          `<stop offset="1" stop-color="${surface}" stop-opacity="0"/>` +
          `</linearGradient>`,
        );
        const liftH = Math.round(kickerSize * 3.2);
        parts.push(`<rect x="0" y="${blockTop - Math.round(kickerSize * 1.6)}" width="${W}" height="${liftH}" fill="url(#kickerLift)"/>`);
        kLum = blendLum(kBase, surface, Math.min(0.95, kAlpha + lift));
        kRatio = contrastOf(lum(signature), kLum);
      }
      kickerColor = kRatio >= 3 ? signature : ink;
      metrics.kicker_contrast = Number((kRatio >= 3 ? kRatio : contrastOf(lum(ink), kLum)).toFixed(2));
    } else {
      metrics.kicker_contrast = Number(contrastOf(lum(signature), bgLum).toFixed(2));
    }

    const anchorX = centered ? Math.round(W / 2) : textLeft;
    const anchorAttr = centered ? ` text-anchor="middle"` : "";

    let y = blockTop;

    if (kickerText) {
      y += kickerSize;
      parts.push(
        `<text x="${anchorX}" y="${y}"${anchorAttr} fill="${kickerColor}" font-family="${fonts!.sansBoldFamily}" font-size="${kickerSize}" font-weight="700" letter-spacing="${(kickerSize * 0.22).toFixed(1)}">${escapeXml(kickerText.toUpperCase())}</text>`,
      );
      y += gapKicker;
    }

    if (head) {
      y += Math.round(head.size * 0.82);
      parts.push(
        `<text x="${anchorX}" y="${y}"${anchorAttr} fill="${ink}" font-family="${fonts!.serifFamily}" font-size="${head.size}" font-weight="700" letter-spacing="${(-head.size * 0.012).toFixed(2)}">` +
        head.lines.map((l, i) => `<tspan x="${anchorX}" dy="${i === 0 ? 0 : head.lineHeight}">${escapeXml(l)}</tspan>`).join("") +
        `</text>`,
      );
      y += (head.lines.length - 1) * head.lineHeight + Math.round(head.size * 0.30);
    }

    if (ctaText) {
      // Outlined pill + chevron: reads as an action, not a caption.
      const label = ctaText.toUpperCase();
      const padX = Math.round(ctaSize * 0.95);
      const padY = Math.round(ctaSize * 0.62);
      const track = ctaSize * 0.1;
      const labelW = Math.round(estWidth(label, ctaSize) + label.length * track);
      const chevW = Math.round(ctaSize * 0.9);
      const pillH = Math.round(ctaSize + padY * 2);
      const pillW = Math.min(textW, labelW + chevW + padX * 2 + Math.round(ctaSize * 0.4));
      const pillY = y + gapHeadCta;
      const pillX = centered ? Math.round((W - pillW) / 2) : textLeft;
      const cLum = blendLum(baseRgb, surface, alphaAtY(pillY + pillH / 2));
      const accentRatio = contrastOf(lum(accent), cLum);
      const ctaInk = accentRatio >= 3 ? accent : ink;
      parts.push(
        `<rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${Math.round(pillH / 2)}" fill="none" stroke="${ctaInk}" stroke-width="${Math.max(1.5, ctaSize * 0.055).toFixed(1)}" opacity="0.92"/>`,
      );
      const baselineY = pillY + Math.round(pillH / 2 + ctaSize * 0.36);
      parts.push(
        `<text x="${pillX + padX}" y="${baselineY}" fill="${ctaInk}" font-family="${fonts!.sansBoldFamily}" font-size="${Math.round(ctaSize * 0.86)}" font-weight="700" letter-spacing="${track.toFixed(2)}">${escapeXml(label)}</text>`,
      );
      const cx = pillX + pillW - padX - Math.round(chevW * 0.4);
      const cy = pillY + pillH / 2;
      const ch = Math.round(ctaSize * 0.3);
      parts.push(
        `<path d="M ${cx - ch} ${cy - ch} L ${cx} ${cy} L ${cx - ch} ${cy + ch}" fill="none" stroke="${ctaInk}" stroke-width="${Math.max(1.5, ctaSize * 0.075).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/>`,
      );
      metrics.cta_contrast = Number(Math.max(accentRatio, contrastOf(lum(ink), cLum)).toFixed(2));
    }

    metrics.band_ratio = centered ? null : Number(bandRatio.toFixed(3));
  }



  // ---------- logo: vector ink in the quietest legal corner ----------
  if (args.logoSvgText || args.logoBytes || args.logoDataUrl) {
    const size = args.logoSize || "sm";
    const aspect = args.logoAspect || 1;
    const capFrac = LOGO_HEIGHT_CAP[args.aspect] ?? 0.11;
    // Sit diagonally opposite the type lockup by default.
    const preferred: CornerId[] = args.logoCorner
      ? [args.logoCorner as CornerId]
      : layout === "centered-plate"
        ? ["top-right", "top-left", "bottom-right", "bottom-left"]
        : ["top-right", "top-left", "bottom-right", "bottom-left"];
    const candidates: CornerId[] = Array.from(
      new Set<CornerId>([...preferred, "top-right", "top-left", "bottom-right", "bottom-left"]),
    );

    const boxes = {} as Record<CornerId, { x: number; y: number; w: number; h: number }>;
    const collides: Partial<Record<CornerId, boolean>> = {};
    const contrastByCorner: Partial<Record<CornerId, number>> = {};
    const lumByCorner: Partial<Record<CornerId, number>> = {};
    const boxByCorner = {} as Record<CornerId, ReturnType<typeof logoBox>>;
    for (const corner of candidates) {
      const box = logoBox(W, H, aspect, size, corner as Corner, inset, capFrac);
      boxByCorner[corner] = box;
      boxes[corner] = { x: box.x, y: box.y, w: box.boxW, h: box.boxH };
      collides[corner] = typeRect
        ? intersects({ x: box.x, y: box.y, w: box.boxW, h: box.boxH }, typeRect, Math.round(inset * 0.6))
        : false;
      const stat = sampler.sample(box.x, box.y, box.boxW, box.boxH, W, H);
      const behind = stat ? stat.lum : lum(surface);
      lumByCorner[corner] = behind;
      contrastByCorner[corner] = Math.max(contrastOf(lum("#FFFFFF"), behind), contrastOf(lum(planInk), behind));
    }

    // Emptiness first, contrast second — and never on a face.
    const scores = scoreCorners({ sampler, W, H, boxes, collides, contrast: contrastByCorner, preferred });
    const pick = pickCorner(scores);
    const chosen = pick
      ? {
          corner: pick.corner as Corner,
          box: boxByCorner[pick.corner],
          lumBehind: lumByCorner[pick.corner] ?? lum(surface),
          score: pick.score,
        }
      : null;
    if (pick) {
      metrics.logo_placement = {
        edge: Number(pick.edge.toFixed(3)),
        skin_pct: Number(pick.skinPct.toFixed(3)),
        face_avoided: scores.some((s) => s.faceLikely),
      };
    }

    if (chosen) {

      const darkInk = lum(planInk) < 0.32 ? planInk : "#0B0F19";
      // Pick whichever ink actually reads on the pixels behind the mark.
      const whiteRatio = contrastOf(lum("#FFFFFF"), chosen.lumBehind);
      const darkRatio = contrastOf(lum(darkInk), chosen.lumBehind);
      let inkHex = whiteRatio >= darkRatio ? "#FFFFFF" : darkInk;
      let ratio = Math.max(whiteRatio, darkRatio);

      // Ads held a lower bar than covers: a 3.5:1 mark on a busy plate is a
      // smudge. Below 4.5:1 we lay a quiet brand plate and re-pick the ink.
      const MIN_LOGO_CONTRAST = 4.5;
      let plated = false;
      let plateColor = surface;
      if (ratio < MIN_LOGO_CONTRAST) {
        const plateFill = chosen.lumBehind < 0.5 ? surface : "#FFFFFF";
        const plateLum = lum(plateFill);
        const wOnPlate = contrastOf(lum("#FFFFFF"), plateLum);
        const dOnPlate = contrastOf(lum(darkInk), plateLum);
        inkHex = wOnPlate >= dOnPlate ? "#FFFFFF" : darkInk;
        ratio = Math.max(wOnPlate, dOnPlate);
        plated = true;
        plateColor = plateFill;
      }

      const built = await buildVectorInkLogoPng({
        svgText: args.logoSvgText ?? null,
        bytes: args.logoBytes ?? null,
        inkHex,
        targetWidthPx: chosen.box.boxW,
      });
      const href = built?.dataUrl ?? args.logoDataUrl ?? null;
      if (href) {
        // Re-derive the box from the trimmed mark so the inset stays optical.
        const finalBox = logoBox(W, H, built?.aspect ?? aspect, size, chosen.corner, inset, capFrac);
        if (plated) {
          const pad = Math.round(inset * 0.4);
          parts.push(
            `<rect x="${finalBox.x - pad}" y="${finalBox.y - pad}" width="${finalBox.boxW + pad * 2}" height="${finalBox.boxH + pad * 2}" rx="${Math.round(minDim * 0.008)}" fill="${plateColor}" opacity="0.88"/>`,
          );
        }
        parts.push(
          `<image href="${escapeXml(href)}" x="${finalBox.x}" y="${finalBox.y}" width="${finalBox.boxW}" height="${finalBox.boxH}" preserveAspectRatio="xMidYMid meet"/>`,
        );
        metrics.logo_corner = chosen.corner;
        metrics.logo_ink = built ? inkHex : null;
        metrics.logo_contrast = Number(ratio.toFixed(2));
        (metrics as any).logo_plate = plated;
      }
    }

  }

  if (defs.length) parts.splice(fonts?.styleBlock ? 2 : 1, 0, `<defs>${defs.join("")}</defs>`);
  parts.push(`</svg>`);
  return { bytes: enc.encode(parts.join("")), metrics };
}

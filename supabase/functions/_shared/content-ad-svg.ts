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

  for (let size = max; size >= min; size -= 2) {
    const lines = wrap(clean, size, maxW, maxLines);
    if (!lines) continue;
    const lineHeight = Math.round(size * 1.12);
    // Shrink the type before letting the block run past its height budget.
    if (lines.length * lineHeight > maxBlockH) continue;
    return { lines, size, lineHeight, fits: true, longestPct: longestPctOf(lines, size, maxW) };
  }

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

  return aspect === "1:1" ? 3 : 4;
}

// ---------- margin scale ----------

/** One inset drives left, right, bottom and the logo. */
function safeInsetFor(W: number, H: number): number {
  const minDim = Math.min(W, H);
  const frac = H > W * 1.1 ? 0.08 : W > H * 1.1 ? 0.06 : 0.07;
  return Math.round(minDim * frac);
}

// ---------- vertical rhythm ----------

const RHYTHM = {
  kickerToHead: 0.8, // × kicker size
  headToRule: 0.6, // × headline size
  ruleToCta: 1.1, // × cta size
};

// ---------- logo ----------

function logoBox(W: number, H: number, logoAspect: number, size: LogoSize, corner: Corner, inset: number) {
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
    const maxBlockH = Math.round(H * 0.52);

    // Budget the headline against the fixed-height elements around it.
    const fixedH =
      (kickerText ? Math.round(kickerSize * (1 + RHYTHM.kickerToHead)) : 0) +
      (ctaText ? Math.round(ctaSize * (1 + RHYTHM.ruleToCta)) + Math.max(2, Math.round(minDim * 0.0025)) : 0);
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
    const gapHeadRule = ctaText && head ? Math.round(head.size * RHYTHM.headToRule) : 0;
    const ruleH = ctaText && !centered ? Math.max(2, Math.round(minDim * 0.0025)) : 0;
    const gapRuleCta = ctaText ? Math.round(ctaSize * RHYTHM.ruleToCta) : 0;
    const kickerH = kickerText ? kickerSize : 0;
    const ctaH = ctaText ? Math.round(ctaSize * 1.2) : 0;
    const blockH = kickerH + gapKicker + headH + gapHeadRule + ruleH + gapRuleCta + ctaH;

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

    // Kicker stays gold only when the gold itself is legible.
    const kickerRatio = contrastOf(lum(signature), bgLum);
    const kickerColor = kickerRatio >= 3 ? signature : ink;
    metrics.kicker_contrast = Number((kickerRatio >= 3 ? kickerRatio : contrastOf(lum(ink), bgLum)).toFixed(2));

    // --- scrim / plate ---
    if (centered) {
      const plateW = Math.min(W - inset * 2, Math.round(W * 0.86));
      const plateH = Math.min(H - inset * 2, blockH + inset * 2);
      const plateX = Math.round((W - plateW) / 2);
      const plateY = Math.round((H - plateH) / 2);
      parts.push(
        `<rect x="${plateX}" y="${plateY}" width="${plateW}" height="${plateH}" rx="${Math.round(minDim * 0.012)}" fill="${surface}" opacity="${chosenAlpha.toFixed(2)}"/>`,
      );
    } else {
      const k = chosenAlpha / 0.62;
      const s0 = Math.min(0.97, 0.92 * k);
      const s1 = Math.min(0.94, 0.62 * k);
      const s2 = Math.min(0.72, 0.16 * k);
      defs.push(
        `<linearGradient id="scrim" x1="0" y1="1" x2="0" y2="0">` +
        `<stop offset="0" stop-color="${surface}" stop-opacity="${s0.toFixed(3)}"/>` +
        `<stop offset="0.42" stop-color="${surface}" stop-opacity="${s1.toFixed(3)}"/>` +
        `<stop offset="0.78" stop-color="${surface}" stop-opacity="${s2.toFixed(3)}"/>` +
        `<stop offset="1" stop-color="${surface}" stop-opacity="0"/>` +
        `</linearGradient>`,
      );
      const scrimH = Math.min(Math.round(H * 0.82), blockH + inset * 3);
      parts.push(`<rect x="0" y="${H - scrimH}" width="${W}" height="${scrimH}" fill="url(#scrim)"/>`);
      if (layout === "edge-rule") {
        const ruleW = Math.max(3, Math.round(minDim * 0.006));
        parts.push(`<rect x="${inset}" y="${blockTop}" width="${ruleW}" height="${blockH}" fill="${accent}" opacity="0.95"/>`);
      }
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
      let cursor = y + gapHeadRule;
      if (ruleH) {
        parts.push(
          `<rect x="${anchorX}" y="${cursor}" width="${Math.round(minDim * 0.075)}" height="${ruleH}" fill="${accent}" opacity="0.9"/>`,
        );
        cursor += ruleH;
      }
      cursor += gapRuleCta + ctaSize;
      parts.push(
        `<text x="${anchorX}" y="${cursor}"${anchorAttr} fill="${ink}" font-family="${fonts!.sansFamily}" font-size="${ctaSize}" font-weight="500" opacity="0.94" letter-spacing="${(ctaSize * 0.02).toFixed(2)}">${escapeXml(ctaText)}</text>`,
      );
    }
  }

  // ---------- logo: vector ink in the quietest legal corner ----------
  if (args.logoSvgText || args.logoBytes || args.logoDataUrl) {
    const size = args.logoSize || "sm";
    const aspect = args.logoAspect || 1;
    const preferred: Corner[] = args.logoCorner
      ? [args.logoCorner as Corner]
      : ["bottom-right", "top-right", "top-left", "bottom-left"];
    const candidates: Corner[] = Array.from(
      new Set<Corner>([...preferred, "top-right", "top-left", "bottom-right", "bottom-left"]),
    );

    let chosen: { corner: Corner; box: ReturnType<typeof logoBox>; lumBehind: number; score: number } | null = null;
    for (const corner of candidates) {
      const box = logoBox(W, H, aspect, size, corner, inset);
      const rect: Rect = { x: box.x, y: box.y, w: box.boxW, h: box.boxH };
      const collides = typeRect ? intersects(rect, typeRect, Math.round(inset * 0.6)) : false;
      const stat = sampler.sample(box.x, box.y, box.boxW, box.boxH, W, H);
      const behind = stat ? stat.lum : lum(surface);
      const busy = stat ? stat.variance / 255 : 0.3;
      const bestInkContrast = Math.max(contrastOf(lum("#FFFFFF"), behind), contrastOf(lum(planInk), behind));
      const score = (collides ? -100 : 0) + bestInkContrast - busy * 4;
      if (!chosen || score > chosen.score) chosen = { corner, box, lumBehind: behind, score };
    }

    if (chosen) {
      const darkInk = lum(planInk) < 0.32 ? planInk : "#0B0F19";
      const inkHex = chosen.lumBehind < 0.5 ? "#FFFFFF" : darkInk;
      const ratio = contrastOf(lum(inkHex), chosen.lumBehind);
      const built = await buildVectorInkLogoPng({
        svgText: args.logoSvgText ?? null,
        bytes: args.logoBytes ?? null,
        inkHex,
        targetWidthPx: chosen.box.boxW,
      });
      const href = built?.dataUrl ?? args.logoDataUrl ?? null;
      if (href) {
        // Re-derive the box from the trimmed mark so the inset stays optical.
        const finalBox = logoBox(W, H, built?.aspect ?? aspect, size, chosen.corner, inset);
        parts.push(
          `<image href="${escapeXml(href)}" x="${finalBox.x}" y="${finalBox.y}" width="${finalBox.boxW}" height="${finalBox.boxH}" preserveAspectRatio="xMidYMid meet"/>`,
        );
        metrics.logo_corner = chosen.corner;
        metrics.logo_ink = built ? inkHex : null;
        metrics.logo_contrast = Number(ratio.toFixed(2));
      }
    }
  }

  if (defs.length) parts.splice(fonts?.styleBlock ? 2 : 1, 0, `<defs>${defs.join("")}</defs>`);
  parts.push(`</svg>`);
  return { bytes: enc.encode(parts.join("")), metrics };
}

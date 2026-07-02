import type { CanvasPlan } from "./canvas-plan.ts";
import type { AdAspect } from "./content-ad-director.ts";
import type { LogoSize } from "./logo-compositor.ts";

type SvgArgs = {
  baseImageB64: string;
  baseMime?: string;
  width: number;
  height: number;
  plan: CanvasPlan;
  aspect: AdAspect;
  headline?: string | null;
  logoDataUrl?: string | null;
  logoAspect?: number | null;
  logoSize?: LogoSize;
  logoCorner?: "top-left" | "bottom-right";
  logoChip?: boolean;
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
  const [r, g, b] = rgb(h).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const L1 = lum(a), L2 = lum(b);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

// Base band % (2-line target). Grown dynamically by fitHeadline for longer titles.
function baseBandPct(aspect: AdAspect): number {
  if (aspect === "9:16") return 0.16;
  if (aspect === "4:5") return 0.20;
  return 0.22;
}

function maxBandPct(aspect: AdAspect): number {
  if (aspect === "9:16") return 0.32;
  if (aspect === "4:5") return 0.40;
  return 0.42;
}

function aspectMaxLines(aspect: AdAspect): number {
  if (aspect === "9:16") return 5;
  return 4;
}

// Tiered length classification. Returns target line count based on character length.
function targetLinesForLength(len: number, aspect: AdAspect): number {
  const cap = aspectMaxLines(aspect);
  if (len <= 28) return 1;
  if (len <= 55) return Math.min(2, cap);
  if (len <= 90) return Math.min(3, cap);
  return cap;
}

// Font size range per line-count tier (based on 1080px canvas; scaled by minDim).
function sizeRangeForTier(targetLines: number, minDim: number): { min: number; max: number } {
  const s = minDim / 1080;
  if (targetLines <= 1) return { min: Math.round(60 * s), max: Math.round(104 * s) };
  if (targetLines === 2) return { min: Math.round(52 * s), max: Math.round(84 * s) };
  if (targetLines === 3) return { min: Math.round(42 * s), max: Math.round(68 * s) };
  return { min: Math.round(32 * s), max: Math.round(54 * s) };
}

function charUnits(s: string): number {
  let out = 0;
  for (const ch of s) {
    if (ch === " ") { out += 0.38; continue; }
    if (/[,.;:!|'’`]/.test(ch)) out += 0.28;
    else if (/[ilI1]/.test(ch)) out += 0.34;
    else if (/[mwMW]/.test(ch)) out += 0.95;
    else if (/[A-Z]/.test(ch)) out += 0.72;
    else out += 0.62;
  }
  return out;
}

function estimatedWidth(s: string, size: number): number {
  return charUnits(s) * size;
}

function wrap(words: string[], size: number, maxW: number, maxL: number): string[] | null {
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    // If a single word is wider than the canvas at this size, this size fails.
    if (estimatedWidth(w, size) > maxW) return null;
    const next = cur ? `${cur} ${w}` : w;
    if (estimatedWidth(next, size) <= maxW) {
      cur = next;
    } else {
      if (cur) lines.push(cur);
      if (lines.length >= maxL) return null;
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (!lines.length || lines.length > maxL) return null;
  for (const line of lines) {
    if (estimatedWidth(line, size) > maxW * 0.98) return null;
  }
  return lines;
}

// Fit the full headline — never truncate. Escalates through line-count tiers,
// growing the band as needed, until the entire string fits.
function fitHeadline(text: string, W: number, H: number, aspect: AdAspect) {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return null;
  const x = Math.round(W * 0.075);
  const bandY = Math.round(H * 0.035);
  const textW = W - x * 2 - Math.round(W * 0.02);
  const words = clean.split(/\s+/).filter(Boolean);
  const minDim = Math.min(W, H);
  const capLines = aspectMaxLines(aspect);
  const startTier = targetLinesForLength(clean.length, aspect);
  const maxBandH = Math.round(H * maxBandPct(aspect));

  // Try each tier from length-implied target up to the aspect cap.
  for (let tier = startTier; tier <= capLines; tier += 1) {
    const range = sizeRangeForTier(tier, minDim);
    // Grow band to comfortably hold `tier` lines.
    const growPct = baseBandPct(aspect) + Math.max(0, tier - 2) * 0.05;
    const bandH = Math.min(maxBandH, Math.round(H * growPct));
    const textH = Math.round(bandH * 0.72);
    for (let size = range.max; size >= range.min; size -= 2) {
      const lines = wrap(words, size, textW, tier);
      if (!lines) continue;
      const lineHeight = Math.round(size * 1.08);
      if (lines.length * lineHeight <= textH) {
        return { lines, size, lineHeight, x, bandY, bandH, textH };
      }
    }
  }

  // Last-resort emergency shrink at max tier — still no truncation.
  const tier = capLines;
  const bandH = maxBandH;
  const textH = Math.round(bandH * 0.78);
  const emergencyMin = Math.max(22, Math.round(24 * (minDim / 1080)));
  const emergencyMax = sizeRangeForTier(tier, minDim).min;
  for (let size = emergencyMax; size >= emergencyMin; size -= 1) {
    const lines = wrap(words, size, textW, tier);
    if (!lines) continue;
    const lineHeight = Math.round(size * 1.08);
    if (lines.length * lineHeight <= textH) {
      return { lines, size, lineHeight, x, bandY, bandH, textH };
    }
  }
  return null;
}


function logoBox(W: number, H: number, logoAspect: number, size: LogoSize, corner: "top-left" | "bottom-right") {
  const tiers = {
    sm: { h: 0.10, w: 0.28, maxW: 0.42, inset: 0.05 },
    md: { h: 0.14, w: 0.36, maxW: 0.52, inset: 0.05 },
    lg: { h: 0.20, w: 0.46, maxW: 0.66, inset: 0.05 },
  } as const;
  const t = tiers[size || "sm"] ?? tiers.sm;
  const short = Math.min(W, H);
  const aspect = Math.max(0.2, logoAspect || 1);
  let boxW: number;
  let boxH: number;
  if (aspect >= 2) {
    boxW = Math.min(Math.round(short * t.w), Math.round(W * t.maxW));
    boxH = Math.max(1, Math.round(boxW / aspect));
  } else {
    boxH = Math.round(short * t.h);
    boxW = Math.round(boxH * aspect);
  }
  const inset = Math.round(short * t.inset);
  const x = corner === "bottom-right" ? W - boxW - inset : inset;
  const y = corner === "bottom-right" ? H - boxH - inset : inset;
  return { x, y, boxW, boxH };
}

export function buildContentAdSvgBytes(args: SvgArgs): Uint8Array {
  const W = Math.max(1, Math.round(args.width || 1080));
  const H = Math.max(1, Math.round(args.height || 1080));
  const surface = hex(args.plan.surface, "#0B0F19");
  const preferredInk = hex(args.plan.ink, "#FFFFFF");
  const ink = contrast(preferredInk, surface) >= 4.5 ? preferredInk : contrast("#FFFFFF", surface) >= contrast("#0B0F19", surface) ? "#FFFFFF" : "#0B0F19";
  const signature = hex(args.plan.displaySignature || args.plan.signature, "#7C3AED");
  const headline = fitHeadline(args.headline || "", W, H, args.aspect);
  const mime = args.baseMime || "image/png";
  const imageHref = `data:${mime};base64,${args.baseImageB64}`;

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">`);
  parts.push(`<image href="${imageHref}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>`);

  if (headline) {
    const bandPadX = Math.round(W * 0.045);
    const bandH = Math.max(headline.bandH, Math.round(H * 0.18));
    const stripeH = Math.max(8, Math.round(H * 0.008));
    parts.push(`<rect x="0" y="0" width="${W}" height="${bandH}" fill="${surface}" opacity="0.96"/>`);
    parts.push(`<rect x="0" y="${bandH - stripeH}" width="${W}" height="${stripeH}" fill="${signature}"/>`);
    const totalTextH = headline.lines.length * headline.lineHeight;
    let y = Math.round(headline.bandY + (headline.textH - totalTextH) / 2 + headline.size * 0.86);
    parts.push(`<text x="${bandPadX + Math.round(W * 0.03)}" y="${y}" fill="${ink}" font-family="Arial, Helvetica, sans-serif" font-size="${headline.size}" font-weight="800" letter-spacing="0">`);
    for (let i = 0; i < headline.lines.length; i += 1) {
      const dy = i === 0 ? 0 : headline.lineHeight;
      parts.push(`<tspan x="${bandPadX + Math.round(W * 0.03)}" dy="${dy}">${escapeXml(headline.lines[i])}</tspan>`);
    }
    parts.push(`</text>`);
  }

  if (args.logoDataUrl) {
    const corner = args.logoCorner || "bottom-right";
    const box = logoBox(W, H, args.logoAspect || 1, args.logoSize || "sm", corner);
    const wantChip = args.logoChip ?? (corner === "bottom-right");
    if (wantChip) {
      const surfLum = lum(surface);
      let chipFill = "#FFFFFF";
      let chipOpacity = 0.92;
      if (surfLum > 0.7) {
        chipFill = ink === "#0B0F19" ? ink : "#0B0F19";
        chipOpacity = 0.88;
      } else if (surfLum >= 0.35) {
        chipFill = contrast("#FFFFFF", surface) >= contrast("#0B0F19", surface) ? "#FFFFFF" : "#0B0F19";
        chipOpacity = 0.9;
      }
      const padX = Math.round(box.boxW * 0.12);
      const padY = Math.round(box.boxH * 0.18);
      const rx = Math.round(box.boxH * 0.22);
      const cx = box.x - padX;
      const cy = box.y - padY;
      const cw = box.boxW + padX * 2;
      const ch = box.boxH + padY * 2;
      parts.push(`<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="${rx}" ry="${rx}" fill="${chipFill}" opacity="${chipOpacity}"/>`);
    }
    parts.push(`<image href="${escapeXml(args.logoDataUrl)}" x="${box.x}" y="${box.y}" width="${box.boxW}" height="${box.boxH}" preserveAspectRatio="xMidYMid meet"/>`);
  }

  parts.push(`</svg>`);
  return enc.encode(parts.join(""));
}
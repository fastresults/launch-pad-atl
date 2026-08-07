// Editorial poster compositor. Layers the generated photograph, a soft gradient
// scrim (never an opaque band), a three-part type lockup rendered in real brand
// fonts, and the vector logo. Output is an SVG so text stays crisp at any size.

import type { CanvasPlan } from "./canvas-plan.ts";
import type { AdAspect } from "./content-ad-director.ts";
import type { LogoSize } from "./logo-compositor.ts";
import { loadPosterFonts } from "./poster-fonts.ts";

export type PosterLayout = "bottom-scrim" | "centered-plate" | "edge-rule";

export const POSTER_LAYOUTS: { id: PosterLayout; label: string; blurb: string }[] = [
  { id: "bottom-scrim", label: "Bottom scrim", blurb: "Cinematic gradient, type anchored bottom-left" },
  { id: "centered-plate", label: "Centered plate", blurb: "Soft brand plate, type centered" },
  { id: "edge-rule", label: "Edge rule", blurb: "Accent rule at the left edge, type stacked" },
];

type SvgArgs = {
  baseImageB64: string;
  baseMime?: string;
  width: number;
  height: number;
  plan: CanvasPlan;
  aspect: AdAspect;
  layout?: PosterLayout;
  kicker?: string | null;
  headline?: string | null;
  ctaLine?: string | null;
  logoDataUrl?: string | null;
  logoAspect?: number | null;
  logoSize?: LogoSize;
  logoCorner?: "top-left" | "bottom-right";
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

function estWidth(s: string, size: number): number {
  return charUnits(s) * size;
}

function wrap(text: string, size: number, maxW: number, maxLines: number): string[] | null {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (estWidth(w, size) > maxW) return null;
    const next = cur ? `${cur} ${w}` : w;
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

function fitDisplay(text: string, maxW: number, minDim: number, maxLines: number) {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return null;
  const s = minDim / 1080;
  const max = Math.round(96 * s);
  const min = Math.round(34 * s);
  for (let size = max; size >= min; size -= 2) {
    const lines = wrap(clean, size, maxW, maxLines);
    if (lines) return { lines, size, lineHeight: Math.round(size * 1.12) };
  }
  const lines = wrap(clean, min, maxW, maxLines + 1) ?? [clean];
  return { lines, size: min, lineHeight: Math.round(min * 1.12) };
}

function maxHeadlineLines(aspect: AdAspect): number {
  return aspect === "1:1" ? 3 : 4;
}

// ---------- logo ----------

function logoBox(W: number, H: number, logoAspect: number, size: LogoSize, corner: "top-left" | "bottom-right") {
  const tiers = {
    sm: { h: 0.085, w: 0.24, maxW: 0.38, inset: 0.055 },
    md: { h: 0.12, w: 0.32, maxW: 0.48, inset: 0.055 },
    lg: { h: 0.17, w: 0.42, maxW: 0.60, inset: 0.055 },
  } as const;
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
  const inset = Math.round(short * t.inset);
  const x = corner === "bottom-right" ? W - boxW - inset : inset;
  const y = corner === "bottom-right" ? H - boxH - inset : inset;
  return { x, y, boxW, boxH };
}

// ---------- compositor ----------

export async function buildContentAdSvgBytes(args: SvgArgs): Promise<Uint8Array> {
  const W = Math.max(1, Math.round(args.width || 1080));
  const H = Math.max(1, Math.round(args.height || 1080));
  const minDim = Math.min(W, H);
  const layout: PosterLayout = args.layout ?? "bottom-scrim";
  const surface = hex(args.plan.surface, "#0B0F19");
  const signature = hex(args.plan.displaySignature || args.plan.signature, "#C29B46");
  const accent = hex(args.plan.accent, signature);

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

  // Gradient scrim definition — soft, never a hard band.
  parts.push(
    `<defs><linearGradient id="scrim" x1="0" y1="1" x2="0" y2="0">` +
    `<stop offset="0" stop-color="${surface}" stop-opacity="0.92"/>` +
    `<stop offset="0.42" stop-color="${surface}" stop-opacity="0.62"/>` +
    `<stop offset="0.78" stop-color="${surface}" stop-opacity="0.16"/>` +
    `<stop offset="1" stop-color="${surface}" stop-opacity="0"/>` +
    `</linearGradient></defs>`,
  );

  parts.push(`<image href="${imageHref}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>`);

  if (hasType) {
    const padX = Math.round(W * (layout === "edge-rule" ? 0.10 : 0.075));
    const textW = W - padX * 2;
    const head = headlineText ? fitDisplay(headlineText, textW, minDim, maxHeadlineLines(args.aspect)) : null;

    const kickerSize = Math.round(minDim * 0.026);
    const ctaSize = Math.round(minDim * 0.030);
    const gapKicker = kickerText ? Math.round(kickerSize * 2.0) : 0;
    const gapCta = ctaText ? Math.round(ctaSize * 2.6) : 0;
    const headH = head ? head.lines.length * head.lineHeight : 0;
    const blockH = gapKicker + headH + gapCta;

    // Ink is white over photography by default; flip if the plan surface is light.
    const light = lum(surface) > 0.62;
    const ink = light ? "#0B0F19" : "#FFFFFF";
    const kickerColor = contrast(signature, light ? "#FFFFFF" : "#000000") >= 2.2 ? signature : (light ? "#0B0F19" : "#FFFFFF");

    let blockTop: number;
    if (layout === "centered-plate") {
      const plateW = Math.round(W * 0.86);
      const plateH = Math.min(Math.round(H * 0.72), blockH + Math.round(minDim * 0.14));
      const plateX = Math.round((W - plateW) / 2);
      const plateY = Math.round((H - plateH) / 2);
      parts.push(`<rect x="${plateX}" y="${plateY}" width="${plateW}" height="${plateH}" rx="${Math.round(minDim * 0.012)}" fill="${surface}" opacity="0.72"/>`);
      blockTop = plateY + Math.round((plateH - blockH) / 2);
    } else {
      const scrimH = Math.min(Math.round(H * 0.82), blockH + Math.round(minDim * 0.28));
      parts.push(`<rect x="0" y="${H - scrimH}" width="${W}" height="${scrimH}" fill="url(#scrim)"/>`);
      blockTop = H - Math.round(minDim * 0.085) - blockH;
      if (layout === "edge-rule") {
        const ruleW = Math.max(3, Math.round(minDim * 0.006));
        parts.push(`<rect x="${Math.round(W * 0.048)}" y="${blockTop}" width="${ruleW}" height="${blockH}" fill="${accent}" opacity="0.95"/>`);
      }
    }

    const centered = layout === "centered-plate";
    const anchorX = centered ? Math.round(W / 2) : padX;
    const anchorAttr = centered ? ` text-anchor="middle"` : "";

    let y = blockTop;

    if (kickerText) {
      y += Math.round(kickerSize * 1.05);
      parts.push(
        `<text x="${anchorX}" y="${y}"${anchorAttr} fill="${kickerColor}" font-family="${fonts!.sansBoldFamily}" font-size="${kickerSize}" font-weight="700" letter-spacing="${(kickerSize * 0.22).toFixed(1)}">${escapeXml(kickerText.toUpperCase())}</text>`,
      );
      y += Math.round(kickerSize * 0.95);
    }

    if (head) {
      y += Math.round(head.size * 0.86);
      parts.push(
        `<text x="${anchorX}" y="${y}"${anchorAttr} fill="${ink}" font-family="${fonts!.serifFamily}" font-size="${head.size}" font-weight="700" letter-spacing="${(-head.size * 0.012).toFixed(2)}">` +
        head.lines.map((l, i) => `<tspan x="${anchorX}" dy="${i === 0 ? 0 : head.lineHeight}">${escapeXml(l)}</tspan>`).join("") +
        `</text>`,
      );
      y += (head.lines.length - 1) * head.lineHeight + Math.round(head.size * 0.28);
    }

    if (ctaText) {
      const ruleY = y + Math.round(ctaSize * 0.9);
      if (!centered) {
        parts.push(`<rect x="${anchorX}" y="${ruleY}" width="${Math.round(minDim * 0.075)}" height="${Math.max(2, Math.round(minDim * 0.0025))}" fill="${accent}" opacity="0.9"/>`);
      }
      const ctaY = ruleY + Math.round(ctaSize * 1.9);
      parts.push(
        `<text x="${anchorX}" y="${ctaY}"${anchorAttr} fill="${ink}" font-family="${fonts!.sansFamily}" font-size="${ctaSize}" font-weight="500" opacity="0.94" letter-spacing="${(ctaSize * 0.02).toFixed(2)}">${escapeXml(ctaText)}</text>`,
      );
    }
  }

  if (args.logoDataUrl) {
    const corner = args.logoCorner || "bottom-right";
    const box = logoBox(W, H, args.logoAspect || 1, args.logoSize || "sm", corner);
    parts.push(`<image href="${escapeXml(args.logoDataUrl)}" x="${box.x}" y="${box.y}" width="${box.boxW}" height="${box.boxH}" preserveAspectRatio="xMidYMid meet"/>`);
  }

  parts.push(`</svg>`);
  return enc.encode(parts.join(""));
}

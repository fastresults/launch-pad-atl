// Server-side logo compositor.
// Guarantees the user's selected brand logo appears on every generated social
// asset, regardless of what the image model produced. Chooses aspect-aware
// sizing (width-first for wordmarks, height-first for square/tall marks),
// prefers a direct composite for transparent PNGs, and otherwise draws a
// rounded-corner chip with a soft drop shadow whose surface color contrasts
// with the region behind it.
//
// Pure JS via imagescript — runs on the Supabase Edge runtime, no native deps.

import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";
import { rasterizeSvgMono } from "./logo-raster.ts";

export type LogoPlacement =
  | "avatar-center"
  | "banner-corner"
  | "post-lockup"
  | "thumbnail-lockup";

export type LogoSize = "sm" | "md" | "lg";

export function normalizeLogoSize(v: unknown): LogoSize {
  return v === "sm" || v === "lg" ? v : "md";
}

// Map a social-platform-specs AssetKind to a placement rule.
export function placementForAssetKind(kind: string): LogoPlacement {
  switch (kind) {
    case "avatar":
      return "avatar-center";
    case "banner":
    case "header":
    case "channel_art":
      return "banner-corner";
    case "thumbnail":
    case "video_poster":
    case "vertical_pin":
      return "thumbnail-lockup";
    // pinned_post, story_cover, post, cover, …
    default:
      return "post-lockup";
  }
}

// Per-size targets. Wordmarks (aspect >= 2) are driven from `widthFrac`,
// square/tall marks are driven from `heightFrac`. `maxWFrac` is a hard ceiling
// that never shrinks a wordmark below its height target.
type Tier = { heightFrac: number; widthFrac: number; maxWFrac: number; insetFrac: number };
const TIERS: Record<LogoSize, Tier> = {
  sm: { heightFrac: 0.10, widthFrac: 0.28, maxWFrac: 0.42, insetFrac: 0.05 },
  md: { heightFrac: 0.14, widthFrac: 0.36, maxWFrac: 0.52, insetFrac: 0.05 },
  lg: { heightFrac: 0.20, widthFrac: 0.46, maxWFrac: 0.66, insetFrac: 0.05 },
};

const WIDE_ASPECT = 2; // aspect >= 2 → treat as wordmark

// Canvas-aware reserved-zone hint. Derives the rectangle from the same
// targetBoxFor() logic the compositor uses, then converts to canvas
// percentages, so the prompt and the composite reference the same region.
export function logoSafeZone(
  placement: LogoPlacement,
  size: LogoSize,
  logoAspect: number,
  canvasW: number,
  canvasH: number,
  cornerOverride?: "top-left" | "bottom-right",
): { widthPct: number; heightPct: number; corner: "top-left" | "bottom-right" | "center" } {
  if (placement === "avatar-center") {
    return { widthPct: 78, heightPct: 78, corner: "center" };
  }
  const W = Math.max(1, canvasW);
  const H = Math.max(1, canvasH);
  const box = targetBoxFor(placement, W, H, Math.max(0.2, logoAspect), size, cornerOverride);
  const widthPct = Math.max(1, Math.round((box.w / W) * 100));
  const heightPct = Math.max(1, Math.round((box.h / H) * 100));
  const corner: "top-left" | "bottom-right" =
    cornerOverride ?? (placement === "banner-corner" ? "bottom-right" : "top-left");
  return { widthPct, heightPct, corner };
}

// Cheap aspect-ratio probe used by the prompt builder before compositing.
export async function readLogoAspect(logoBytes: Uint8Array | null | undefined): Promise<number | null> {
  if (!logoBytes || logoBytes.byteLength === 0) return null;
  try {
    const img = await Image.decode(logoBytes);
    return img.width / Math.max(1, img.height);
  } catch {
    return null;
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return { r: 11, g: 15, b: 25 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function rgbToImagescriptColor(r: number, g: number, b: number, a = 0xff): number {
  return ((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | (a & 0xff);
}

// Relative luminance (WCAG-style, 0..1) from sRGB.
function luminance(r: number, g: number, b: number): number {
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

// Aspect-aware chip target. `logoAspect` = logo.width / logo.height.
function targetBoxFor(
  placement: LogoPlacement,
  W: number,
  H: number,
  logoAspect: number,
  size: LogoSize,
  cornerOverride?: "top-left" | "bottom-right",
): { x: number; y: number; w: number; h: number; mode: "width-first" | "height-first" } {
  const short = Math.min(W, H);

  if (placement === "avatar-center") {
    const s = Math.floor(short * 0.78);
    return { x: Math.floor((W - s) / 2), y: Math.floor((H - s) / 2), w: s, h: s, mode: "width-first" };
  }

  const tier = TIERS[size];
  const aspect = Math.max(0.2, logoAspect);
  const wide = aspect >= WIDE_ASPECT;

  let boxW: number;
  let boxH: number;
  let mode: "width-first" | "height-first";

  if (wide) {
    // Width-first: size the wordmark by its width, then derive height.
    mode = "width-first";
    boxW = Math.min(Math.floor(short * tier.widthFrac), Math.floor(W * tier.maxWFrac));
    boxH = Math.max(1, Math.round(boxW / aspect));

    // Guarantee wordmarks still reach the tier's minimum readable height even
    // when the width clamp bites — take the max of the two candidates.
    const minH = Math.floor(short * tier.heightFrac * 0.75);
    if (boxH < minH) {
      boxH = minH;
      boxW = Math.min(Math.round(boxH * aspect), Math.floor(W * tier.maxWFrac));
    }
  } else {
    mode = "height-first";
    boxH = Math.floor(short * tier.heightFrac);
    boxW = Math.max(1, Math.round(boxH * aspect));
    const maxW = Math.floor(W * tier.maxWFrac);
    if (boxW > maxW) {
      boxW = maxW;
      // Do not push height below the tier's target.
      const minH = Math.floor(short * tier.heightFrac * 0.9);
      boxH = Math.max(minH, Math.round(boxW / aspect));
    }
  }

  // Safety ceiling: never let the chip take more than a third of the canvas.
  const maxH = Math.floor(short * 0.34);
  if (boxH > maxH) {
    boxH = maxH;
    boxW = Math.min(Math.max(1, Math.round(boxH * aspect)), Math.floor(W * tier.maxWFrac));
  }

  const inset = Math.floor(short * tier.insetFrac);
  const effectiveCorner: "top-left" | "bottom-right" =
    cornerOverride ?? (placement === "banner-corner" ? "bottom-right" : "top-left");
  if (effectiveCorner === "bottom-right") {
    return { x: W - boxW - inset, y: H - boxH - inset, w: boxW, h: boxH, mode };
  }
  return { x: inset, y: inset, w: boxW, h: boxH, mode };
}

// Fit logo into an outer box preserving aspect ratio; returns resized image +
// offset to center within the box. Inner padding is intentionally small so
// glyphs fill the readable region.
function fitInside(
  logo: Image,
  boxW: number,
  boxH: number,
  padPct: number,
): { img: Image; offX: number; offY: number } {
  const usableW = Math.max(1, Math.floor(boxW * (1 - padPct * 2)));
  const usableH = Math.max(1, Math.floor(boxH * (1 - padPct * 2)));
  const scale = Math.min(usableW / logo.width, usableH / logo.height);
  const newW = Math.max(1, Math.round(logo.width * scale));
  const newH = Math.max(1, Math.round(logo.height * scale));
  const resized = logo.clone().resize(newW, newH);
  const offX = Math.floor((boxW - newW) / 2);
  const offY = Math.floor((boxH - newH) / 2);
  return { img: resized, offX, offY };
}

// Detect whether the logo has meaningful transparency (transparent PNG).
function hasTransparency(logo: Image): boolean {
  // Sample a modest grid to avoid full-image scans on large logos.
  const cols = 24;
  const rows = 24;
  let transparentPixels = 0;
  let totalSampled = 0;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = Math.min(logo.width - 1, Math.floor((i + 0.5) * (logo.width / cols)));
      const y = Math.min(logo.height - 1, Math.floor((j + 0.5) * (logo.height / rows)));
      const px = logo.getPixelAt(x + 1, y + 1); // imagescript is 1-indexed
      const a = px & 0xff;
      totalSampled++;
      if (a < 250) transparentPixels++;
    }
  }
  return transparentPixels / Math.max(1, totalSampled) > 0.05;
}

// Average luminance of a region on the base canvas.
function avgLuminance(base: Image, x: number, y: number, w: number, h: number): number {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(base.width, Math.floor(x + w));
  const y1 = Math.min(base.height, Math.floor(y + h));
  const stepX = Math.max(1, Math.floor((x1 - x0) / 16));
  const stepY = Math.max(1, Math.floor((y1 - y0) / 16));
  let sum = 0;
  let n = 0;
  for (let py = y0; py < y1; py += stepY) {
    for (let px = x0; px < x1; px += stepX) {
      const p = base.getPixelAt(px + 1, py + 1);
      const r = (p >>> 24) & 0xff;
      const g = (p >>> 16) & 0xff;
      const b = (p >>> 8) & 0xff;
      sum += luminance(r, g, b);
      n++;
    }
  }
  return n === 0 ? 0.5 : sum / n;
}

// Paint a solid rounded rectangle into `dst`, clipping corners with radius `r`.
function fillRoundedRect(dst: Image, color: number, r: number): void {
  const w = dst.width;
  const h = dst.height;
  const rr = Math.max(0, Math.min(r, Math.floor(Math.min(w, h) / 2)));
  const r2 = rr * rr;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let inside = true;
      if (x < rr && y < rr) {
        const dx = rr - x - 1;
        const dy = rr - y - 1;
        if (dx * dx + dy * dy > r2) inside = false;
      } else if (x >= w - rr && y < rr) {
        const dx = x - (w - rr);
        const dy = rr - y - 1;
        if (dx * dx + dy * dy > r2) inside = false;
      } else if (x < rr && y >= h - rr) {
        const dx = rr - x - 1;
        const dy = y - (h - rr);
        if (dx * dx + dy * dy > r2) inside = false;
      } else if (x >= w - rr && y >= h - rr) {
        const dx = x - (w - rr);
        const dy = y - (h - rr);
        if (dx * dx + dy * dy > r2) inside = false;
      }
      if (inside) dst.setPixelAt(x + 1, y + 1, color);
    }
  }
}

// Cheap soft-shadow: draw a slightly larger dark rounded rect, offset down,
// with low alpha. Not a Gaussian blur but reads as a soft shadow at thumbnail
// sizes and is O(area) with no extra deps.
function paintShadow(
  base: Image,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  radius: number,
): void {
  const spread = Math.max(3, Math.round(Math.min(boxW, boxH) * 0.06));
  const offsetY = Math.max(2, Math.round(spread * 0.6));
  const shadowW = boxW + spread * 2;
  const shadowH = boxH + spread * 2;
  const layer = new Image(shadowW, shadowH);
  // Two passes at low alpha to soften the edge slightly.
  const passes = [
    { inset: 0, alpha: 40, radius: radius + spread },
    { inset: Math.floor(spread / 2), alpha: 55, radius: radius + Math.floor(spread / 2) },
  ];
  for (const pass of passes) {
    const layerPass = new Image(shadowW - pass.inset * 2, shadowH - pass.inset * 2);
    fillRoundedRect(layerPass, rgbToImagescriptColor(0, 0, 0, pass.alpha), pass.radius);
    layer.composite(layerPass, pass.inset, pass.inset);
  }
  base.composite(layer, boxX - spread, boxY - spread + offsetY);
}

// --- Mark preparation ------------------------------------------------------
// A vector mark must arrive as ink on transparency. Marks exported with a
// baked white plate get that plate knocked out here, then the bitmap is
// trimmed to its ink bounding box so no dead margin ships with the logo.
function knockoutAndTrim(logo: Image): Image {
  const w = logo.width;
  const h = logo.height;
  const corner = logo.getPixelAt(1, 1);
  const cr = (corner >>> 24) & 0xff;
  const cg = (corner >>> 16) & 0xff;
  const cb = (corner >>> 8) & 0xff;
  const ca = corner & 0xff;
  const near = (r: number, g: number, b: number) =>
    Math.abs(r - cr) < 14 && Math.abs(g - cg) < 14 && Math.abs(b - cb) < 14;

  const out = logo.clone();
  if (ca > 250) {
    for (let y = 1; y <= h; y++) {
      for (let x = 1; x <= w; x++) {
        const p = out.getPixelAt(x, y);
        const r = (p >>> 24) & 0xff;
        const g = (p >>> 16) & 0xff;
        const b = (p >>> 8) & 0xff;
        if (near(r, g, b)) out.setPixelAt(x, y, rgbToImagescriptColor(r, g, b, 0));
      }
    }
  }

  let minX = w, minY = h, maxX = 1, maxY = 1;
  for (let y = 1; y <= h; y++) {
    for (let x = 1; x <= w; x++) {
      if ((out.getPixelAt(x, y) & 0xff) > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX <= minX || maxY <= minY) return out;
  return out.clone().crop(minX - 1, minY - 1, maxX - minX + 1, maxY - minY + 1);
}

// Repaint every visible pixel in one hex, preserving alpha (knockout mark).
function tintMark(logo: Image, hex: string): Image {
  const { r, g, b } = hexToRgb(hex);
  const out = logo.clone();
  for (let y = 1; y <= out.height; y++) {
    for (let x = 1; x <= out.width; x++) {
      const a = out.getPixelAt(x, y) & 0xff;
      if (a > 0) out.setPixelAt(x, y, rgbToImagescriptColor(r, g, b, a));
    }
  }
  return out;
}

// Soft radial falloff behind the mark — no rectangle, no hard edge. Used only
// when the knockout still lacks contrast against a busy region.
function paintRadialScrim(base: Image, cx: number, cy: number, radius: number, dark: boolean): void {
  const r2 = radius * radius;
  const x0 = Math.max(0, Math.floor(cx - radius));
  const x1 = Math.min(base.width - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const y1 = Math.min(base.height - 1, Math.ceil(cy + radius));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const t = 1 - Math.sqrt(d2) / radius;
      const strength = Math.pow(t, 1.6) * 0.55;
      const p = base.getPixelAt(x + 1, y + 1);
      const pr = (p >>> 24) & 0xff;
      const pg = (p >>> 16) & 0xff;
      const pb = (p >>> 8) & 0xff;
      const pa = p & 0xff;
      const target = dark ? 0 : 255;
      const nr = Math.round(pr + (target - pr) * strength);
      const ng = Math.round(pg + (target - pg) * strength);
      const nb = Math.round(pb + (target - pb) * strength);
      base.setPixelAt(x + 1, y + 1, rgbToImagescriptColor(nr, ng, nb, pa));
    }
  }
}

function isLightHex(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  return luminance(r, g, b) > 0.6;
}

function isDarkHex(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  return luminance(r, g, b) < 0.35;
}

export async function compositeLogo(
  baseBytes: Uint8Array,
  logoBytes: Uint8Array,
  opts: {
    placement: LogoPlacement;
    surfaceHex: string;
    logoSize?: LogoSize;
    inkHex?: string;
    cornerOverride?: "top-left" | "bottom-right";
    /** Vector source — when present the mark is re-rendered in the knockout
     *  color instead of pixel-tinted, keeping vector crispness. */
    svgText?: string | null;
  },
): Promise<{ bytes: Uint8Array; contrast: number; inkHex: string; scrim: boolean } | Uint8Array> {
  let base: Image;
  let logo: Image;
  try {
    base = await Image.decode(baseBytes);
  } catch (e) {
    console.warn("logo-compositor: base decode failed, returning original", e);
    return baseBytes;
  }
  try {
    logo = knockoutAndTrim(await Image.decode(logoBytes));
  } catch (e) {
    console.warn("logo-compositor: logo decode failed, returning base", e);
    return baseBytes;
  }

  const size = normalizeLogoSize(opts.logoSize);
  const isAvatar = opts.placement === "avatar-center";
  const logoAspect = logo.width / Math.max(1, logo.height);
  const box = targetBoxFor(opts.placement, base.width, base.height, logoAspect, size, opts.cornerOverride);

  const baseLumBehind = avgLuminance(base, box.x, box.y, box.w, box.h);

  // Knockout ink: a single contrast-safe color pulled from the kit.
  const lightCandidate = isLightHex(opts.surfaceHex) ? opts.surfaceHex : "#FFFFFF";
  const darkCandidate = opts.inkHex && isDarkHex(opts.inkHex) ? opts.inkHex : "#0B0F19";
  const inkHex = baseLumBehind < 0.5 ? lightCandidate : darkCandidate;

  let mark = logo;
  if (!isAvatar) {
    if (opts.svgText) {
      const mono = await rasterizeSvgMono(opts.svgText, inkHex, Math.max(512, box.w * 2));
      if (mono) {
        try {
          mark = knockoutAndTrim(await Image.decode(mono));
        } catch {
          mark = tintMark(logo, inkHex);
        }
      } else {
        mark = tintMark(logo, inkHex);
      }
    } else {
      mark = tintMark(logo, inkHex);
    }
  }

  // Re-derive the box from the trimmed/re-rendered mark's aspect.
  const finalAspect = mark.width / Math.max(1, mark.height);
  const finalBox = targetBoxFor(opts.placement, base.width, base.height, finalAspect, size, opts.cornerOverride);

  const inkRgb = hexToRgb(inkHex);
  const inkLum = luminance(inkRgb.r, inkRgb.g, inkRgb.b);
  const behind = avgLuminance(base, finalBox.x, finalBox.y, finalBox.w, finalBox.h);
  let contrast = (Math.max(inkLum, behind) + 0.05) / (Math.min(inkLum, behind) + 0.05);

  let scrim = false;
  if (!isAvatar && contrast < 3) {
    scrim = true;
    const cx = finalBox.x + finalBox.w / 2;
    const cy = finalBox.y + finalBox.h / 2;
    const radius = Math.max(finalBox.w, finalBox.h) * 1.1;
    paintRadialScrim(base, cx, cy, radius, inkLum > 0.5);
    const after = avgLuminance(base, finalBox.x, finalBox.y, finalBox.w, finalBox.h);
    contrast = (Math.max(inkLum, after) + 0.05) / (Math.min(inkLum, after) + 0.05);
  }

  const fit = fitInside(mark, finalBox.w, finalBox.h, 0.02);
  base.composite(fit.img, finalBox.x + fit.offX, finalBox.y + fit.offY);

  console.log(
    `[logo-compositor] placement=${opts.placement} size=${size} aspect=${finalAspect.toFixed(2)} box=${finalBox.w}x${finalBox.h} @${finalBox.x},${finalBox.y} ink=${inkHex} contrast=${contrast.toFixed(2)} scrim=${scrim} vector=${!!opts.svgText} canvas=${base.width}x${base.height}`,
  );

  const out = await base.encode();
  return { bytes: out, contrast, inkHex, scrim };
}

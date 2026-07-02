// Server-side logo compositor.
// Guarantees the user's selected brand logo appears on every generated social
// asset, regardless of what the image model produced. Draws a flat brand-surface
// "chip" at a deterministic safe-zone location sized from the logo's actual
// aspect ratio, then letterboxes the logo into it preserving aspect (never warps).
//
// Pure JS via imagescript — runs on the Supabase Edge runtime, no native deps.

import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

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

// Per-placement + per-size targets, tuned so the *logo's dominant axis*
// is always big enough to read at platform display sizes.
// - `heightFrac`: chip height as a fraction of the canvas' shortest side.
// - `maxWFrac`:   chip width capped at this fraction of canvas width.
// - `insetFrac`:  inset from the placement corner as a fraction of shortest side.
const CORNER_TIERS: Record<LogoSize, { heightFrac: number; maxWFrac: number; insetFrac: number }> = {
  sm: { heightFrac: 0.09, maxWFrac: 0.40, insetFrac: 0.05 },
  md: { heightFrac: 0.13, maxWFrac: 0.48, insetFrac: 0.05 },
  lg: { heightFrac: 0.18, maxWFrac: 0.58, insetFrac: 0.05 },
};

// Returns a hint the prompt can echo, so the model reserves the same
// rectangle we're about to composite into.
export function logoSafeZone(
  placement: LogoPlacement,
  size: LogoSize,
  logoAspect: number,
): { widthPct: number; heightPct: number; corner: "top-left" | "bottom-right" | "center" } {
  if (placement === "avatar-center") {
    return { widthPct: 78, heightPct: 78, corner: "center" };
  }
  const tier = CORNER_TIERS[size];
  const heightPct = Math.round(tier.heightFrac * 100);
  // Prompt-side approximation using a 16:9 canvas assumption; the compositor
  // makes the actual final decision using the real canvas dimensions.
  const rawWidthPct = heightPct * logoAspect * (9 / 16);
  const widthPct = Math.min(Math.round(rawWidthPct), Math.round(tier.maxWFrac * 100));
  const corner = placement === "banner-corner" ? "bottom-right" : "top-left";
  return { widthPct, heightPct, corner };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { r: 11, g: 15, b: 25 }; // safe near-black
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function rgbToImagescriptColor(r: number, g: number, b: number, a = 0xff): number {
  // imagescript uses 0xRRGGBBAA
  return ((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | (a & 0xff);
}

// Aspect-aware chip target. `logoAspect` = logo.width / logo.height.
function targetBoxFor(
  placement: LogoPlacement,
  W: number,
  H: number,
  logoAspect: number,
  size: LogoSize,
): { x: number; y: number; w: number; h: number } {
  const short = Math.min(W, H);

  if (placement === "avatar-center") {
    const s = Math.floor(short * 0.78);
    return { x: Math.floor((W - s) / 2), y: Math.floor((H - s) / 2), w: s, h: s };
  }

  const tier = CORNER_TIERS[size];
  // Start with target chip height, then derive width from logo aspect.
  // padCompensation: because fitInside applies 8% inner padding on both axes,
  // we grow the chip slightly so the logo itself hits the target height.
  const padCompensation = 1 / (1 - 0.08 * 2);
  let boxH = Math.floor(short * tier.heightFrac * padCompensation);
  let boxW = Math.max(1, Math.round(boxH * Math.max(0.2, logoAspect)));

  const maxW = Math.floor(W * tier.maxWFrac);
  if (boxW > maxW) {
    boxW = maxW;
    boxH = Math.max(1, Math.round(boxW / Math.max(0.2, logoAspect)));
  }

  // Also ensure the chip never becomes taller than a corner should be
  // (guard against very tall logos on landscape canvases).
  const maxH = Math.floor(short * 0.32);
  if (boxH > maxH) {
    boxH = maxH;
    boxW = Math.max(1, Math.round(boxH * Math.max(0.2, logoAspect)));
  }

  const inset = Math.floor(short * tier.insetFrac);
  if (placement === "banner-corner") {
    return { x: W - boxW - inset, y: H - boxH - inset, w: boxW, h: boxH };
  }
  // thumbnail-lockup and post-lockup: top-left
  return { x: inset, y: inset, w: boxW, h: boxH };
}

// Fit logo into box preserving aspect ratio; returns resized image + offset
// to center within the chip. Inner padding reduced 12% → 8% so glyphs are larger.
function fitInside(
  logo: Image,
  boxW: number,
  boxH: number,
): { img: Image; offX: number; offY: number } {
  const padPct = 0.08;
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

export async function compositeLogo(
  baseBytes: Uint8Array,
  logoBytes: Uint8Array,
  opts: { placement: LogoPlacement; surfaceHex: string; logoSize?: LogoSize },
): Promise<Uint8Array> {
  // Decode both. imagescript auto-detects PNG/JPEG; if logo is something else
  // (webp, svg) decode will throw — caller is responsible for filtering svg.
  let base: Image;
  let logo: Image;
  try {
    base = await Image.decode(baseBytes);
  } catch (e) {
    console.warn("logo-compositor: base decode failed, returning original", e);
    return baseBytes;
  }
  try {
    logo = await Image.decode(logoBytes);
  } catch (e) {
    console.warn("logo-compositor: logo decode failed, returning base", e);
    return baseBytes;
  }

  const size = normalizeLogoSize(opts.logoSize);
  const logoAspect = logo.width / Math.max(1, logo.height);
  const box = targetBoxFor(opts.placement, base.width, base.height, logoAspect, size);
  const surface = hexToRgb(opts.surfaceHex || "#FFFFFF");

  // 1) Paint the chip background — flat brand surface, guarantees contrast.
  const chip = new Image(box.w, box.h);
  chip.fill(rgbToImagescriptColor(surface.r, surface.g, surface.b, 0xff));

  // 2) Fit the logo into the chip with inner padding.
  const fit = fitInside(logo, box.w, box.h);
  chip.composite(fit.img, fit.offX, fit.offY);

  // 3) Drop the chip onto the base canvas at the placement coordinates.
  base.composite(chip, box.x, box.y);

  console.log(
    `[logo-compositor] placement=${opts.placement} size=${size} aspect=${logoAspect.toFixed(2)} chip=${box.w}x${box.h} @${box.x},${box.y} canvas=${base.width}x${base.height}`,
  );

  const out = await base.encode(); // PNG bytes
  return out;
}

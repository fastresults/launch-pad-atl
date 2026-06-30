// Server-side logo compositor.
// Guarantees the user's selected brand logo appears on every generated social
// asset, regardless of what the image model produced. Draws a flat brand-surface
// "chip" at a deterministic safe-zone location, then letterboxes the logo into
// it preserving aspect ratio (never warps).
//
// Pure JS via imagescript — runs on the Supabase Edge runtime, no native deps.

import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

export type LogoPlacement =
  | "avatar-center"
  | "banner-corner"
  | "post-lockup"
  | "thumbnail-lockup";

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

// Returns { x, y, w, h } for the logo chip on the canvas.
function targetBoxFor(
  placement: LogoPlacement,
  W: number,
  H: number,
): { x: number; y: number; w: number; h: number } {
  const short = Math.min(W, H);
  if (placement === "avatar-center") {
    const size = Math.floor(short * 0.78);
    return { x: Math.floor((W - size) / 2), y: Math.floor((H - size) / 2), w: size, h: size };
  }
  if (placement === "banner-corner") {
    // bottom-right, ~16% of the shortest side, 5% inset
    const size = Math.floor(short * 0.16);
    const inset = Math.floor(short * 0.05);
    return { x: W - size - inset, y: H - size - inset, w: size, h: size };
  }
  if (placement === "thumbnail-lockup") {
    // top-left, ~18% of shortest side, 6% inset
    const size = Math.floor(short * 0.18);
    const inset = Math.floor(short * 0.06);
    return { x: inset, y: inset, w: size, h: size };
  }
  // post-lockup: top-left, ~20%, 7% inset (more breathing room on square/tall posts)
  const size = Math.floor(short * 0.2);
  const inset = Math.floor(short * 0.07);
  return { x: inset, y: inset, w: size, h: size };
}

// Fit logo into box preserving aspect ratio; returns resized image + offset
// to center within the chip.
function fitInside(
  logo: Image,
  boxW: number,
  boxH: number,
): { img: Image; offX: number; offY: number } {
  const padPct = 0.12; // inner padding so logo doesn't kiss the chip edge
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
  opts: { placement: LogoPlacement; surfaceHex: string },
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

  const box = targetBoxFor(opts.placement, base.width, base.height);
  const surface = hexToRgb(opts.surfaceHex || "#FFFFFF");

  // 1) Paint the chip background — flat brand surface, guarantees contrast.
  const chip = new Image(box.w, box.h);
  chip.fill(rgbToImagescriptColor(surface.r, surface.g, surface.b, 0xff));

  // 2) Fit the logo into the chip with inner padding.
  const fit = fitInside(logo, box.w, box.h);
  chip.composite(fit.img, fit.offX, fit.offY);

  // 3) Drop the chip onto the base canvas at the placement coordinates.
  base.composite(chip, box.x, box.y);

  const out = await base.encode(); // PNG bytes
  return out;
}

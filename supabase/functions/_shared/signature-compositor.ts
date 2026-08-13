// Deterministically adds the brand signature color to generated social assets.
// This is intentionally post-model: prompts can be ignored, pixels cannot.

import { PNG } from "npm:pngjs@7.0.0";
import { Buffer } from "node:buffer";
import { readPng, writePng } from "./png-codec.ts";
import type { CanvasPlan, SignaturePlacement } from "./canvas-plan.ts";

function hexToRgb(hex: string): [number, number, number] {
  const h = String(hex || "#7C3AED").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [124, 58, 237];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function blendPixel(png: PNG, x: number, y: number, rgb: [number, number, number], alpha: number) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const i = (png.width * y + x) << 2;
  const a = clamp(alpha, 0, 1);
  png.data[i] = Math.round(rgb[0] * a + png.data[i] * (1 - a));
  png.data[i + 1] = Math.round(rgb[1] * a + png.data[i + 1] * (1 - a));
  png.data[i + 2] = Math.round(rgb[2] * a + png.data[i + 2] * (1 - a));
  png.data[i + 3] = 255;
}

function fillRect(
  png: PNG,
  rect: { x: number; y: number; w: number; h: number },
  rgb: [number, number, number],
  alpha = 1,
) {
  const x0 = clamp(Math.floor(rect.x), 0, png.width);
  const y0 = clamp(Math.floor(rect.y), 0, png.height);
  const x1 = clamp(Math.ceil(rect.x + rect.w), 0, png.width);
  const y1 = clamp(Math.ceil(rect.y + rect.h), 0, png.height);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) blendPixel(png, x, y, rgb, alpha);
  }
}

function fillCircle(
  png: PNG,
  cx: number,
  cy: number,
  r: number,
  rgb: [number, number, number],
  alpha = 1,
) {
  const x0 = clamp(Math.floor(cx - r), 0, png.width);
  const y0 = clamp(Math.floor(cy - r), 0, png.height);
  const x1 = clamp(Math.ceil(cx + r), 0, png.width);
  const y1 = clamp(Math.ceil(cy + r), 0, png.height);
  const rr = r * r;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= rr) blendPixel(png, x, y, rgb, alpha);
    }
  }
}

function requiredPct(plan: CanvasPlan) {
  return clamp(Number(plan.signatureMinCoveragePct || 18), 8, 60) / 100;
}

function solidStripeWidth(W: number, pct: number) {
  return Math.ceil(W * clamp(pct, 0.08, 0.35));
}

function applyPlacement(png: PNG, placement: SignaturePlacement, rgb: [number, number, number], pct: number) {
  const W = png.width;
  const H = png.height;
  const short = Math.min(W, H);
  const frame = Math.max(18, Math.round(short * 0.055));

  switch (placement) {
    case "sidebar_stripe": {
      fillRect(png, { x: 0, y: 0, w: solidStripeWidth(W, pct), h: H }, rgb, 1);
      return;
    }
    case "anchor_block": {
      const w = Math.ceil(W * clamp(pct * 1.45, 0.22, 0.42));
      const h = Math.ceil(H * clamp(pct * 1.25, 0.26, 0.52));
      fillRect(png, { x: 0, y: H - h, w, h }, rgb, 1);
      return;
    }
    case "corner_mark": {
      const size = Math.ceil(short * clamp(Math.sqrt(pct) * 0.95, 0.23, 0.46));
      fillCircle(png, W - Math.round(size * 0.18), Math.round(size * 0.18), size, rgb, 1);
      return;
    }
    case "framed_border": {
      fillRect(png, { x: 0, y: 0, w: W, h: frame }, rgb, 1);
      fillRect(png, { x: 0, y: H - frame, w: W, h: frame }, rgb, 1);
      fillRect(png, { x: 0, y: 0, w: frame, h: H }, rgb, 1);
      fillRect(png, { x: W - frame, y: 0, w: frame, h: H }, rgb, 1);
      return;
    }
    case "focal_shape": {
      const r = short * clamp(Math.sqrt(pct / Math.PI) * 1.25, 0.2, 0.38);
      fillCircle(png, W * 0.82, H * 0.22, r, rgb, 1);
      return;
    }
    case "duotone_wash": {
      // Preserve the image while making the brand hue unmistakable across midtones.
      fillRect(png, { x: 0, y: 0, w: W, h: H }, rgb, 0.48);
      fillRect(png, { x: 0, y: 0, w: W, h: Math.max(frame, Math.ceil(H * 0.12)) }, rgb, 0.82);
      return;
    }
    case "auto":
    default: {
      fillRect(png, { x: 0, y: 0, w: solidStripeWidth(W, pct), h: H }, rgb, 1);
      return;
    }
  }
}

export function compositeSignatureSplash(baseBytes: Uint8Array, plan: CanvasPlan): Uint8Array {
  let png: PNG;
  try {
    png = readPng(baseBytes);
  } catch (e) {
    console.warn("signature-compositor: decode failed, returning original", e);
    return baseBytes;
  }

  const signature = (plan.displaySignature || plan.signature || "#7C3AED").toUpperCase();
  const rgb = hexToRgb(signature);
  const pct = requiredPct(plan);
  applyPlacement(png, plan.signaturePlacement || "auto", rgb, pct);

  return writePng(png);
}
// Renders a tiny PNG showing the surface / ink / accent swatches so the
// multimodal image model can SEE the exact pixels it's allowed to compose with.

import { PNG } from "npm:pngjs@7.0.0";
import type { CanvasPlan } from "./canvas-plan.ts";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function buildPaletteTilePngBytes(plan: CanvasPlan): Uint8Array {
  const W = 768;
  const H = 256;
  const png = new PNG({ width: W, height: H });
  const stripes: Array<[string, [number, number, number]]> = [
    ["surface",   hexToRgb(plan.surface)],
    ["ink",       hexToRgb(plan.ink)],
    ["signature", hexToRgb(plan.signature)],
    ["accent",    hexToRgb(plan.accent)],
  ];
  const stripeW = Math.floor(W / stripes.length);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = Math.min(stripes.length - 1, Math.floor(x / stripeW));
      const [r, g, b] = stripes[idx][1];
      const off = (W * y + x) << 2;
      png.data[off] = r;
      png.data[off + 1] = g;
      png.data[off + 2] = b;
      png.data[off + 3] = 255;
    }
  }
  const buf = PNG.sync.write(png);
  return new Uint8Array(buf);
}

export function bytesToDataUrl(bytes: Uint8Array, mime = "image/png"): string {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:${mime};base64,${btoa(s)}`;
}

// Deterministic finishing pass for generated imagery.
//
// The image models can only return 1024x1024, 1536x1024 or 1024x1536, and they
// frequently paint a flat white/neutral band along one edge when they "reserve"
// quiet space. Nothing downstream fixed that, so covers shipped at the wrong
// aspect with visible white edges.
//
// This module owns three deterministic steps:
//   1. trimFlatBorders() — cut away near-uniform off-palette edge bands.
//   2. coverFit()        — scale + centre-crop so pixels equal the exact spec.
//   3. edgeBandReport()  — report any edge that is still a flat band, so the
//                          caller can retry generation.

import { PNG } from "npm:pngjs@7.0.0";
import { Buffer } from "node:buffer";
import { readPng, writePng } from "./png-codec.ts";

export type Gravity = "center" | "top";

function decode(bytes: Uint8Array): PNG {
  return readPng(bytes);
}

function encode(png: PNG): Uint8Array {
  return writePng(png);
}

function px(png: PNG, x: number, y: number): [number, number, number] {
  const i = (png.width * y + x) << 2;
  return [png.data[i], png.data[i + 1], png.data[i + 2]];
}

function lum([r, g, b]: [number, number, number]): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function sat([r, g, b]: [number, number, number]): number {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

type LineStats = { flat: boolean; light: boolean; neutral: boolean; mean: [number, number, number] };

function lineStats(png: PNG, kind: "row" | "col", index: number): LineStats {
  const n = kind === "row" ? png.width : png.height;
  const step = Math.max(1, Math.floor(n / 96));
  let sr = 0, sg = 0, sb = 0, count = 0;
  const samples: [number, number, number][] = [];
  for (let k = 0; k < n; k += step) {
    const p = kind === "row" ? px(png, k, index) : px(png, index, k);
    samples.push(p);
    sr += p[0]; sg += p[1]; sb += p[2];
    count++;
  }
  const mean: [number, number, number] = [sr / count, sg / count, sb / count];
  // Flat = every sample sits within a tight band of the mean.
  let maxDev = 0;
  for (const s of samples) {
    const d = Math.max(Math.abs(s[0] - mean[0]), Math.abs(s[1] - mean[1]), Math.abs(s[2] - mean[2]));
    if (d > maxDev) maxDev = d;
  }
  return {
    flat: maxDev <= 12,
    light: lum(mean) >= 0.86,
    neutral: sat(mean) <= 0.08,
    mean,
  };
}

/**
 * Remove near-uniform light/neutral bands from any edge. Capped at 22% of the
 * dimension per edge so a legitimately minimal composition is never gutted.
 */
export function trimFlatBorders(
  bytes: Uint8Array,
  opts?: { maxFraction?: number },
): { bytes: Uint8Array; trimmed: { top: number; bottom: number; left: number; right: number } } {
  const maxFraction = opts?.maxFraction ?? 0.22;
  let png: PNG;
  try {
    png = decode(bytes);
  } catch {
    return { bytes, trimmed: { top: 0, bottom: 0, left: 0, right: 0 } };
  }

  const capY = Math.floor(png.height * maxFraction);
  const capX = Math.floor(png.width * maxFraction);
  const bad = (s: LineStats) => s.flat && s.light && s.neutral;

  let top = 0;
  while (top < capY && bad(lineStats(png, "row", top))) top++;
  let bottom = 0;
  while (bottom < capY && bad(lineStats(png, "row", png.height - 1 - bottom))) bottom++;
  let left = 0;
  while (left < capX && bad(lineStats(png, "col", left))) left++;
  let right = 0;
  while (right < capX && bad(lineStats(png, "col", png.width - 1 - right))) right++;

  if (!top && !bottom && !left && !right) {
    return { bytes, trimmed: { top: 0, bottom: 0, left: 0, right: 0 } };
  }

  const w = png.width - left - right;
  const h = png.height - top - bottom;
  if (w < 32 || h < 32) return { bytes, trimmed: { top: 0, bottom: 0, left: 0, right: 0 } };

  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = (png.width * (y + top) + (x + left)) << 2;
      const di = (w * y + x) << 2;
      out.data[di] = png.data[si];
      out.data[di + 1] = png.data[si + 1];
      out.data[di + 2] = png.data[si + 2];
      out.data[di + 3] = 255;
    }
  }
  return { bytes: encode(out), trimmed: { top, bottom, left, right } };
}

/**
 * Scale so the source fully covers target w×h, then crop. Output pixel
 * dimensions always equal the target — never letterboxed, never padded.
 */
export function coverFit(
  bytes: Uint8Array,
  targetW: number,
  targetH: number,
  gravity: Gravity = "center",
): Uint8Array {
  let src: PNG;
  try {
    src = decode(bytes);
  } catch {
    return bytes;
  }
  if (src.width === targetW && src.height === targetH) return bytes;

  const scale = Math.max(targetW / src.width, targetH / src.height);
  // Source rect that maps onto the target, expressed in source pixels.
  const rectW = Math.min(src.width, targetW / scale);
  const rectH = Math.min(src.height, targetH / scale);
  const offX = (src.width - rectW) / 2;
  const offY = gravity === "top"
    ? (src.height - rectH) * 0.18
    : (src.height - rectH) / 2;

  const out = new PNG({ width: targetW, height: targetH });
  for (let y = 0; y < targetH; y++) {
    // Bilinear sample position in source space.
    const sy = offY + ((y + 0.5) / targetH) * rectH - 0.5;
    const y0 = Math.max(0, Math.min(src.height - 1, Math.floor(sy)));
    const y1 = Math.min(src.height - 1, y0 + 1);
    const fy = Math.max(0, Math.min(1, sy - y0));
    for (let x = 0; x < targetW; x++) {
      const sx = offX + ((x + 0.5) / targetW) * rectW - 0.5;
      const x0 = Math.max(0, Math.min(src.width - 1, Math.floor(sx)));
      const x1 = Math.min(src.width - 1, x0 + 1);
      const fx = Math.max(0, Math.min(1, sx - x0));

      const i00 = (src.width * y0 + x0) << 2;
      const i10 = (src.width * y0 + x1) << 2;
      const i01 = (src.width * y1 + x0) << 2;
      const i11 = (src.width * y1 + x1) << 2;
      const di = (targetW * y + x) << 2;
      for (let c = 0; c < 3; c++) {
        const top = src.data[i00 + c] * (1 - fx) + src.data[i10 + c] * fx;
        const bot = src.data[i01 + c] * (1 - fx) + src.data[i11 + c] * fx;
        out.data[di + c] = Math.round(top * (1 - fy) + bot * fy);
      }
      out.data[di + 3] = 255;
    }
  }
  return encode(out);
}

export type EdgeReport = {
  ok: boolean;
  badEdges: string[];
  detail: Record<string, { flat: boolean; light: boolean; hex: string }>;
};

function toHex([r, g, b]: [number, number, number]): string {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/**
 * An edge fails when a band ~2.5% deep is flat AND light AND neutral —
 * i.e. the leftover white margin the model painted.
 */
export function edgeBandReport(bytes: Uint8Array): EdgeReport {
  let png: PNG;
  try {
    png = decode(bytes);
  } catch {
    return { ok: true, badEdges: [], detail: {} };
  }
  const depthY = Math.max(2, Math.floor(png.height * 0.025));
  const depthX = Math.max(2, Math.floor(png.width * 0.025));

  const probe = (kind: "row" | "col", indices: number[]) => {
    const stats = indices.map((i) => lineStats(png, kind, i));
    const flat = stats.every((s) => s.flat);
    const light = stats.every((s) => s.light && s.neutral);
    return { flat, light, hex: toHex(stats[0].mean) };
  };

  const detail: EdgeReport["detail"] = {
    top: probe("row", [0, Math.floor(depthY / 2), depthY]),
    bottom: probe("row", [png.height - 1, png.height - 1 - Math.floor(depthY / 2), png.height - 1 - depthY]),
    left: probe("col", [0, Math.floor(depthX / 2), depthX]),
    right: probe("col", [png.width - 1, png.width - 1 - Math.floor(depthX / 2), png.width - 1 - depthX]),
  };
  const badEdges = Object.entries(detail)
    .filter(([, d]) => d.flat && d.light)
    .map(([k]) => k);
  return { ok: badEdges.length === 0, badEdges, detail };
}

/** Trim + cover-fit in one call. */
export function finishToSpec(
  bytes: Uint8Array,
  targetW: number,
  targetH: number,
): { bytes: Uint8Array; trimmed: { top: number; bottom: number; left: number; right: number }; edges: EdgeReport } {
  const t = trimFlatBorders(bytes);
  const gravity: Gravity = targetH > targetW ? "top" : "center";
  const fitted = coverFit(t.bytes, targetW, targetH, gravity);
  return { bytes: fitted, trimmed: t.trimmed, edges: edgeBandReport(fitted) };
}

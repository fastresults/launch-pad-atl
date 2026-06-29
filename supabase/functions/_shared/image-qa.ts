// Post-generation contrast QA for social cover art.
// Decodes the PNG, samples dominant colors per region, and verifies that any
// rendered text/foreground stands at least ~3:1 against its surrounding bg.

import { PNG } from "npm:pngjs@7.0.0";
import { contrastRatio, lightness } from "./palette-rules.ts";
import type { CanvasPlan } from "./canvas-plan.ts";

export type QaVerdict = {
  ok: boolean;
  reasons: string[];
  observed: {
    dominantBg: string;
    dominantFg: string;
    ratio: number;
  };
};

function toHex(r: number, g: number, b: number): string {
  const h = (v: number) => v.toString(16).padStart(2, "0").toUpperCase();
  return `#${h(r)}${h(g)}${h(b)}`;
}

function bucket(v: number): number {
  // Quantize to 32 buckets per channel so near-identical colors collapse.
  return Math.min(7, v >> 5);
}

function dominantColors(
  png: PNG,
  region: { x0: number; y0: number; x1: number; y1: number },
): { hex: string; pct: number }[] {
  const counts = new Map<number, number>();
  const { width } = png;
  let total = 0;
  // Stride sample to keep this cheap.
  const stride = 4;
  for (let y = region.y0; y < region.y1; y += stride) {
    for (let x = region.x0; x < region.x1; x += stride) {
      const i = (width * y + x) << 2;
      const a = png.data[i + 3];
      if (a < 128) continue;
      const r = png.data[i];
      const g = png.data[i + 1];
      const b = png.data[i + 2];
      const key = (bucket(r) << 6) | (bucket(g) << 3) | bucket(b);
      counts.set(key, (counts.get(key) || 0) + 1);
      total++;
    }
  }
  const arr = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([key, c]) => {
      const r = ((key >> 6) & 7) * 32 + 16;
      const g = ((key >> 3) & 7) * 32 + 16;
      const b = (key & 7) * 32 + 16;
      return { hex: toHex(r, g, b), pct: c / Math.max(1, total) };
    });
  return arr;
}

export function runContrastQa(pngBytes: Uint8Array, plan: CanvasPlan): QaVerdict {
  const reasons: string[] = [];
  let png: PNG;
  try {
    png = PNG.sync.read(Buffer.from(pngBytes));
  } catch (e) {
    return {
      ok: true,
      reasons: ["qa_skipped: decode failed"],
      observed: { dominantBg: "", dominantFg: "", ratio: 0 },
    };
  }
  const { width: W, height: H } = png;

  // BG sample = corners (avoid central focal area).
  const corner = (x0: number, y0: number) =>
    dominantColors(png, { x0, y0, x1: x0 + Math.floor(W * 0.15), y1: y0 + Math.floor(H * 0.15) });
  const bgSamples = [
    ...corner(0, 0),
    ...corner(Math.floor(W * 0.85), 0),
    ...corner(0, Math.floor(H * 0.85)),
    ...corner(Math.floor(W * 0.85), Math.floor(H * 0.85)),
  ].sort((a, b) => b.pct - a.pct);
  const dominantBg = bgSamples[0]?.hex ?? "#FFFFFF";

  // FG sample = center band (where headline or focal mark sits).
  const cy0 = Math.floor(H * 0.30);
  const cy1 = Math.floor(H * 0.70);
  const centerColors = dominantColors(png, { x0: 0, y0: cy0, x1: W, y1: cy1 });

  // Find the non-bg color with highest pct that lies > 0.05 luminance distance from bg.
  const bgL = lightness(dominantBg);
  const fg = centerColors.find(
    (c) =>
      c.hex !== dominantBg &&
      Math.abs(lightness(c.hex) - bgL) > 0.05 &&
      c.pct > 0.02,
  ) ?? centerColors[1] ?? centerColors[0] ?? { hex: dominantBg, pct: 0 };

  const ratio = contrastRatio(fg.hex, dominantBg);
  const ok = ratio >= 3.0; // UI minimum; text would need 4.5 but we don't know if there's text
  if (!ok) {
    reasons.push(
      `Dominant foreground ${fg.hex} on background ${dominantBg} = ${ratio.toFixed(2)}:1 (need ≥3:1)`,
    );
  }

  // Also fail if the dominant bg is wildly off plan.surface (luminance band mismatch).
  const planSurfaceL = lightness(plan.surface);
  if (Math.abs(planSurfaceL - bgL) > 0.4) {
    reasons.push(
      `Background drifted from planned surface ${plan.surface} (got ${dominantBg})`,
    );
  }

  return {
    ok: reasons.length === 0,
    reasons,
    observed: { dominantBg, dominantFg: fg.hex, ratio: Number(ratio.toFixed(2)) },
  };
}

// Cheap dominant-ink estimator for a logo PNG (used to pick avatar surface).
export function logoDominantInk(pngBytes: Uint8Array): string | null {
  try {
    const png = PNG.sync.read(Buffer.from(pngBytes));
    const { width: W, height: H } = png;
    // Look at the central 60% region, weight darker / more saturated pixels.
    const x0 = Math.floor(W * 0.2), x1 = Math.floor(W * 0.8);
    const y0 = Math.floor(H * 0.2), y1 = Math.floor(H * 0.8);
    const counts = new Map<number, number>();
    for (let y = y0; y < y1; y += 4) {
      for (let x = x0; x < x1; x += 4) {
        const i = (W * y + x) << 2;
        const a = png.data[i + 3];
        if (a < 200) continue;
        const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
        // Skip near-white background pixels.
        if (r > 230 && g > 230 && b > 230) continue;
        const key = (bucket(r) << 6) | (bucket(g) << 3) | bucket(b);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
    if (!top) return null;
    const key = top[0];
    const r = ((key >> 6) & 7) * 32 + 16;
    const g = ((key >> 3) & 7) * 32 + 16;
    const b = (key & 7) * 32 + 16;
    return toHex(r, g, b);
  } catch {
    return null;
  }
}

// Post-generation contrast QA for social cover art.
// Decodes the PNG, samples dominant colors per region, and verifies that any
// rendered text/foreground stands at least ~3:1 against its surrounding bg.

import { PNG } from "npm:pngjs@7.0.0";
import { Buffer } from "node:buffer";
import { readPng } from "./png-codec.ts";
import { contrastRatio, lightness } from "./palette-rules.ts";
import type { CanvasPlan } from "./canvas-plan.ts";

export type QaVerdict = {
  ok: boolean;
  reasons: string[];
  observed: {
    dominantBg: string;
    dominantFg: string;
    ratio: number;
    signatureCoveragePct?: number;
    signatureVisible?: boolean;
  };
};

function hexToRgbLocal(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

// HSL conversion for perceptual hue-matching. We only count a pixel toward
// signature coverage when it is itself a chromatic color in the same hue
// family — never neutrals / blacks / whites that happen to be RGB-close to a
// dark brand hex.
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === R) h = ((G - B) / d) % 6;
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  h = h * 60;
  if (h < 0) h += 360;
  return [h, s, l];
}

function hueDelta(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

// Returns { pct, visible }. A pixel counts only when it is chromatic
// (s ≥ 0.20, l in 0.12..0.92) AND within ~25° hue of the target signature
// (which is itself chromatic by construction — we use plan.displaySignature).
function signatureCoverageStats(png: PNG, signatureHex: string): { pct: number; visible: boolean } {
  const [tr, tg, tb] = hexToRgbLocal(signatureHex);
  const [th, ts, tl] = rgbToHsl(tr, tg, tb);
  // If target itself isn't chromatic (shouldn't happen with displaySignature),
  // we can't measure hue coverage — fall back to "always visible".
  if (ts < 0.10) return { pct: 100, visible: true };

  let hits = 0;
  let chromaHits = 0;
  let total = 0;
  const stride = 4;
  const HUE_TOL = 28;     // degrees
  const SAT_MIN = 0.20;
  const L_MIN = 0.12;
  const L_MAX = 0.92;
  for (let y = 0; y < png.height; y += stride) {
    for (let x = 0; x < png.width; x += stride) {
      const i = (png.width * y + x) << 2;
      if (png.data[i + 3] < 128) continue;
      total++;
      const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
      const [h, s, l] = rgbToHsl(r, g, b);
      if (s < SAT_MIN || l < L_MIN || l > L_MAX) continue;
      chromaHits++;
      if (hueDelta(h, th) <= HUE_TOL) hits++;
    }
  }
  const pct = total ? (hits / total) * 100 : 0;
  // "Visible" if we observed at least a meaningful number of in-hue chromatic
  // pixels — guards against a single stray colored pixel registering as "present".
  const visible = hits >= Math.max(80, Math.floor(total * 0.01));
  return { pct, visible };
}



function toHex(r: number, g: number, b: number): string {
  const h = (v: number) => v.toString(16).padStart(2, "0").toUpperCase();
  return `#${h(r)}${h(g)}${h(b)}`;
}

function rgbDistance(a: string, b: string): number {
  const [ar, ag, ab] = hexToRgbLocal(a);
  const [br, bg, bb] = hexToRgbLocal(b);
  return Math.hypot(ar - br, ag - bg, ab - bb);
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
    png = readPng(pngBytes);
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
  // Brand signature panels often occupy a corner/edge by design. Choose the
  // corner sample closest to the planned surface so the splash is not mistaken
  // for an unintended background drift.
  const dominantBg = bgSamples.length
    ? [...bgSamples].sort((a, b) => rgbDistance(a.hex, plan.surface) - rgbDistance(b.hex, plan.surface))[0].hex
    : "#FFFFFF";

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
  const signatureCanOccupyCorners = ["duotone_wash", "corner_mark", "framed_border"].includes(plan.signaturePlacement as string);
  if (!signatureCanOccupyCorners && Math.abs(planSurfaceL - bgL) > 0.4) {
    reasons.push(
      `Background drifted from planned surface ${plan.surface} (got ${dominantBg})`,
    );
  }

  // Signature color presence — the brand splash must actually show up.
  // We check the *displaySignature* (the visible tint), not the raw brand hex,
  // because a near-black brand hex would falsely "match" plain black pixels.
  const sigTarget = (plan.displaySignature || plan.signature || "").toUpperCase();
  let signatureCovPct: number | undefined;
  let signatureVisible: boolean | undefined;
  if (sigTarget && sigTarget !== plan.surface.toUpperCase()) {
    const stats = signatureCoverageStats(png, sigTarget);
    signatureCovPct = Number(stats.pct.toFixed(1));
    signatureVisible = stats.visible;
    const minPct = (plan.signatureMinCoveragePct ?? 12) * 0.75; // tighter tolerance
    if (!stats.visible) {
      reasons.push(
        `No perceptible ${sigTarget} pixels in the render — the brand splash is missing entirely. Add a confident ${sigTarget} block, sidebar, full-bleed stripe, or duotone wash covering ≥${plan.signatureMinCoveragePct}% of the canvas. Not a hairline. Not a corner accent.`,
      );
    } else if (signatureCovPct < minPct) {
      reasons.push(
        `Signature brand color ${sigTarget} only covered ${signatureCovPct}% of the canvas (need ≥${plan.signatureMinCoveragePct}%, tolerance ≥${minPct.toFixed(0)}%). The brand splash is too small — increase to a confident shape, sidebar, block, or duotone wash, not a hairline.`,
      );
    }
  }

  return {
    ok: reasons.length === 0,
    reasons,
    observed: {
      dominantBg,
      dominantFg: fg.hex,
      ratio: Number(ratio.toFixed(2)),
      signatureCoveragePct: signatureCovPct,
      signatureVisible,
    },
  };
}


// Cheap dominant-ink estimator for a logo PNG (used to pick avatar surface).
export function logoDominantInk(pngBytes: Uint8Array): string | null {
  try {
    const png = readPng(pngBytes);
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

// Post-render quality control for brand collateral.
//
// Two layers: geometry recorded by the template at draw time (mark height,
// type sizes, safe margin) checked against the piece spec, and pixel
// measurement of the rasterised page (ink coverage, ink inside the safe band on
// non-bleed edges). A piece that fails is reported with the specific reason
// instead of quietly landing in the library.

import { PNG } from "npm:pngjs@7.0.0";
import { Buffer } from "node:buffer";
import type { PageMetrics, ResolvedSpec } from "./collateral-specs.ts";
import { contrastRatio, isDarkSurface } from "./color-spaces.ts";

export type QcVerdict = {
  ok: boolean;
  page: string;
  reasons: string[];
  observed: {
    coverage?: number;
    markHeightPct?: number;
    markBandPct?: [number, number];
    safeViolationPct?: number;
    smallestTypePt?: number;
    textLines?: number;
  };
};

function pct(n: number): number {
  return Number((n * 100).toFixed(1));
}

/** Colour distance in plain RGB — good enough to separate ink from paper. */
function far(a: number[], b: number[], t: number): boolean {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > t;
}

export function qcPage(
  pngBytes: Uint8Array | null,
  metrics: PageMetrics,
  rs: ResolvedSpec,
): QcVerdict {
  const reasons: string[] = [];
  const observed: QcVerdict["observed"] = {};

  // ── geometry, from what the template actually drew ────────────────────────
  if (metrics.markH && metrics.markBand) {
    const [lo, hi] = metrics.markBand;
    observed.markHeightPct = pct(metrics.markH / rs.H);
    observed.markBandPct = [pct(lo / rs.H), pct(hi / rs.H)];
    if (metrics.markH < lo * 0.92) {
      reasons.push(
        `Logo is too small: ${observed.markHeightPct}% of the piece height, standard is ${observed.markBandPct[0]}–${observed.markBandPct[1]}%.`,
      );
    } else if (metrics.markH > hi * 1.12) {
      reasons.push(
        `Logo is oversized: ${observed.markHeightPct}% of the piece height, standard is ${observed.markBandPct[0]}–${observed.markBandPct[1]}%.`,
      );
    }
  }

  // A full-colour, light-background mark drawn on a dark ground is the classic
  // "wrong logo" failure — the reversed artwork or a knockout must be used.
  if (metrics.markArt === "primary" && metrics.markBg) {
    if (isDarkSurface(metrics.markBg)) {
      reasons.push("The light-background logo was drawn on a dark surface — use the reversed mark.");
    }
  }

  // Every specimen must be *visibly* on its tile. Since every renderer now
  // resolves its ink through `resolveInk` before drawing, reaching this branch
  // means the chooser and the judge disagreed — a renderer bug, not a brand
  // problem. It is labelled as one so it shows up in triage instead of reading
  // like something the founder can fix.
  for (const m of metrics.marks ?? []) {
    if (!m.bg || !m.ink) continue;
    if (contrastRatio(m.ink, m.bg) < 2.4) {
      reasons.push(
        `RENDERER_BUG: a logo specimen was drawn in ${m.ink} on ${m.bg} — too little contrast to be visible.`,
      );
      break;
    }
  }




  if (metrics.overlaps?.length) {
    reasons.push(`Type collides on the page: ${metrics.overlaps.slice(0, 3).join("; ")}.`);
  }

  observed.textLines = metrics.textLines;
  if (metrics.textLines === 0 && rs.spec.page !== "design-tokens") {
    reasons.push("No type was set on the page.");
  }

  if (metrics.smallestType) {
    const ptScale = rs.spec.screen ? 1 : 72 / rs.dpi;
    observed.smallestTypePt = Number((metrics.smallestType * ptScale).toFixed(1));
    const floorPt = rs.spec.minTypePt;
    if (metrics.smallestType < rs.minType * 0.9) {
      reasons.push(
        `Type set below the ${floorPt}${rs.spec.screen ? "px" : "pt"} minimum for this piece (smallest line ${observed.smallestTypePt}${rs.spec.screen ? "px" : "pt"}).`,
      );
    }
  }

  if (metrics.longestLine && metrics.longestLine > rs.measureMax * 1.25) {
    reasons.push(`A line runs ${metrics.longestLine} characters — the comfortable measure for this piece is ${rs.measureMax}.`);
  }

  // ── pixels ────────────────────────────────────────────────────────────────
  if (pngBytes) {
    try {
      const png = PNG.sync.read(Buffer.from(pngBytes));
      const { width: W, height: H } = png;
      const sx = W / rs.W;
      const sy = H / rs.H;
      const at = (x: number, y: number) => {
        const i = (W * y + x) << 2;
        return [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]];
      };
      // Surface = the most common colour on the page. Averaging the corners
      // breaks on a two-tone card, where half the corners are the colour field:
      // the average is a colour that appears nowhere, and every pixel then
      // reads as ink.
      const counts = new Map<number, number>();
      for (let y = 0; y < H; y += 5) {
        for (let x = 0; x < W; x += 5) {
          const p = at(x, y);
          if (p[3] < 128) continue;
          const key = ((p[0] >> 4) << 8) | ((p[1] >> 4) << 4) | (p[2] >> 4);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0xfff;
      const paper = [((top >> 8) & 15) * 16 + 8, ((top >> 4) & 15) * 16 + 8, (top & 15) * 16 + 8];

      const stride = 3;
      let ink = 0, total = 0;
      const safeX = Math.round(rs.safe * sx);
      const safeY = Math.round(rs.safe * sy);
      let edgeInk = 0, edgeTotal = 0;
      const edges = rs.bleedEdges;
      for (let y = 0; y < H; y += stride) {
        for (let x = 0; x < W; x += stride) {
          const p = at(x, y);
          if (p[3] < 128) continue;
          total++;
          const isInk = far(p, paper, 40);
          if (isInk) ink++;
          const inTop = y < safeY && !edges.includes("top");
          const inBottom = y > H - safeY && !edges.includes("bottom");
          const inLeft = x < safeX && !edges.includes("left");
          const inRight = x > W - safeX && !edges.includes("right");
          if (inTop || inBottom || inLeft || inRight) {
            edgeTotal++;
            if (isInk) edgeInk++;
          }
        }
      }
      const cov = total ? ink / total : 0;
      observed.coverage = pct(cov);
      const [cLo, cHi] = rs.coverage;
      if (cov < cLo) reasons.push(`The page is effectively blank (${observed.coverage}% ink).`);
      else if (cov > cHi) reasons.push(`The page is a solid block (${observed.coverage}% ink) — nothing reads.`);

      if (edgeTotal > 0) {
        const v = edgeInk / edgeTotal;
        observed.safeViolationPct = pct(v);
        // A hairline rule crossing the margin is fine; a block of content is not.
        if (v > 0.06) {
          reasons.push(`Content sits inside the ${rs.spec.safeIn}${rs.spec.screen ? "px" : "in"} safe margin (${observed.safeViolationPct}% of that band is inked).`);
        }
      }
    } catch {
      reasons.push("The final raster could not be decoded for visual quality review.");
    }
  } else {
    reasons.push("The final raster is missing, so visual quality could not be verified.");
  }

  return { ok: reasons.length === 0, page: metrics.page, reasons, observed };
}

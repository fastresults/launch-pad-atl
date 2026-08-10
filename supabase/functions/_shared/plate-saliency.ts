// Corner saliency for poster compositing.
//
// A brand mark parked on a face is wrong no matter how well it contrasts.
// This module scores the four corners of the plate on emptiness FIRST
// (low edge energy, no skin) and legibility second, and hard-vetoes any
// corner that reads as a face or collides with the type block.

import type { PlateSampler } from "./plate-sample.ts";

export type CornerId = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type CornerScore = {
  corner: CornerId;
  /** Higher is better. Vetoed corners score below -50. */
  score: number;
  edge: number;
  skinPct: number;
  /** true when the region very likely contains a face. */
  faceLikely: boolean;
  vetoed: boolean;
  reason: string | null;
};

/** Above this share of skin-tone pixels we treat the region as a face/person. */
const FACE_SKIN_THRESHOLD = 0.22;

export function scoreCorners(args: {
  sampler: PlateSampler;
  W: number;
  H: number;
  /** Box the mark would occupy in each corner, keyed by corner. */
  boxes: Record<CornerId, { x: number; y: number; w: number; h: number }>;
  /** Corners that collide with the type lockup. */
  collides?: Partial<Record<CornerId, boolean>>;
  /** Legibility of the best available ink over each corner (WCAG ratio). */
  contrast?: Partial<Record<CornerId, number>>;
  /** Soft preference order — small bonus, never overrides emptiness. */
  preferred?: CornerId[];
}): CornerScore[] {
  const { sampler, W, H, boxes } = args;
  const out: CornerScore[] = [];
  const corners = Object.keys(boxes) as CornerId[];

  for (const corner of corners) {
    const b = boxes[corner];
    // Probe a slightly generous halo so a mark never crowds a face just
    // outside its own box.
    const pad = Math.round(Math.min(W, H) * 0.02);
    const d = sampler.detail(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2, W, H);
    const edge = d?.edge ?? 0.12;
    const skinPct = d?.skinPct ?? 0;
    const faceLikely = skinPct >= FACE_SKIN_THRESHOLD;
    const collide = !!args.collides?.[corner];
    const ratio = args.contrast?.[corner] ?? 4.5;
    const prefIdx = args.preferred?.indexOf(corner) ?? -1;

    let score = 0;
    let reason: string | null = null;
    // Emptiness dominates: a calm corner is worth more than a high-contrast
    // busy one, because the mark is a detail, not the message.
    score += (1 - Math.min(1, edge / 0.22)) * 10;
    score += Math.min(ratio, 12) * 0.6;
    score += prefIdx >= 0 ? (args.preferred!.length - prefIdx) * 0.4 : 0;
    score -= skinPct * 12;

    let vetoed = false;
    if (faceLikely) { vetoed = true; reason = "face"; score -= 100; }
    if (collide) { vetoed = true; reason = reason ?? "type-collision"; score -= 100; }

    out.push({ corner, score, edge, skinPct, faceLikely, vetoed, reason });
  }

  out.sort((a, b) => b.score - a.score);
  return out;
}

/**
 * Best corner overall.
 *
 * NOTE: this returns a vetoed corner as a last resort and must never be used
 * to place a brand mark on its own — use `resolveMarkPlacement`, which refuses
 * to return a placement that sits on a face or on a text element.
 */
export function pickCorner(scores: CornerScore[]): CornerScore | null {
  if (!scores.length) return null;
  return scores.find((s) => !s.vetoed) ?? scores[0];
}

export type Rect = { x: number; y: number; w: number; h: number };

export function rectsIntersect(a: Rect, b: Rect, guard = 0): boolean {
  return !(
    a.x + a.w + guard <= b.x ||
    b.x + b.w + guard <= a.x ||
    a.y + a.h + guard <= b.y ||
    b.y + b.h + guard <= a.y
  );
}

export type MarkPlacement = {
  corner: CornerId;
  box: Rect;
  /** Size multiplier that was accepted (1 = full size). */
  scale: number;
  score: number;
  edge: number;
  skinPct: number;
  /** true when at least one candidate corner read as a face. */
  faceAvoided: boolean;
  /** true when at least one candidate corner collided with a text element. */
  textAvoided: boolean;
};

/**
 * Hard placement contract for a brand mark:
 *  - never over a face / person (skin-heavy region),
 *  - never over a text element (headline, kicker, CTA pill, any caller rect),
 *  - shrink before compromising,
 *  - if no legal position exists, return null so the caller omits the mark.
 */
export function resolveMarkPlacement(args: {
  sampler: PlateSampler;
  W: number;
  H: number;
  /** Box the mark would occupy for a given corner at a given size multiplier. */
  makeBox: (corner: CornerId, scale: number) => Rect;
  /** Text elements and any other no-go zones. */
  forbidden?: (Rect | null | undefined)[];
  /** Clearance kept between the mark and a forbidden rect. */
  guard?: number;
  /** Legibility of the best ink over a given box (WCAG ratio). */
  contrastFor?: (box: Rect) => number;
  preferred?: CornerId[];
  /** Size multipliers tried in order; the mark shrinks rather than collide. */
  scales?: number[];
}): MarkPlacement | null {
  const corners: CornerId[] = ["top-left", "top-right", "bottom-left", "bottom-right"];
  const scales = args.scales ?? [1, 0.8, 0.62];
  const guard = args.guard ?? Math.round(Math.min(args.W, args.H) * 0.02);
  const forbidden = (args.forbidden ?? []).filter(Boolean) as Rect[];

  let faceSeen = false;
  let textSeen = false;

  for (const scale of scales) {
    const boxes = {} as Record<CornerId, Rect>;
    const collides: Partial<Record<CornerId, boolean>> = {};
    const contrast: Partial<Record<CornerId, number>> = {};
    for (const corner of corners) {
      const box = args.makeBox(corner, scale);
      boxes[corner] = box;
      collides[corner] = forbidden.some((f) => rectsIntersect(box, f, guard));
      if (args.contrastFor) contrast[corner] = args.contrastFor(box);
    }

    const scores = scoreCorners({
      sampler: args.sampler,
      W: args.W,
      H: args.H,
      boxes,
      collides,
      contrast,
      preferred: args.preferred,
    });
    faceSeen = faceSeen || scores.some((s) => s.faceLikely);
    textSeen = textSeen || corners.some((c) => collides[c]);

    // Only a fully legal corner is acceptable — no "least bad" fallback.
    const legal = scores.find((s) => !s.vetoed);
    if (legal) {
      return {
        corner: legal.corner,
        box: boxes[legal.corner],
        scale,
        score: legal.score,
        edge: legal.edge,
        skinPct: legal.skinPct,
        faceAvoided: faceSeen,
        textAvoided: textSeen,
      };
    }
  }

  return null;
}

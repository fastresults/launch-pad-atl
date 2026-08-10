// Print/identity specs for every collateral piece.
//
// Each template used to carry its own hand-typed constants, so nothing said how
// big a logo should be on a 3.5x2in card or how far ink must stay from the
// trim. These specs encode the standards a print producer would check, as
// ratios of the trim, so they hold at any DPI. Templates ask the spec for their
// geometry; QC measures the rendered page against the same numbers.

export type BleedEdge = "top" | "right" | "bottom" | "left";

export type PieceSpec = {
  /** Page name this spec governs. */
  page: string;
  /** Trim size in inches (or CSS px for screen pieces). */
  widthIn: number;
  heightIn: number;
  /** Rendered trim in px — matches what the template draws. */
  trimW: number;
  trimH: number;
  /** Print bleed in inches. 0 for screen pieces. */
  bleedIn: number;
  /** Minimum distance from trim to any content, in inches. */
  safeIn: number;
  /** Mark height as a fraction of trim height — [min, max]. */
  logo: [number, number];
  /** Same band for a wide lockup, which reads larger at the same height. */
  logoLockup?: [number, number];
  /** Clear space around the mark, as a multiple of the mark's own height. */
  clearSpace: number;
  /** Smallest permissible type, in points (px for screen pieces). */
  minTypePt: number;
  /** Longest comfortable line, in characters. */
  measureMax: number;
  /** Edges a colour field may bleed off. */
  bleedEdges: BleedEdge[];
  /** Emit crop/trim marks on the vector master. */
  cropMarks: boolean;
  /** Ink coverage band for the whole page — catches blanks and solid blocks. */
  coverage: [number, number];
  /** Screen piece: minTypePt and safeIn are already in px/px-equivalents. */
  screen?: boolean;
};

const IN = (n: number) => n;

export const PIECE_SPECS: PieceSpec[] = [
  {
    page: "business-card-front",
    widthIn: 3.5, heightIn: 2, trimW: 1050, trimH: 600,
    bleedIn: 0.125, safeIn: 0.15,
    logo: [0.22, 0.32], logoLockup: [0.16, 0.24],
    clearSpace: 0.5, minTypePt: 6.5, measureMax: 45,
    bleedEdges: ["top", "right", "bottom", "left"], cropMarks: true,
    coverage: [0.02, 0.9],
  },
  {
    page: "business-card-back",
    widthIn: 3.5, heightIn: 2, trimW: 1050, trimH: 600,
    bleedIn: 0.125, safeIn: 0.15,
    logo: [0.12, 0.2], logoLockup: [0.1, 0.16],
    clearSpace: 0.5, minTypePt: 6.5, measureMax: 45,
    bleedEdges: ["left"], cropMarks: true,
    coverage: [0.01, 0.7],
  },
  {
    page: "letterhead",
    widthIn: 8.5, heightIn: 11, trimW: 1275, trimH: 1650,
    bleedIn: 0.125, safeIn: 0.5,
    logo: [0.07, 0.1], logoLockup: [0.05, 0.08],
    clearSpace: 0.5, minTypePt: 8, measureMax: 75,
    bleedEdges: ["top"], cropMarks: true,
    coverage: [0.01, 0.5],
  },
  {
    page: "envelope-no10",
    widthIn: 9.5, heightIn: 4.125, trimW: 1425, trimH: 619,
    bleedIn: 0.125, safeIn: 0.375,
    logo: [0.14, 0.22], logoLockup: [0.1, 0.17],
    clearSpace: 0.5, minTypePt: 8, measureMax: 55,
    bleedEdges: ["bottom"], cropMarks: true,
    coverage: [0.005, 0.45],
  },
  {
    page: "notecard",
    widthIn: 5.5, heightIn: 4.25, trimW: 1050, trimH: 750,
    bleedIn: 0.125, safeIn: 0.3,
    logo: [0.18, 0.28], logoLockup: [0.13, 0.22],
    clearSpace: 0.6, minTypePt: 7, measureMax: 55,
    bleedEdges: ["top", "right", "bottom", "left"], cropMarks: true,
    // A notecard is meant to be mostly empty — the writing area is the design.
    coverage: [0.004, 0.95],
  },
  {
    page: "email-signature",
    widthIn: 1200, heightIn: 340, trimW: 1200, trimH: 340,
    bleedIn: 0, safeIn: 24,
    logo: [0.42, 0.58], logoLockup: [0.3, 0.46],
    clearSpace: 0.45, minTypePt: 22, measureMax: 60,
    bleedEdges: [], cropMarks: false,
    coverage: [0.005, 0.5], screen: true,
  },
  {
    page: "invoice",
    widthIn: 8.5, heightIn: 11, trimW: 1275, trimH: 1650,
    bleedIn: 0.125, safeIn: 0.5,
    logo: [0.06, 0.09], logoLockup: [0.045, 0.075],
    clearSpace: 0.5, minTypePt: 8, measureMax: 75,
    bleedEdges: ["top"], cropMarks: true,
    coverage: [0.01, 0.5],
  },
  {
    page: "proposal",
    widthIn: 8.5, heightIn: 11, trimW: 1275, trimH: 1650,
    bleedIn: 0.125, safeIn: 0.5,
    logo: [0.06, 0.09], logoLockup: [0.045, 0.075],
    clearSpace: 0.5, minTypePt: 8, measureMax: 75,
    bleedEdges: ["top"], cropMarks: true,
    coverage: [0.01, 0.5],
  },
  {
    page: "slide-cover",
    widthIn: 1920, heightIn: 1080, trimW: 1920, trimH: 1080,
    bleedIn: 0, safeIn: 0.06 * 1080,
    logo: [0.1, 0.15], logoLockup: [0.07, 0.12],
    clearSpace: 0.5, minTypePt: 26, measureMax: 65,
    bleedEdges: ["top", "right", "bottom", "left"], cropMarks: false,
    coverage: [0.005, 0.98], screen: true,
  },
  {
    page: "slide",
    widthIn: 1920, heightIn: 1080, trimW: 1920, trimH: 1080,
    bleedIn: 0, safeIn: 0.06 * 1080,
    logo: [0.045, 0.075], logoLockup: [0.035, 0.06],
    clearSpace: 0.5, minTypePt: 22, measureMax: 65,
    bleedEdges: ["top", "right", "bottom", "left"], cropMarks: false,
    coverage: [0.005, 0.98], screen: true,
  },
  {
    // The closing slide signs off with the mark — it is the subject, like a
    // title card, so it carries a display band rather than the running one.
    page: "slide-closing",
    widthIn: 1920, heightIn: 1080, trimW: 1920, trimH: 1080,
    bleedIn: 0, safeIn: 0.06 * 1080,
    logo: [0.08, 0.16], logoLockup: [0.06, 0.13],
    clearSpace: 0.5, minTypePt: 22, measureMax: 65,
    bleedEdges: ["top", "right", "bottom", "left"], cropMarks: false,
    coverage: [0.005, 0.98], screen: true,
  },
  {
    page: "guidelines-cover",
    widthIn: 1600, heightIn: 1000, trimW: 1600, trimH: 1000,
    bleedIn: 0, safeIn: 0.05 * 1000,
    logo: [0.16, 0.24], logoLockup: [0.12, 0.19],
    clearSpace: 0.5, minTypePt: 18, measureMax: 75,
    bleedEdges: ["top", "right", "bottom", "left"], cropMarks: false,
    coverage: [0.005, 0.98], screen: true,
  },
  {
    // The logo page *is* a specimen sheet — the mark is the subject, so it is
    // shown far larger than it would sit on a running page.
    page: "guidelines-2-logo",
    widthIn: 1600, heightIn: 1000, trimW: 1600, trimH: 1000,
    bleedIn: 0, safeIn: 0.05 * 1000,
    logo: [0.10, 0.34], logoLockup: [0.08, 0.28],
    clearSpace: 0.5, minTypePt: 16, measureMax: 75,
    bleedEdges: [], cropMarks: false,
    coverage: [0.005, 0.9], screen: true,
  },
  {
    // Clear space and misuse pages draw the mark many times at deliberately
    // different sizes, so the band has to span from thumbnail to specimen.
    page: "guidelines-specimen",
    widthIn: 1600, heightIn: 1000, trimW: 1600, trimH: 1000,
    bleedIn: 0, safeIn: 0.05 * 1000,
    logo: [0.03, 0.42], logoLockup: [0.03, 0.36],
    clearSpace: 0.5, minTypePt: 15, measureMax: 75,
    bleedEdges: [], cropMarks: false,
    coverage: [0.004, 0.9], screen: true,
  },
  {
    page: "guidelines",
    widthIn: 1600, heightIn: 1000, trimW: 1600, trimH: 1000,
    bleedIn: 0, safeIn: 0.05 * 1000,
    logo: [0.08, 0.16], logoLockup: [0.06, 0.13],
    clearSpace: 0.5, minTypePt: 16, measureMax: 75,
    bleedEdges: [], cropMarks: false,
    coverage: [0.005, 0.9], screen: true,
  },

];

/** Resolved, in page pixels. */
export type ResolvedSpec = {
  spec: PieceSpec;
  W: number;
  H: number;
  dpi: number;
  bleed: number;
  safe: number;
  /** Smallest permissible type in page px. */
  minType: number;
  measureMax: number;
  clearSpace: number;
  bleedEdges: BleedEdge[];
  cropMarks: boolean;
  coverage: [number, number];
  /** Mark height band in page px. */
  logoBand: [number, number];
  /** Mark height band for a wide lockup, in page px. */
  lockupBand: [number, number];
};

function specFor(pageName: string): PieceSpec {
  const exact = PIECE_SPECS.find((s) => s.page === pageName);
  if (exact) return exact;
  if (/^slide-1-cover/.test(pageName)) return PIECE_SPECS.find((s) => s.page === "slide-cover")!;
  if (/^slide-.*closing/.test(pageName)) return PIECE_SPECS.find((s) => s.page === "slide-closing")!;
  if (/^slide-/.test(pageName)) return PIECE_SPECS.find((s) => s.page === "slide")!;
  if (/^guidelines-1-cover/.test(pageName)) return PIECE_SPECS.find((s) => s.page === "guidelines-cover")!;
  if (/^guidelines-.*(clearspace|misuse)/.test(pageName)) return PIECE_SPECS.find((s) => s.page === "guidelines-specimen")!;
  if (/^guidelines-.*logo/.test(pageName)) return PIECE_SPECS.find((s) => s.page === "guidelines-2-logo")!;

  if (/^guidelines-/.test(pageName)) return PIECE_SPECS.find((s) => s.page === "guidelines")!;

  return PIECE_SPECS.find((s) => s.page === "letterhead")!;
}

/**
 * Resolve a spec against the page the template is actually drawing. Ratios stay
 * ratios, so a page rendered at a different pixel size still obeys the same
 * physical standard.
 */
export function resolveSpec(pageName: string, W?: number, H?: number): ResolvedSpec {
  const spec = specFor(pageName);
  const w = W ?? spec.trimW;
  const h = H ?? spec.trimH;
  const dpi = spec.screen ? 72 : w / IN(spec.widthIn);
  const px = (inches: number) => (spec.screen ? inches : inches * dpi);
  return {
    spec,
    W: w,
    H: h,
    dpi,
    bleed: Math.round(px(spec.bleedIn)),
    safe: Math.round(px(spec.safeIn)),
    minType: spec.screen ? spec.minTypePt : (spec.minTypePt / 72) * dpi,
    measureMax: spec.measureMax,
    clearSpace: spec.clearSpace,
    bleedEdges: spec.bleedEdges,
    cropMarks: spec.cropMarks,
    coverage: spec.coverage,
    logoBand: [spec.logo[0] * h, spec.logo[1] * h],
    lockupBand: [(spec.logoLockup ?? spec.logo)[0] * h, (spec.logoLockup ?? spec.logo)[1] * h],
  };
}

/**
 * The mark's box for this piece: a height inside the spec band, and the width
 * its own aspect demands. `bias` picks a point in the band (0 = min, 1 = max).
 */
export function logoBox(
  rs: ResolvedSpec,
  aspect: number,
  isLockup: boolean,
  maxWidth: number,
  bias = 0.85,
  fillWidth = false,
): { w: number; h: number; clear: number } {
  const [lo, hi] = isLockup ? rs.lockupBand : rs.logoBand;
  // `fillWidth` lets a wide lockup use the slot it was given, still clamped to
  // the legal height band — a lockup set at a square mark's height reads tiny.
  let h = fillWidth
    ? Math.min(hi, Math.max(lo, maxWidth / Math.max(aspect, 0.2)))
    : lo + (hi - lo) * Math.min(1, Math.max(0, bias));
  let w = h * Math.max(aspect, 0.2);
  if (w > maxWidth) {
    // Never break the band to fit a column: narrow the box, keep the height
    // legal, and let the caller give it a wider slot if it needs one.
    const scaled = maxWidth / Math.max(aspect, 0.2);
    h = Math.max(lo, Math.min(h, scaled));
    w = Math.min(maxWidth, h * Math.max(aspect, 0.2));
  }
  return { w: Math.round(w), h: Math.round(h), clear: Math.round(h * rs.clearSpace) };
}

/**
 * Machine-readable print metadata for the vector master, so a printer (or any
 * downstream tool) knows the trim, bleed and safe area the page was built to.
 */
export function printMeta(rs: ResolvedSpec): string {
  return ` data-trim="${rs.W}x${rs.H}" data-bleed="${rs.bleed}" data-safe="${rs.safe}" data-piece="${rs.spec.page}"`;
}

/** Per-page geometry recorded at render time so QC can verify it. */
export type PageMetrics = {
  page: string;
  markH?: number;
  markW?: number;
  markBand?: [number, number];
  /** Which artwork the mark was drawn from: primary | reversed | knockout | plated. */
  markArt?: string;
  /** The surface the mark landed on, so QC can catch a light mark on a dark ground. */
  markBg?: string;
  /** Every mark drawn on the page, with the ink and surface it actually used. */
  marks?: Array<{ h: number; art: string; bg: string; ink: string }>;

  safe: number;
  bleed: number;
  minType: number;
  textLines: number;
  smallestType?: number;
  longestLine?: number;
  /** Pairs of type that share pixels — the collision defect, named. */
  overlaps?: string[];
};


// Measure what a logo actually *draws*, not what its file claims.
//
// A traced mark carries whatever padding the tracer's canvas had — the saved
// artwork we checked is 1408x768 with ink only inside x 152–1277, y 150–583.
// Sizing that file at "22% of card height" puts 12% of visible logo on the
// card, which is why every piece read small. Everything here works off the ink
// bounding box instead, and isolates the drawn symbol from a traced wordmark so
// the company name can be set in real type rather than shipped as polygons.

export type InkBox = { x: number; y: number; w: number; h: number; vw: number; vh: number };

type Shape = { tag: string; x0: number; y0: number; x1: number; y1: number };

const SHAPE_RE = /<(path|polygon|polyline|rect|circle|ellipse|line)\b[^>]*\/?>(?:\s*<\/(?:path|polygon|polyline|rect|circle|ellipse|line)>)?/gi;

function attr(tag: string, name: string): string {
  return new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i").exec(tag)?.[1]?.trim() ?? "";
}

/** Near-white paint — a background plate, not artwork. */
function isPlatePaint(tag: string): boolean {
  const paint = `${attr(tag, "fill")} ${attr(tag, "style")}`.toLowerCase();
  if (/fill\s*[:=]?\s*none/.test(paint)) return false;
  const rgb = /rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(paint);
  if (rgb) {
    const [r, g, b] = [1, 2, 3].map((i) => Number(rgb[i]));
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.93;
  }
  const hex = /#([0-9a-f]{3,8})/.exec(paint)?.[1];
  if (hex) {
    const h = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex.slice(0, 6);
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.93;
  }
  if (/\bwhite\b/.test(paint)) return true;
  return false;
}

function bboxOfNumbers(src: string): { x0: number; y0: number; x1: number; y1: number } | null {
  const nums = src.match(/-?\d*\.?\d+(?:e-?\d+)?/gi)?.map(Number) ?? [];
  if (nums.length < 4) return null;
  const even = nums.length - (nums.length % 2);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < even; i += 2) {
    if (!Number.isFinite(nums[i]) || !Number.isFinite(nums[i + 1])) continue;
    x0 = Math.min(x0, nums[i]); x1 = Math.max(x1, nums[i]);
    y0 = Math.min(y0, nums[i + 1]); y1 = Math.max(y1, nums[i + 1]);
  }
  return Number.isFinite(x0) && Number.isFinite(y0) ? { x0, y0, x1, y1 } : null;
}

function shapeBox(tag: string, el: string): { x0: number; y0: number; x1: number; y1: number } | null {
  const num = (n: string, d = 0) => {
    const v = parseFloat(attr(tag, n));
    return Number.isFinite(v) ? v : d;
  };
  switch (el.toLowerCase()) {
    case "rect": {
      const x = num("x"), y = num("y"), w = num("width"), h = num("height");
      return w > 0 && h > 0 ? { x0: x, y0: y, x1: x + w, y1: y + h } : null;
    }
    case "circle": {
      const cx = num("cx"), cy = num("cy"), r = num("r");
      return r > 0 ? { x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r } : null;
    }
    case "ellipse": {
      const cx = num("cx"), cy = num("cy"), rx = num("rx"), ry = num("ry");
      return rx > 0 && ry > 0 ? { x0: cx - rx, y0: cy - ry, x1: cx + rx, y1: cy + ry } : null;
    }
    case "line":
      return { x0: Math.min(num("x1"), num("x2")), y0: Math.min(num("y1"), num("y2")), x1: Math.max(num("x1"), num("x2")), y1: Math.max(num("y1"), num("y2")) };
    case "polygon":
    case "polyline":
      return bboxOfNumbers(attr(tag, "points"));
    default:
      return bboxOfNumbers(attr(tag, "d"));
  }
}

export function viewBoxOf(svg: string): { x: number; y: number; w: number; h: number } {
  const vb = /viewBox\s*=\s*["']([\d.\-\s,eE+]+)["']/i.exec(svg)?.[1];
  if (vb) {
    const p = vb.trim().split(/[\s,]+/).map(Number);
    if (p.length === 4 && p[2] > 0 && p[3] > 0) return { x: p[0], y: p[1], w: p[2], h: p[3] };
  }
  const w = parseFloat(/\bwidth\s*=\s*["']([\d.]+)/i.exec(svg)?.[1] ?? "");
  const h = parseFloat(/\bheight\s*=\s*["']([\d.]+)/i.exec(svg)?.[1] ?? "");
  return { x: 0, y: 0, w: w > 0 ? w : 1024, h: h > 0 ? h : 1024 };
}

/** Every painted, non-plate shape with its own bounding box. */
function inkShapes(svg: string, vb: { w: number; h: number }): Shape[] {
  const out: Shape[] = [];
  for (const m of svg.matchAll(SHAPE_RE)) {
    const tag = m[0];
    const el = m[1];
    if (isPlatePaint(tag)) continue;
    const b = shapeBox(tag, el);
    if (!b) continue;
    const w = b.x1 - b.x0, h = b.y1 - b.y0;
    if (w <= 0 || h <= 0) continue;
    // A shape covering the whole canvas is a plate even when it is painted.
    if (w >= vb.w * 0.985 && h >= vb.h * 0.985) continue;
    out.push({ tag, ...b });
  }
  return out;
}

const inkCache = new Map<string, InkBox>();

/** The box the artwork really occupies, in the file's own user units. */
export function inkBox(svg: string): InkBox {
  const key = svg.length + ":" + svg.slice(0, 96) + svg.slice(-48);
  const hit = inkCache.get(key);
  if (hit) return hit;
  const vb = viewBoxOf(svg);
  const shapes = inkShapes(svg, vb);
  let box: InkBox;
  if (!shapes.length) {
    box = { x: vb.x, y: vb.y, w: vb.w, h: vb.h, vw: vb.w, vh: vb.h };
  } else {
    const x0 = Math.min(...shapes.map((s) => s.x0));
    const y0 = Math.min(...shapes.map((s) => s.y0));
    const x1 = Math.max(...shapes.map((s) => s.x1));
    const y1 = Math.max(...shapes.map((s) => s.y1));
    box = {
      x: Math.max(vb.x, x0),
      y: Math.max(vb.y, y0),
      w: Math.max(1, Math.min(vb.x + vb.w, x1) - Math.max(vb.x, x0)),
      h: Math.max(1, Math.min(vb.y + vb.h, y1) - Math.max(vb.y, y0)),
      vw: vb.w,
      vh: vb.h,
    };
  }
  if (inkCache.size > 24) inkCache.clear();
  inkCache.set(key, box);
  return box;
}

/** Ink aspect (w/h) — what fitting and clear space should be driven by. */
export function inkAspect(svg: string): number {
  const b = inkBox(svg);
  return b.h > 0 ? b.w / b.h : 1;
}

export type SymbolSplit = {
  /** Symbol-only SVG, tightly cropped to its ink. */
  symbol: string;
  /** Fraction of the ink width the wordmark occupied. */
  wordmarkShare: number;
};

/**
 * Split a traced lockup into symbol + (discarded) traced wordmark.
 *
 * Traced type is polygons, not letterforms: stems wobble, counters fill in and
 * edges chip at print size. When we can isolate the drawn symbol, collateral
 * pairs it with the company name set in the brand's real typeface instead.
 */
export function isolateSymbol(svg: string): SymbolSplit | null {
  const vb = viewBoxOf(svg);
  const shapes = inkShapes(svg, vb);
  if (shapes.length < 6) return null;

  const inkX0 = Math.min(...shapes.map((s) => s.x0));
  const inkX1 = Math.max(...shapes.map((s) => s.x1));
  const inkW = inkX1 - inkX0;
  if (inkW <= 0) return null;

  // Find the widest vertical corridor with no ink in it — the gap between the
  // symbol and the wordmark in a horizontal lockup.
  const sorted = [...shapes].sort((a, b) => a.x0 - b.x0);
  let reach = sorted[0].x1;
  let gap = { at: 0, size: 0 };
  for (const s of sorted.slice(1)) {
    if (s.x0 - reach > gap.size) gap = { at: reach, size: s.x0 - reach };
    reach = Math.max(reach, s.x1);
  }
  if (gap.size < inkW * 0.03) return null;

  const left = shapes.filter((s) => s.x1 <= gap.at + 0.01);
  const right = shapes.filter((s) => s.x0 >= gap.at + gap.size - 0.01);
  if (!left.length || right.length < 4) return null;

  const lw = Math.max(...left.map((s) => s.x1)) - Math.min(...left.map((s) => s.x0));
  const lh = Math.max(...left.map((s) => s.y1)) - Math.min(...left.map((s) => s.y0));
  const rw = Math.max(...right.map((s) => s.x1)) - Math.min(...right.map((s) => s.x0));
  if (lw <= 0 || lh <= 0) return null;

  // The symbol side is compact; the wordmark side is wide, busy and shorter.
  const aspect = lw / lh;
  if (aspect < 0.45 || aspect > 2) return null;
  if (rw < inkW * 0.25) return null;
  if (right.length < left.length * 0.6 && right.length < 8) return null;

  const x0 = Math.min(...left.map((s) => s.x0));
  const y0 = Math.min(...left.map((s) => s.y0));
  const body = left.map((s) => s.tag).join("");
  const symbol =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${round(x0)} ${round(y0)} ${round(lw)} ${round(lh)}" width="${round(lw)}" height="${round(lh)}">${body}</svg>`;

  return { symbol, wordmarkShare: rw / inkW };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

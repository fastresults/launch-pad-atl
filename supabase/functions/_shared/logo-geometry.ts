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

/* ------------------------------------------------------------------ *
 * VECTOR SPEC — the drawn logo model shared by the Logo Studio stages.
 * The model returns primitives on a 1000x1000 construction grid; these
 * helpers normalise them, grade them, and typeset the lockup family.
 * ------------------------------------------------------------------ */

export const LOGO_CANVAS = 1000;

export type Construction = {
  module: number;
  stroke_weight: number;
  radii?: number[];
  symmetry?: string;
};

export type VectorPrimitive = {
  kind: string;
  d?: string;
  points?: string;
  x?: number; y?: number; width?: number; height?: number; rx?: number; ry?: number;
  cx?: number; cy?: number; r?: number;
  x1?: number; y1?: number; x2?: number; y2?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeLinecap?: string;
  strokeLinejoin?: string;
  opacity?: number;
};

export type VectorWordmark = {
  text: string;
  case?: string;
  weight?: number;
  tracking?: number;
};

export type VectorSpec = {
  construction: Construction;
  primitives: VectorPrimitive[];
  wordmark?: VectorWordmark;
  rationale?: string;
  quality_scores?: Record<string, number>;
};

export type VectorLint = {
  pass: boolean;
  score: number;
  findings: string[];
  metrics: Record<string, number>;
};

const MAX_PRIMITIVES = 12;
const TOKEN_KEYS = ["primary", "secondary", "accent", "ink", "neutral", "background", "surface"];

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Normalise model output against the construction grid: every stroke snaps to
 * the declared weight family, paints fall back to brand tokens, and anything
 * undrawable is dropped.
 */
export function applyConstruction(primitives: any[], construction: Construction): VectorPrimitive[] {
  const weight = Math.max(4, num(construction?.stroke_weight, 80));
  const out: VectorPrimitive[] = [];
  for (const raw of Array.isArray(primitives) ? primitives : []) {
    if (!raw || typeof raw !== "object") continue;
    const kind = String(raw.kind ?? raw.type ?? "path").toLowerCase();
    const p: VectorPrimitive = { kind };
    if (kind === "path") {
      const d = String(raw.d ?? "").trim();
      if (!d) continue;
      p.d = d;
    } else if (kind === "polygon" || kind === "polyline") {
      const pts = String(raw.points ?? "").trim();
      if (!pts) continue;
      p.points = pts;
    } else if (kind === "circle") {
      p.cx = num(raw.cx, LOGO_CANVAS / 2); p.cy = num(raw.cy, LOGO_CANVAS / 2); p.r = num(raw.r, 0);
      if (!(p.r! > 0)) continue;
    } else if (kind === "ellipse") {
      p.cx = num(raw.cx, LOGO_CANVAS / 2); p.cy = num(raw.cy, LOGO_CANVAS / 2);
      p.rx = num(raw.rx, 0); p.ry = num(raw.ry, 0);
      if (!(p.rx! > 0 && p.ry! > 0)) continue;
    } else if (kind === "rect") {
      p.x = num(raw.x, 0); p.y = num(raw.y, 0);
      p.width = num(raw.width ?? raw.w, 0); p.height = num(raw.height ?? raw.h, 0);
      const radii = Array.isArray(construction?.radii) ? construction.radii.filter((n) => Number.isFinite(n)) : [];
      const rx = raw.rx != null ? num(raw.rx, 0) : (radii[0] ?? 0);
      if (rx > 0) { p.rx = rx; p.ry = num(raw.ry, rx); }
      if (!(p.width! > 0 && p.height! > 0)) continue;
    } else if (kind === "line") {
      p.x1 = num(raw.x1, 0); p.y1 = num(raw.y1, 0); p.x2 = num(raw.x2, 0); p.y2 = num(raw.y2, 0);
    } else {
      const d = String(raw.d ?? "").trim();
      if (!d) continue;
      p.kind = "path";
      p.d = d;
    }

    const fill = String(raw.fill ?? "").trim();
    const stroke = String(raw.stroke ?? "").trim();
    p.fill = fill || (stroke ? "none" : "primary");
    p.stroke = stroke || "none";
    if (p.stroke !== "none") {
      const w = num(raw.strokeWidth ?? raw.stroke_width, weight);
      // Keep strokes in the declared weight family: full, half, or quarter.
      const ratios = [1, 0.5, 0.25, 1.5, 2];
      const snapped = ratios
        .map((r) => weight * r)
        .reduce((best, cand) => (Math.abs(cand - w) < Math.abs(best - w) ? cand : best), weight);
      p.strokeWidth = Math.round(snapped);
      p.strokeLinecap = String(raw.strokeLinecap ?? "round");
      p.strokeLinejoin = String(raw.strokeLinejoin ?? "round");
    }
    const opacity = Number(raw.opacity);
    if (Number.isFinite(opacity) && opacity >= 0 && opacity < 1) p.opacity = opacity;
    out.push(p);
    if (out.length >= MAX_PRIMITIVES) break;
  }
  return out;
}

/** Grade the drawing: element economy, weight discipline, and canvas fit. */
export function lintVectorSpec(spec: VectorSpec | null): VectorLint {
  const findings: string[] = [];
  const prims = Array.isArray(spec?.primitives) ? spec!.primitives : [];
  if (!prims.length) {
    return { pass: false, score: 0, findings: ["No drawable geometry was returned — draw the mark as SVG primitives."], metrics: { elements: 0 } };
  }

  let score = 5;
  if (prims.length > MAX_PRIMITIVES) {
    findings.push(`Too many elements (${prims.length}). Redraw with 1–5 contours; 12 is the ceiling.`);
    score -= 1.5;
  } else if (prims.length > 6) {
    score -= 0.5;
  }

  const weights = prims.map((p) => Number(p.strokeWidth)).filter((n) => Number.isFinite(n) && n > 0);
  const distinct = new Set(weights.map((w) => Math.round(w)));
  if (distinct.size > 3) {
    findings.push("Stroke weights are inconsistent — keep every stroke in one weight family.");
    score -= 1;
  }

  // Canvas fit: measure the drawn ink and require it to use the grid without
  // spilling outside it.
  const svg = primitivesToSvg(prims, { primary: "#000000" });
  const box = inkBox(svg);
  const coverage = box.w > 0 && box.h > 0 ? Math.max(box.w, box.h) / LOGO_CANVAS : 0;
  const overflow = box.x < -1 || box.y < -1 || box.x + box.w > LOGO_CANVAS + 1 || box.y + box.h > LOGO_CANVAS + 1;
  if (overflow) {
    findings.push("The drawing runs off the 1000×1000 construction grid — keep all geometry inside it.");
    score -= 1;
  }
  if (coverage && coverage < 0.45) {
    findings.push("The mark sits small inside the grid — scale the geometry to fill roughly 70–90% of the canvas.");
    score -= 0.75;
  }

  score = Math.max(0, Math.min(5, score));
  return {
    pass: findings.length === 0,
    score,
    findings,
    metrics: {
      elements: prims.length,
      stroke_families: distinct.size,
      coverage: Number(coverage.toFixed(3)),
    },
  };
}

function resolveColor(token: string | undefined, colors: Record<string, string>, override?: string | null): string {
  if (override) return override;
  const t = String(token ?? "").trim();
  if (!t || t === "none") return "none";
  if (/^(#|rgb|hsl)/i.test(t)) return t;
  const key = t.toLowerCase();
  if (TOKEN_KEYS.includes(key) && colors[key]) return colors[key];
  if (key === "ink" || key === "foreground") return colors.primary ?? "#111111";
  return colors[key] ?? colors.primary ?? "#111111";
}

function primitivesToSvg(
  prims: VectorPrimitive[],
  colors: Record<string, string>,
  override?: string | null,
): string {
  const body = prims.map((p) => {
    const fill = resolveColor(p.fill, colors, p.fill === "none" ? null : override);
    const stroke = resolveColor(p.stroke, colors, p.stroke === "none" ? null : override);
    const strokeAttrs = stroke !== "none"
      ? ` stroke="${stroke}" stroke-width="${p.strokeWidth ?? 80}" stroke-linecap="${p.strokeLinecap ?? "round"}" stroke-linejoin="${p.strokeLinejoin ?? "round"}"`
      : "";
    const common = ` fill="${fill}"${strokeAttrs}${p.opacity != null ? ` opacity="${p.opacity}"` : ""}`;
    switch (p.kind) {
      case "circle": return `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}"${common}/>`;
      case "ellipse": return `<ellipse cx="${p.cx}" cy="${p.cy}" rx="${p.rx}" ry="${p.ry}"${common}/>`;
      case "rect": return `<rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}"${p.rx ? ` rx="${p.rx}" ry="${p.ry ?? p.rx}"` : ""}${common}/>`;
      case "line": return `<line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}"${common}/>`;
      case "polygon": return `<polygon points="${p.points}"${common}/>`;
      case "polyline": return `<polyline points="${p.points}"${common}/>`;
      default: return `<path d="${p.d}"${common}/>`;
    }
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LOGO_CANVAS} ${LOGO_CANVAS}">${body}</svg>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export type RenderLogoOptions = {
  layout?: "mark" | "horizontal" | "stacked";
  mono?: string | null;
  knockout?: boolean;
  wordmarkPath?: { d: string; width: number; height: number; family?: string } | null;
  fontStack?: string;
};

/**
 * Typeset one lockup from the approved construction. The symbol is always the
 * same drawing — only its placement and paint change.
 */
export function renderLogoSvg(
  spec: VectorSpec,
  tokens: any,
  companyName: string,
  opts: RenderLogoOptions = {},
): string {
  const layout = opts.layout ?? "mark";
  const colors = (tokens?.colors ?? {}) as Record<string, string>;
  const override = opts.knockout ? "#FFFFFF" : (opts.mono ?? null);
  const inkColor = override ?? colors.primary ?? "#111111";

  const symbolSvg = primitivesToSvg(spec.primitives ?? [], colors, override);
  const box = inkBox(symbolSvg);
  const sw = box.w > 0 ? box.w : LOGO_CANVAS;
  const sh = box.h > 0 ? box.h : LOGO_CANVAS;
  const inner = symbolSvg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  // Re-origin the drawing on its ink box so every lockup is optically centred.
  const symbolGroup = (x: number, y: number, h: number) => {
    const s = h / sh;
    const w = sw * s;
    return { w, node: `<g transform="translate(${x} ${y}) scale(${s}) translate(${-box.x} ${-box.y})">${inner}</g>` };
  };

  const text = String(spec.wordmark?.text ?? companyName ?? "").trim();
  const cased = spec.wordmark?.case === "upper" ? text.toUpperCase()
    : spec.wordmark?.case === "lower" ? text.toLowerCase()
    : text;

  if (layout === "mark" || !cased) {
    const pad = 40;
    const h = LOGO_CANVAS - pad * 2;
    const { w, node } = symbolGroup(0, 0, h);
    const width = Math.round(w + pad * 2);
    const inkNode = `<g transform="translate(${pad} ${pad})">${node}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${LOGO_CANVAS}" width="${width}" height="${LOGO_CANVAS}" role="img" aria-label="${esc(text || "logo")}">${inkNode}</svg>`;
  }

  const tracking = num(spec.wordmark?.tracking, 0) / 1000;
  const weight = num(spec.wordmark?.weight, 600);
  const fontStack = opts.fontStack ?? "Georgia, 'Times New Roman', serif";
  const outlined = opts.wordmarkPath;

  const wordmarkNode = (x: number, y: number, capHeight: number) => {
    if (outlined?.d && outlined.height > 0) {
      const s = capHeight / outlined.height;
      return { w: outlined.width * s, node: `<g transform="translate(${x} ${y}) scale(${s})" fill="${inkColor}"><path d="${outlined.d}"/></g>` };
    }
    const fontSize = capHeight / 0.72;
    const approxW = cased.length * fontSize * 0.58 + cased.length * fontSize * tracking;
    return {
      w: approxW,
      node: `<text x="${x}" y="${y + capHeight}" font-family="${esc(fontStack)}" font-size="${fontSize.toFixed(1)}" font-weight="${weight}" letter-spacing="${(fontSize * tracking).toFixed(2)}" fill="${inkColor}">${esc(cased)}</text>`,
    };
  };

  if (layout === "horizontal") {
    const symH = 320;
    const capH = symH * 0.42;
    const sym = symbolGroup(0, 0, symH);
    const gap = symH * 0.28;
    const word = wordmarkNode(sym.w + gap, (symH - capH) / 2, capH);
    const width = Math.round(sym.w + gap + word.w);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${symH}" width="${width}" height="${symH}" role="img" aria-label="${esc(cased)}">${sym.node}${word.node}</svg>`;
  }

  // stacked
  const symH = 420;
  const capH = symH * 0.24;
  const gap = symH * 0.22;
  const sym0 = symbolGroup(0, 0, symH);
  const word0 = wordmarkNode(0, 0, capH);
  const width = Math.round(Math.max(sym0.w, word0.w));
  const symX = (width - sym0.w) / 2;
  const sym = symbolGroup(symX, 0, symH);
  const word = wordmarkNode((width - word0.w) / 2, symH + gap, capH);
  const height = Math.round(symH + gap + capH);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(cased)}">${sym.node}${word.node}</svg>`;
}

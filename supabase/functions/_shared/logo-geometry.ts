// Logo geometry system — the discipline layer between the model and the SVG.
//
// The model PROPOSES a construction (module grid, one stroke weight, a radius
// family, primitives, optional groups with transforms). This module ENFORCES it:
// coordinates snap to the grid, stroke weights collapse to the declared value,
// the mark is optically centred and scaled into the canvas, and a deterministic
// lint reports what is still wrong so the next pass can fix exactly that.

export type PaletteKey = "primary" | "secondary" | "accent" | "none" | "white";

export type VectorNode = {
  kind: "rect" | "circle" | "ellipse" | "line" | "path" | "group";
  // rect
  x?: number; y?: number; width?: number; height?: number; rx?: number;
  // circle / ellipse
  cx?: number; cy?: number; r?: number; rxr?: number; ryr?: number;
  // line
  x1?: number; y1?: number; x2?: number; y2?: number;
  // path
  d?: string;
  fillRule?: "evenodd" | "nonzero";
  // paint
  fill?: PaletteKey;
  stroke?: PaletteKey;
  strokeWidth?: number;
  // group
  children?: VectorNode[];
  transform?: { translate?: [number, number]; rotate?: number | [number, number, number]; scale?: number | [number, number] };
};

export type Construction = {
  module: number;        // grid unit, canvas is 1000
  stroke_weight: number; // the single stroke weight for the whole mark
  radii?: number[];      // allowed corner radii
  symmetry?: string;
};

export type VectorSpec = {
  construction?: Construction;
  primitives: VectorNode[];
  wordmark?: { text: string; case?: "upper" | "title" | "lower"; weight?: number; tracking?: number };
  rationale?: string;
  quality_scores?: Record<string, number>;
};

export type LintResult = {
  pass: boolean;
  score: number;             // 0-5
  findings: string[];        // imperative, model-readable
  metrics: Record<string, number>;
};

export const CANVAS = 1000;
export const MARK_BOX = { x: 190, y: 150, width: 620, height: 620 }; // where the symbol lives
export const MAX_LEAVES = 12;

/* --------------------------- sanitisation --------------------------- */

const PATH_COMMANDS = /[MLHVCSQTAZ]/i;

export function sanitizePath(value: unknown): string {
  const path = String(value ?? "").trim();
  if (!path || path.length > 4000) throw new Error("Vector path is empty or too long");
  if (/[^0-9a-zA-Z.,+\-\s]/.test(path)) throw new Error("Vector path contains unsupported data");
  const commands = path.match(/[A-Za-z]/g) ?? [];
  if (!commands.length) throw new Error("Vector path has no commands");
  if (commands.some((c) => !PATH_COMMANDS.test(c))) throw new Error("Vector path uses an unsupported command");
  return path;
}

export function clampNumber(value: unknown, min: number, max: number, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

export function safeColor(value: unknown, fallback: string): string {
  const text = String(value ?? "").trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text : fallback;
}

function escapeXml(value: unknown): string {
  return String(value ?? "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&apos;", '"': "&quot;" }[c] ?? c));
}

/* --------------------------- normalisation --------------------------- */

function leafCount(nodes: VectorNode[]): number {
  return nodes.reduce((sum, n) => sum + (n.kind === "group" ? leafCount(n.children ?? []) : 1), 0);
}

function snap(value: number, module: number): number {
  if (!Number.isFinite(value) || module < 2) return value;
  return Math.round(value / module) * module;
}

/**
 * Snap every coordinate to the module grid and collapse stroke weights to the
 * single declared weight. Path data is snapped number-by-number, which keeps
 * curves intact while pulling their control points onto the grid.
 */
export function applyConstruction(nodes: VectorNode[], c: Construction): VectorNode[] {
  const module = clampNumber(c.module, 5, 125, 25);
  const weight = clampNumber(c.stroke_weight, 4, 120, 40);
  const walk = (list: VectorNode[]): VectorNode[] => list.map((n) => {
    if (n.kind === "group") return { ...n, children: walk(n.children ?? []) };
    const out: VectorNode = { ...n };
    for (const key of ["x", "y", "width", "height", "cx", "cy", "r", "rxr", "ryr", "x1", "y1", "x2", "y2"] as const) {
      if (typeof out[key] === "number") (out as any)[key] = snap(out[key] as number, module);
    }
    if (typeof out.d === "string") {
      out.d = out.d.replace(/-?\d+(\.\d+)?/g, (m) => String(snap(Number(m), module)));
    }
    if (out.stroke && out.stroke !== "none") out.strokeWidth = weight;
    return out;
  });
  return walk(nodes);
}

/* --------------------------- bounding box --------------------------- */

type Box = { minX: number; minY: number; maxX: number; maxY: number };

const EMPTY: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

function merge(a: Box, b: Box): Box {
  return { minX: Math.min(a.minX, b.minX), minY: Math.min(a.minY, b.minY), maxX: Math.max(a.maxX, b.maxX), maxY: Math.max(a.maxY, b.maxY) };
}

function pathBox(d: string): Box {
  // Approximate: every numeric pair in the path is treated as a point. Good
  // enough for centring and coverage checks, and never throws.
  const nums = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  let box = { ...EMPTY };
  for (let i = 0; i + 1 < nums.length; i += 2) {
    box = merge(box, { minX: nums[i], minY: nums[i + 1], maxX: nums[i], maxY: nums[i + 1] });
  }
  return box;
}

/** Apply a node transform to a box, matching the render order: translate → rotate → scale. */
function transformBox(box: Box, t?: VectorNode["transform"]): Box {
  if (!t || !Number.isFinite(box.minX)) return box;
  const sx = typeof t.scale === "number" ? t.scale : (Array.isArray(t.scale) ? t.scale[0] : 1);
  const sy = typeof t.scale === "number" ? t.scale : (Array.isArray(t.scale) ? t.scale[1] : 1);
  const angle = typeof t.rotate === "number" ? t.rotate : (Array.isArray(t.rotate) ? t.rotate[0] : 0);
  const rcx = Array.isArray(t.rotate) ? t.rotate[1] : 500;
  const rcy = Array.isArray(t.rotate) ? t.rotate[2] : 500;
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const tx = t.translate?.[0] ?? 0;
  const ty = t.translate?.[1] ?? 0;
  let out = { ...EMPTY };
  for (const [px, py] of [[box.minX, box.minY], [box.maxX, box.minY], [box.minX, box.maxY], [box.maxX, box.maxY]]) {
    let x = px * (sx || 1);
    let y = py * (sy || 1);
    if (angle) {
      const dx = x - rcx;
      const dy = y - rcy;
      x = rcx + dx * cos - dy * sin;
      y = rcy + dx * sin + dy * cos;
    }
    x += tx; y += ty;
    out = merge(out, { minX: x, minY: y, maxX: x, maxY: y });
  }
  return out;
}

export function boundingBox(nodes: VectorNode[]): Box {
  let box = { ...EMPTY };
  for (const n of nodes) {
    const pad = (n.stroke && n.stroke !== "none" ? (n.strokeWidth ?? 0) / 2 : 0);
    let local: Box = { ...EMPTY };
    if (n.kind === "group") {
      local = transformBox(boundingBox(n.children ?? []), n.transform);
    } else if (n.kind === "rect") {
      local = { minX: n.x ?? 0, minY: n.y ?? 0, maxX: (n.x ?? 0) + (n.width ?? 0), maxY: (n.y ?? 0) + (n.height ?? 0) };
    } else if (n.kind === "circle") {
      local = { minX: (n.cx ?? 0) - (n.r ?? 0), maxX: (n.cx ?? 0) + (n.r ?? 0), minY: (n.cy ?? 0) - (n.r ?? 0), maxY: (n.cy ?? 0) + (n.r ?? 0) };
    } else if (n.kind === "ellipse") {
      local = { minX: (n.cx ?? 0) - (n.rxr ?? 0), maxX: (n.cx ?? 0) + (n.rxr ?? 0), minY: (n.cy ?? 0) - (n.ryr ?? 0), maxY: (n.cy ?? 0) + (n.ryr ?? 0) };
    } else if (n.kind === "line") {
      local = { minX: Math.min(n.x1 ?? 0, n.x2 ?? 0), maxX: Math.max(n.x1 ?? 0, n.x2 ?? 0), minY: Math.min(n.y1 ?? 0, n.y2 ?? 0), maxY: Math.max(n.y1 ?? 0, n.y2 ?? 0) };
    } else if (n.kind === "path" && n.d) {
      local = pathBox(n.d);
    }
    if (n.kind !== "group") local = transformBox(local, n.transform);
    if (!Number.isFinite(local.minX)) continue;
    box = merge(box, { minX: local.minX - pad, minY: local.minY - pad, maxX: local.maxX + pad, maxY: local.maxY + pad });
  }
  return box;
}

/** Fit the mark into MARK_BOX and optically centre it, without distorting it. */
export function fitTransform(nodes: VectorNode[], box = MARK_BOX): string {
  const b = boundingBox(nodes);
  if (!Number.isFinite(b.minX) || b.maxX <= b.minX || b.maxY <= b.minY) return "";
  const w = b.maxX - b.minX;
  const h = b.maxY - b.minY;
  const scale = Math.min(box.width / w, box.height / h);
  const cx = b.minX + w / 2;
  const cy = b.minY + h / 2;
  const tx = box.x + box.width / 2 - cx * scale;
  const ty = box.y + box.height / 2 - cy * scale;
  return `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})`;
}

/* --------------------------- rendering --------------------------- */

export type Palette = { primary: string; secondary: string; accent: string; white: string; none: string };

export function paletteOf(tokens: any): Palette {
  return {
    primary: safeColor(tokens?.colors?.primary, "#171717"),
    secondary: safeColor(tokens?.colors?.secondary, "#4B5563"),
    accent: safeColor(tokens?.colors?.accent, "#C29B46"),
    white: "#FFFFFF",
    none: "none",
  };
}

function transformOf(n: VectorNode): string {
  const t = n.transform;
  if (!t) return "";
  const parts: string[] = [];
  if (t.translate) parts.push(`translate(${clampNumber(t.translate[0], -1000, 1000)} ${clampNumber(t.translate[1], -1000, 1000)})`);
  if (typeof t.rotate === "number") parts.push(`rotate(${clampNumber(t.rotate, -360, 360)} 500 500)`);
  else if (Array.isArray(t.rotate)) parts.push(`rotate(${clampNumber(t.rotate[0], -360, 360)} ${clampNumber(t.rotate[1], 0, 1000, 500)} ${clampNumber(t.rotate[2], 0, 1000, 500)})`);
  if (typeof t.scale === "number") parts.push(`scale(${clampNumber(t.scale, -4, 4, 1)})`);
  else if (Array.isArray(t.scale)) parts.push(`scale(${clampNumber(t.scale[0], -4, 4, 1)} ${clampNumber(t.scale[1], -4, 4, 1)})`);
  return parts.length ? ` transform="${parts.join(" ")}"` : "";
}

function renderNodes(nodes: VectorNode[], palette: Palette, mono?: string): string {
  return nodes.map((n) => {
    if (n.kind === "group") return `<g${transformOf(n)}>${renderNodes(n.children ?? [], palette, mono)}</g>`;
    const pick = (key: unknown, fallback: string) => {
      const raw = palette[String(key ?? "") as keyof Palette] ?? fallback;
      if (!mono) return raw;
      return raw === "none" ? "none" : (raw === palette.white ? "#FFFFFF" : mono);
    };
    const fill = pick(n.fill, palette.primary);
    const stroke = pick(n.stroke, "none");
    const rule = n.fillRule === "evenodd" ? ` fill-rule="evenodd" clip-rule="evenodd"` : "";
    const common = `fill="${fill}" stroke="${stroke}" stroke-width="${clampNumber(n.strokeWidth, 0, 140, 0)}" stroke-linecap="round" stroke-linejoin="round"${rule}${transformOf(n)}`;
    if (n.kind === "rect") return `<rect x="${clampNumber(n.x, -200, 1200)}" y="${clampNumber(n.y, -200, 1200)}" width="${clampNumber(n.width, 1, 1200, 100)}" height="${clampNumber(n.height, 1, 1200, 100)}" rx="${clampNumber(n.rx, 0, 600)}" ${common}/>`;
    if (n.kind === "circle") return `<circle cx="${clampNumber(n.cx, -200, 1200, 500)}" cy="${clampNumber(n.cy, -200, 1200, 500)}" r="${clampNumber(n.r, 1, 600, 100)}" ${common}/>`;
    if (n.kind === "ellipse") return `<ellipse cx="${clampNumber(n.cx, -200, 1200, 500)}" cy="${clampNumber(n.cy, -200, 1200, 500)}" rx="${clampNumber(n.rxr, 1, 600, 100)}" ry="${clampNumber(n.ryr, 1, 600, 100)}" ${common}/>`;
    if (n.kind === "line") return `<line x1="${clampNumber(n.x1, -200, 1200)}" y1="${clampNumber(n.y1, -200, 1200)}" x2="${clampNumber(n.x2, -200, 1200)}" y2="${clampNumber(n.y2, -200, 1200)}" ${common}/>`;
    if (n.kind === "path") return `<path d="${escapeXml(sanitizePath(n.d))}" ${common}/>`;
    throw new Error("Unsupported vector primitive");
  }).join("");
}

export type RenderOptions = {
  /** "mark" = symbol only, "horizontal" = mark left + words right, "stacked" = mark over words */
  layout?: "mark" | "horizontal" | "stacked";
  /** pre-outlined wordmark: an SVG path covering a 0..1000 x 0..250 box */
  wordmarkPath?: { d: string; width: number; height: number } | null;
  /** wordmark fallback text when no outline is available */
  wordmarkText?: string;
  fontStack?: string;
  mono?: string;      // force a single ink colour
  knockout?: boolean; // white ink on the primary colour
  background?: string;
};

export function renderLogoSvg(spec: VectorSpec, tokens: any, companyName: string, options: RenderOptions = {}): string {
  const palette = paletteOf(tokens);
  const layout = options.layout ?? (spec.wordmark?.text ? "stacked" : "mark");
  const nodes = Array.isArray(spec?.primitives) ? spec.primitives : [];
  if (!nodes.length) throw new Error("Vector specification has no drawable elements");
  if (leafCount(nodes) > MAX_LEAVES) throw new Error("Vector specification is too complex");

  const mono = options.knockout ? "#FFFFFF" : options.mono;
  const bg = options.knockout ? palette.primary : (options.background ?? "#FFFFFF");
  const inkColor = mono ?? palette.primary;
  const words = options.wordmarkText ?? spec.wordmark?.text ?? companyName;

  const wordmarkBlock = (box: { x: number; y: number; width: number; height: number }) => {
    if (!words) return "";
    if (options.wordmarkPath?.d) {
      const w = options.wordmarkPath.width || 1000;
      const h = options.wordmarkPath.height || 250;
      const scale = Math.min(box.width / w, box.height / h);
      const tx = box.x + (box.width - w * scale) / 2;
      const ty = box.y + (box.height - h * scale) / 2;
      return `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})"><path d="${escapeXml(options.wordmarkPath.d)}" fill="${inkColor}"/></g>`;
    }
    const size = Math.max(40, Math.min(box.height, Math.floor((box.width * 1.55) / Math.max(words.length, 4))));
    return `<text x="${box.x + box.width / 2}" y="${box.y + box.height / 2 + size * 0.35}" text-anchor="middle" fill="${inkColor}" font-family="${escapeXml(options.fontStack ?? "Helvetica Neue, Helvetica, sans-serif")}" font-size="${size}" font-weight="${clampNumber(spec.wordmark?.weight, 300, 800, 600)}" letter-spacing="${clampNumber(spec.wordmark?.tracking, -10, 40, 2)}">${escapeXml(words)}</text>`;
  };

  if (layout === "horizontal") {
    const markBox = { x: 60, y: 60, width: 260, height: 260 };
    const fit = fitTransform(nodes, markBox);
    const body = `<g${fit ? ` transform="${fit}"` : ""}>${renderNodes(nodes, palette, mono)}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 380" role="img" aria-label="${escapeXml(companyName)} logo"><rect width="1200" height="380" fill="${bg}"/>${body}${wordmarkBlock({ x: 380, y: 120, width: 760, height: 140 })}</svg>`;
  }

  if (layout === "stacked") {
    const markBox = { x: 300, y: 90, width: 400, height: 400 };
    const fit = fitTransform(nodes, markBox);
    const body = `<g${fit ? ` transform="${fit}"` : ""}>${renderNodes(nodes, palette, mono)}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800" role="img" aria-label="${escapeXml(companyName)} logo"><rect width="1000" height="800" fill="${bg}"/>${body}${wordmarkBlock({ x: 120, y: 560, width: 760, height: 130 })}</svg>`;
  }

  const fit = fitTransform(nodes, MARK_BOX);
  const body = `<g${fit ? ` transform="${fit}"` : ""}>${renderNodes(nodes, palette, mono)}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" role="img" aria-label="${escapeXml(companyName)} logo"><rect width="1000" height="1000" fill="${bg}"/>${body}</svg>`;
}

/* --------------------------- lint --------------------------- */

function collectLeaves(nodes: VectorNode[], out: VectorNode[] = []): VectorNode[] {
  for (const n of nodes) {
    if (n.kind === "group") collectLeaves(n.children ?? [], out);
    else out.push(n);
  }
  return out;
}

/** Deterministic quality gate — runs on every spec before it can be published. */
export function lintVectorSpec(spec: VectorSpec): LintResult {
  const findings: string[] = [];
  const nodes = Array.isArray(spec.primitives) ? spec.primitives : [];
  const leaves = collectLeaves(nodes);
  const module = clampNumber(spec.construction?.module, 5, 125, 25);

  if (!leaves.length) findings.push("The mark has no drawable elements — rebuild it.");
  if (leaves.length > MAX_LEAVES) findings.push(`Reduce the mark to ${MAX_LEAVES} elements or fewer; it currently has ${leaves.length}.`);
  if (leaves.length === 1 && leaves[0].kind === "circle") findings.push("A single circle is not a mark — introduce the construction idea from the direction.");

  // one stroke weight only
  const weights = new Set(leaves.filter((n) => n.stroke && n.stroke !== "none").map((n) => Math.round(clampNumber(n.strokeWidth, 0, 140, 0))));
  if (weights.size > 1) findings.push("Use one single stroke weight across the whole mark.");

  // grid discipline
  const coords: number[] = [];
  for (const n of leaves) {
    for (const key of ["x", "y", "width", "height", "cx", "cy", "r", "x1", "y1", "x2", "y2"] as const) {
      if (typeof n[key] === "number") coords.push(n[key] as number);
    }
    if (typeof n.d === "string") coords.push(...(n.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number).slice(0, 60));
  }
  const offGrid = coords.filter((v) => Math.abs(v / module - Math.round(v / module)) > 0.001).length;
  const offGridRatio = coords.length ? offGrid / coords.length : 0;
  if (offGridRatio > 0.15) findings.push("Align every coordinate to the declared module grid.");

  // proportion & coverage
  const box = boundingBox(nodes);
  const w = Number.isFinite(box.minX) ? box.maxX - box.minX : 0;
  const h = Number.isFinite(box.minY) ? box.maxY - box.minY : 0;
  const aspect = w && h ? Math.max(w, h) / Math.min(w, h) : 99;
  if (aspect > 2.6) findings.push("The mark is far too elongated — bring it closer to a square silhouette.");
  if (w < module * 3 || h < module * 3) findings.push("The mark is too small relative to its own grid — build it from at least three modules per side.");

  const metrics = {
    elements: leaves.length,
    stroke_weights: weights.size,
    off_grid_ratio: Number(offGridRatio.toFixed(3)),
    aspect: Number(aspect.toFixed(2)),
  };

  const score = Math.max(0, 5 - findings.length * 1.25);
  return { pass: findings.length === 0, score, findings, metrics };
}

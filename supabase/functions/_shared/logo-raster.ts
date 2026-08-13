// Rasterise an SVG so a vision model can actually look at the finished mark.
// Best-effort: if the wasm renderer is unavailable, the caller skips the
// vision critique rather than failing the run.

let initPromise: Promise<any> | null = null;

const WASM_URL = "https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm";

async function getResvg(): Promise<any | null> {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const mod: any = await import("npm:@resvg/resvg-wasm@2.6.2");
        const res = await fetch(WASM_URL);
        if (!res.ok) throw new Error(`wasm ${res.status}`);
        await mod.initWasm(await res.arrayBuffer());
        return mod;
      } catch (e) {
        console.warn("resvg init failed", e instanceof Error ? e.message : e);
        return null;
      }
    })();
  }
  return await initPromise;
}

/** Canvas size from the root <svg> viewBox (or width/height). */
function canvasOf(svg: string): { w: number; h: number } {
  const vb = /viewBox\s*=\s*["']([\d.\-\s,]+)["']/i.exec(svg)?.[1];
  if (vb) {
    const p = vb.trim().split(/[\s,]+/).map(Number);
    if (p.length === 4 && p[2] > 0 && p[3] > 0) return { w: p[2], h: p[3] };
  }
  const w = parseFloat(/\bwidth\s*=\s*["']([\d.]+)/i.exec(svg)?.[1] ?? "");
  const h = parseFloat(/\bheight\s*=\s*["']([\d.]+)/i.exec(svg)?.[1] ?? "");
  return { w: w > 0 ? w : 1024, h: h > 0 ? h : 1024 };
}

function attrOf(tag: string, n: string): string {
  const m = new RegExp(`${n}\\s*=\\s*["']([^"']*)["']`, "i").exec(tag);
  return m ? m[1].trim() : "";
}

/** White / near-white fill — the signature of a background plate. */
function isLightFill(fill: string, style: string, allowUnset = false): boolean {
  const f = fill.toLowerCase();
  const s = style.toLowerCase();
  if (f === "none" || /fill\s*:\s*none/.test(s)) return false;
  // An unset fill inherits (usually black). Only the very first drawable in a
  // document is allowed to be judged a plate on that basis — glyph paths in a
  // traced wordmark routinely carry no fill of their own.
  if (f === "" && !/fill\s*:/.test(s)) return allowUnset;
  const hex = /#([0-9a-f]{3,8})/.exec(f || s)?.[1];
  if (f === "white" || /fill\s*:\s*white/.test(s)) return true;
  // Tracers emit rgb() triples, not hex — the plate hid behind this gap.
  const rgb = /rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(f || s);
  if (rgb) {
    const [r, g, b] = [1, 2, 3].map((i) => Number(rgb[i]));
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.93;
  }
  if (hex) {
    const h = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex.slice(0, 6);
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.93;
  }
  return false;
}

type BBox = { x0: number; y0: number; x1: number; y1: number };

/**
 * True bounding box of a straight-line path subpath.
 *
 * The old implementation paired raw numbers as (x, y). Relative `h` / `v`
 * commands carry a SINGLE number each, so that pairing was meaningless and a
 * plain glyph (e.g. the "E" in a traced wordmark) could fake a full-canvas
 * bbox and be stripped as a background plate. This walks the pen properly.
 */
function pathBBox(d: string): BBox | null {
  const tokens = d.match(/[MmLlHhVvZz]|-?\d*\.?\d+(?:e-?\d+)?/gi);
  if (!tokens) return null;
  let x = 0, y = 0, sx = 0, sy = 0;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  let cmd = "";
  let seen = false;
  const mark = () => {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x);
    y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    seen = true;
  };
  const num = (i: number) => Number(tokens[i]);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (/^[A-Za-z]$/.test(t)) {
      cmd = t;
      if (cmd === "Z" || cmd === "z") { x = sx; y = sy; mark(); }
      continue;
    }
    // Implicit repeats reuse the last command (M repeats as L).
    const c = cmd === "M" ? "L" : cmd === "m" ? "l" : cmd;
    if (c === "H") { x = num(i); mark(); }
    else if (c === "h") { x += num(i); mark(); }
    else if (c === "V") { y = num(i); mark(); }
    else if (c === "v") { y += num(i); mark(); }
    else if (c === "L" || c === "l" || cmd === "M" || cmd === "m") {
      const a = num(i), b = num(i + 1);
      if (!Number.isFinite(b)) return null;
      i++;
      if (c === "L" || cmd === "M") { x = a; y = b; } else { x += a; y += b; }
      if (cmd === "M" || cmd === "m") { sx = x; sy = y; cmd = cmd === "M" ? "M" : "m"; }
      mark();
    } else {
      return null; // curve or arc — not a plate candidate
    }
  }
  return seen && Number.isFinite(x0) ? { x0, y0, x1, y1 } : null;
}

/** Bounding box of a `points` list (polygon) — genuinely x,y pairs. */
function pointsBBox(pts: string): BBox | null {
  const nums = pts.match(/-?\d*\.?\d+(?:e-?\d+)?/gi)?.map(Number) ?? [];
  if (nums.length < 4 || nums.length % 2 !== 0) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < nums.length; i += 2) {
    x0 = Math.min(x0, nums[i]); x1 = Math.max(x1, nums[i]);
    y0 = Math.min(y0, nums[i + 1]); y1 = Math.max(y1, nums[i + 1]);
  }
  return Number.isFinite(x0) ? { x0, y0, x1, y1 } : null;
}

/**
 * Removes full-canvas background plates so a vector mark sits on the paper with
 * real transparency. Traced logos hide their plate as a *path* or *polygon* as
 * often as a <rect>, and a surviving plate is fatal: the compositor tints every
 * shape one ink colour, so plate and artwork become the same solid block.
 *
 * Conservative by design: it is far worse to delete a letterform than to leave
 * a plate behind, so a shape is only stripped when its geometry is measured
 * exactly and its fill is explicitly light (or it is the document's first
 * drawable).
 */
export function stripSvgBackground(svg: string): string {
  const { w: CW, h: CH } = canvasOf(svg);

  let out = svg.replace(/<rect\b[^>]*\/?>(?:\s*<\/rect>)?/gi, (tag) => {
    const x = parseFloat(attrOf(tag, "x") || "0");
    const y = parseFloat(attrOf(tag, "y") || "0");
    const w = attrOf(tag, "width");
    const h = attrOf(tag, "height");
    const rx = parseFloat(attrOf(tag, "rx") || "0");
    if (x > CW * 0.03 || y > CH * 0.03) return tag;
    if (rx > 0) return tag;
    const spansCanvas =
      (w === "100%" || parseFloat(w) >= CW * 0.94) && (h === "100%" || parseFloat(h) >= CH * 0.94);
    if (!spansCanvas) return tag;
    return isLightFill(attrOf(tag, "fill"), attrOf(tag, "style"), true) ? "" : tag;
  });

  // Plates disguised as geometry: a light shape whose bbox covers the canvas.
  const SHAPE = /<(path|polygon)\b[^>]*\/?>(?:\s*<\/(?:path|polygon)>)?/gi;
  const total = (out.match(SHAPE) || []).length;
  let index = -1;
  let removed = 0;
  out = out.replace(SHAPE, (tag, el) => {
    index++;
    // Only the first drawable may be judged a plate on an inherited fill.
    if (!isLightFill(attrOf(tag, "fill"), attrOf(tag, "style"), index === 0)) return tag;
    // Never let this pass eat into a multi-shape mark (a traced wordmark is
    // dozens of little paths — a plate is one of them, at the front).
    if (index > 0 && total > 4) return tag;
    if (removed >= Math.max(1, Math.floor(total * 0.25))) return tag;
    const isPath = el.toLowerCase() === "path";
    const geom = isPath ? attrOf(tag, "d") : attrOf(tag, "points");
    if (!geom) return tag;
    let bb: BBox | null;
    if (isPath) {
      // Tracers emit the plate as the FIRST subpath of a compound path, with the
      // artwork punched out of it as even-odd holes. Judge the first subpath
      // only — the holes that follow are allowed to curve.
      const first = geom.split(/[zZ]/)[0];
      if (/[csqta]/i.test(first.replace(/[eE]-?\d/g, ""))) return tag;
      bb = pathBBox(first);
    } else {
      bb = pointsBBox(geom);
    }
    if (!bb) return tag;
    const covers = (bb.x1 - bb.x0) >= CW * 0.94 && (bb.y1 - bb.y0) >= CH * 0.94 &&
      bb.x0 <= CW * 0.03 && bb.y0 <= CH * 0.03;
    if (!covers) return tag;
    removed++;
    return "";
  });

  return out;
}



const NON_COLOR = /^(none|transparent|url\(|currentcolor)/i;

/** Re-paints every fill/stroke in the mark with a single hex (knockout ink). */
export function forceSvgMono(svg: string, hex: string): string {
  let out = svg
    .replace(/(fill|stroke)\s*=\s*["']([^"']*)["']/gi, (m, prop, val) =>
      NON_COLOR.test(String(val).trim()) ? m : `${prop}="${hex}"`,
    )
    .replace(/(fill|stroke)\s*:\s*([^;"']+)/gi, (m, prop, val) =>
      NON_COLOR.test(String(val).trim()) ? m : `${prop}:${hex}`,
    );
  // Root-level default so unpainted shapes inherit the knockout color too.
  out = out.replace(/<svg\b/i, `<svg fill="${hex}"`);
  return out;
}

/** Rasterise a mark as a single-color knockout on a transparent background. */
export async function rasterizeSvgMono(
  svg: string,
  hex: string,
  width = 1024,
): Promise<Uint8Array | null> {
  return await rasterizeSvgToBytes(forceSvgMono(stripSvgBackground(svg), hex), width);
}

/** Returns raw PNG bytes, or null when rasterisation is not available. */

export async function rasterizeSvgToBytes(
  svg: string,
  width = 1024,
  background?: string,
  fontBuffers?: Uint8Array[],
): Promise<Uint8Array | null> {
  try {
    const mod = await getResvg();
    if (!mod) return null;
    const opts: Record<string, unknown> = { fitTo: { mode: "width", value: width } };
    if (background) opts.background = background;
    // resvg has no @font-face support — real TTF buffers must be handed in or
    // every <text> node renders as nothing at all.
    if (fontBuffers?.length) {
      opts.font = { fontBuffers, loadSystemFonts: false, defaultFontFamily: "BrandBody" };
    }
    const resvg = new mod.Resvg(svg, opts);
    return new Uint8Array(resvg.render().asPng());
  } catch (e) {
    console.warn("rasterize failed", e instanceof Error ? e.message : e);
    return null;

  }
}

/** Returns a base64 PNG, or null when rasterisation is not available. */
export async function rasterizeSvg(svg: string, width = 512): Promise<string | null> {
  const bytes = await rasterizeSvgToBytes(svg, width, "#FFFFFF");
  if (!bytes) return null;
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}


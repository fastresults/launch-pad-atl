// Measure a logo's own ink and decide which stored variant survives on a given
// surface. Used by the public brand-logo endpoint so every share link, export
// and embed picks a mark that is actually visible.

import { contrastRatio, inkOn, relLuminance } from "./color-spaces.ts";

/** Contrast a lone mark needs against its ground before we call it legible. */
export const LOGO_MIN_CONTRAST = 3.0;

export const DARK_SURFACE = "#0B0B12";
export const LIGHT_SURFACE = "#FFFFFF";

const NAMED: Record<string, string> = {
  black: "#000000", white: "#FFFFFF", navy: "#000080", gray: "#808080", grey: "#808080",
  red: "#FF0000", blue: "#0000FF", green: "#008000", yellow: "#FFFF00",
};

function normHex(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (NAMED[v]) return NAMED[v];
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(v);
  if (m) {
    const h = m[1];
    return h.length === 3 ? `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}` : `#${h}`;
  }
  const rgb = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(v);
  if (rgb) {
    const to = (n: string) => Math.max(0, Math.min(255, Number(n))).toString(16).padStart(2, "0");
    return `#${to(rgb[1])}${to(rgb[2])}${to(rgb[3])}`;
  }
  return null;
}

/** Artwork whose paint we cannot rewrite: pixels, gradients or pattern fills. */
export function isUntintableSvg(svg: string): boolean {
  return /<image\b/i.test(svg) || /(fill|stroke)\s*[=:]\s*["']?url\(/i.test(svg);
}

/**
 * Dominant ink of an SVG: the average luminance of every paint that isn't
 * `none` or transparent, weighted equally. Good enough to tell a navy mark
 * from a white one, which is the only call we need to make.
 *
 * Paints declared in `<style>` blocks and gradient `stop-color`s count too —
 * plenty of exported artwork carries no `fill=` attribute at all. A shape that
 * covers the whole viewBox is the artwork's own background, not its ink, so
 * its paint is dropped before averaging.
 */
export function svgInkHex(svg: string): string | null {
  const source = stripBackgroundShapes(svg);
  const paints: string[] = [];
  const re =
    /(?:fill|stroke|stop-color)\s*[=:]\s*["']?\s*(#[0-9a-fA-F]{3,6}|rgba?\([^)]*\)|[a-zA-Z]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    const raw = m[1];
    if (/^(none|transparent|url|currentcolor|inherit)$/i.test(raw)) continue;
    const hex = normHex(raw);
    if (hex) paints.push(hex);
  }
  if (!paints.length) return null;
  // Drop paints that are effectively the page (pure white) unless that's all
  // there is — a white plate behind a navy mark should not read as white ink.
  const ink = paints.filter((p) => relLuminance(p) < 0.92);
  const pool = ink.length ? ink : paints;
  let r = 0, g = 0, b = 0;
  for (const p of pool) {
    r += parseInt(p.slice(1, 3), 16);
    g += parseInt(p.slice(3, 5), 16);
    b += parseInt(p.slice(5, 7), 16);
  }
  const n = pool.length;
  const to = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/**
 * Remove full-bleed rects (and a full-canvas circle) — the artwork's ground.
 * Measuring them as ink is what makes a reversed mark look "dark" and a light
 * mark look "white".
 */
export function stripBackgroundShapes(svg: string): string {
  const vb = /viewBox\s*=\s*["']\s*([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)/i.exec(svg);
  const w = vb ? Number(vb[3]) : Number(/\bwidth\s*=\s*["']([\d.]+)/i.exec(svg)?.[1] ?? 0);
  const h = vb ? Number(vb[4]) : Number(/\bheight\s*=\s*["']([\d.]+)/i.exec(svg)?.[1] ?? 0);
  if (!(w > 0 && h > 0)) return svg;
  return svg.replace(/<rect\b[^>]*\/?>/gi, (tag) => {
    const num = (attr: string) => Number(/\s(?:width|height)\s*=/.test("") ? 0 : (new RegExp(`\\b${attr}\\s*=\\s*["']([-\\d.%]+)["']`, "i").exec(tag)?.[1] ?? "").replace("%", "") || NaN);
    const rw = num("width");
    const rh = num("height");
    const pct = /width\s*=\s*["']\s*100%/i.test(tag) && /height\s*=\s*["']\s*100%/i.test(tag);
    const covers = pct || (rw >= w * 0.98 && rh >= h * 0.98);
    return covers ? "" : tag;
  });
}


/** Average ink of a raster, ignoring transparent pixels. */
export async function rasterInkHex(bytes: Uint8Array): Promise<string | null> {
  try {
    const { Image } = await import("https://deno.land/x/imagescript@1.2.17/mod.ts");
    const img = await Image.decode(bytes);
    let r = 0, g = 0, b = 0, n = 0;
    const stepX = Math.max(1, Math.floor(img.width / 64));
    const stepY = Math.max(1, Math.floor(img.height / 64));
    for (let y = 1; y <= img.height; y += stepY) {
      for (let x = 1; x <= img.width; x += stepX) {
        const c = img.getPixelAt(x, y);
        const a = c & 0xff;
        if (a < 40) continue;
        r += (c >> 24) & 0xff;
        g += (c >> 16) & 0xff;
        b += (c >> 8) & 0xff;
        n++;
      }
    }
    if (!n) return null;
    const to = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
    return `#${to(r)}${to(g)}${to(b)}`;
  } catch {
    return null;
  }
}

export function surfaceHex(on: string | null | undefined): string | null {
  if (!on) return null;
  const v = String(on).trim().toLowerCase();
  if (v === "dark") return DARK_SURFACE;
  if (v === "light") return LIGHT_SURFACE;
  return normHex(v);
}

/** Preferred stored variants for a surface, best first. */
export function variantOrder(surface: string): string[] {
  const dark = relLuminance(surface) < 0.35;
  return dark
    ? ["knockout", "mono", "mark", "horizontal", "stacked"]
    : ["mark", "horizontal", "stacked", "mono", "knockout"];
}

export function inkPasses(ink: string | null, surface: string): boolean {
  if (!ink) return false;
  return contrastRatio(ink, surface) >= LOGO_MIN_CONTRAST;
}

/** Rewrite every paint in an SVG to one legible ink. */
export function tintSvg(svg: string, use: string): string {
  return svg
    .replace(/fill\s*=\s*["'](?!none)[^"']*["']/gi, `fill="${use}"`)
    .replace(/stroke\s*=\s*["'](?!none)[^"']*["']/gi, `stroke="${use}"`)
    .replace(/fill\s*:\s*(?!none)[^;"'}]+/gi, `fill:${use}`)
    .replace(/stroke\s*:\s*(?!none)[^;"'}]+/gi, `stroke:${use}`)
    .replace(/currentColor/gi, use);
}

export function legibleInkFor(surface: string): string {
  return inkOn(surface);
}

/**
 * Last resort for artwork that cannot be recoloured: wrap it in a rounded
 * contrast plate so it stays visible instead of vanishing into the ground.
 */
export function platedSvg(dataUri: string, surface: string, size = 512): string {
  const plate = relLuminance(surface) < 0.35 ? "#FFFFFF" : "#101820";
  const pad = Math.round(size * 0.08);
  const inner = size - pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<rect x="0" y="0" width="${size}" height="${size}" rx="${Math.round(size * 0.12)}" fill="${plate}"/>` +
    `<image x="${pad}" y="${pad}" width="${inner}" height="${inner}" href="${dataUri}" preserveAspectRatio="xMidYMid meet"/>` +
    `</svg>`;
}

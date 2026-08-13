// Measure a logo's own ink and decide which stored variant survives on a given
// surface. Used by the public brand-logo endpoint so every share link, export
// and embed picks a mark that is actually visible.

import { contrastRatio, inkOn, relLuminance } from "./color-spaces.ts";

/** Contrast a lone mark needs against its ground before we call it legible. */
export const LOGO_MIN_CONTRAST = 3.0;
/** The floor the collateral quality gate applies to a drawn specimen. */
export const SPECIMEN_MIN_CONTRAST = 2.4;

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

/** Artwork whose paint we cannot safely rewrite without flattening embedded media. */
export function isUntintableSvg(svg: string): boolean {
  return /<image\b/i.test(svg) || /<pattern\b/i.test(svg);
}

const PAINT_RE = /(?:fill|stroke|stop-color)\s*[=:]\s*["']?\s*(#[0-9a-fA-F]{3,6}|rgba?\([^)]*\)|[a-zA-Z]+)/g;

/** Every distinct material paint in the mark, never averaged together. */
export function svgPaints(svg: string): string[] {
  const source = stripBackgroundShapes(svg);
  const paints: string[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  PAINT_RE.lastIndex = 0;
  while ((match = PAINT_RE.exec(source))) {
    const raw = match[1];
    if (/^(none|transparent|url|currentcolor|inherit)$/i.test(raw)) continue;
    const hex = normHex(raw);
    if (!hex) continue;
    const key = hex.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      paints.push(hex);
    }
  }
  return paints;
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
  const paints = svgPaints(svg);
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
    const attrNum = (attr: string) => {
      const raw = new RegExp(`\\b${attr}\\s*=\\s*["']([-\\d.]+)`, "i").exec(tag)?.[1];
      return raw === undefined ? NaN : Number(raw);
    };
    const rw = attrNum("width");
    const rh = attrNum("height");
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

/**
 * Preferred stored variants for a surface, best first.
 *
 * Kept for callers that only have slot names. New code should rely on
 * `logoCandidates`, which scores the measured form and tone of each entry.
 */
export function variantOrder(surface: string, boxAspect?: number): string[] {
  const dark = relLuminance(surface) < 0.35;
  const preferStacked = typeof boxAspect === "number" && boxAspect > 0 && boxAspect < 2.2;
  if (dark) {
    return preferStacked
      ? ["stacked_reversed", "reversed", "knockout", "mono", "stacked", "mark", "horizontal", "icon_reversed", "icon"]
      : ["reversed", "knockout", "mono", "mark", "horizontal", "stacked_reversed", "stacked", "icon_reversed", "icon"];
  }
  return preferStacked
    ? ["stacked", "mark", "primary", "horizontal", "icon", "mono", "knockout", "stacked_reversed", "reversed"]
    : ["mark", "primary", "horizontal", "stacked", "icon", "mono", "knockout", "stacked_reversed", "reversed"];
}

export type CandidateForm = "symbol" | "horizontal" | "stacked" | "wordmark";
export type CandidateTone = "colour" | "inverse";

export interface LogoCandidate {
  /** Storage path of the artwork. */
  path: string;
  /** Slot or generated-variant name it came from — ordering and debugging. */
  variant: string;
  /** Shape of the lockup, measured at upload where available. */
  form: CandidateForm;
  /** Which ground the artwork is drawn for. */
  tone: CandidateTone;
  /** width / height when known. */
  aspect: number | null;
}

/** Name → form/tone for entries with no stored measurement (legacy + studio). */
const NAME_FORM_TONE: Record<string, { form: CandidateForm; tone: CandidateTone }> = {
  primary: { form: "horizontal", tone: "colour" },
  reversed: { form: "horizontal", tone: "inverse" },
  horizontal: { form: "horizontal", tone: "colour" },
  stacked: { form: "stacked", tone: "colour" },
  stacked_reversed: { form: "stacked", tone: "inverse" },
  vertical: { form: "stacked", tone: "colour" },
  icon: { form: "symbol", tone: "colour" },
  icon_reversed: { form: "symbol", tone: "inverse" },
  monogram: { form: "symbol", tone: "colour" },
  // The Logo Studio writes the *symbol alone* as `mark`; `knockout` is the same
  // symbol drawn white, `mono` the same symbol drawn near-black.
  mark: { form: "symbol", tone: "colour" },
  mono: { form: "symbol", tone: "colour" },
  knockout: { form: "symbol", tone: "inverse" },
  wordmark: { form: "wordmark", tone: "colour" },
  wordmark_reversed: { form: "wordmark", tone: "inverse" },
};

const normName = (v: string) => {
  const s = v.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (s === "stacked_knockout" || s === "stacked_reverse" || s === "stacked_dark") return "stacked_reversed";
  if (s === "reverse" || s === "inverse") return "reversed";
  return s;
};

/**
 * Every mark a venture has, ordered best-first for a surface and placement box.
 *
 * Founders upload artwork as *sibling entries* in the `logos` array (each with
 * its own slot, plus the measured `form` / `tone` / `aspect` recorded at upload
 * time), while the generator writes `variants.knockout` / `variants.mono`
 * inside a single entry. Both shapes are collected and scored on the same two
 * axes, so a symbol can never be mistaken for a horizontal lockup.
 */
export function logoCandidates(logos: any[], surface: string, boxAspect?: number): LogoCandidate[] {
  const out: LogoCandidate[] = [];
  const seen = new Set<string>();
  const add = (path: unknown, name: string, meta?: any) => {
    const p = typeof path === "string" ? path.trim() : "";
    if (!p || seen.has(p)) return;
    seen.add(p);
    const key = normName(name);
    const fallback = NAME_FORM_TONE[key] ?? { form: "horizontal" as const, tone: "colour" as const };
    const aspect = Number(meta?.aspect);
    const form = (meta?.form as CandidateForm) ?? fallback.form;
    const tone = (meta?.tone as CandidateTone) ?? fallback.tone;
    out.push({
      path: p,
      variant: key,
      form: ["symbol", "horizontal", "stacked", "wordmark"].includes(form) ? form : fallback.form,
      tone: tone === "inverse" ? "inverse" : "colour",
      aspect: Number.isFinite(aspect) && aspect > 0 ? aspect : null,
    });
  };

  for (const l of Array.isArray(logos) ? logos : []) {
    if (!l || typeof l !== "object") continue;
    const variantsObj = l.variants && typeof l.variants === "object" ? l.variants : {};
    // A Logo Studio entry carries generated lockups beside it — its own file is
    // then the *symbol*, never a horizontal lockup, whatever the slot is called.
    const studioEntry = Boolean(variantsObj.horizontal || variantsObj.stacked || variantsObj.mark);
    const own = studioEntry ? "mark" : String(l.variant ?? (l.primary ? "primary" : "mark"));
    add(l.svg_path ?? l.path, own, studioEntry ? { ...l, form: l.form ?? "symbol" } : l);
    const variants = l.variants && typeof l.variants === "object" ? l.variants : {};
    for (const [name, v] of Object.entries(variants as Record<string, any>)) {
      add(v?.path ?? v?.svg_path, String(name), v);
    }
  }

  const dark = relLuminance(surface) < 0.35;
  const wantTone: CandidateTone = dark ? "inverse" : "colour";
  const wantForm: CandidateForm | null =
    typeof boxAspect === "number" && boxAspect > 0 ? (boxAspect >= 2.2 ? "horizontal" : "stacked") : null;

  // Tone is the stronger signal — an illegible mark is useless whatever its
  // shape — so it outweighs form fit.
  const formScore = (c: LogoCandidate): number => {
    if (!wantForm) return c.form === "horizontal" ? 0 : c.form === "stacked" ? 1 : c.form === "symbol" ? 2 : 3;
    if (c.form === wantForm) return 0;
    if (wantForm === "stacked" && c.form === "symbol") return 1;
    if (wantForm === "horizontal" && c.form === "wordmark") return 1;
    if (c.form === "symbol") return 2;
    return 3;
  };
  const score = (c: LogoCandidate) => (c.tone === wantTone ? 0 : 10) + formScore(c);

  return out
    .map((c, i) => ({ c, i }))
    .sort((a, b) => score(a.c) - score(b.c) || a.i - b.i)
    .map(({ c }) => c);
}


export function inkPasses(ink: string | null, surface: string): boolean {
  if (!ink) return false;
  return contrastRatio(ink, surface) >= LOGO_MIN_CONTRAST;
}

/** A multicolour mark passes only when every material paint remains visible. */
export function svgPaintsPass(svg: string, surface: string): boolean {
  const paints = svgPaints(svg);
  return paints.length > 0 && paints.every((paint) => inkPasses(paint, surface));
}

/* ---------------- hue-preserving repair ---------------- */

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const v = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * A legible replacement for a failing paint that keeps the brand's own hue.
 *
 * Collapsing a bright brand blue to flat black fixes contrast and destroys the
 * identity. We instead walk that colour's own lightness — darker on a light
 * ground, lighter on a dark one — and take the first step that clears the
 * floor. Only a hue with no legible lightness at all falls back to neutral ink.
 */
export function hueSafeInk(paint: string, surface: string): string {
  const hex = normHex(paint) ?? paint;
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return legibleInkFor(surface);
  const [h, s, l] = hexToHsl(hex);
  if (s < 0.08) return legibleInkFor(surface); // a neutral has no hue to protect
  const darken = relLuminance(surface) >= 0.35;
  for (let step = 1; step <= 20; step++) {
    const nl = darken ? l - step * 0.05 : l + step * 0.05;
    if (nl <= 0.02 || nl >= 0.98) break;
    const candidate = hslToHex(h, Math.min(1, s * 1.05), nl);
    if (inkPasses(candidate, surface)) return candidate;
  }
  return legibleInkFor(surface);
}

/**
 * The single authority every renderer must use before it paints a mark.
 *
 * Templates used to assign specimen inks directly — brand primary on paper,
 * flat charcoal on a tinted card — and the quality gate then rejected the page
 * they produced. Chooser and judge now share one rule: ask for the ink you
 * want, get back the nearest legible form of it on that ground.
 *
 * `min` defaults to the logo floor (3.0), comfortably above the QC floor (2.4),
 * so a resolved ink can never be the reason a page is blocked.
 */
export function resolveInk(
  desired: string | null | undefined,
  ground: string,
  opts: { min?: number } = {},
): string {
  const surface = normHex(ground) ?? ground;
  const min = opts.min ?? LOGO_MIN_CONTRAST;
  const hex = desired ? normHex(desired) : null;
  if (!hex) return legibleInkFor(surface);
  if (contrastRatio(hex, surface) >= min) return hex;
  const repaired = hueSafeInk(hex, surface);
  return contrastRatio(repaired, surface) >= min ? repaired : legibleInkFor(surface);
}

/**
 * Resolve every palette role against every ground the brand paints on, once,
 * at lock time. Downstream renderers read these instead of each recomputing —
 * and a role with no legible form on a ground is visible to the founder in the
 * Brand Studio rather than discovered eleven assets later.
 */
export function resolveBrandInks(
  roles: Record<string, string | null | undefined>,
  grounds: Record<string, string | null | undefined>,
): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const [groundName, groundHex] of Object.entries(grounds)) {
    if (!groundHex) continue;
    const surface = normHex(groundHex) ?? groundHex;
    const row: Record<string, string> = {};
    for (const [roleName, roleHex] of Object.entries(roles)) {
      if (!roleHex) continue;
      row[roleName] = resolveInk(roleHex, surface);
    }
    out[groundName] = row;
  }
  return out;
}



/**
 * Repair only failing SVG paints. Passing brand accents remain untouched, so a
 * gold-and-navy mark becomes gold-and-white on dark rather than monochrome, and
 * a failing paint keeps its hue instead of turning into flat ink.
 */
export function repairSvgContrast(svg: string, surface: string): string {
  return svg.replace(
    /((?:fill|stroke|stop-color)\s*[=:]\s*["']?\s*)(#[0-9a-fA-F]{3,6}|rgba?\([^)]*\)|[a-zA-Z]+)/g,
    (whole, prefix: string, raw: string) => {
      if (/^(none|transparent|url|currentcolor|inherit)$/i.test(raw)) return whole;
      const hex = normHex(raw);
      return hex && !inkPasses(hex, surface) ? `${prefix}${hueSafeInk(hex, surface)}` : whole;
    },
  );
}

/**
 * Verdict for one mark on one surface — the shape the studio renders as a chip
 * and the lock gate reads before it lets a brand be committed.
 */
export interface SurfaceVerdict {
  surface: string;
  passes: boolean;
  failing: string[];
  repairable: boolean;
}

/** Audit a vector mark against every ground the brand actually paints on. */
export function auditSvgSurfaces(svg: string, surfaces: string[]): SurfaceVerdict[] {
  const paints = svgPaints(svg);
  const untintable = isUntintableSvg(svg);
  return surfaces.map((surface) => {
    const failing = paints.filter((p) => !inkPasses(p, surface));
    return {
      surface,
      passes: paints.length > 0 && failing.length === 0,
      failing,
      repairable: !untintable && paints.length > 0,
    };
  });
}

/**
 * Short fingerprint of a venture's logo set. It rides on every preview request
 * so a freshly uploaded reversed mark can never be answered from the cached
 * "there is no reversed mark" reply written seconds earlier.
 */
export function logoSetFingerprint(logos: any[]): string {
  const parts = (Array.isArray(logos) ? logos : [])
    .map((l: any) => `${l?.path ?? l?.svg_path ?? ""}@${l?.created_at ?? ""}`)
    .sort()
    .join("|");
  let hash = 2166136261;
  for (let i = 0; i < parts.length; i++) {
    hash ^= parts.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
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

/**
 * What a renderer records about one drawn specimen, measured the same way the
 * quality gate measures it.
 *
 * A mark is rarely one colour. Reporting the first fill in the file blocked
 * perfectly readable two-tone marks — a strong primary shape with a light
 * accent detail — because the accent alone failed the floor. The rule here:
 * `ink` is the fill a reader would struggle with most (worth surfacing in
 * triage), and `visible` says whether *any* painted fill clears the floor,
 * which is what legibility actually means.
 */
export function specimenVerdict(
  fills: string[],
  ground: string,
  opts: { min?: number } = {},
): { ink: string; visible: boolean } {
  const min = opts.min ?? SPECIMEN_MIN_CONTRAST;
  const painted = fills.filter(Boolean);
  if (!painted.length) return { ink: "", visible: true };
  const worst = painted
    .slice()
    .sort((a, b) => contrastRatio(a, ground) - contrastRatio(b, ground))[0];
  return { ink: worst, visible: painted.some((f) => contrastRatio(f, ground) >= min) };
}

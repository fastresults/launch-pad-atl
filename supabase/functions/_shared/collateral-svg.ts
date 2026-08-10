// Deterministic brand collateral compositor.
//
// Business cards, letterhead, envelopes, invoices and guideline pages need
// exact type, alignment and real vector logo ink — so none of this is drawn by
// an image model. Every page is assembled as SVG from the LOCKED brand kit,
// laid out on the grid the art director chose, typeset with real font metrics,
// and rasterised.

import { colorSpaces, contrastRatio, inkOn, isDarkSurface } from "./color-spaces.ts";
import { stripSvgBackground } from "./logo-raster.ts";
import { inkAspect, inkBox } from "./logo-geometry.ts";

import { fitBox, fitLine, measure } from "./text-metrics.ts";
import {
  type ArtDirection,
  archetypeSpec,
  gridFor,
  PAPER_TONE,
  type PageGrid,
  snap,
  step,
} from "./brand-art-direction.ts";
import { addressBlock, addressLine, type ContactDetails } from "./collateral-fields.ts";
import {
  logoBox,
  type PageMetrics,
  printMeta,
  resolveSpec,
  type ResolvedSpec,
} from "./collateral-specs.ts";

// Font loading has one hard requirement: the wasm rasteriser can only read a
// real sfnt (TTF/OTF). It has no woff2 decoder and no @font-face support, so if
// we hand it anything else every <text> node renders as *nothing at all* — the
// page comes out as a logo on blank paper. Google serves TTF only to a bare
// "Mozilla/5.0" UA on the v1 CSS endpoint; modern UAs get woff2, and the old
// MSIE UA gets EOT. So: TTF for the rasteriser and the metrics reader, woff2
// for the SVG's @font-face (browser previews only).
const UA_MODERN =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const UA_TTF = "Mozilla/5.0";

/** Bundled last resort so a page is never typeset with an empty font. */
const FALLBACK_FAMILY = { serif: "Lora", sans: "Inter" } as const;

type LoadedFont = { b64: string; bytes: Uint8Array; family: string };

const fontCache = new Map<string, LoadedFont | null>();

/** True for an sfnt container resvg can actually parse. */
function isSfnt(b: Uint8Array): boolean {
  if (!b || b.length < 4) return false;
  const tag = (b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3];
  return tag === 0x00010000 /* TTF */ ||
    tag === 0x4f54544f /* OTTO */ ||
    tag === 0x74727565 /* true */ ||
    tag === 0x74746366 /* ttcf */;
}

async function fetchFontFile(family: string, weight: number, ttf: boolean): Promise<Uint8Array | null> {
  const cssUrl = ttf
    ? `https://fonts.googleapis.com/css?family=${encodeURIComponent(family).replace(/%20/g, "+")}:${weight}`
    : `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@${weight}&display=swap`;
  const res = await fetch(cssUrl, { headers: { "User-Agent": ttf ? UA_TTF : UA_MODERN } });
  if (!res.ok) return null;
  const text = await res.text();
  const blocks = text.split("@font-face").filter((b) => b.includes("url("));
  const latin = blocks.find((b) => /unicode-range:[^;]*U\+0000/i.test(b)) ?? blocks[blocks.length - 1];
  // Do NOT require a file extension: Google's legacy endpoint serves
  // extensionless `/l/font?kit=...` URLs. Sniff the bytes instead.
  const url = latin?.match(/url\((https:\/\/[^)'"]+)\)/)?.[1];
  if (!url) return null;
  const bin = await fetch(url);
  if (!bin.ok) return null;
  const bytes = new Uint8Array(await bin.arrayBuffer());
  if (!bytes.length) return null;
  if (ttf && !isSfnt(bytes)) return null; // EOT/woff2 is useless to the rasteriser
  return bytes;
}

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Load one weight: base64 for the SVG @font-face, real TTF bytes for rendering. */
async function loadFont(family: string, weight: number): Promise<LoadedFont | null> {
  const key = `${family}:${weight}`;
  if (!fontCache.has(key)) {
    let out: LoadedFont | null = null;
    try {
      const [webBytes, ttfBytes] = await Promise.all([
        fetchFontFile(family, weight, false).catch(() => null),
        fetchFontFile(family, weight, true).catch(() => null),
      ]);
      if (ttfBytes) out = { b64: toB64(webBytes ?? ttfBytes), bytes: ttfBytes, family };
      else if (webBytes) out = { b64: toB64(webBytes), bytes: new Uint8Array(), family };
    } catch { /* handled by the fallback below */ }
    fontCache.set(key, out);
  }
  return fontCache.get(key) ?? null;
}

/**
 * Never return a font without renderable bytes: if the brand family has no
 * usable TTF, fall back to the bundled serif/sans pair so the page still has
 * real type rather than silently rendering nothing.
 */
async function loadFontOrFallback(family: string, weight: number): Promise<LoadedFont | null> {
  const first = await loadFont(family, weight);
  if (first?.bytes.length) return first;
  const alt = /(serif|playfair|lora|merriweather|garamond|baskerv|crimson|spectral|cormorant|bitter|domine)/i.test(family)
    ? FALLBACK_FAMILY.serif
    : FALLBACK_FAMILY.sans;
  if (alt.toLowerCase() === family.toLowerCase()) return first;
  console.warn(`[collateral] no TTF for "${family}" — falling back to ${alt}`);
  const second = await loadFont(alt, weight);
  return second?.bytes.length ? second : first;
}


export type CollateralCopy = {
  deck?: {
    section?: string;
    sectionSub?: string;
    points?: Array<{ title: string; body: string }>;
    closing?: string;
    /** Agenda / contents slide. */
    agenda?: string[];
    agendaSub?: string;
    /** Full-bleed statement slide. */
    statement?: string;
    /** Two-column copy + image well. */
    splitTitle?: string;
    splitBody?: string;
    /** Data slide. */
    statsTitle?: string;
    stats?: Array<{ figure: string; label: string; note: string }>;
    /** Process / timeline slide. */
    timelineTitle?: string;
    timeline?: Array<{ label: string; body: string }>;
    /** Quote slide. */
    quote?: string;
    quoteAttribution?: string;
  };
  proposal?: { scope?: string[]; terms?: string };
  invoice?: { terms?: string };
  notecard?: string;
  voiceDo?: string;
  voiceDont?: string;
};

export type CollateralCtx = {
  company: string;
  tagline?: string | null;
  person: {
    name?: string | null;
    title?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    address?: string | null;
  };
  /** Verified, normalised text inventory — the source of truth for every line. */
  details: ContactDetails;
  colors: Record<string, string>;
  fonts: { heading?: string | null; body?: string | null };
  /** Traced vector mark (preferred) — inlined so the ink stays vector. */
  logoSvg?: string | null;
  /**
   * The reversed / knockout artwork, used whenever a piece draws the mark on a
   * dark ground. Sourced from the founder's "reversed" logo slot, else the
   * generated knockout/mono variant. Absent for ventures that only have a
   * primary mark — those fall back to a single-ink knockout of the primary.
   */
  logoSvgDark?: string | null;
  symbolSvgDark?: string | null;
  /**
   * Symbol isolated from a traced lockup. When present it is the artwork every
   * piece draws, and the company name is set in real type beside it instead of
   * shipping the tracer's polygon letterforms.
   */
  symbolSvg?: string | null;


  voice?: string | null;
  ad: ArtDirection;
  copy?: CollateralCopy | null;
};

export const COLLATERAL_KINDS = [
  "business_card",
  "letterhead",
  "envelope",
  "notecard",
  "email_signature",
  "invoice",
  "proposal",
  "presentation",
  "guidelines",
  "design_tokens",
] as const;
export type CollateralKind = typeof COLLATERAL_KINDS[number];

export const KIND_LABELS: Record<CollateralKind, string> = {
  business_card: "Business card",
  letterhead: "Letterhead",
  envelope: "#10 envelope",
  notecard: "Notecard",
  email_signature: "Email signature",
  invoice: "Invoice template",
  proposal: "Proposal template",
  presentation: "Presentation template",
  guidelines: "Brand guidelines",
  design_tokens: "Design tokens",
};

export type Page = { name: string; svg: string; width: number; height: number; metrics?: PageMetrics };

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

function r(n: number, p = 2): number {
  const f = Math.pow(10, p);
  return Math.round(n * f) / f;
}

function palette(ctx: CollateralCtx) {
  const c = ctx.colors ?? {};
  const primary = c.primary || c.accent || "#111827";
  const fg = c.fg || c.text || "#14161A";
  const accent = c.accent || c.secondary || primary;
  const muted = c.muted || "#6B7280";
  const paper = c.bg || c.surface || PAPER_TONE[ctx.ad.material.paper] || "#FFFFFF";
  return { primary, paper, fg, accent, muted };
}

/** Blend two hex colours — used for hairlines that sit on the paper, not over it. */
function mix(a: string, b: string, t: number): string {
  const p = (h: string) => {
    const s = h.replace("#", "");
    return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
  };
  const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
  const to = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${to(r1 + (r2 - r1) * t)}${to(g1 + (g2 - g1) * t)}${to(b1 + (b2 - b1) * t)}`;
}

// ── typesetting ─────────────────────────────────────────────────────────────

type Fonts = { head?: Uint8Array | null; body?: Uint8Array | null };

type LineOpts = {
  family?: "head" | "body";
  weight?: number;
  anchor?: "start" | "middle" | "end";
  tracking?: number;
  opacity?: number;
  maxWidth?: number;
  minSize?: number;
};

function makeType(fonts: Fonts) {
  const bytesFor = (f: "head" | "body") => (f === "head" ? fonts.head : fonts.body);

  // The legal minimum type size for the page currently being drawn. Set once
  // per page from its print spec, so no call site can set 6pt caption type on
  // a piece whose standard is 8pt — and nothing shrinks below it to fit.
  let floorPx = 0;
  // Comfortable line length for the page, in characters. Long measures are a
  // readability defect on letter-size and slide pages, so blocks wrap early.
  let measureChars = 0;
  const setFloor = (px: number, chars = 0) => {
    floorPx = Math.max(0, px || 0);
    measureChars = Math.max(0, chars || 0);
  };
  const min = (o: { minSize?: number }) => Math.max(o.minSize ?? 0, floorPx);

  /** One line, shrunk if needed so it can never leave its box. */
  function line(text: string, x: number, y: number, size: number, fill: string, o: LineOpts = {}): string {
    const t = String(text ?? "").trim();
    if (!t) return "";
    const family = o.family ?? "body";
    const tracking = o.tracking ?? 0;
    const floor = min(o);
    let out = t, s = Math.max(size, floor);
    // A single line longer than the piece's comfortable measure is a paragraph
    // masquerading as a headline — cut it at a word, don't set it in agate.
    if (measureChars && t.length > measureChars * 1.15) {
      let cut = t.slice(0, measureChars);
      const sp = cut.lastIndexOf(" ");
      if (sp > measureChars * 0.5) cut = cut.slice(0, sp);
      out = `${cut.replace(/[\s,;:.\-–—]+$/, "")}…`;
    }
    if (o.maxWidth) {
      const fit = fitLine(out, { size: s, maxWidth: o.maxWidth, bytes: bytesFor(family), tracking, minSize: floor || undefined });
      out = fit.text; s = fit.size;
      if (!out) return "";
    }
    return `<text x="${r(x)}" y="${r(y)}" font-family="${family === "head" ? "BrandHead" : "BrandBody"}" font-weight="${o.weight ?? 400}" font-size="${r(s)}" fill="${fill}" text-anchor="${o.anchor ?? "start"}" letter-spacing="${r(tracking)}" opacity="${o.opacity ?? 1}">${esc(out)}</text>`;
  }

  /** A wrapped block that respects a line budget; returns svg + consumed height. */
  function block(
    text: string,
    x: number,
    y: number,
    size: number,
    width: number,
    fill: string,
    o: { family?: "head" | "body"; weight?: number; leading?: number; maxLines?: number; tracking?: number; opacity?: number; anchor?: "start" | "middle" | "end"; minSize?: number } = {},
  ): { svg: string; height: number; size: number; lines: number } {
    const family = o.family ?? "body";
    const leading = o.leading ?? 1.55;
    const floor = min(o);
    const base = Math.max(size, floor);
    // Cap the measure: an alphabet's average advance times the comfortable
    // character count is the widest this block should ever set.
    const cap = measureChars
      ? (measure("abcdefghijklmnopqrstuvwxyz", base, bytesFor(family), o.tracking ?? 0) / 26) * measureChars
      : width;
    const boxW = Math.min(width, Math.max(cap, base * 8));
    const fit = fitBox(String(text ?? ""), {
      size: base,
      maxWidth: boxW,
      maxLines: o.maxLines ?? 40,
      bytes: bytesFor(family),
      tracking: o.tracking ?? 0,
      minSize: floor || undefined,
    });
    const svg = fit.lines
      .map((l, i) => (l ? line(l, x, y + i * fit.size * leading, fit.size, fill, { family, weight: o.weight, tracking: o.tracking, opacity: o.opacity, anchor: o.anchor }) : ""))
      .join("");
    return { svg, height: fit.lines.length * fit.size * leading, size: fit.size, lines: fit.lines.length };
  }

  const width = (t: string, size: number, family: "head" | "body" = "body", tracking = 0) =>
    measure(t, size, bytesFor(family), tracking);

  /** The size a single line will actually be drawn at after shrink-to-fit. */
  function lineSize(text: string, size: number, maxWidth?: number, o: LineOpts = {}): number {
    const t = String(text ?? "").trim();
    const family = o.family ?? "body";
    const floor = min(o);
    let s = Math.max(size, floor);
    if (t && maxWidth) {
      s = fitLine(t, {
        size: s, maxWidth, bytes: bytesFor(family), tracking: o.tracking ?? 0, minSize: floor || undefined,
      }).size;
    }
    return s;
  }

  /**
   * A top-down cursor. Every element is placed under the *measured* bottom of
   * the one before it, so a headline that shrank to fit — or a paragraph that
   * ran to four lines instead of two — pushes what follows down instead of
   * being written over. Fixed step offsets are what produced the collisions
   * this replaces.
   */
  function flow(x: number, startY: number, boxWidth: number) {
    let y = startY;
    const parts: string[] = [];
    const rest = (s: number) => s * 0.24; // descender + optical breathing room
    const api = {
      get y() { return y; },
      get bottom() { return y; },
      gap(px: number) { y += px; return api; },
      line(text: string, size: number, fill: string, o: LineOpts & { gap?: number } = {}) {
        const t = String(text ?? "").trim();
        if (!t) return api;
        const s = lineSize(t, size, boxWidth, o);
        y += (o.gap ?? 0) + s;
        parts.push(line(t, x, y, size, fill, { ...o, maxWidth: boxWidth }));
        y += rest(s);
        return api;
      },
      block(
        text: string,
        size: number,
        fill: string,
        o: Parameters<typeof block>[6] & { gap?: number; width?: number } = {},
      ) {
        const t = String(text ?? "").trim();
        if (!t) return api;
        const w = o.width ?? boxWidth;
        const leading = o.leading ?? 1.5;
        const probe = block(t, x, 0, size, w, fill, { ...o, leading });
        y += (o.gap ?? 0) + probe.size;
        parts.push(block(t, x, y, size, w, fill, { ...o, leading }).svg);
        y += (probe.lines - 1) * probe.size * leading + rest(probe.size);
        return api;
      },
      svg() { return parts.join(""); },
    };
    return api;
  }

  return { line, block, width, setFloor, lineSize, flow };

}

type TypeKit = ReturnType<typeof makeType>;

// ── surfaces, marks, motifs ─────────────────────────────────────────────────

/** Paper: the base tone plus a whisper of grain so it reads as stock, not screen. */
function surface(W: number, H: number, tone: string, grain: number): string {
  const dots = grain > 0.02
    ? `<rect width="${W}" height="${H}" fill="url(#grain)" opacity="${r(Math.min(0.5, grain))}"/>`
    : "";
  return `<rect width="${W}" height="${H}" fill="${tone}"/>${dots}`;
}

function grainDef(fg: string): string {
  return `<pattern id="grain" width="7" height="7" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="0.45" fill="${fg}" opacity="0.16"/>
    <circle cx="4.5" cy="3.2" r="0.32" fill="${fg}" opacity="0.11"/>
    <circle cx="2.4" cy="5.6" r="0.38" fill="${fg}" opacity="0.09"/>
  </pattern>`;
}

/** Every explicit fill colour in a fragment — used to spot invisible artwork. */
function fillsIn(svg: string): string[] {
  return [...svg.matchAll(/fill\s*[=:]\s*["']?(#[0-9a-f]{3,8}|white|black)/gi)].map((m) => m[1].toLowerCase());
}

/**
 * Inline the vector mark, scaled to fit a box, tinted to one ink colour.
 *
 * `bg` is the surface the mark lands on. It is not decoration: the light,
 * full-colour mark on a dark brand ground is the bug this solves. A dark ground
 * gets the reversed artwork when the venture has one; when it doesn't, the
 * primary mark is knocked out to a single legible ink; and when the artwork
 * cannot be recoloured at all (embedded raster, gradient-only fills) it is set
 * on a light plate rather than left to vanish.
 */

/** Artwork chosen for a surface, plus whether it is the reversed set. */
function markSvgFor(ctx: CollateralCtx, bg?: string | null): { svg: string | null; dark: boolean } {
  if (isDarkSurface(bg)) {
    const reversed = ctx.symbolSvgDark || ctx.logoSvgDark;
    if (reversed) return { svg: reversed, dark: true };
  }
  return { svg: ctx.symbolSvg || ctx.logoSvg || null, dark: false };
}

function markSvgOf(ctx: CollateralCtx): string | null {
  return markSvgFor(ctx, null).svg;
}

/** Artwork whose colour we cannot rewrite: pixels, or gradient/pattern paint. */
function isUntintable(svg: string): boolean {
  return /<image\b/i.test(svg) || /fill\s*[=:]\s*["']?url\(/i.test(svg);
}

/** Rewrite every paint in a fragment to one ink — attributes, inline style and CSS blocks. */
function tint(inner: string, use: string): string {
  return inner
    .replace(/fill\s*=\s*["'](?!none)[^"']*["']/gi, `fill="${use}"`)
    .replace(/stroke\s*=\s*["'](?!none)[^"']*["']/gi, `stroke="${use}"`)
    .replace(/fill\s*:\s*(?!none)[^;"'}]+/gi, `fill:${use}`)
    .replace(/stroke\s*:\s*(?!none)[^;"'}]+/gi, `stroke:${use}`)
    .replace(/currentColor/gi, use);
}

function markAt(
  ctx: CollateralCtx, x: number, y: number, boxW: number, boxH: number,
  ink: string | null, bg?: string,
): string {
  const picked = markSvgFor(ctx, bg);
  const svg = picked.svg;
  if (!svg) return "";
  // Drop full-bleed background plates so the mark sits directly on the paper.
  let inner = stripSvgBackground(svg)
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "")
    .trim();

  const untintable = isUntintable(inner);
  const dark = isDarkSurface(bg);
  const MIN = 2.4;
  // A variant label is not proof of visible pixels. On any known surface we
  // resolve the ink mathematically; when the artwork cannot be recoloured at
  // all we give it a plate instead of letting it vanish — that is true of a
  // founder's uploaded "reversed" raster too, which is how a dark mark used to
  // land on a dark ground and still be called a knockout.
  let use = ink;
  let plate = false;

  if (bg && !untintable) {
    if (picked.dark) use = inkOn(bg);
    if (use && contrastRatio(use, bg) < MIN) use = inkOn(bg);
    if (!use) {
      const fills = fillsIn(inner);
      const visible = fills.some((f) => contrastRatio(f === "white" ? "#ffffff" : f === "black" ? "#000000" : f, bg) >= MIN);
      if (dark || (fills.length && !visible)) use = inkOn(bg);
    }
  } else if (bg && untintable && dark) {
    plate = true;
  }

  if (use && !untintable) inner = tint(inner, use);

  // Scale and position by the artwork's INK box, never its file box: traced
  // marks carry the tracer's canvas padding, so fitting the file put roughly
  // half the requested height on the page as empty air.
  const box = inkBox(svg);
  const s = Math.min(boxW / box.w, boxH / box.h);
  const drawnW = box.w * s;
  const drawnH = box.h * s;
  const dx = x + (boxW - drawnW) / 2 - box.x * s;
  const dy = y + (boxH - drawnH) / 2 - box.y * s;

  const pad = Math.round(Math.max(drawnW, drawnH) * 0.14);
  const plateSvg = plate
    ? `<rect x="${r(x + (boxW - drawnW) / 2 - pad)}" y="${r(y + (boxH - drawnH) / 2 - pad)}" width="${r(drawnW + pad * 2)}" height="${r(drawnH + pad * 2)}" rx="${r(pad * 0.6)}" fill="#ffffff" opacity="0.94"/>`
    : "";

  // The drawn size is recorded on the group so QC can verify the mark landed
  // inside the size band this piece's standard allows; the surface, the artwork
  // used and the ink it was actually drawn in are recorded so QC can measure
  // the specimen's real legibility rather than trusting a variant label.
  const effectiveBg = plate ? "#ffffff" : (bg ?? "");
  const drawnInk = use ?? (untintable ? "" : (fillsIn(inner)[0] ?? ""));
  return `${plateSvg}<g data-mark-w="${r(drawnW)}" data-mark-h="${r(drawnH)}" data-mark-art="${picked.dark ? "reversed" : use ? "knockout" : plate ? "plated" : "primary"}" data-mark-bg="${effectiveBg}" data-mark-ink="${drawnInk}" transform="translate(${r(dx)} ${r(dy)}) scale(${r(s, 5)})">${inner}</g>`;
}



function logoAspect(ctx: CollateralCtx): number {
  const svg = markSvgOf(ctx);
  return svg ? inkAspect(svg) : 1;

}

/** True when the artwork being drawn already contains the company name. */
function isLockup(ctx: CollateralCtx): boolean {
  if (ctx.symbolSvg) return false; // the wordmark is set in real type instead
  return logoAspect(ctx) >= 1.6;

}

/** Clear space the mark demands on every side, from its own height. */
function clearSpace(height: number): number {
  return Math.round(height * 0.55);
}

/**
 * The mark box this piece's standard calls for — height inside the spec band,
 * width from the artwork's own aspect. Templates never hand-pick a logo size.
 */
function markBoxFor(ctx: CollateralCtx, rs: ResolvedSpec, maxWidth: number, bias = 0.85, fillWidth = false) {
  return logoBox(rs, logoAspect(ctx), isLockup(ctx), maxWidth, bias, fillWidth);
}

/** Draw the mark at its spec size, top-left anchored at (x, y). */
function specMark(
  ctx: CollateralCtx, rs: ResolvedSpec, x: number, y: number, maxWidth: number,
  ink: string | null, bg: string, bias = 0.85,
): { svg: string; w: number; h: number; clear: number } {
  const box = markBoxFor(ctx, rs, maxWidth, bias);
  return { svg: markAt(ctx, x, y, box.w, box.h, ink, bg), ...box };
}

/**
 * Logo block for a header: a wide lockup gets the width it needs, a square mark
 * is paired with the typeset company name, measured so it never collides.
 */
function logoBlock(
  ctx: CollateralCtx, T: TypeKit, x: number, baseline: number, height: number,
  ink: string | null, nameFill: string, nameSize: number, maxWidth: number, bg?: string,
): string {
  if (isLockup(ctx)) {
    const w = Math.min(height * logoAspect(ctx), maxWidth);
    return markAt(ctx, x, baseline - height, w, height, ink, bg);
  }
  const gap = Math.round(height * 0.42);
  return [
    markAt(ctx, x, baseline - height, height, height, ink, bg),
    T.line(ctx.company, x + height + gap, baseline - height * 0.24, nameSize, nameFill, {
      family: "head", weight: 700, tracking: nameSize * (ctx.ad.type.displayTracking), maxWidth: maxWidth - height - gap,
    }),
  ].join("");
}

/** The repeating graphic device that makes the set read as one family. */
function motif(ctx: CollateralCtx, g: PageGrid, color: string, corner: "tl" | "tr" | "bl" | "br" = "br"): string {
  const ad = ctx.ad;
  const s = 1;
  const unit = Math.round(Math.min(g.W, g.H) * 0.055 * ad.motif.scale * s);
  const x = corner.includes("r") ? g.W - g.M - unit : g.M;
  const y = corner.startsWith("t") ? g.M : g.H - g.M - unit;
  switch (ad.motif.kind) {
    case "rule_cap":
      return `<rect x="${r(x)}" y="${r(y + unit - ad.ink.ruleWeight)}" width="${unit}" height="${ad.ink.ruleWeight}" fill="${color}"/>`;
    case "corner_notch":
      return `<path d="M ${r(x)} ${r(y + unit)} L ${r(x)} ${r(y)} L ${r(x + unit)} ${r(y)}" fill="none" stroke="${color}" stroke-width="${ad.ink.hairline * 2}"/>`;
    case "dot_grid": {
      const n = 4, gap = unit / (n - 1);
      let out = "";
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        out += `<circle cx="${r(x + i * gap)}" cy="${r(y + j * gap)}" r="${r(ad.ink.hairline * 1.1)}" fill="${color}" opacity="0.6"/>`;
      }
      return out;
    }
    case "diagonal_cut":
      return `<path d="M ${r(x)} ${r(y + unit)} L ${r(x + unit)} ${r(y)} L ${r(x + unit)} ${r(y + unit)} Z" fill="${color}" opacity="0.14"/>`;
    default:
      return "";
  }
}

function label(T: TypeKit, ctx: CollateralCtx, text: string, x: number, y: number, size: number, fill: string, anchor: LineOpts["anchor"] = "start", maxWidth?: number) {
  const upper = ctx.ad.type.caseLabels === "upper";
  return T.line(upper ? String(text).toUpperCase() : text, x, y, size, fill, {
    tracking: size * ctx.ad.type.labelTracking, anchor, maxWidth, weight: 500,
  });
}

function page(width: number, height: number, defs: string, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${defs}</defs>${body}</svg>`;
}

// ── templates ───────────────────────────────────────────────────────────────

type Args = { ctx: CollateralCtx; T: TypeKit; defs: string };

function inverted(ctx: CollateralCtx, kind: string): boolean {
  return ctx.ad.ink.invert.includes(kind);
}

function contactRows(d: ContactDetails): string[] {
  return [d.email, d.phone, d.website, addressLine(d), d.social].filter(Boolean) as string[];
}

/**
 * A card carries a descriptor, not a positioning statement. Anything longer
 * than a glance is cut at a word boundary — never shrunk to 8pt to make it fit.
 */
function cardDescriptor(d: ContactDetails): string {
  const t = String(d.tagline ?? "").replace(/\s+/g, " ").trim();
  if (t && t.length <= 45) return t;
  // Never truncate mid-thought. Use the first complete clause if it stands on
  // its own; otherwise say where the company is, which always reads cleanly.
  const clause = t.split(/[,;:—–]|\s+\|\s+/)[0]?.trim() ?? "";
  if (clause.length >= 22 && clause.length <= 45) return clause;
  const place = [d.address_city, d.address_state].filter(Boolean).join(", ");
  return place || clause || "";
}

function businessCard({ ctx, T, defs }: Args): Page[] {
  const W = 1050, H = 600; // 3.5 × 2in at 300dpi
  const ad = ctx.ad;
  const g = gridFor(ad, W, H);
  const { primary, paper, fg, accent, muted } = palette(ctx);
  const d = ctx.details;
  const invert = inverted(ctx, "business_card");
  const faceInk = invert ? inkOn(primary) : fg;

  const rsF = resolveSpec("business-card-front", W, H);
  const rsB = resolveSpec("business-card-back", W, H);
  T.setFloor(Math.min(rsF.minType, rsB.minType), rsF.measureMax);
  // Never let the art-direction margin fall inside the printer's safe area.
  const M = Math.max(g.M, rsF.safe);

  // FRONT — an asymmetric card: a full-bleed colour field carries the mark at
  // the size a 3.5×2in card actually calls for, the paper side carries the name
  // and a short descriptor.
  const fieldBg = invert ? paper : primary;
  const fieldInk = inkOn(fieldBg);
  const markBox = markBoxFor(ctx, rsF, W * 0.32, 1, true);
  const clear = markBox.clear;
  const fieldW = Math.round(Math.min(W * 0.44, Math.max(W * 0.3, markBox.w + clear * 2)));
  const fieldX = W - fieldW;
  const colW = fieldX - M - Math.round(clear * 0.5);

  const nameSize = Math.max(rsF.minType * 2.2, step(ad, 1.2));
  const descSize = Math.max(rsF.minType, step(ad, -0.5));
  const desc = cardDescriptor(d);
  const stackH = nameSize * 1.05 + (desc ? descSize * 2.4 : 0);
  const nameBase = Math.round((H - stackH) / 2 + nameSize * 0.82);

  const front = page(W, H, defs, [
    invert ? `<rect width="${W}" height="${H}" fill="${primary}"/>` : surface(W, H, paper, ad.material.grain),
    // Bleeds off three edges by design — the field is trim-to-trim.
    `<rect x="${fieldX}" y="0" width="${fieldW}" height="${H}" fill="${fieldBg}"/>`,
    markAt(ctx, fieldX + (fieldW - markBox.w) / 2, (H - markBox.h) / 2, markBox.w, markBox.h, fieldInk, fieldBg),
    T.line(ctx.company, M, nameBase, nameSize, faceInk, {
      family: "head", weight: 700, tracking: nameSize * ad.type.displayTracking, maxWidth: colW, minSize: rsF.minType,
    }),
    desc
      ? T.line(desc, M, nameBase + descSize * 2.1, descSize, invert ? faceInk : muted, {
        tracking: descSize * ad.type.labelTracking * 0.5, maxWidth: colW, minSize: rsF.minType,
      })
      : "",
    `<rect x="${M}" y="${r(nameBase + descSize * (desc ? 3.6 : 1.6))}" width="${r(Math.min(g.span(1), colW * 0.5))}" height="${r(Math.max(2, ad.ink.ruleWeight))}" fill="${invert ? faceInk : accent}"/>`,
  ].join(""));


  // BACK — the contact block, set on the grid and measured line by line.
  const rows = contactRows(d);
  const rule = ad.ink.ruleWeight;
  const nameS = Math.max(rsB.minType * 1.9, step(ad, 1));
  const titleS = Math.max(rsB.minType, step(ad, -0.6));
  const rowS = Math.max(rsB.minType, step(ad, -0.7));
  const rowGap = rowS * 1.62;
  const backMark = markBoxFor(ctx, rsB, W * 0.26, 0.8, true);
  const backColW = Math.min(g.span(Math.max(4, Math.round(ad.grid.columns * 0.62))), W - M * 2 - backMark.w - backMark.clear);

  // Optically centre the whole back block. Pinning it to either trim edge left
  // half the card as dead space.
  const blockH = titleS * 1.7 + rowGap * 2.6 + (rows.length - 1) * rowGap;
  const backTop = Math.max(M + nameS, (H - blockH) / 2 - nameS * 0.2);
  const backRowsTop = backTop + titleS * 1.7 + rowGap * 2.6;

  const back = page(W, H, defs, [
    surface(W, H, paper, ad.material.grain),
    `<rect x="0" y="0" width="${r(rule * 3)}" height="${H}" fill="${primary}"/>`,
    // Mark, top-right, at the back-of-card size band, inside its clear space.
    markAt(ctx, W - M - backMark.w, M, backMark.w, backMark.h, mix(fg, paper, 0.25), paper),
    T.line(d.person_name || ctx.company, M, backTop, nameS, fg, { family: "head", weight: 700, maxWidth: backColW, tracking: nameS * ad.type.displayTracking, minSize: rsB.minType }),
    d.person_title ? label(T, ctx, d.person_title, M, backTop + titleS * 1.7, titleS, accent, "start", backColW) : "",
    `<rect x="${M}" y="${r(backRowsTop - rowGap * 1.25)}" width="${r(Math.min(g.span(2), backColW))}" height="${r(ad.ink.hairline * 2)}" fill="${accent}"/>`,
    ...rows.map((t, i) => T.line(t, M, backRowsTop + i * rowGap, rowS, i === 0 ? fg : muted, { maxWidth: W - M * 2, minSize: rsB.minType })),
  ].join(""));

  return [
    { name: "business-card-front", svg: front, width: W, height: H },
    { name: "business-card-back", svg: back, width: W, height: H },
  ];
}

function letterhead({ ctx, T, defs }: Args): Page[] {
  const W = 1275, H = 1650; // US Letter at 150dpi
  const ad = ctx.ad;
  const g = gridFor(ad, W, H);
  const { primary, paper, fg, accent, muted } = palette(ctx);
  const d = ctx.details;

  const rs = resolveSpec("letterhead", W, H);
  T.setFloor(rs.minType, rs.measureMax);
  const logoH = markBoxFor(ctx, rs, g.span(Math.round(ad.grid.columns * 0.6)), 0.7).h;
  const headBase = snap(ad, Math.max(g.M, rs.safe) + logoH);
  const footerY = H - g.M;
  const footer = [d.website, d.email, d.phone].filter(Boolean).join("   ·   ");
  const addr = addressLine(d);

  const bodyTop = snap(ad, headBase + clearSpace(logoH) + step(ad, 3));
  const openBlock = T.block("Date\n\nRecipient name\nCompany\nStreet address\n\nDear ______,", g.M, bodyTop, step(ad, -0.4), g.span(Math.round(ad.grid.columns * 0.55)), muted, { leading: 1.6, maxLines: 8 });
  const copyBlock = T.block(
    "Body copy sits here. Keep paragraphs short and specific. This template is set in your brand typefaces at your locked sizes, so anything typed into it stays on brand.",
    g.M, snap(ad, bodyTop + openBlock.height + step(ad, 2)), step(ad, -0.3), g.span(Math.round(ad.grid.columns * 0.78)), fg, { leading: ad.type.bodyLeading, maxLines: 12 },
  );

  const body = [
    surface(W, H, paper, ad.material.grain),
    `<rect x="0" y="0" width="${W}" height="${r(ad.ink.ruleWeight * 2)}" fill="${primary}"/>`,
    logoBlock(ctx, T, g.M, headBase, logoH, null, fg, step(ad, 1.4), g.span(Math.round(ad.grid.columns * 0.6)), paper),
    d.tagline ? label(T, ctx, d.tagline, g.M, headBase + step(ad, -0.9) * 2, step(ad, -1.2), muted, "start", g.span(6)) : "",
    `<rect x="${g.M}" y="${r(headBase + clearSpace(logoH))}" width="${g.content}" height="${r(ad.ink.hairline)}" fill="${mix(primary, paper, 0.55)}"/>`,
    openBlock.svg,
    copyBlock.svg,
    `<rect x="${g.M}" y="${r(footerY - step(ad, 1.6))}" width="${g.content}" height="${r(ad.ink.hairline)}" fill="${mix(fg, paper, 0.8)}"/>`,
    footer ? label(T, ctx, footer, W / 2, footerY - step(ad, -0.4), step(ad, -1.1), muted, "middle", g.content) : "",
    addr ? T.line(addr, W / 2, footerY, step(ad, -1.3), mix(fg, paper, 0.45), { anchor: "middle", maxWidth: g.content }) : "",
    motif(ctx, g, accent, "tr"),
  ].join("");
  return [{ name: "letterhead", svg: page(W, H, defs, body), width: W, height: H }];
}

function envelope({ ctx, T, defs }: Args): Page[] {
  const W = 1425, H = 619; // #10 at 150dpi
  const ad = ctx.ad;
  const g = gridFor(ad, W, H);
  const { primary, paper, fg, accent, muted } = palette(ctx);
  const d = ctx.details;
  const rs = resolveSpec("envelope-no10", W, H);
  T.setFloor(rs.minType, rs.measureMax);
  const logoH = markBoxFor(ctx, rs, g.span(Math.round(ad.grid.columns * 0.45)), 0.7).h;
  const base = snap(ad, Math.max(g.M, rs.safe) + logoH);
  const lines = addressBlock(d);

  const body = [
    surface(W, H, paper, ad.material.grain),
    `<rect x="0" y="${r(H - ad.ink.ruleWeight * 2)}" width="${W}" height="${r(ad.ink.ruleWeight * 2)}" fill="${primary}"/>`,
    logoBlock(ctx, T, g.M, base, logoH, null, fg, step(ad, 0.6), g.span(Math.round(ad.grid.columns * 0.45)), paper),
    ...lines.map((l, i) => T.line(l, g.M, base + clearSpace(logoH) + i * step(ad, -1) * 1.6, step(ad, -1.1), muted, { maxWidth: g.span(Math.round(ad.grid.columns * 0.4)) })),
    d.website ? T.line(d.website, g.M, H - g.M, step(ad, -1.2), accent, { maxWidth: g.span(4) }) : "",
    `<rect x="${r(W - g.M - 180)}" y="${g.M}" width="180" height="120" fill="none" stroke="${mix(fg, paper, 0.6)}" stroke-width="${r(ad.ink.hairline * 1.5)}" stroke-dasharray="8 8"/>`,
    label(T, ctx, "Stamp", W - g.M - 90, g.M + 68, step(ad, -1.5), mix(fg, paper, 0.5), "middle", 150),
  ].join("");
  return [{ name: "envelope-no10", svg: page(W, H, defs, body), width: W, height: H }];
}

function notecard({ ctx, T, defs }: Args): Page[] {
  const W = 1050, H = 750; // A2 notecard at 150dpi
  const ad = ctx.ad;
  const g = gridFor(ad, W, H);
  const { primary, paper, fg, accent, muted } = palette(ctx);
  const d = ctx.details;
  const invert = inverted(ctx, "notecard");
  const bg = invert ? primary : paper;
  const ink = invert ? inkOn(primary) : fg;
  const soft = invert ? inkOn(primary) : muted;

  const rs = resolveSpec("notecard", W, H);
  T.setFloor(rs.minType, rs.measureMax);
  const nBox = markBoxFor(ctx, rs, g.content * 0.62, 0.68);
  const markH = nBox.h;
  const markW = nBox.w;
  const top = snap(ad, H * 0.17);
  const nameS = step(ad, 1.1);
  const note = ctx.copy?.notecard || d.tagline || "";

  const body = [
    invert ? `<rect width="${W}" height="${H}" fill="${primary}"/>` : surface(W, H, paper, ad.material.grain),
    markAt(ctx, (W - markW) / 2, top, markW, markH, invert ? ink : null, invert ? primary : paper),
    isLockup(ctx) ? "" : T.line(ctx.company, W / 2, top + markH + clearSpace(markH) * 0.8, nameS, ink, { family: "head", weight: 700, anchor: "middle", tracking: nameS * ad.type.displayTracking, maxWidth: g.content }),
    note ? label(T, ctx, note, W / 2, top + markH + clearSpace(markH) * (isLockup(ctx) ? 0.8 : 1.6), step(ad, -1), soft, "middle", g.span(Math.round(ad.grid.columns * 0.75))) : "",
    `<rect x="${r(W / 2 - g.span(1))}" y="${r(H * 0.52)}" width="${r(g.span(2))}" height="${r(ad.ink.hairline * 2)}" fill="${invert ? ink : accent}" opacity="${invert ? 0.5 : 1}"/>`,
    ...[0, 1, 2].map((i) => `<rect x="${g.M}" y="${r(H * 0.63 + i * step(ad, 2.4))}" width="${g.content}" height="${r(ad.ink.hairline)}" fill="${invert ? ink : fg}" opacity="0.16"/>`),
    d.website ? T.line(d.website, W / 2, H - g.M, step(ad, -1.4), soft, { anchor: "middle", opacity: invert ? 0.7 : 1, maxWidth: g.content }) : "",
  ].join("");
  return [{ name: "notecard", svg: page(W, H, defs, body), width: W, height: H }];
}

function emailSignature({ ctx, T, defs }: Args): Page[] {
  const W = 1200, H = 340;
  const ad = ctx.ad;
  const { primary, paper, fg, accent, muted } = palette(ctx);
  const d = ctx.details;
  const rows = [d.email, d.phone, d.website, d.social].filter(Boolean) as string[];
  const rsSig = resolveSpec("email-signature", W, H);
  T.setFloor(rsSig.minType, rsSig.measureMax);
  // Use the box's real aspect: fitting a wide lockup inside a square slot is
  // what kept the mark a third under its standard height.
  const mb = markBoxFor(ctx, rsSig, W * 0.4, 1, true);
  const markBox = mb.h;
  const left = Math.max(60, rsSig.safe);
  const railX = left + mb.w + clearSpace(markBox) * 0.7;
  const textX = railX + 34;
  const nameS = step(ad, 0.9);
  const rowS = step(ad, -0.9);
  const top = (H - (nameS * 1.5 + rowS * 1.5 + rows.length * rowS * 1.55)) / 2 + nameS;

  const body = [
    surface(W, H, paper, ad.material.grain * 0.4),
    markAt(ctx, left, (H - mb.h) / 2, mb.w, mb.h, null, paper),
    `<rect x="${r(railX)}" y="${r(H * 0.2)}" width="${r(Math.max(3, ad.ink.ruleWeight))}" height="${r(H * 0.6)}" fill="${primary}"/>`,
    T.line(d.person_name || ctx.company, textX, top, nameS, fg, { family: "head", weight: 700, maxWidth: W - textX - 60 }),
    T.line([d.person_title, ctx.company].filter(Boolean).join(" · "), textX, top + nameS * 1.35, rowS, accent, { maxWidth: W - textX - 60 }),
    ...rows.map((t, i) => T.line(t, textX, top + nameS * 1.35 + rowS * 1.9 + i * rowS * 1.55, rowS, muted, { maxWidth: W - textX - 60 })),
  ].join("");
  return [{ name: "email-signature", svg: page(W, H, defs, body), width: W, height: H }];
}

function docTemplate({ ctx, T, defs }: Args, mode: "invoice" | "proposal"): Page[] {
  const W = 1275, H = 1650;
  const ad = ctx.ad;
  const g = gridFor(ad, W, H);
  const { primary, paper, fg, accent, muted } = palette(ctx);
  const d = ctx.details;
  const isInvoice = mode === "invoice";
  const title = isInvoice ? "Invoice" : "Proposal";
  const cols = isInvoice ? ["Description", "Qty", "Rate", "Amount"] : ["Scope item", "Detail", "Timeline", "Investment"];
  const colX = [g.M, g.col(Math.round(ad.grid.columns * 0.55)), g.col(Math.round(ad.grid.columns * 0.72)), W - g.M];

  const rs = resolveSpec(mode, W, H);
  T.setFloor(rs.minType, rs.measureMax);
  const logoH = markBoxFor(ctx, rs, g.span(Math.round(ad.grid.columns * 0.5)), 0.7).h;
  const headBase = snap(ad, Math.max(g.M, rs.safe) + logoH);
  const metaTop = snap(ad, headBase + clearSpace(logoH) + step(ad, 2.5));

  const fromLines = [d.legal_entity || ctx.company, d.person_name, d.email, d.phone, addressLine(d)].filter(Boolean).join("\n");
  const scope = ctx.copy?.proposal?.scope ?? [];
  const terms = isInvoice
    ? (d.payment_terms || ctx.copy?.invoice?.terms || "Payment terms: net 15. Late balances accrue 1.5% monthly.")
    : (ctx.copy?.proposal?.terms || "This proposal is valid for 30 days. Work begins on countersignature and receipt of the deposit.");

  // Both meta columns are typeset through a measured cursor, so a five-line
  // sender block with a wrapping street address reports its real bottom edge
  // instead of being assumed to end nine steps down.
  const metaW = g.span(Math.round(ad.grid.columns * 0.42));
  const metaX2 = g.col(Math.round(ad.grid.columns * 0.55));
  const lab = (t: string) => (ad.type.caseLabels === "upper" ? t.toUpperCase() : t);
  const labelSize = step(ad, -1.5);
  const labelOpts = { tracking: labelSize * ad.type.labelTracking, weight: 500 };
  const fromCol = T.flow(g.M, metaTop - labelSize, metaW);
  fromCol.line(lab("From"), labelSize, accent, labelOpts);
  fromCol.block(fromLines, step(ad, -0.7), fg, { leading: 1.6, maxLines: 6, gap: step(ad, -0.2) });
  const clientCol = T.flow(metaX2, metaTop - labelSize, metaW);
  clientCol.line(lab(isInvoice ? "Bill to" : "Client"), labelSize, accent, labelOpts);
  clientCol.block("Client name\nCompany\nEmail\nAddress", step(ad, -0.7), mix(fg, paper, 0.4), { leading: 1.6, maxLines: 6, gap: step(ad, -0.2) });


  const metaBottom = Math.max(fromCol.bottom, clientCol.bottom);
  const tableTop = snap(ad, Math.max(metaTop + step(ad, 7), metaBottom + step(ad, 3.4)));
  const rowH = step(ad, 1.8);
  const bodyTop = tableTop + step(ad, 0.2);
  // Rows follow the content, and the table can never grow into the footer.
  const footerTop = H - g.M - step(ad, 5.4);
  const maxRows = Math.max(3, Math.floor((footerTop - step(ad, 2.6)) / rowH - bodyTop / rowH - 1.6));
  const rows = Math.min(maxRows, isInvoice ? 6 : Math.min(9, Math.max(4, scope.length + 1)));
  const totalsY = snap(ad, bodyTop + rowH * (rows + 1.6));

  const body = [
    surface(W, H, paper, ad.material.grain),
    `<rect x="0" y="0" width="${W}" height="${r(ad.ink.ruleWeight * 2)}" fill="${primary}"/>`,
    logoBlock(ctx, T, g.M, headBase, logoH, null, fg, step(ad, 1.1), g.span(Math.round(ad.grid.columns * 0.5)), paper),
    label(T, ctx, title, W - g.M, headBase - logoH * 0.35, step(ad, 1.8), primary, "end", g.span(4)),
    T.line(isInvoice ? "No. 0001" : "Prepared for", W - g.M, headBase + step(ad, -0.4), step(ad, -1), muted, { anchor: "end", maxWidth: g.span(4) }),

    fromCol.svg(),
    clientCol.svg(),

    `<rect x="${g.M}" y="${r(tableTop - step(ad, 1.5))}" width="${g.content}" height="${r(ad.ink.ruleWeight)}" fill="${primary}"/>`,
    ...cols.map((c, i) => label(T, ctx, c, colX[i], tableTop - step(ad, -0.2), step(ad, -1.4), primary, i === cols.length - 1 ? "end" : "start", g.span(3))),
    `<rect x="${g.M}" y="${r(bodyTop)}" width="${g.content}" height="${r(ad.ink.hairline)}" fill="${mix(fg, paper, 0.65)}"/>`,
    ...Array.from({ length: rows }, (_, i) => {
      const y = bodyTop + (i + 1) * rowH;
      const text = !isInvoice && scope[i]
        ? T.line(scope[i], g.M, y - rowH * 0.35, step(ad, -0.8), fg, { maxWidth: g.span(Math.round(ad.grid.columns * 0.5)) })
        : "";
      return `${text}<rect x="${g.M}" y="${r(y)}" width="${g.content}" height="${r(ad.ink.hairline)}" fill="${mix(fg, paper, 0.82)}"/>`;
    }),

    `<rect x="${r(W - g.M - g.span(Math.round(ad.grid.columns * 0.36)))}" y="${r(totalsY)}" width="${r(g.span(Math.round(ad.grid.columns * 0.36)))}" height="${r(step(ad, 2.6))}" fill="${primary}" opacity="0.07" rx="${ad.material.radius}"/>`,
    T.line(isInvoice ? "Total due" : "Total investment", W - g.M - g.span(Math.round(ad.grid.columns * 0.34)), totalsY + step(ad, 1.7), step(ad, -0.3), fg, { family: "head", weight: 700, maxWidth: g.span(4) }),
    T.line("$0.00", W - g.M - step(ad, 0.4), totalsY + step(ad, 1.7), step(ad, 0.4), primary, { family: "head", weight: 700, anchor: "end", maxWidth: g.span(3) }),

    T.block(terms, g.M, H - g.M - step(ad, 3.6), step(ad, -1.1), g.span(Math.round(ad.grid.columns * 0.7)), muted, { leading: 1.5, maxLines: 3 }).svg,
    d.tax_id ? T.line(`EIN ${d.tax_id}`, g.M, H - g.M - step(ad, 0.4), step(ad, -1.4), mix(fg, paper, 0.5), { maxWidth: g.span(4) }) : "",
    label(T, ctx, [d.website, d.email].filter(Boolean).join("   ·   "), W - g.M, H - g.M - step(ad, 0.4), step(ad, -1.4), muted, "end", g.span(6)),
    // No corner motif here: all four corners are already spoken for (mark,
    // title, terms, contact line). The ornament was striking through the title.
  ].join("");

  return [{ name: mode, svg: page(W, H, defs, body), width: W, height: H }];
}

function presentation({ ctx, T, defs }: Args): Page[] {
  const W = 1920, H = 1080;
  const ad = ctx.ad;
  const g = gridFor(ad, W, H);
  // A slide is read from the back of a room, not held at arm's length. The
  // shared type scale is sized for print, so every slide step is multiplied
  // once here — type, gaps and rules all grow together.
  const SLIDE_SCALE = 1.62;
  const sp = (n: number) => step(ad, n) * SLIDE_SCALE;
  const { primary, paper, fg, accent, muted } = palette(ctx);
  const d = ctx.details;
  const ink = inkOn(primary);
  const invert = inverted(ctx, "presentation");
  const coverInk = invert ? ink : fg;
  const pages: Page[] = [];
  const deck = ctx.copy?.deck ?? {};
  const points = (deck.points ?? []).slice(0, 3);
  const agenda = (deck.agenda ?? []).slice(0, 6);
  const stats = (deck.stats ?? []).slice(0, 3);
  const steps = (deck.timeline ?? []).slice(0, 4);

  const rsCover = resolveSpec("slide-1-cover", W, H);
  const rsSlide = resolveSpec("slide-2-section", W, H);
  // The cover carries its own, larger type floor; every interior slide shares
  // the running one. Taking the minimum of the two let 22px chrome onto a page
  // whose standard is 26px.
  T.setFloor(rsCover.minType, rsCover.measureMax);
  const coverBox = markBoxFor(ctx, rsCover, g.span(4), 0.65);
  const slideBox = markBoxFor(ctx, rsSlide, g.span(3), 0.6);

  const total = 10;
  /**
   * Running chrome shared by every interior slide: folio, company footer and
   * the mark in the safe corner, always resolved against the slide's own
   * ground so a dark slide gets the reversed artwork.
   */
  const chrome = (n: number, ground: string, tone: string, markInk: string | null) => [
    label(T, ctx, `${String(n).padStart(2, "0")} / ${total}`, g.M, g.M + sp( -0.6), sp( -1.2), tone, "start", g.span(2)),
    T.line(ctx.company, g.M, H - g.M, sp( -0.9), tone, { maxWidth: g.span(5), opacity: 0.85 }),
    markAt(ctx, W - g.M - slideBox.w, H - g.M - slideBox.h, slideBox.w, slideBox.h, markInk, ground),
  ].join("");

  const headTop = g.M + sp( 2.2);
  /** Slide title block, measured — the body always starts under what was drawn. */
  const slideHead = (title: string, sub?: string) => {
    const f = T.flow(g.M, headTop, g.span(Math.round(ad.grid.columns * 0.72)));
    f.line(title, sp( 2.4), fg, { family: "head", weight: 700, tracking: sp( 2.4) * ad.type.displayTracking });
    const ruleY = f.bottom + sp( 0.5);
    let bottom = ruleY + sp( 1.4);
    let subSvg = "";
    if (sub) {
      const sf = T.flow(g.M, ruleY + sp( 0.9), g.span(Math.round(ad.grid.columns * 0.6)));
      sf.block(sub, sp( 0.2), muted, { leading: 1.5, maxLines: 2 });
      subSvg = sf.svg();
      bottom = sf.bottom + sp( 1.2);
    }
    return {
      bottom,
      svg: `${f.svg()}<rect x="${g.M}" y="${r(ruleY)}" width="${r(g.span(1))}" height="${r(ad.ink.ruleWeight * 2)}" fill="${accent}"/>${subSvg}`,
    };
  };

  /** Vertical band left for slide body between the head and the footer chrome. */
  const bandBottom = H - g.M - slideBox.h - sp(1.2);
  /**
   * Slides were reading top-heavy: every body stack started right under the
   * title and left the lower third empty. The measured stack is centred in the
   * band it actually has, so the composition sits on the slide instead of
   * clinging to the headline.
   */
  const balance = (top: number, height: number) =>
    `translate(0, ${r(Math.max(0, (bandBottom - top - height) / 2))})`;

  // ── 01 cover ──────────────────────────────────────────────────────────────
  const coverGround = invert ? primary : paper;
  const coverStack = T.flow(g.M, H * 0.52, g.span(Math.round(ad.grid.columns * 0.82)));
  coverStack.line(ctx.company, sp( 5.2), coverInk, {
    family: "head", weight: 700, tracking: sp( 5.2) * ad.type.displayTracking,
  });
  if (d.tagline) {
    coverStack.block(d.tagline, sp( 0.8), coverInk, {
      leading: 1.4, maxLines: 2, gap: sp( 1.1), opacity: invert ? 0.82 : 0.72,
      width: g.span(Math.round(ad.grid.columns * 0.6)),
    });
  }
  pages.push({
    name: "slide-1-cover", width: W, height: H,
    svg: page(W, H, defs, [
      invert ? `<rect width="${W}" height="${H}" fill="${primary}"/>` : surface(W, H, paper, ad.material.grain),
      markAt(ctx, g.M, g.M, coverBox.w, coverBox.h, invert ? coverInk : null, coverGround),
      coverStack.svg(),
      label(T, ctx, String(new Date().getFullYear()), W - g.M, H - g.M, sp( -0.6), coverInk, "end", g.span(2)),
      motif(ctx, g, invert ? coverInk : accent, "br"),
    ].join("")),
  });

  T.setFloor(rsSlide.minType, rsSlide.measureMax);

  // ── 02 section divider ────────────────────────────────────────────────────
  const sectionStack = T.flow(g.M, H * 0.34, g.span(Math.round(ad.grid.columns * 0.72)));
  sectionStack.line("01", sp( 0.6), accent, { tracking: sp( 0.6) * ad.type.labelTracking, weight: 500 });
  sectionStack.line(deck.section || "Where we are today", sp( 3.8), fg, {
    family: "head", weight: 700, gap: sp( 1.1), tracking: sp( 3.8) * ad.type.displayTracking,
  });
  sectionStack.block(deck.sectionSub || "One sentence that frames what this section proves.", sp( 0.6), muted, {
    leading: 1.5, maxLines: 2, gap: sp( 1.0), width: g.span(Math.round(ad.grid.columns * 0.55)),
  });
  pages.push({
    name: "slide-2-section", width: W, height: H,
    svg: page(W, H, defs, [
      surface(W, H, paper, ad.material.grain),
      `<rect x="0" y="0" width="${r(ad.ink.ruleWeight * 6)}" height="${H}" fill="${accent}"/>`,
      sectionStack.svg(),
      chrome(2, paper, muted, mix(primary, paper, 0.25)),
    ].join("")),
  });

  // ── 03 agenda ─────────────────────────────────────────────────────────────
  const agendaHead = slideHead("Agenda", deck.agendaSub || undefined);
  const agendaItems = agenda.length ? agenda : [
    "Where we are today", "What we heard", "What we propose", "How it works", "What it costs", "Next steps",
  ];
  const agendaCols = agendaItems.length > 3 ? 2 : 1;
  const agendaColW = agendaCols === 2 ? (g.content - g.gutter * 2) / 2 : g.span(Math.round(ad.grid.columns * 0.7));
  const perCol = Math.ceil(agendaItems.length / agendaCols);
  const agendaRows: string[] = [];
  for (let c = 0; c < agendaCols; c++) {
    const x = g.M + c * (agendaColW + g.gutter * 2);
    let y = agendaHead.bottom + sp( 0.6);
    for (let i = c * perCol; i < Math.min(agendaItems.length, (c + 1) * perCol); i++) {
      const f = T.flow(x, y, agendaColW);
      f.line(`${String(i + 1).padStart(2, "0")}   ${agendaItems[i]}`, sp( 1.0), fg, {
        family: "head", weight: 700,
      });
      const ruleY = f.bottom + sp( 0.5);
      agendaRows.push(`${f.svg()}<rect x="${r(x)}" y="${r(ruleY)}" width="${r(agendaColW)}" height="${r(ad.ink.hairline)}" fill="${mix(fg, paper, 0.82)}"/>`);
      y = ruleY + sp( 0.9);
    }
  }
  pages.push({
    name: "slide-3-agenda", width: W, height: H,
    svg: page(W, H, defs, [
      surface(W, H, paper, ad.material.grain),
      agendaHead.svg,
      `<g transform="${balance(agendaTop, agendaBottom - agendaTop)}">${agendaRows.join("")}</g>`,
      chrome(3, paper, muted, mix(primary, paper, 0.3)),
    ].join("")),
  });

  // ── 04 statement ──────────────────────────────────────────────────────────
  const stGround = primary;
  const stInk = inkOn(stGround);
  const stStack = T.flow(g.M, H * 0.3, g.span(Math.round(ad.grid.columns * 0.78)));
  stStack.line("The point", sp( -0.4), stInk, { tracking: sp( -0.4) * ad.type.labelTracking, weight: 500, opacity: 0.75 });
  stStack.block(deck.statement || deck.sectionSub || `${ctx.company} exists to make this simple.`, sp( 3.0), stInk, {
    family: "head", weight: 700, leading: 1.18, maxLines: 4, gap: sp( 1.4),
  });
  pages.push({
    name: "slide-4-statement", width: W, height: H,
    svg: page(W, H, defs, [
      `<rect width="${W}" height="${H}" fill="${stGround}"/>`,
      stStack.svg(),
      chrome(4, stGround, mix(stInk, stGround, 0.25), stInk),
    ].join("")),
  });

  // ── 05 three-column content ───────────────────────────────────────────────
  const contentHead = slideHead(deck.section || "What we propose");
  const cardGap = g.gutter * 2;
  const cardWidth = (g.content - cardGap * 2) / 3;
  const cardPad = sp( 1.4);
  const cardTop = contentHead.bottom + sp( 0.6);
  const cardMaxH = H - g.M - slideBox.h - sp( 1.6) - cardTop;
  // Each card is typeset first, then all three are drawn at the tallest
  // measured height. Nothing is placed at a guessed offset, so the number,
  // the headline and the body can no longer land on top of one another, and
  // three short points no longer leave two-thirds of the card empty.
  const cardStacks = [0, 1, 2].map((i) => {
    const x = g.M + i * (cardWidth + cardGap);
    const p = points[i];
    const inner = cardWidth - cardPad * 2;
    const f = T.flow(x + cardPad, cardTop + cardPad * 0.4, inner);
    f.line(`0${i + 1}`, sp( -0.6), accent, { tracking: sp( -0.6) * ad.type.labelTracking, weight: 500 });
    f.block(p?.title || "Point headline", sp( 1.2), fg, {
      family: "head", weight: 700, leading: 1.15, maxLines: 3, gap: sp( 0.5),
    });
    f.block(
      p?.body || "Supporting detail, kept short so the slide stays readable from the back of the room.",
      sp( -0.2), muted, { leading: 1.5, maxLines: 6, gap: sp( 0.4) },
    );
    return { x, svg: f.svg(), height: f.bottom - cardTop + cardPad };
  });
  const cardH = Math.min(cardMaxH, Math.max(...cardStacks.map((c) => c.height), (bandBottom - cardTop) * 0.72));

  pages.push({
    name: "slide-5-content", width: W, height: H,
    svg: page(W, H, defs, [
      surface(W, H, paper, ad.material.grain),
      contentHead.svg,
      `<g transform="${balance(cardTop, cardH)}">${cardStacks.map((c) =>
        `<rect x="${r(c.x)}" y="${r(cardTop)}" width="${r(cardWidth)}" height="${r(cardH)}" fill="${primary}" opacity="0.05" rx="${ad.material.radius}"/>${c.svg}`,
      ).join("")}</g>`,
      chrome(5, paper, muted, mix(primary, paper, 0.3)),
    ].join("")),
  });

  // ── 06 split: copy left, image well right ─────────────────────────────────
  const splitHead = slideHead(deck.splitTitle || "How it works");
  const splitColW = (g.content - g.gutter * 2) / 2;
  const splitTop = splitHead.bottom + sp( 0.4);
  const splitStack = T.flow(g.M, splitTop, splitColW);
  splitStack.block(
    deck.splitBody || deck.sectionSub || "A short paragraph that carries the argument, set at a comfortable measure so it stays readable from the back of the room.",
    sp( 0.4), fg, { leading: 1.55, maxLines: 6 },
  );
  for (const p of points.slice(0, 3)) {
    splitStack.line(`—  ${p.title}`, sp( 0.0), muted, { gap: sp( 0.7) });
  }
  const wellX = g.M + splitColW + g.gutter * 2;
  const wellH = Math.min(H - g.M - slideBox.h - sp( 1.8) - splitTop, H * 0.5);
  pages.push({
    name: "slide-6-split", width: W, height: H,
    svg: page(W, H, defs, [
      surface(W, H, paper, ad.material.grain),
      splitHead.svg,
      `<g transform="${balance(splitTop, Math.max(wellH, splitStack.bottom - splitTop))}">${splitStack.svg()}` +
      `<rect x="${r(wellX)}" y="${r(splitTop)}" width="${r(splitColW)}" height="${r(wellH)}" rx="${ad.material.radius}" fill="${primary}" opacity="0.08"/>`,
      `<rect x="${r(wellX)}" y="${r(splitTop)}" width="${r(splitColW)}" height="${r(ad.ink.ruleWeight * 3)}" fill="${accent}"/>`,
      label(T, ctx, "Image", wellX + sp( 1.2), splitTop + wellH - sp( 1.2), sp( -1.0), mix(fg, paper, 0.45), "start", splitColW - sp( 2.4)),
      chrome(6, paper, muted, mix(primary, paper, 0.3)),
    ].join("")),
  });

  // ── 07 data ───────────────────────────────────────────────────────────────
  const dataHead = slideHead(deck.statsTitle || "By the numbers");
  const statW = (g.content - g.gutter * 2 * 2) / 3;
  const statTop = dataHead.bottom + sp( 1.0);
  const fallbackStats = [
    { figure: "—", label: "Add your figure", note: "Replace with a number you can defend." },
    { figure: "—", label: "Add your figure", note: "Replace with a number you can defend." },
    { figure: "—", label: "Add your figure", note: "Replace with a number you can defend." },
  ];
  const statSet = stats.length ? stats : fallbackStats;
  const statStacks = statSet.slice(0, 3).map((s, i) => {
    const x = g.M + i * (statW + g.gutter * 2);
    const f = T.flow(x, statTop, statW);
    f.line(s.figure || "—", sp( 4.0), primary, { family: "head", weight: 700, tracking: sp( 4.0) * ad.type.displayTracking });
    f.line(s.label || "", sp( 0.4), fg, { family: "head", weight: 700, gap: sp( 0.6) });
    f.block(s.note || "", sp( -0.6), muted, { leading: 1.5, maxLines: 3, gap: sp( 0.4) });
    return { x, svg: f.svg(), bottom: f.bottom };
  });
  pages.push({
    name: "slide-7-data", width: W, height: H,
    svg: page(W, H, defs, [
      surface(W, H, paper, ad.material.grain),
      dataHead.svg,
      `<g transform="${balance(statTop, Math.max(...statStacks.map((s) => s.bottom)) - statTop)}">${statStacks.map((s) =>
        `<rect x="${r(s.x)}" y="${r(statTop - sp( 0.6))}" width="${r(ad.ink.ruleWeight * 3)}" height="${r(s.bottom - statTop + sp( 0.8))}" fill="${accent}" opacity="0.35"/>${s.svg}`,
      ).join("")}</g>`,
      chrome(7, paper, muted, mix(primary, paper, 0.3)),
    ].join("")),
  });

  // ── 08 timeline ───────────────────────────────────────────────────────────
  const tlHead = slideHead(deck.timelineTitle || "The path");
  const tlSet = steps.length ? steps : [
    { label: "Week 1", body: "Get the offer and the page live." },
    { label: "Week 2", body: "Take it to real buyers." },
    { label: "Week 3", body: "Fix what the market told us." },
    { label: "Week 4", body: "Repeat what worked." },
  ];
  const tlW = (g.content - g.gutter * 2 * (tlSet.length - 1)) / tlSet.length;
  const tlRuleY = tlHead.bottom + sp( 2.2);
  const tlStacks = tlSet.map((s, i) => {
    const x = g.M + i * (tlW + g.gutter * 2);
    const f = T.flow(x, tlRuleY + sp( 1.0), tlW);
    f.line(s.label || `Step ${i + 1}`, sp( 1.0), fg, { family: "head", weight: 700 });
    f.block(s.body || "", sp( -0.4), muted, { leading: 1.5, maxLines: 4, gap: sp( 0.4) });
    return `<circle cx="${r(x + ad.ink.ruleWeight * 3)}" cy="${r(tlRuleY)}" r="${r(ad.ink.ruleWeight * 3)}" fill="${accent}"/>${f.svg()}`;
  });
  pages.push({
    name: "slide-8-timeline", width: W, height: H,
    svg: page(W, H, defs, [
      surface(W, H, paper, ad.material.grain),
      tlHead.svg,
      `<rect x="${g.M}" y="${r(tlRuleY - ad.ink.hairline / 2)}" width="${r(g.content)}" height="${r(ad.ink.hairline)}" fill="${mix(fg, paper, 0.78)}"/>`,
      tlStacks.join(""),
      chrome(8, paper, muted, mix(primary, paper, 0.3)),
    ].join("")),
  });

  // ── 09 quote ──────────────────────────────────────────────────────────────
  const qGround = fg;
  const qInk = inkOn(qGround);
  const qStack = T.flow(g.M, H * 0.3, g.span(Math.round(ad.grid.columns * 0.76)));
  qStack.block(
    `“${deck.quote || deck.statement || "The clearest offer wins."}”`,
    sp( 2.4), qInk, { family: "head", weight: 700, leading: 1.25, maxLines: 4 },
  );
  qStack.line(deck.quoteAttribution || ctx.company, sp( 0.0), mix(qInk, qGround, 0.28), { gap: sp( 1.4) });
  pages.push({
    name: "slide-9-quote", width: W, height: H,
    svg: page(W, H, defs, [
      `<rect width="${W}" height="${H}" fill="${qGround}"/>`,
      `<rect x="${g.M}" y="${r(H * 0.3 - sp( 2.4))}" width="${r(ad.ink.ruleWeight * 4)}" height="${r(sp( 2.0))}" fill="${accent}"/>`,
      qStack.svg(),
      chrome(9, qGround, mix(qInk, qGround, 0.3), qInk),
    ].join("")),
  });

  // ── 10 closing ────────────────────────────────────────────────────────────
  const closeStack = T.flow(W / 2, H * 0.58, g.span(Math.round(ad.grid.columns * 0.7)));
  closeStack.line(deck.closing || "Thank you", sp( 3.6), inkOn(fg), {
    family: "head", weight: 700, anchor: "middle",
  });
  const contact = [d.website, d.email, d.phone].filter(Boolean).join("   ·   ");
  if (contact) {
    closeStack.line(contact, sp( 0.2), mix(inkOn(fg), fg, 0.22), { anchor: "middle", gap: sp( 1.0) });
  }
  pages.push({
    name: "slide-10-closing", width: W, height: H,
    svg: page(W, H, defs, [
      `<rect width="${W}" height="${H}" fill="${fg}"/>`,
      markAt(ctx, (W - coverBox.w) / 2, H * 0.3, coverBox.w, coverBox.h, inkOn(fg), fg),
      closeStack.svg(),
    ].join("")),
  });

  return pages;
}


function guidelines({ ctx, T, defs }: Args): Page[] {
  const W = 1600, H = 1000;
  const ad = ctx.ad;
  const g = gridFor(ad, W, H);
  const { primary, paper, fg, accent, muted } = palette(ctx);
  const ink = inkOn(primary);
  const pages: Page[] = [];
  const d = ctx.details;

  const rsG = resolveSpec("guidelines-1-cover", W, H);
  const rsPage = resolveSpec("guidelines-3-colour", W, H);
  const rsLogo = resolveSpec("guidelines-2-logo", W, H);

  // The running head is set as a measured stack: the folio number, then the
  // title under its real drawn height, then the rule under that. Fixed offsets
  // are what put "01" through "Logo".
  const head = (title: string, n: string): { svg: string; bottom: number } => {
    const eyebrow = step(ad, -1);
    const f = T.flow(g.M, g.M, g.span(Math.round(ad.grid.columns * 0.6)));
    f.line(ad.type.caseLabels === "upper" ? n.toUpperCase() : n, eyebrow, accent, {
      tracking: eyebrow * ad.type.labelTracking, weight: 500,
    });
    f.line(title, step(ad, 2.4), fg, {
      family: "head", weight: 700, gap: step(ad, 0.4), tracking: step(ad, 2.4) * ad.type.displayTracking,
    });
    const ruleY = f.bottom + step(ad, 0.9);
    return {
      bottom: ruleY + step(ad, 1.6),
      svg: [
        surface(W, H, paper, ad.material.grain),
        f.svg(),
        `<rect x="${g.M}" y="${r(ruleY)}" width="${g.content}" height="${r(ad.ink.hairline)}" fill="${mix(primary, paper, 0.55)}"/>`,
        label(T, ctx, `${ctx.company} — Brand guidelines`, W - g.M, g.M + eyebrow, step(ad, -1.3), muted, "end", g.span(5)),
      ].join(""),
    };
  };

  // Cover carries its own (larger) type floor; the interior pages share theirs.
  T.setFloor(rsG.minType, rsG.measureMax);
  const gCover = markBoxFor(ctx, rsG, g.span(4), 0.68);

  pages.push({
    name: "guidelines-1-cover", width: W, height: H,
    svg: page(W, H, defs, [
      `<rect width="${W}" height="${H}" fill="${primary}"/>`,
      markAt(ctx, g.M, g.M, gCover.w, gCover.h, ink, primary),
      label(T, ctx, "Brand guidelines", g.M, H * 0.52, step(ad, 0.6), ink, "start", g.span(6)),
      T.line(ctx.company, g.M, H * 0.66, step(ad, 4), ink, { family: "head", weight: 700, maxWidth: g.span(Math.round(ad.grid.columns * 0.8)), tracking: step(ad, 4) * ad.type.displayTracking }),
      d.tagline ? T.line(d.tagline, g.M, H * 0.73, step(ad, 0.4), ink, { opacity: 0.75, maxWidth: g.span(Math.round(ad.grid.columns * 0.6)) }) : "",
      T.line(new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }), g.M, H - g.M, Math.max(step(ad, -1), rsG.minType), ink, { opacity: 0.7, maxWidth: g.span(4) }),
      motif(ctx, g, ink, "br"),
    ].join("")),
  });

  T.setFloor(Math.min(rsPage.minType, rsLogo.minType), rsPage.measureMax);

  // ── 01 Logo: the full variant system, not three tiles and a lot of air ────
  const hLogo = head("Logo", "01");
  const top = hLogo.bottom;
  const charcoal = "#161719";
  const tiles: Array<{ label: string; note: string; bg: string; ink: string | null }> = [
    { label: "Primary", note: "Full colour on light", bg: paper, ink: null },
    { label: "On brand", note: `Reversed on ${primary}`, bg: primary, ink: inkOn(primary) },
    { label: "On accent", note: "Reversed on accent", bg: accent, ink: inkOn(accent) },
    { label: "Mono black", note: "One ink on paper", bg: paper, ink: "#121212" },
    { label: "Mono white", note: "One ink on charcoal", bg: charcoal, ink: "#FFFFFF" },
    { label: "One colour", note: "Brand ink only", bg: paper, ink: primary },
  ];
  const cols = 3, rowsL = 2;
  const tGap = g.gutter * 2;
  const tileW = (g.content - tGap * (cols - 1)) / cols;
  const footNote = step(ad, 6);
  const gridH = H - g.M - top - footNote;
  const tileH = (gridH - tGap * (rowsL - 1)) / rowsL;
  const capBand = step(ad, 3.8);
  const artH = tileH - capBand;
  pages.push({
    name: "guidelines-2-logo", width: W, height: H,
    svg: page(W, H, defs, [
      hLogo.svg,
      ...tiles.map((t, i) => {
        const x = g.M + (i % cols) * (tileW + tGap);
        const y = top + Math.floor(i / cols) * (tileH + tGap);
        const onDark = isDarkSurface(t.bg);
        const f = T.flow(x, y + artH + step(ad, 0.4), tileW);
        f.line(t.label, step(ad, -1.1), fg, { family: "head", weight: 700 })
          .line(t.note, step(ad, -1.4), muted, { gap: step(ad, 0.2) });
        return [
          `<rect x="${r(x)}" y="${r(y)}" width="${r(tileW)}" height="${r(artH)}" fill="${t.bg}" rx="${ad.material.radius}"${onDark ? "" : ` stroke="${mix(fg, paper, 0.82)}" stroke-width="${r(ad.ink.hairline)}"`}/>`,
          markAt(ctx, x + tileW * 0.14, y + artH * 0.18, tileW * 0.72, artH * 0.64, t.ink, t.bg),
          f.svg(),
        ].join("");
      }),
      T.block(
        "Use the variant whose ground it was built for. Never redraw, restack or re-space the lockup.",
        g.M, H - g.M - step(ad, 0.6), step(ad, -0.6), g.span(Math.round(ad.grid.columns * 0.7)), muted, { leading: ad.type.bodyLeading, maxLines: 2 },
      ).svg,
    ].join("")),
  });

  // ── 02 Clear space and minimum size ───────────────────────────────────────
  const hClear = head("Clear space & minimum size", "02");
  const csTop = hClear.bottom;
  const csFoot = step(ad, 9);
  const csH = Math.min(H * 0.44, H - g.M - csTop - csFoot);
  const csW = g.content * 0.56;
  const unit = csH * 0.14;
  const markX = g.M + unit * 2, markY = csTop + unit * 2;
  const markW = csW - unit * 4, markH = csH - unit * 4;
  const tick = (x1: number, y1: number, x2: number, y2: number) =>
    `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${accent}" stroke-width="${r(ad.ink.hairline * 1.4)}" stroke-dasharray="6 5"/>`;
  const sizeRow = [
    { w: g.content * 0.16, cap: "Print — 0.75 in wide" },
    { w: g.content * 0.11, cap: "Screen — 120 px wide" },
    { w: g.content * 0.07, cap: "Minimum — 72 px wide" },
  ];
  const srTop = csTop + csH + step(ad, 4);
  const srArtH = Math.max(step(ad, 3), H - g.M - srTop - step(ad, 3.4));
  pages.push({
    name: "guidelines-2b-clearspace", width: W, height: H,
    svg: page(W, H, defs, [
      hClear.svg,
      `<rect x="${g.M}" y="${r(csTop)}" width="${r(csW)}" height="${r(csH)}" fill="${paper}" stroke="${mix(fg, paper, 0.82)}" stroke-width="${r(ad.ink.hairline)}" rx="${ad.material.radius}"/>`,
      `<rect x="${r(markX)}" y="${r(markY)}" width="${r(markW)}" height="${r(markH)}" fill="none" stroke="${accent}" stroke-width="${r(ad.ink.hairline)}" stroke-dasharray="4 6" opacity="0.7"/>`,
      tick(markX - unit, csTop, markX - unit, csTop + csH),
      tick(markX + markW + unit, csTop, markX + markW + unit, csTop + csH),
      tick(g.M, markY - unit, g.M + csW, markY - unit),
      tick(g.M, markY + markH + unit, g.M + csW, markY + markH + unit),
      markAt(ctx, markX, markY, markW, markH, null, paper),
      (() => {
        const f = T.flow(g.M + csW + g.gutter * 2, csTop, g.content - csW - g.gutter * 2);
        f.line("X = the mark's cap height", step(ad, 0.2), accent, { weight: 500, tracking: step(ad, 0.2) * ad.type.labelTracking })
          .block(
            "Hold clear space of at least one X on every side of the mark. Nothing — type, rules, photography, another logo — enters that field. On crowded layouts, increase it rather than shrink it.",
            step(ad, -0.3), fg, { gap: step(ad, 1.2), leading: ad.type.bodyLeading, maxLines: 6 },
          );
        return f.svg();
      })(),
      ...sizeRow.map((s, i) => {
        const x = g.M + i * (g.content / 3);
        const h = Math.min(srArtH, s.w * 0.5);
        return [
          markAt(ctx, x, srTop, s.w, h, null, paper),
          label(T, ctx, s.cap, x, srTop + srArtH + step(ad, 1), step(ad, -1.3), muted, "start", g.content / 3 - g.gutter),
        ].join("");
      }),
    ].join("")),
  });

  // ── 03 Misuse ─────────────────────────────────────────────────────────────
  const hMis = head("Misuse", "03");
  const mTop = hMis.bottom;
  const mCols = 4;
  const mGap = g.gutter * 2;
  const mW = (g.content - mGap * (mCols - 1)) / mCols;
  const mCap = step(ad, 2.6);
  const mH = Math.min(H * 0.42, H - g.M - mTop - step(ad, 3.2));
  const mArt = mH - mCap;
  // `transform-origin` is not honoured by the rasteriser, so every distortion
  // is expressed about the tile's own centre with explicit translates.
  const about = (cx: number, cy: number, t: string) => `translate(${r(cx)} ${r(cy)}) ${t} translate(${r(-cx)} ${r(-cy)})`;
  const misuse: Array<{ cap: string; wrap: (art: string, cx: number, cy: number) => string; ink?: string | null }> = [
    { cap: "Do not stretch or condense", wrap: (a, cx, cy) => `<g transform="${about(cx, cy, "scale(1.18 0.82)")}">${a}</g>` },
    { cap: "Do not rotate", wrap: (a, cx, cy) => `<g transform="rotate(-11 ${r(cx)} ${r(cy)})">${a}</g>` },
    { cap: "Do not recolour off-palette", wrap: (a) => a, ink: "#C2410C" },
    { cap: "Do not add effects", wrap: (a) => `<g opacity="0.85" filter="url(#misuseBlur)">${a}</g>` },
  ];
  pages.push({
    name: "guidelines-3b-misuse", width: W, height: H,
    svg: page(W, H, `${defs}<filter id="misuseBlur"><feGaussianBlur stdDeviation="2.2"/></filter>`, [
      hMis.svg,
      ...misuse.map((m, i) => {
        const x = g.M + i * (mW + mGap);
        const art = markAt(ctx, x + mW * 0.16, mTop + mArt * 0.2, mW * 0.68, mArt * 0.6, m.ink ?? null, paper);
        const f = T.flow(x, mTop + mArt + step(ad, 0.4), mW);
        f.line(m.cap, step(ad, -1.2), fg, { family: "head", weight: 700 });
        return [
          `<rect x="${r(x)}" y="${r(mTop)}" width="${r(mW)}" height="${r(mArt)}" fill="${paper}" stroke="${mix(fg, paper, 0.82)}" stroke-width="${r(ad.ink.hairline)}" rx="${ad.material.radius}"/>`,
          m.wrap(art, x + mW / 2, mTop + mArt / 2),

          `<line x1="${r(x)}" y1="${r(mTop + mArt)}" x2="${r(x + mW)}" y2="${r(mTop)}" stroke="#C2410C" stroke-width="${r(ad.ink.hairline * 1.6)}" opacity="0.5"/>`,
          f.svg(),
        ].join("");
      }),
      T.block(
        "These are the failures we see most. When in doubt, use an approved variant at an approved size and leave the clear space alone.",
        g.M, H - g.M - step(ad, 0.6), step(ad, -0.6), g.span(Math.round(ad.grid.columns * 0.7)), muted, { leading: ad.type.bodyLeading, maxLines: 2 },
      ).svg,
    ].join("")),
  });


  const hColour = head("Colour", "04");
  const cTop = hColour.bottom;
  const entries = Object.entries(ctx.colors ?? {}).slice(0, 8);
  const swGap = g.gutter * 2;
  const swW = (g.content - swGap * 3) / 4;
  const rows = Math.max(1, Math.ceil(entries.length / 4));
  const cellH = (H - g.M - cTop) / rows;
  const swatchH = Math.min(H * 0.13, cellH * 0.42);
  pages.push({
    name: "guidelines-3-colour", width: W, height: H,
    svg: page(W, H, defs, [
      hColour.svg,
      ...entries.map(([k, v], i) => {
        const cs = colorSpaces(v);
        const x = g.M + (i % 4) * (swW + swGap);
        const y = cTop + Math.floor(i / 4) * cellH;
        const role = k.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const f = T.flow(x, y + swatchH + step(ad, 0.5), swW);
        f.line(role, step(ad, -1.1), fg, { family: "head", weight: 700 })
          .line(cs.hex, step(ad, -1.3), muted, { gap: step(ad, 0.35) })
          .line(`RGB ${cs.rgb.join(" · ")}`, step(ad, -1.3), muted, { gap: step(ad, 0.15) })
          .line(`CMYK ${cs.cmyk.join(" · ")}`, step(ad, -1.3), muted, { gap: step(ad, 0.15) })
          .line(cs.pantone, step(ad, -1.3), accent, { gap: step(ad, 0.15) });
        return [
          `<rect x="${r(x)}" y="${r(y)}" width="${r(swW)}" height="${r(swatchH)}" fill="${v}" rx="${ad.material.radius}"/>`,
          f.svg(),
        ].join("");
      }),
    ].join("")),
  });

  const hType = head("Typography", "05");
  const tf = T.flow(g.M, hType.bottom, g.span(Math.round(ad.grid.columns * 0.7)));
  tf.line(
    ad.type.caseLabels === "upper" ? (ctx.fonts?.heading || "Heading").toUpperCase() : (ctx.fonts?.heading || "Heading"),
    step(ad, 0.2), accent, { tracking: step(ad, 0.2) * ad.type.labelTracking, weight: 500 },
  )
    .line("Aa Bb Cc 0123", step(ad, 3.6), fg, { family: "head", weight: 700, gap: step(ad, 0.8) })
    .line("Headlines · weight 700 · tight tracking", step(ad, -0.6), muted, { gap: step(ad, 0.4) })
    .line(
      ad.type.caseLabels === "upper" ? (ctx.fonts?.body || "Body").toUpperCase() : (ctx.fonts?.body || "Body"),
      step(ad, 0.2), accent, { gap: step(ad, 2.2), tracking: step(ad, 0.2) * ad.type.labelTracking, weight: 500 },
    )
    .line("Aa Bb Cc 0123", step(ad, 2.8), fg, { gap: step(ad, 0.8) })
    .block(
      "Body copy is set at 16–20px with a 1.6 line height. Sentence case everywhere except small labels, which are set uppercase with generous tracking.",
      step(ad, -0.4), fg, { gap: step(ad, 1.4), leading: ad.type.bodyLeading, maxLines: 3 },
    );
  pages.push({
    name: "guidelines-4-type", width: W, height: H,
    svg: page(W, H, defs, [hType.svg, tf.svg()].join("")),
  });


  const voice = d.voice || ctx.voice || "Plain, specific, and confident. Short sentences. Name the outcome, not the process. No jargon, no hype, no exclamation marks.";
  const halfW = (g.content - g.gutter * 3) / 2;
  const hVoice = head("Voice", "06");
  const vf = T.flow(g.M, hVoice.bottom, g.span(Math.round(ad.grid.columns * 0.72)));
  vf.block(voice, step(ad, 0.6), fg, { leading: 1.7, maxLines: 6 });
  const panelTop = Math.max(H * 0.62, vf.bottom + step(ad, 2));
  const panelH = Math.min(H * 0.22, H - g.M - panelTop);
  const doF = T.flow(g.M + step(ad, 1.6), panelTop + step(ad, 1.2), halfW - step(ad, 3.2));
  doF.line(ad.type.caseLabels === "upper" ? "DO" : "Do", step(ad, -0.4), accent, { tracking: step(ad, -0.4) * ad.type.labelTracking, weight: 500 })
    .block(ctx.copy?.voiceDo || "Lead with the result. Use the customer's words. One idea per sentence.", step(ad, -0.7), fg, { gap: step(ad, 0.6), leading: 1.5, maxLines: 3 });
  const dontX = g.M + halfW + g.gutter * 3 + step(ad, 1.6);
  const dontF = T.flow(dontX, panelTop + step(ad, 1.2), halfW - step(ad, 3.2));
  dontF.line(ad.type.caseLabels === "upper" ? "DON'T" : "Don't", step(ad, -0.4), muted, { tracking: step(ad, -0.4) * ad.type.labelTracking, weight: 500 })
    .block(ctx.copy?.voiceDont || "Don't stack adjectives, borrow buzzwords, or promise what the product can't do yet.", step(ad, -0.7), fg, { gap: step(ad, 0.6), leading: 1.5, maxLines: 3 });
  pages.push({
    name: "guidelines-5-voice", width: W, height: H,
    svg: page(W, H, defs, [
      hVoice.svg,
      vf.svg(),
      `<rect x="${g.M}" y="${r(panelTop)}" width="${r(halfW)}" height="${r(panelH)}" fill="${primary}" opacity="0.06" rx="${ad.material.radius}"/>`,
      `<rect x="${r(g.M + halfW + g.gutter * 3)}" y="${r(panelTop)}" width="${r(halfW)}" height="${r(panelH)}" fill="${fg}" opacity="0.05" rx="${ad.material.radius}"/>`,
      doF.svg(),
      dontF.svg(),
    ].join("")),
  });


  return pages;
}

/** CSS design tokens — the web design-system half of the kit. */
export function designTokens(ctx: CollateralCtx): { css: string; json: string } {
  const c = ctx.colors ?? {};
  const ad = ctx.ad ?? archetypeSpec("swiss_editorial");
  const vars = Object.entries(c).map(([k, v]) => `  --brand-${k}: ${v};`).join("\n");
  const css = `:root {\n${vars}\n  --brand-font-heading: '${ctx.fonts?.heading ?? "Inter"}';\n  --brand-font-body: '${ctx.fonts?.body ?? "Inter"}';\n  --brand-radius: ${ad.material.radius}px;\n  --brand-space: ${ad.grid.baseline}px;\n  --brand-scale-ratio: ${ad.scale.ratio};\n  --brand-paper: ${PAPER_TONE[ad.material.paper]};\n}\n`;
  const json = JSON.stringify(
    {
      artDirection: { archetype: ad.archetype, rationale: ad.rationale },
      color: Object.fromEntries(Object.entries(c).map(([k, v]) => [k, colorSpaces(v)])),
      font: { heading: ctx.fonts?.heading ?? null, body: ctx.fonts?.body ?? null },
      scale: Array.from({ length: 7 }, (_, i) => Math.round(step(ad, i - 1) * 100) / 100),
      radius: { sm: Math.max(2, ad.material.radius / 2), md: ad.material.radius, lg: ad.material.radius * 2, pill: 999 },
      space: [1, 2, 3, 4, 6, 8, 12].map((n) => n * ad.grid.baseline),
    },
    null,
    2,
  );
  return { css, json };
}

const SERIF_FALLBACK = "Georgia, 'Times New Roman', serif";
const SANS_FALLBACK = "'Helvetica Neue', Helvetica, Arial, sans-serif";

function fallbackFor(family: string): string {
  return /(serif|playfair|lora|merriweather|garamond|baskerv|crimson|spectral|cormorant|bitter|domine)/i.test(family)
    ? SERIF_FALLBACK
    : SANS_FALLBACK;
}

/**
 * What the page actually contains, read back off the finished SVG: the drawn
 * mark size, the smallest type on the page, and the longest line. QC compares
 * these against the piece's standard.
 */
/** Every `<text>` on the page, resolved to a drawn bounding box. */
function textBoxes(svg: string, T: TypeKit): { box: [number, number, number, number]; text: string }[] {
  const out: { box: [number, number, number, number]; text: string }[] = [];
  for (const m of svg.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)) {
    const attrs = m[1];
    const text = m[2];
    if (!text.trim()) continue;
    const num = (k: string) => Number(new RegExp(`${k}="([-\\d.]+)"`).exec(attrs)?.[1] ?? 0);
    const x = num("x"), y = num("y"), size = num("font-size"), tracking = num("letter-spacing");
    if (!size) continue;
    const family = /font-family="BrandHead"/.test(attrs) ? "head" : "body";
    const anchor = /text-anchor="(\w+)"/.exec(attrs)?.[1] ?? "start";
    const w = T.width(text, size, family as "head" | "body", tracking);
    const x0 = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
    out.push({ box: [x0, y - size * 0.78, x0 + w, y + size * 0.22], text });
  }
  return out;
}

/**
 * Two pieces of type sharing the same pixels is the defect a founder sees
 * first — a title with a rule through it, an address printed over a table
 * header. Report it by name so a page can be re-set instead of shipped.
 */
/** Drop the artwork groups: letterforms inside a logo are not typeset copy, and
 *  they sit under transforms this flat detector cannot resolve. */
function withoutMarks(svg: string): string {
  let out = "", i = 0;
  for (;;) {
    const start = svg.indexOf("<g data-mark-w", i);
    if (start < 0) return out + svg.slice(i);
    out += svg.slice(i, start);
    let depth = 0, k = start;
    while (k < svg.length) {
      const g = svg.indexOf("<g", k), c = svg.indexOf("</g>", k);
      if (c < 0) return out;
      if (g >= 0 && g < c) { depth++; k = g + 2; continue; }
      depth--; k = c + 4;
      if (depth <= 0) break;
    }
    i = k;
  }
}

function textOverlaps(svg: string, T: TypeKit): string[] {
  const boxes = textBoxes(withoutMarks(svg), T);

  const hits: string[] = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i].box, b = boxes[j].box;
      const ox = Math.min(a[2], b[2]) - Math.max(a[0], b[0]);
      const oy = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
      if (ox <= 1 || oy <= 1) continue;
      const smaller = Math.min((a[2] - a[0]) * (a[3] - a[1]), (b[2] - b[0]) * (b[3] - b[1]));
      if (smaller <= 0 || (ox * oy) / smaller < 0.18) continue;
      hits.push(`"${boxes[i].text.slice(0, 28)}" overlaps "${boxes[j].text.slice(0, 28)}"`);
      if (hits.length >= 6) return hits;
    }
  }
  return hits;
}

function pageMetrics(ctx: CollateralCtx, name: string, svg: string, rs: ResolvedSpec, T?: TypeKit): PageMetrics {
  const markHs = [...svg.matchAll(/data-mark-h="([\d.]+)"/g)].map((m) => Number(m[1]));
  const markWs = [...svg.matchAll(/data-mark-w="([\d.]+)"/g)].map((m) => Number(m[1]));
  const markArts = [...svg.matchAll(/data-mark-art="([^"]*)"/g)].map((m) => m[1]);
  const markBgs = [...svg.matchAll(/data-mark-bg="([^"]*)"/g)].map((m) => m[1]);
  const markInks = [...svg.matchAll(/data-mark-ink="([^"]*)"/g)].map((m) => m[1]);
  const sizes = [...svg.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
  const texts = [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
  const primaryMark = markHs.length ? Math.max(...markHs) : undefined;
  const idx = primaryMark !== undefined ? markHs.indexOf(primaryMark) : -1;
  return {
    page: name,
    markH: primaryMark,
    markW: idx >= 0 ? markWs[idx] : undefined,
    markArt: idx >= 0 ? markArts[idx] : undefined,
    markBg: idx >= 0 ? markBgs[idx] : undefined,
    // Every mark on the page, not just the biggest — a specimen sheet stands or
    // falls on the small tiles being legible too.
    marks: markHs.map((h, i) => ({
      h,
      art: markArts[i] ?? "",
      bg: markBgs[i] ?? "",
      ink: markInks[i] ?? "",
    })),
    markBand: isLockup(ctx) ? rs.lockupBand : rs.logoBand,


    safe: rs.safe,
    bleed: rs.bleed,
    minType: rs.minType,
    textLines: texts.length,
    smallestType: sizes.length ? Math.min(...sizes) : undefined,
    longestLine: texts.length ? Math.max(...texts.map((t) => t.length)) : undefined,
    overlaps: T ? textOverlaps(svg, T) : undefined,
  };
}


export type RenderResult = { pages: Page[]; fontBuffers: Uint8Array[]; fontsOk: boolean };

export async function renderCollateral(kind: CollateralKind, ctx: CollateralCtx): Promise<RenderResult> {
  const wantHead = ctx.fonts?.heading || "Inter";
  const wantBody = ctx.fonts?.body || "Inter";
  const [head, bodyFont] = await Promise.all([
    loadFontOrFallback(wantHead, 700),
    loadFontOrFallback(wantBody, 400),
  ]);
  // Use the family we actually loaded — the rasteriser matches on the font's
  // own name, so asking for a family we failed to fetch renders nothing.
  const heading = head?.family ?? wantHead;
  const body = bodyFont?.family ?? wantBody;

  // Browsers read the embedded @font-face; the rasteriser matches the TTF's own
  // family name, so the SVG must ask for the real family, not an alias.
  const faces = [
    head?.b64 ? `@font-face{font-family:'${heading}';font-style:normal;font-weight:700;src:url(data:font/woff2;base64,${head.b64});}` : "",
    bodyFont?.b64 ? `@font-face{font-family:'${body}';font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${bodyFont.b64});}` : "",
    "text{ -webkit-font-smoothing:antialiased; }",
  ].join("");

  const { fg } = palette(ctx);
  const defs = `<style>${faces}</style>${grainDef(fg)}`;
  const T = makeType({ head: head?.bytes, body: bodyFont?.bytes });

  const headStack = `${heading}, ${fallbackFor(heading)}`;
  const bodyStack = `${body}, ${fallbackFor(body)}`;

  const draw = (drawCtx: CollateralCtx): Page[] => {
    const args: Args = { ctx: drawCtx, T, defs };
    let raw: Page[];
    switch (kind) {
      case "business_card": raw = businessCard(args); break;
      case "letterhead": raw = letterhead(args); break;
      case "envelope": raw = envelope(args); break;
      case "notecard": raw = notecard(args); break;
      case "email_signature": raw = emailSignature(args); break;
      case "invoice": raw = docTemplate(args, "invoice"); break;
      case "proposal": raw = docTemplate(args, "proposal"); break;
      case "presentation": raw = presentation(args); break;
      case "guidelines": raw = guidelines(args); break;
      default: raw = [];
    }
    return raw.map((p) => {
      const rs = resolveSpec(p.name, p.width, p.height);
      const svg = p.svg
        .replace(/font-family="BrandHead"/g, `font-family="${headStack}"`)
        .replace(/font-family="BrandBody"/g, `font-family="${bodyStack}"`)
        .replace("<svg ", `<svg${printMeta(rs)} `);
      return { ...p, svg, metrics: pageMetrics(drawCtx, p.name, svg, rs, T) };
    });
  };

  const pages = draw(ctx);
  // Do not globally shrink a broken composition. Measured templates must pass
  // at their intended scale; the publication gate reports the exact page.


  const fontBuffers = [head?.bytes, bodyFont?.bytes].filter((b): b is Uint8Array => !!b && b.length > 0);
  return { pages, fontBuffers, fontsOk: fontBuffers.length > 0 };
}


/** Ready-to-paste HTML email signature (matches the PNG variant). */
export function signatureHtml(ctx: CollateralCtx, logoUrl?: string | null): string {
  const { primary, fg, muted } = palette(ctx);
  const d = ctx.details ?? {};
  const rows = [d.email, d.phone, d.website, d.social].filter(Boolean) as string[];
  return `<table cellpadding="0" cellspacing="0" style="font-family:${ctx.fonts?.body ?? "Helvetica"},Helvetica,Arial,sans-serif;color:${fg}">
  <tr>
    ${logoUrl ? `<td style="padding-right:16px;vertical-align:top"><img src="${logoUrl}" alt="${esc(ctx.company)}" width="64" height="64" style="display:block;border:0"></td>` : ""}
    <td style="border-left:3px solid ${primary};padding-left:16px">
      <div style="font-size:16px;font-weight:700">${esc(d.person_name || ctx.company)}</div>
      <div style="font-size:13px;color:${primary};padding-top:2px">${esc([d.person_title, ctx.company].filter(Boolean).join(" · "))}</div>
      ${rows.map((t) => `<div style="font-size:12px;color:${muted};padding-top:2px">${esc(t)}</div>`).join("")}
    </td>
  </tr>
</table>`;
}

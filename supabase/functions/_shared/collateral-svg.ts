// Deterministic brand collateral compositor.
//
// Business cards, letterhead, envelopes, invoices and guideline pages need
// exact type, alignment and real vector logo ink — so none of this is drawn by
// an image model. Every page is assembled as SVG from the LOCKED brand kit,
// laid out on the grid the art director chose, typeset with real font metrics,
// and rasterised.

import { colorSpaces, inkOn } from "./color-spaces.ts";
import { stripSvgBackground } from "./logo-raster.ts";
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
  deck?: { section?: string; sectionSub?: string; points?: Array<{ title: string; body: string }>; closing?: string };
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

export type Page = { name: string; svg: string; width: number; height: number };

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

  /** One line, shrunk if needed so it can never leave its box. */
  function line(text: string, x: number, y: number, size: number, fill: string, o: LineOpts = {}): string {
    const t = String(text ?? "").trim();
    if (!t) return "";
    const family = o.family ?? "body";
    const tracking = o.tracking ?? 0;
    let out = t, s = size;
    if (o.maxWidth) {
      const fit = fitLine(t, { size, maxWidth: o.maxWidth, bytes: bytesFor(family), tracking, minSize: o.minSize });
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
    const fit = fitBox(String(text ?? ""), {
      size,
      maxWidth: width,
      maxLines: o.maxLines ?? 40,
      bytes: bytesFor(family),
      tracking: o.tracking ?? 0,
      minSize: o.minSize,
    });
    const svg = fit.lines
      .map((l, i) => (l ? line(l, x, y + i * fit.size * leading, fit.size, fill, { family, weight: o.weight, tracking: o.tracking, opacity: o.opacity, anchor: o.anchor }) : ""))
      .join("");
    return { svg, height: fit.lines.length * fit.size * leading, size: fit.size, lines: fit.lines.length };
  }

  const width = (t: string, size: number, family: "head" | "body" = "body", tracking = 0) =>
    measure(t, size, bytesFor(family), tracking);

  return { line, block, width };
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

/** Relative luminance of a hex colour, 0–1. */
function lum(hex: string): number {
  const m = /#?([0-9a-f]{6})/i.exec(hex || "");
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contrast(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Every explicit fill colour in a fragment — used to spot invisible artwork. */
function fillsIn(svg: string): string[] {
  return [...svg.matchAll(/fill\s*[=:]\s*["']?(#[0-9a-f]{3,8}|white|black)/gi)].map((m) => m[1].toLowerCase());
}

/**
 * Inline the vector mark, scaled to fit a box, tinted to one ink colour.
 *
 * `bg` is the surface the mark lands on. It is not decoration: a traced mark is
 * often solid white, so dropping it on ivory paper — or tinting it with a pale
 * ink — produces the invisible ghost we shipped before. Any ink that fails to
 * separate from the surface is replaced with one that does.
 */
function markAt(
  ctx: CollateralCtx, x: number, y: number, boxW: number, boxH: number,
  ink: string | null, bg?: string,
): string {
  const svg = ctx.logoSvg;
  if (!svg) return "";
  const vb = /viewBox\s*=\s*["']([\d.\-\s,]+)["']/i.exec(svg)?.[1];
  let vw = 1024, vh = 1024;
  if (vb) {
    const p = vb.trim().split(/[\s,]+/).map(Number);
    if (p.length === 4 && p[2] > 0 && p[3] > 0) { vw = p[2]; vh = p[3]; }
  }
  // Drop full-bleed background plates so the mark sits directly on the paper.
  let inner = stripSvgBackground(svg)
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "")
    .trim();

  let use = ink;
  if (bg) {
    const MIN = 2.4;
    if (use && contrast(use, bg) < MIN) use = inkOn(bg);
    if (!use) {
      // Untinted artwork: if nothing in it separates from the surface, knock it
      // out rather than leaving an invisible mark.
      const fills = fillsIn(inner);
      const visible = fills.some((f) => contrast(f === "white" ? "#ffffff" : f === "black" ? "#000000" : f, bg) >= MIN);
      if (fills.length && !visible) use = inkOn(bg);
    }
  }
  if (use) {
    inner = inner
      .replace(/fill\s*=\s*["'](?!none)[^"']*["']/gi, `fill="${use}"`)
      .replace(/stroke\s*=\s*["'](?!none)[^"']*["']/gi, `stroke="${use}"`);
  }
  const s = Math.min(boxW / vw, boxH / vh);
  const dx = x + (boxW - vw * s) / 2;
  const dy = y + (boxH - vh * s) / 2;
  return `<g transform="translate(${r(dx)} ${r(dy)}) scale(${r(s, 5)})">${inner}</g>`;
}


function logoAspect(ctx: CollateralCtx): number {
  const vb = /viewBox\s*=\s*["']([\d.\-\s,]+)["']/i.exec(ctx.logoSvg ?? "")?.[1];
  if (!vb) return 1;
  const p = vb.trim().split(/[\s,]+/).map(Number);
  return p.length === 4 && p[3] > 0 ? p[2] / p[3] : 1;
}

/** True when the saved artwork already contains the company name. */
function isLockup(ctx: CollateralCtx): boolean {
  return logoAspect(ctx) >= 1.6;
}

/** Clear space the mark demands on every side, from its own height. */
function clearSpace(height: number): number {
  return Math.round(height * 0.55);
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

  // FRONT — an asymmetric card: a full-bleed colour field carries the mark,
  // the paper side carries the name and a short descriptor. A centred logo on a
  // blank field is not a design; this is the one page people actually look at.
  const fieldW = Math.round(W * 0.34);
  const fieldX = W - fieldW;
  const fieldBg = invert ? paper : primary;
  const fieldInk = inkOn(fieldBg);
  const pad = Math.round(fieldW * 0.2);
  const colW = fieldX - g.M * 2;

  const nameSize = step(ad, 1.2);
  const descSize = step(ad, -0.5);
  const desc = cardDescriptor(d);
  const showName = !isLockup(ctx) || true; // the field mark reads as a device; the name is set in type
  const stackH = nameSize * 1.05 + (desc ? descSize * 2.4 : 0);
  const nameBase = Math.round((H - stackH) / 2 + nameSize * 0.82);

  const front = page(W, H, defs, [
    invert ? `<rect width="${W}" height="${H}" fill="${primary}"/>` : surface(W, H, paper, ad.material.grain),
    `<rect x="${fieldX}" y="0" width="${fieldW}" height="${H}" fill="${fieldBg}"/>`,
    markAt(ctx, fieldX + pad, pad, fieldW - pad * 2, H - pad * 2, fieldInk, fieldBg),
    showName
      ? T.line(ctx.company, g.M, nameBase, nameSize, faceInk, {
        family: "head", weight: 700, tracking: nameSize * ad.type.displayTracking, maxWidth: colW, minSize: 15,
      })
      : "",
    desc
      ? T.line(desc, g.M, nameBase + descSize * 2.1, descSize, invert ? faceInk : muted, {
        tracking: descSize * ad.type.labelTracking * 0.5, maxWidth: colW, minSize: 11,
      })
      : "",
    `<rect x="${g.M}" y="${r(nameBase + descSize * (desc ? 3.6 : 1.6))}" width="${r(g.span(1))}" height="${r(Math.max(2, ad.ink.ruleWeight))}" fill="${invert ? faceInk : accent}"/>`,
  ].join(""));


  // BACK — the contact block, set on the grid and measured line by line.
  const rows = contactRows(d);
  const rule = ad.ink.ruleWeight;
  const nameS = step(ad, 1);
  const titleS = step(ad, -0.6);
  const rowS = step(ad, -0.7);
  const rowGap = rowS * 1.72;
  const backColW = g.span(Math.max(4, Math.round(ad.grid.columns * 0.62)));

  const backTop = g.M + nameS;
  // Set the contact block a measured interval under the name rather than
  // pinning it to the trim — bottom-anchoring left a dead void mid-card.
  const backRowsTop = Math.min(
    backTop + titleS * 1.7 + rowGap * 2.6,
    H - g.M - (rows.length - 1) * rowGap,
  );


  const back = page(W, H, defs, [
    surface(W, H, paper, ad.material.grain),
    `<rect x="0" y="0" width="${r(rule * 3)}" height="${H}" fill="${primary}"/>`,
    // mark, top-right, quiet
    markAt(ctx, W - g.M - 190, g.M - 4, 190, 76, mix(fg, paper, 0.3), paper),
    T.line(d.person_name || ctx.company, g.M, backTop, nameS, fg, { family: "head", weight: 700, maxWidth: backColW, tracking: nameS * ad.type.displayTracking, minSize: 13 }),
    d.person_title ? label(T, ctx, d.person_title, g.M, backTop + titleS * 1.7, titleS, accent, "start", backColW) : "",
    `<rect x="${g.M}" y="${r(backRowsTop - rowGap * 1.25)}" width="${r(g.span(2))}" height="${r(ad.ink.hairline * 2)}" fill="${accent}"/>`,
    ...rows.map((t, i) => T.line(t, g.M, backRowsTop + i * rowGap, rowS, i === 0 ? fg : muted, { maxWidth: g.content, minSize: 10 })),
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

  const logoH = Math.round(H * 0.052);
  const headBase = snap(ad, g.M + logoH);
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
  const logoH = Math.round(H * 0.13);
  const base = snap(ad, g.M + logoH);
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

  const markH = Math.round(H * 0.17);
  const markW = Math.min(g.content * 0.6, markH * Math.max(logoAspect(ctx), 1));
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
  const markBox = 150;
  const left = 60;
  const railX = left + markBox + clearSpace(markBox) * 0.7;
  const textX = railX + 34;
  const nameS = step(ad, 0.9);
  const rowS = step(ad, -0.9);
  const top = (H - (nameS * 1.5 + rowS * 1.5 + rows.length * rowS * 1.55)) / 2 + nameS;

  const body = [
    surface(W, H, paper, ad.material.grain * 0.4),
    markAt(ctx, left, (H - markBox) / 2, markBox, markBox, null, paper),
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

  const logoH = Math.round(H * 0.045);
  const headBase = snap(ad, g.M + logoH);
  const metaTop = snap(ad, headBase + clearSpace(logoH) + step(ad, 2.5));
  const tableTop = snap(ad, metaTop + step(ad, 9));
  const rowH = step(ad, 1.8);
  const rows = 7;
  const totalsY = snap(ad, tableTop + rowH * (rows + 1.6));

  const fromLines = [d.legal_entity || ctx.company, d.person_name, d.email, d.phone, addressLine(d)].filter(Boolean).join("\n");
  const scope = ctx.copy?.proposal?.scope ?? [];
  const terms = isInvoice
    ? (d.payment_terms || ctx.copy?.invoice?.terms || "Payment terms: net 15. Late balances accrue 1.5% monthly.")
    : (ctx.copy?.proposal?.terms || "This proposal is valid for 30 days. Work begins on countersignature and receipt of the deposit.");

  const body = [
    surface(W, H, paper, ad.material.grain),
    `<rect x="0" y="0" width="${W}" height="${r(ad.ink.ruleWeight * 2)}" fill="${primary}"/>`,
    logoBlock(ctx, T, g.M, headBase, logoH, null, fg, step(ad, 1.1), g.span(Math.round(ad.grid.columns * 0.5)), paper),
    label(T, ctx, title, W - g.M, headBase - logoH * 0.35, step(ad, 1.8), primary, "end", g.span(4)),
    T.line(isInvoice ? "No. 0001" : "Prepared for", W - g.M, headBase + step(ad, -0.4), step(ad, -1), muted, { anchor: "end", maxWidth: g.span(4) }),

    label(T, ctx, "From", g.M, metaTop, step(ad, -1.5), accent),
    T.block(fromLines, g.M, metaTop + step(ad, 1.1), step(ad, -0.7), g.span(Math.round(ad.grid.columns * 0.42)), fg, { leading: 1.6, maxLines: 6 }).svg,
    label(T, ctx, isInvoice ? "Bill to" : "Client", g.col(Math.round(ad.grid.columns * 0.55)), metaTop, step(ad, -1.5), accent),
    T.block("Client name\nCompany\nEmail\nAddress", g.col(Math.round(ad.grid.columns * 0.55)), metaTop + step(ad, 1.1), step(ad, -0.7), g.span(Math.round(ad.grid.columns * 0.42)), mix(fg, paper, 0.4), { leading: 1.6, maxLines: 6 }).svg,

    `<rect x="${g.M}" y="${r(tableTop - step(ad, 1.5))}" width="${g.content}" height="${r(ad.ink.ruleWeight)}" fill="${primary}"/>`,
    ...cols.map((c, i) => label(T, ctx, c, colX[i], tableTop - step(ad, -0.2), step(ad, -1.4), primary, i === cols.length - 1 ? "end" : "start", g.span(3))),
    `<rect x="${g.M}" y="${r(tableTop + step(ad, 0.2))}" width="${g.content}" height="${r(ad.ink.hairline)}" fill="${mix(fg, paper, 0.65)}"/>`,
    ...Array.from({ length: rows }, (_, i) => {
      const y = tableTop + step(ad, 0.2) + (i + 1) * rowH;
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
    motif(ctx, g, accent, "tr"),
  ].join("");
  return [{ name: mode, svg: page(W, H, defs, body), width: W, height: H }];
}

function presentation({ ctx, T, defs }: Args): Page[] {
  const W = 1920, H = 1080;
  const ad = ctx.ad;
  const g = gridFor(ad, W, H);
  const { primary, paper, fg, accent, muted } = palette(ctx);
  const d = ctx.details;
  const ink = inkOn(primary);
  const invert = inverted(ctx, "presentation");
  const coverBg = invert ? primary : paper;
  const coverInk = invert ? ink : fg;
  const pages: Page[] = [];
  const deck = ctx.copy?.deck ?? {};
  const points = (deck.points ?? []).slice(0, 3);

  const markH = Math.round(H * 0.11);
  const markW = Math.min(g.span(4), markH * Math.max(logoAspect(ctx), 1));

  pages.push({
    name: "slide-1-cover", width: W, height: H,
    svg: page(W, H, defs, [
      invert ? `<rect width="${W}" height="${H}" fill="${primary}"/>` : surface(W, H, paper, ad.material.grain),
      markAt(ctx, g.M, g.M, markW, markH, invert ? coverInk : null, invert ? primary : paper),
      T.line(ctx.company, g.M, H * 0.62, step(ad, 5.2), coverInk, { family: "head", weight: 700, maxWidth: g.span(Math.round(ad.grid.columns * 0.82)), tracking: step(ad, 5.2) * ad.type.displayTracking }),
      d.tagline ? T.line(d.tagline, g.M, H * 0.62 + step(ad, 2.6), step(ad, 0.8), coverInk, { opacity: invert ? 0.8 : 0.7, maxWidth: g.span(Math.round(ad.grid.columns * 0.6)) }) : "",
      label(T, ctx, String(new Date().getFullYear()), W - g.M, H - g.M, step(ad, -0.6), coverInk, "end", g.span(2)),
      motif(ctx, g, invert ? coverInk : accent, "br"),
    ].join("")),
  });

  pages.push({
    name: "slide-2-section", width: W, height: H,
    svg: page(W, H, defs, [
      surface(W, H, paper, ad.material.grain),
      `<rect x="0" y="0" width="${r(ad.ink.ruleWeight * 6)}" height="${H}" fill="${accent}"/>`,
      label(T, ctx, "01", g.M, H * 0.32, step(ad, 0.6), accent),
      T.line(deck.section || "Section title", g.M, H * 0.46, step(ad, 3.8), fg, { family: "head", weight: 700, maxWidth: g.span(Math.round(ad.grid.columns * 0.72)), tracking: step(ad, 3.8) * ad.type.displayTracking }),
      T.block(deck.sectionSub || "One sentence that frames what this section proves.", g.M, H * 0.56, step(ad, 0.6), g.span(Math.round(ad.grid.columns * 0.55)), muted, { leading: 1.5, maxLines: 2 }).svg,
      markAt(ctx, W - g.M - 120, H - g.M - 120, 120, 120, mix(primary, paper, 0.25), paper),
    ].join("")),
  });

  const cardW = g.span(Math.floor(ad.grid.columns / 3) - (ad.grid.columns >= 12 ? 0 : 0));
  const cardGap = g.gutter * 2;
  const cardWidth = (g.content - cardGap * 2) / 3;
  pages.push({
    name: "slide-3-content", width: W, height: H,
    svg: page(W, H, defs, [
      surface(W, H, paper, ad.material.grain),
      T.line(deck.section ? `${deck.section}` : "Content slide", g.M, H * 0.17, step(ad, 2.4), fg, { family: "head", weight: 700, maxWidth: g.span(Math.round(ad.grid.columns * 0.7)) }),
      `<rect x="${g.M}" y="${r(H * 0.2)}" width="${r(g.span(1))}" height="${r(ad.ink.ruleWeight * 2)}" fill="${accent}"/>`,
      ...[0, 1, 2].map((i) => {
        const x = g.M + i * (cardWidth + cardGap);
        const p = points[i];
        const top = H * 0.3;
        return [
          `<rect x="${r(x)}" y="${r(top)}" width="${r(cardWidth)}" height="${r(H * 0.42)}" fill="${primary}" opacity="0.05" rx="${ad.material.radius}"/>`,
          label(T, ctx, `0${i + 1}`, x + step(ad, 1.4), top + step(ad, 2.2), step(ad, 0.2), accent),
          T.line(p?.title || "Point headline", x + step(ad, 1.4), top + step(ad, 4.2), step(ad, 1.2), fg, { family: "head", weight: 700, maxWidth: cardWidth - step(ad, 2.8) }),
          T.block(p?.body || "Supporting detail, kept short so the slide stays readable from the back of the room.", x + step(ad, 1.4), top + step(ad, 5.9), step(ad, -0.2), cardWidth - step(ad, 2.8), muted, { leading: 1.5, maxLines: 5 }).svg,
        ].join("");
      }),
      T.line(ctx.company, g.M, H - g.M, step(ad, -0.6), muted, { maxWidth: g.span(5) }),
      markAt(ctx, W - g.M - 70, H - g.M - 60, 70, 70, mix(primary, paper, 0.3), paper),
    ].join("")),
  });

  pages.push({
    name: "slide-4-closing", width: W, height: H,
    svg: page(W, H, defs, [
      `<rect width="${W}" height="${H}" fill="${fg}"/>`,
      markAt(ctx, W / 2 - 100, H * 0.3, 200, 150, inkOn(fg), fg),
      T.line(deck.closing || "Thank you", W / 2, H * 0.6, step(ad, 3.6), inkOn(fg), { family: "head", weight: 700, anchor: "middle", maxWidth: g.span(Math.round(ad.grid.columns * 0.7)) }),
      T.line([d.website, d.email].filter(Boolean).join("   ·   "), W / 2, H * 0.68, step(ad, 0.2), inkOn(fg), { anchor: "middle", opacity: 0.75, maxWidth: g.content }),
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

  const head = (title: string, n: string) => [
    surface(W, H, paper, ad.material.grain),
    label(T, ctx, n, g.M, g.M + step(ad, 0.4), step(ad, -1), accent),
    T.line(title, g.M, g.M + step(ad, 3.4), step(ad, 2.4), fg, { family: "head", weight: 700, maxWidth: g.span(Math.round(ad.grid.columns * 0.6)), tracking: step(ad, 2.4) * ad.type.displayTracking }),
    `<rect x="${g.M}" y="${r(g.M + step(ad, 4.4))}" width="${g.content}" height="${r(ad.ink.hairline)}" fill="${mix(primary, paper, 0.55)}"/>`,
    label(T, ctx, `${ctx.company} — Brand guidelines`, W - g.M, g.M + step(ad, 0.4), step(ad, -1.3), muted, "end", g.span(5)),
  ].join("");

  const top = g.M + step(ad, 6.4);

  pages.push({
    name: "guidelines-1-cover", width: W, height: H,
    svg: page(W, H, defs, [
      `<rect width="${W}" height="${H}" fill="${primary}"/>`,
      markAt(ctx, g.M, g.M, g.span(3), Math.round(H * 0.16), ink, primary),
      label(T, ctx, "Brand guidelines", g.M, H * 0.52, step(ad, 0.6), ink, "start", g.span(6)),
      T.line(ctx.company, g.M, H * 0.66, step(ad, 4), ink, { family: "head", weight: 700, maxWidth: g.span(Math.round(ad.grid.columns * 0.8)), tracking: step(ad, 4) * ad.type.displayTracking }),
      d.tagline ? T.line(d.tagline, g.M, H * 0.73, step(ad, 0.4), ink, { opacity: 0.75, maxWidth: g.span(Math.round(ad.grid.columns * 0.6)) }) : "",
      T.line(new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }), g.M, H - g.M, step(ad, -1), ink, { opacity: 0.7, maxWidth: g.span(4) }),
      motif(ctx, g, ink, "br"),
    ].join("")),
  });

  const boxW = g.span(Math.round(ad.grid.columns * 0.46));
  const boxH = H * 0.4;
  pages.push({
    name: "guidelines-2-logo", width: W, height: H,
    svg: page(W, H, defs, [
      head("Logo", "01"),
      `<rect x="${g.M}" y="${r(top)}" width="${r(boxW)}" height="${r(boxH)}" fill="${paper}" stroke="${mix(fg, paper, 0.8)}" stroke-width="${r(ad.ink.hairline)}"/>`,
      markAt(ctx, g.M + boxW * 0.14, top + boxH * 0.18, boxW * 0.72, boxH * 0.64, null, paper),
      label(T, ctx, "Primary — full colour", g.M, top + boxH + step(ad, 1.4), step(ad, -1.2), muted),
      `<rect x="${r(g.M + boxW + g.gutter * 2)}" y="${r(top)}" width="${r(boxW * 0.55)}" height="${r(boxH * 0.52)}" fill="${fg}"/>`,
      markAt(ctx, g.M + boxW + g.gutter * 2 + boxW * 0.09, top + boxH * 0.1, boxW * 0.37, boxH * 0.32, inkOn(fg), fg),
      label(T, ctx, "Knockout", g.M + boxW + g.gutter * 2, top + boxH * 0.62, step(ad, -1.3), muted),
      `<rect x="${r(g.M + boxW + g.gutter * 2)}" y="${r(top + boxH * 0.72)}" width="${r(boxW * 0.55)}" height="${r(boxH * 0.46)}" fill="${paper}" stroke="${mix(fg, paper, 0.8)}" stroke-width="${r(ad.ink.hairline)}"/>`,
      markAt(ctx, g.M + boxW + g.gutter * 2 + boxW * 0.09, top + boxH * 0.8, boxW * 0.37, boxH * 0.3, "#121212", paper),
      label(T, ctx, "Mono", g.M + boxW + g.gutter * 2, top + boxH * 1.28, step(ad, -1.3), muted),
      T.block(
        "Keep clear space of at least the mark's cap height on every side. Never stretch, recolour outside these variants, add effects, or place the mark on a busy photograph without a scrim.",
        g.M, H - g.M - step(ad, 2.4), step(ad, -0.4), g.span(Math.round(ad.grid.columns * 0.7)), fg, { leading: ad.type.bodyLeading, maxLines: 3 },
      ).svg,
    ].join("")),
  });

  const entries = Object.entries(ctx.colors ?? {}).slice(0, 8);
  const swW = (g.content - g.gutter * 3 * 2) / 4;
  pages.push({
    name: "guidelines-3-colour", width: W, height: H,
    svg: page(W, H, defs, [
      head("Colour", "02"),
      ...entries.map(([k, v], i) => {
        const cs = colorSpaces(v);
        const x = g.M + (i % 4) * (swW + g.gutter * 3);
        const y = top + Math.floor(i / 4) * (H * 0.33);
        const rows = [cs.hex, `RGB ${cs.rgb.join(" ")}`, `CMYK ${cs.cmyk.join(" ")}`];
        return [
          `<rect x="${r(x)}" y="${r(y)}" width="${r(swW)}" height="${r(H * 0.15)}" fill="${v}" rx="${ad.material.radius}"/>`,
          label(T, ctx, k, x, y + H * 0.15 + step(ad, 1.6), step(ad, -1.1), fg, "start", swW),
          ...rows.map((t, j) => T.line(t, x, y + H * 0.15 + step(ad, 3 + j * 1.4), step(ad, -1.3), muted, { maxWidth: swW })),
          T.line(cs.pantone, x, y + H * 0.15 + step(ad, 7.2), step(ad, -1.3), accent, { maxWidth: swW }),
        ].join("");
      }),
    ].join("")),
  });

  pages.push({
    name: "guidelines-4-type", width: W, height: H,
    svg: page(W, H, defs, [
      head("Typography", "03"),
      label(T, ctx, ctx.fonts?.heading || "Heading", g.M, top + step(ad, 0.6), step(ad, 0.2), accent, "start", g.span(6)),
      T.line("Aa Bb Cc 0123", g.M, top + step(ad, 4), step(ad, 3.6), fg, { family: "head", weight: 700, maxWidth: g.span(Math.round(ad.grid.columns * 0.7)) }),
      T.line("Headlines · weight 700 · tight tracking", g.M, top + step(ad, 5.4), step(ad, -0.6), muted, { maxWidth: g.span(8) }),
      label(T, ctx, ctx.fonts?.body || "Body", g.M, top + step(ad, 8.4), step(ad, 0.2), accent, "start", g.span(6)),
      T.line("Aa Bb Cc 0123", g.M, top + step(ad, 11.4), step(ad, 2.8), fg, { maxWidth: g.span(Math.round(ad.grid.columns * 0.7)) }),
      T.block(
        "Body copy is set at 16–20px with a 1.6 line height. Sentence case everywhere except small labels, which are set uppercase with generous tracking.",
        g.M, H - g.M - step(ad, 2.4), step(ad, -0.4), g.span(Math.round(ad.grid.columns * 0.7)), fg, { leading: ad.type.bodyLeading, maxLines: 3 },
      ).svg,
    ].join("")),
  });

  const voice = d.voice || ctx.voice || "Plain, specific, and confident. Short sentences. Name the outcome, not the process. No jargon, no hype, no exclamation marks.";
  const halfW = (g.content - g.gutter * 3) / 2;
  pages.push({
    name: "guidelines-5-voice", width: W, height: H,
    svg: page(W, H, defs, [
      head("Voice", "04"),
      T.block(voice, g.M, top + step(ad, 1), step(ad, 0.6), g.span(Math.round(ad.grid.columns * 0.72)), fg, { leading: 1.7, maxLines: 6 }).svg,
      `<rect x="${g.M}" y="${r(H * 0.66)}" width="${r(halfW)}" height="${r(H * 0.2)}" fill="${primary}" opacity="0.06" rx="${ad.material.radius}"/>`,
      label(T, ctx, "Do", g.M + step(ad, 1.6), H * 0.66 + step(ad, 2.2), step(ad, -0.4), accent),
      T.block(ctx.copy?.voiceDo || "Lead with the result. Use the customer's words. One idea per sentence.", g.M + step(ad, 1.6), H * 0.66 + step(ad, 4.2), step(ad, -0.7), halfW - step(ad, 3.2), fg, { leading: 1.5, maxLines: 3 }).svg,
      `<rect x="${r(g.M + halfW + g.gutter * 3)}" y="${r(H * 0.66)}" width="${r(halfW)}" height="${r(H * 0.2)}" fill="${fg}" opacity="0.05" rx="${ad.material.radius}"/>`,
      label(T, ctx, "Don't", g.M + halfW + g.gutter * 3 + step(ad, 1.6), H * 0.66 + step(ad, 2.2), step(ad, -0.4), muted),
      T.block(ctx.copy?.voiceDont || "Don't stack adjectives, borrow buzzwords, or promise what the product can't do yet.", g.M + halfW + g.gutter * 3 + step(ad, 1.6), H * 0.66 + step(ad, 4.2), step(ad, -0.7), halfW - step(ad, 3.2), fg, { leading: 1.5, maxLines: 3 }).svg,
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
  const args: Args = { ctx, T, defs };

  let pages: Page[];
  switch (kind) {
    case "business_card": pages = businessCard(args); break;
    case "letterhead": pages = letterhead(args); break;
    case "envelope": pages = envelope(args); break;
    case "notecard": pages = notecard(args); break;
    case "email_signature": pages = emailSignature(args); break;
    case "invoice": pages = docTemplate(args, "invoice"); break;
    case "proposal": pages = docTemplate(args, "proposal"); break;
    case "presentation": pages = presentation(args); break;
    case "guidelines": pages = guidelines(args); break;
    default: pages = [];
  }

  const headStack = `${heading}, ${fallbackFor(heading)}`;
  const bodyStack = `${body}, ${fallbackFor(body)}`;
  pages = pages.map((p) => ({
    ...p,
    svg: p.svg
      .replace(/font-family="BrandHead"/g, `font-family="${headStack}"`)
      .replace(/font-family="BrandBody"/g, `font-family="${bodyStack}"`),
  }));

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

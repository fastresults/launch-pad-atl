// Server-side headline compositor.
// Renders the ad headline with real typography, auto-fitting the font size so
// the type never overflows the reserved band. Runs after image generation so
// the model doesn't have to typeset text — it just leaves the top band as
// unmarked negative space and we paint the words on top.
//
// Uses imagescript (already used by logo-compositor). Font is lazy-fetched on
// first call and cached in module scope.

import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";
import type { CanvasPlan } from "./canvas-plan.ts";

// Inter Bold — bundled with the function so we never depend on network egress
// at runtime. Network CDNs are only a fallback if the bundled read fails.
const LOCAL_FONT_URL = new URL("./fonts/Inter-Bold.ttf", import.meta.url);
const FONT_CDN_FALLBACKS = [
  "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-700-normal.woff",
  "https://rsms.me/inter/font-files/Inter-Bold.woff2",
];

let fontBytesPromise: Promise<Uint8Array | null> | null = null;

async function loadFont(): Promise<Uint8Array | null> {
  if (!fontBytesPromise) {
    fontBytesPromise = (async () => {
      // 1) Bundled font — fast, offline, always present.
      try {
        const bytes = await Deno.readFile(LOCAL_FONT_URL);
        if (bytes && bytes.length > 1024) return bytes;
      } catch (e) {
        console.warn("headline-compositor: local font read failed", e);
      }
      // 2) Network fallbacks.
      for (const url of FONT_CDN_FALLBACKS) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const buf = new Uint8Array(await res.arrayBuffer());
          if (buf.length > 1024) return buf;
        } catch (e) {
          console.warn("headline-compositor: cdn font fetch failed", url, e);
        }
      }
      return null;
    })();
  }
  return fontBytesPromise;
}

function hexToRgba(hex: string, a = 0xff): number {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || "").trim());
  const n = m ? parseInt(m[1], 16) : 0x0b0f19;
  const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  return ((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | (a & 0xff);
}

export type AdAspect = "1:1" | "4:5" | "9:16";

// Top-band height as % of canvas — matches the HEADLINE LANDING AREA
// directive in cover-art-director.ts.
function bandHeightPct(aspect: AdAspect): number {
  if (aspect === "9:16") return 14;
  if (aspect === "4:5") return 20;
  return 24; // 1:1
}

function maxLines(aspect: AdAspect): number {
  return aspect === "9:16" ? 3 : 2;
}

// Word-wrap `text` into up to `maxL` lines that each fit inside `maxWpx`
// when rendered by imagescript at `size`. Returns null if it can't fit
// even by using the max lines.
function tryWrap(
  font: Uint8Array,
  size: number,
  text: string,
  maxWpx: number,
  maxL: number,
): { lines: string[]; width: number; height: number } | null {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return null;

  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const candidate = cur ? cur + " " + w : w;
    let img: Image;
    try { img = Image.renderText(font, size, candidate, 0x000000ff) as Image; }
    catch { return null; }
    if (img.width <= maxWpx) {
      cur = candidate;
    } else {
      if (!cur) {
        // Single word wider than the line — no fit at this size.
        return null;
      }
      lines.push(cur);
      cur = w;
      if (lines.length >= maxL) return null;
      // Check single-word width against maxWpx too.
      let solo: Image;
      try { solo = Image.renderText(font, size, w, 0x000000ff) as Image; }
      catch { return null; }
      if (solo.width > maxWpx) return null;
    }
  }
  if (cur) lines.push(cur);
  if (!lines.length || lines.length > maxL) return null;

  let widest = 0;
  const lineHeight = Math.round(size * 1.08);
  for (const l of lines) {
    let img: Image;
    try { img = Image.renderText(font, size, l, 0x000000ff) as Image; }
    catch { return null; }
    if (img.width > widest) widest = img.width;
  }
  const totalH = lines.length * lineHeight;
  return { lines, width: widest, height: totalH };
}

// Binary-search largest font size that fits in the band with word wrapping.
function fitHeadline(
  font: Uint8Array,
  text: string,
  bandW: number,
  bandH: number,
  aspect: AdAspect,
): { lines: string[]; size: number; lineHeight: number; width: number; height: number } | null {
  const maxL = maxLines(aspect);
  // Ceiling: band height / lines, clamped to a reasonable typographic max.
  const ceil = Math.min(180, Math.floor(bandH / Math.max(1, maxL)));
  const floor = 28;

  let best: ReturnType<typeof tryWrap> | null = null;
  let bestSize = 0;

  let lo = floor, hi = ceil;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const wrapped = tryWrap(font, mid, text, bandW, maxL);
    if (wrapped && wrapped.height <= bandH) {
      best = wrapped;
      bestSize = mid;
      lo = mid + 4; // try larger
    } else {
      hi = mid - 4;
    }
  }
  if (!best) return null;
  return {
    lines: best.lines,
    size: bestSize,
    lineHeight: Math.round(bestSize * 1.08),
    width: best.width,
    height: best.height,
  };
}

// Word-safe truncator (matches content-ad-director) as a last-resort fallback.
function truncate(s: string, cap: number): string {
  const t = (s || "").trim().replace(/\s+/g, " ");
  if (t.length <= cap) return t;
  const hard = t.slice(0, cap);
  const sp = hard.lastIndexOf(" ");
  const stem = sp >= Math.floor(cap * 0.5) ? hard.slice(0, sp) : hard;
  return stem.replace(/[\s,;:.!?\-–—(]+$/g, "") + "…";
}

// Composite the headline into the top band of `baseBytes`, auto-fitting the
// font size. Returns the modified PNG bytes. On any failure, returns the
// original bytes unchanged (so the pipeline never dies over a font issue).
export async function compositeHeadline(
  baseBytes: Uint8Array,
  plan: CanvasPlan,
  aspect: AdAspect,
  headlineRaw: string,
): Promise<Uint8Array> {
  const headline = (headlineRaw || "").trim();
  if (!headline) return baseBytes;

  const font = await loadFont();
  if (!font) {
    console.warn("headline-compositor: no font, skipping");
    return baseBytes;
  }

  let base: Image;
  try { base = await Image.decode(baseBytes); }
  catch (e) { console.warn("headline-compositor: decode failed", e); return baseBytes; }

  const W = base.width, H = base.height;
  const sideInsetPct = 0.08;
  const bandTopInsetPct = 0.06;
  const bandBottomInsetPct = 0.02;
  const bandFullH = Math.floor(H * (bandHeightPct(aspect) / 100));
  const bandX = Math.floor(W * sideInsetPct);
  const bandY = Math.floor(H * bandTopInsetPct);
  const bandW = W - bandX * 2;
  const bandH = Math.max(1, bandFullH - Math.floor(H * bandBottomInsetPct));

  // First attempt: use the full string.
  let fit = fitHeadline(font, headline, bandW, bandH, aspect);

  // Fallback: progressively truncate if even the smallest size overflows.
  if (!fit) {
    const caps = [90, 72, 56, 44, 34];
    for (const cap of caps) {
      const t = truncate(headline, cap);
      fit = fitHeadline(font, t, bandW, bandH, aspect);
      if (fit) break;
    }
  }
  if (!fit) {
    console.warn("headline-compositor: no fit found for headline");
    return baseBytes;
  }

  const color = hexToRgba(plan.ink, 0xff);
  let cursorY = bandY;
  for (const line of fit.lines) {
    try {
      const glyphs = Image.renderText(font, fit.size, line, color) as Image;
      base.composite(glyphs, bandX, cursorY);
    } catch (e) {
      console.warn("headline-compositor: renderText failed", e);
      return baseBytes;
    }
    cursorY += fit.lineHeight;
  }

  try { return await base.encode(); }
  catch (e) { console.warn("headline-compositor: encode failed", e); return baseBytes; }
}

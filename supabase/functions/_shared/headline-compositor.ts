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

// IMPORTANT: keep large embedded fonts OFF the function bundle. A previous
// base64 font module pushed the edge worker over its memory limit before it
// could even handle lightweight actions like `list`.
const TTF_CDN_FALLBACK =
  "https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/InterVariable.ttf";

let fontBytesPromise: Promise<Uint8Array | null> | null = null;

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function loadFont(): Promise<Uint8Array | null> {
  if (!fontBytesPromise) {
    fontBytesPromise = (async () => {
      // 1) TTF CDN first: imagescript parses TTF, not woff/woff2. This keeps
      // the embedded base64 module out of memory for the common path.
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(TTF_CDN_FALLBACK, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const buf = new Uint8Array(await res.arrayBuffer());
          if (buf.length > 1024) {
            console.info(`[headline-compositor] font loaded via CDN (bytes=${buf.length})`);
            return buf;
          }
        }
      } catch (e) {
        console.warn("headline-compositor: cdn font fetch failed", e);
      }
      // If the CDN is unavailable, skip headline compositing rather than
      // importing a huge embedded font and crashing the whole generation.
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

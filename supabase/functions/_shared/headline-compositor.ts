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

// Reference size used to measure word widths once. Widths at other sizes are
// derived linearly (px scales ~linearly with font size for a given font).
const REF_SIZE = 100;

type WordMetrics = {
  spaceRef: number;                // width of a single space at REF_SIZE
  widthsRef: Map<string, number>;  // width of each unique word at REF_SIZE
};

function measureWords(font: Uint8Array, words: string[]): WordMetrics | null {
  const widthsRef = new Map<string, number>();
  try {
    for (const w of words) {
      if (widthsRef.has(w)) continue;
      const img = Image.renderText(font, REF_SIZE, w, 0x000000ff) as Image;
      widthsRef.set(w, img.width);
    }
    const a = (Image.renderText(font, REF_SIZE, "a", 0x000000ff) as Image).width;
    const aSpaceA = (Image.renderText(font, REF_SIZE, "a a", 0x000000ff) as Image).width;
    const spaceRef = Math.max(REF_SIZE * 0.25, aSpaceA - a * 2);
    return { spaceRef, widthsRef };
  } catch {
    return null;
  }
}

function wrapAtSize(
  words: string[],
  metrics: WordMetrics,
  size: number,
  maxWpx: number,
  maxL: number,
): { lines: string[] } | null {
  const scale = size / REF_SIZE;
  const space = metrics.spaceRef * scale;
  const lines: string[] = [];
  let curWords: string[] = [];
  let curW = 0;
  for (const w of words) {
    const ww = (metrics.widthsRef.get(w) ?? 0) * scale;
    if (ww > maxWpx) return null;
    const tentative = curWords.length ? curW + space + ww : ww;
    if (tentative <= maxWpx) {
      curWords.push(w);
      curW = tentative;
    } else {
      lines.push(curWords.join(" "));
      if (lines.length >= maxL) return null;
      curWords = [w];
      curW = ww;
    }
  }
  if (curWords.length) lines.push(curWords.join(" "));
  if (!lines.length || lines.length > maxL) return null;
  return { lines };
}

function fitHeadline(
  font: Uint8Array,
  text: string,
  bandW: number,
  bandH: number,
  aspect: AdAspect,
): { lines: string[]; size: number; lineHeight: number } | null {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  const metrics = measureWords(font, words);
  if (!metrics) return null;

  const maxL = maxLines(aspect);
  const ceil = Math.min(180, Math.floor(bandH / Math.max(1, maxL) / 1.08));
  const floor = 28;

  for (let size = ceil; size >= floor; size -= 4) {
    const wrapped = wrapAtSize(words, metrics, size, bandW, maxL);
    if (!wrapped) continue;
    const lh = Math.round(size * 1.08);
    if (wrapped.lines.length * lh <= bandH) {
      return { lines: wrapped.lines, size, lineHeight: lh };
    }
  }
  return null;
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

  try { return await base.encode(1); }
  catch (e) { console.warn("headline-compositor: encode failed", e); return baseBytes; }
}

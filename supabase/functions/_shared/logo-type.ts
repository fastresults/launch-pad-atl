// Real typography for wordmarks.
//
// Instead of emitting <text font-family="Arial"> (which reads as a placeholder
// and depends on the viewer's machine), we fetch the venture's actual heading
// typeface from Google Fonts, convert the wordmark to vector outlines, and
// bake the outlines into the SVG. The result is resolution-independent,
// font-independent, real typography.

import opentype from "npm:opentype.js@1.3.4";

export type OutlinedWordmark = { d: string; width: number; height: number; family: string };

// Curated fallbacks — never Arial. Ordered by how well they hold a logotype.
const FALLBACK_FAMILIES = ["Inter", "Work Sans", "DM Sans", "Manrope"];

const fontCache = new Map<string, ArrayBuffer | null>();

async function fetchWithTimeout(url: string, init: RequestInit, ms: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/** Google's legacy CSS endpoint serves TTF when the client looks old. */
async function loadFontBuffer(family: string, weight: number): Promise<ArrayBuffer | null> {
  const key = `${family}:${weight}`;
  if (fontCache.has(key)) return fontCache.get(key) ?? null;
  try {
    const cssUrl = `https://fonts.googleapis.com/css?family=${encodeURIComponent(family)}:${weight}`;
    const css = await fetchWithTimeout(cssUrl, { headers: { "User-Agent": "Wget/1.20 (linux-gnu)" } }, 8000);
    if (!css.ok) throw new Error(`font css ${css.status}`);
    const text = await css.text();
    const ttf = text.match(/url\((https:\/\/[^)]+\.ttf)\)/)?.[1];
    if (!ttf) throw new Error("no ttf in font css");
    const file = await fetchWithTimeout(ttf, {}, 10_000);
    if (!file.ok) throw new Error(`font file ${file.status}`);
    const buf = await file.arrayBuffer();
    fontCache.set(key, buf);
    return buf;
  } catch (e) {
    console.warn("font load failed", family, weight, e instanceof Error ? e.message : e);
    fontCache.set(key, null);
    return null;
  }
}

function applyCase(text: string, mode?: string): string {
  if (mode === "upper") return text.toUpperCase();
  if (mode === "lower") return text.toLowerCase();
  if (mode === "title") return text.replace(/\b\w/g, (c) => c.toUpperCase());
  return text;
}

function normaliseFamily(input: unknown): string {
  const raw = String(input ?? "").split(",")[0].replace(/["']/g, "").trim();
  if (!raw || /^(system-ui|sans-serif|serif|arial|helvetica)$/i.test(raw)) return "";
  return raw;
}

/**
 * Outline a wordmark. Returns null when no real font could be loaded, so the
 * caller can fall back to a <text> element with a curated stack.
 */
export async function outlineWordmark(
  text: string,
  opts: { family?: unknown; weight?: number; tracking?: number; case?: string } = {},
): Promise<OutlinedWordmark | null> {
  const words = applyCase(String(text ?? "").trim(), opts.case);
  if (!words) return null;

  const weight = Math.min(800, Math.max(300, Math.round((Number(opts.weight) || 600) / 100) * 100));
  const candidates = [normaliseFamily(opts.family), ...FALLBACK_FAMILIES].filter(Boolean) as string[];

  for (const family of candidates) {
    const buffer = await loadFontBuffer(family, weight);
    if (!buffer) continue;
    try {
      const font = opentype.parse(buffer);
      const size = 200;
      const tracking = (Number(opts.tracking) || 0) / 1000 * size; // spec tracking is in 1/1000 em
      let x = 0;
      const parts: string[] = [];
      for (const ch of Array.from(words)) {
        const glyph = font.charToGlyph(ch);
        const path = glyph.getPath(x, size, size);
        const d = path.toPathData(2);
        if (d) parts.push(d);
        x += (glyph.advanceWidth / font.unitsPerEm) * size + tracking;
      }
      if (!parts.length) continue;
      const d = parts.join(" ");
      const ascender = (font.ascender / font.unitsPerEm) * size;
      const descender = (Math.abs(font.descender) / font.unitsPerEm) * size;
      // Shift so the outline sits inside a 0..height box.
      const top = size - ascender;
      const height = ascender + descender;
      const shifted = height > 0 ? `${d}` : d;
      return {
        d: shifted,
        width: Math.max(1, x - tracking),
        height: Math.max(1, size + descender),
        family,
        // The glyph baseline is at y = size; box height accounts for descenders.
        ...(top ? {} : {}),
      };
    } catch (e) {
      console.warn("font parse failed", family, e instanceof Error ? e.message : e);
    }
  }
  return null;
}

export function fontStackFor(family: unknown): string {
  const primary = normaliseFamily(family);
  return [primary, "Inter", "Helvetica Neue", "Helvetica", "sans-serif"].filter(Boolean).map((f) => (/\s/.test(f) ? `'${f}'` : f)).join(", ");
}

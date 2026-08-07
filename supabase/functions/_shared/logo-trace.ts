// Raster -> vector tracing for the Logo Studio.
//
// The founder approves a rendered rough. We do NOT redraw it — we TRACE it, so
// the vector is the same artwork they just looked at. Colours are snapped to
// the brand palette so the output lands inside the design system.
//
// Pipeline: decode PNG -> quantise to the brand palette -> trace closed paths.

import { decode as decodePng } from "npm:fast-png@6.1.0";
import ImageTracer from "npm:imagetracerjs@1.2.6";

export type TraceResult = {
  svg: string;
  /** true = real vector paths. false = raster embedded as a fallback. */
  traced: boolean;
  note: string;
};

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex ?? "").trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** The colours a traced mark is allowed to use: brand palette + black + white. */
export function tracePalette(tokens: any): Rgb[] {
  const raw = [
    tokens?.colors?.primary,
    tokens?.colors?.secondary,
    tokens?.colors?.accent,
    tokens?.colors?.neutral,
    "#111111",
    "#FFFFFF",
  ];
  const out: Rgb[] = [];
  const seen = new Set<string>();
  for (const value of raw) {
    const rgb = hexToRgb(value);
    if (!rgb) continue;
    const key = `${rgb.r},${rgb.g},${rgb.b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(rgb);
  }
  if (out.length < 2) out.push({ r: 17, g: 17, b: 17 }, { r: 255, g: 255, b: 255 });
  return out;
}

function nearest(palette: Rgb[], r: number, g: number, b: number): Rgb {
  let best = palette[0];
  let bestD = Infinity;
  for (const c of palette) {
    const d = (c.r - r) ** 2 + (c.g - g) ** 2 + (c.b - b) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

/** Decode PNG bytes into flat RGBA at the given max dimension. */
function toRgba(bytes: Uint8Array): { width: number; height: number; data: Uint8ClampedArray } {
  const img: any = decodePng(bytes);
  const { width, height, channels, depth } = img;
  const src: any = img.data;
  const scale = depth === 16 ? 1 / 257 : 1;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const s = i * channels;
    let r: number, g: number, b: number, a = 255;
    if (channels === 1) { r = g = b = src[s] * scale; }
    else if (channels === 2) { r = g = b = src[s] * scale; a = src[s + 1] * scale; }
    else { r = src[s] * scale; g = src[s + 1] * scale; b = src[s + 2] * scale; if (channels === 4) a = src[s + 3] * scale; }
    // Flatten transparency onto white — logo roughs are drawn on white.
    if (a < 255) {
      const k = a / 255;
      r = r * k + 255 * (1 - k);
      g = g * k + 255 * (1 - k);
      b = b * k + 255 * (1 - k);
    }
    const d = i * 4;
    out[d] = r; out[d + 1] = g; out[d + 2] = b; out[d + 3] = 255;
  }
  return { width, height, data: out };
}

function base64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/**
 * Trace an approved rough into brand-coloured vector paths.
 * Never throws: an untraceable image degrades to an embedded raster so the
 * founder still gets their mark, clearly flagged as not-yet-vector.
 */
export async function traceLogo(
  pngBytes: Uint8Array,
  tokens: any,
  opts: { detail?: "clean" | "faithful" } = {},
): Promise<TraceResult> {
  try {
    const { width, height, data } = toRgba(pngBytes);
    const palette = tracePalette(tokens);

    // Snap every pixel to the brand palette before tracing. This is what keeps
    // the traced mark inside the colour system instead of inventing tints.
    for (let i = 0; i < data.length; i += 4) {
      const c = nearest(palette, data[i], data[i + 1], data[i + 2]);
      data[i] = c.r; data[i + 1] = c.g; data[i + 2] = c.b;
    }

    const clean = opts.detail !== "faithful";
    const svg: string = (ImageTracer as any).imagedataToSVG(
      { width, height, data },
      {
        pal: palette.map((c) => ({ r: c.r, g: c.g, b: c.b, a: 255 })),
        ltres: clean ? 1 : 0.4,
        qtres: clean ? 1 : 0.4,
        pathomit: clean ? 24 : 8,
        rightangleenhance: true,
        linefilter: true,
        strokewidth: 0,
        scale: 1,
        roundcoords: 1,
        viewbox: true,
        desc: false,
        blurradius: clean ? 1 : 0,
        blurdelta: 20,
      },
    );

    if (typeof svg === "string" && svg.includes("<path")) {
      return { svg: stripWhitePlate(svg), traced: true, note: "" };
    }
    throw new Error("tracer produced no paths");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("logo trace failed", message);
    const b64 = base64(pngBytes);
    return {
      svg:
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">` +
        `<image href="data:image/png;base64,${b64}" x="0" y="0" width="1024" height="1024"/></svg>`,
      traced: false,
      note: `Vector tracing was unavailable (${message.slice(0, 160)}). The mark is stored at full resolution — retry the vector pass to convert it.`,
    };
  }
}

/**
 * The tracer emits a full-bleed white rectangle for the background. Drop it so
 * the mark sits on transparency and works on any surface.
 */
function stripWhitePlate(svg: string): string {
  return svg.replace(
    /<path[^>]*fill="rgb\(255,\s*255,\s*255\)"[^>]*\/>/gi,
    "",
  );
}

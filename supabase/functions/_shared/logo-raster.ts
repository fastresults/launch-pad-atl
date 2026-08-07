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

/**
 * Removes full-canvas background rectangles (and white background paths) so a
 * vector mark rasterises with real transparency instead of a baked-in plate.
 */
export function stripSvgBackground(svg: string): string {
  return svg.replace(/<rect\b[^>]*\/?>(?:\s*<\/rect>)?/gi, (tag) => {
    const attr = (n: string) => {
      const m = new RegExp(`${n}\\s*=\\s*["']([^"']*)["']`, "i").exec(tag);
      return m ? m[1].trim() : "";
    };
    const x = parseFloat(attr("x") || "0");
    const y = parseFloat(attr("y") || "0");
    const w = attr("width");
    const h = attr("height");
    const fill = (attr("fill") || "").toLowerCase();
    const style = (attr("style") || "").toLowerCase();
    const rx = parseFloat(attr("rx") || "0");
    if (x > 1 || y > 1) return tag;
    if (rx > 0) return tag;
    const spansCanvas = /^(100%|\d+(\.\d+)?)$/.test(w) && /^(100%|\d+(\.\d+)?)$/.test(h);
    if (!spansCanvas) return tag;
    const isLight =
      fill === "" ||
      fill === "#fff" ||
      fill === "#ffffff" ||
      fill === "white" ||
      /#f[0-9a-f]{2}(?:[0-9a-f]{3})?/.test(fill) ||
      /fill\s*:\s*(#fff(fff)?|white)/.test(style);
    return isLight ? "" : tag;
  });
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
): Promise<Uint8Array | null> {
  try {
    const mod = await getResvg();
    if (!mod) return null;
    const opts: Record<string, unknown> = { fitTo: { mode: "width", value: width } };
    if (background) opts.background = background;
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


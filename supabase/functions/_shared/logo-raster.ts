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


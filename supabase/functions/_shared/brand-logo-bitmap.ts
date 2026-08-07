// Single source of truth for "give me the venture's primary logo as a bitmap
// the image model and the compositor can both use".
//
// Logo Studio saves marks as SVG. Image models and the PNG compositor cannot
// read SVG, so every consumer used to silently skip the logo
// (`logo_skipped: "svg_unsupported"`) and ship a logo-less asset. This module
// rasterises the SVG on demand and caches the PNG back to storage so the next
// call is a straight download.

import { rasterizeSvgToBytes, stripSvgBackground } from "./logo-raster.ts";

const BUCKET = "user-media";
const RASTER_WIDTH = 1024;

export type LogoSkipReason =
  | "no_logos"
  | "no_path"
  | "download_failed"
  | "too_large"
  | "svg_unsupported"
  | "exception";

export type LogoBitmap = {
  dataUrl: string | null;
  bytes: Uint8Array | null;
  /** Source SVG text when the primary mark is a vector — lets consumers
   *  re-render the mark in any knockout color instead of tinting pixels. */
  svgText: string | null;
  skipReason: LogoSkipReason | null;
};

export function mimeFromPath(p: string): string {
  const ext = (p.split(".").pop() || "").toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "svg") return "image/svg+xml";
  return "image/png";
}

function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}

function pngPathFor(svgPath: string): string {
  return svgPath.replace(/\.svg$/i, "") + `@${RASTER_WIDTH}.png`;
}

async function download(admin: any, path: string): Promise<Uint8Array | null> {
  const { data, error } = await admin.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

/**
 * Resolves the brand kit's primary logo to PNG/JPEG bytes.
 * SVG marks are rasterised (transparent background) and the result is cached
 * next to the source so later generations skip the wasm round-trip.
 */
export async function fetchPrimaryLogoBitmap(admin: any, kit: any): Promise<LogoBitmap> {
  try {
    const logos: any[] = Array.isArray(kit?.logos) ? kit.logos : [];
    if (!logos.length) {
      console.warn("[brand-logo] skipped: no_logos on brand kit");
      return { dataUrl: null, bytes: null, svgText: null, skipReason: "no_logos" };
    }
    const primary = logos.find((l) => l?.primary) ?? logos[0];
    const rawPath: string | undefined = primary?.path || primary?.storage_path;
    if (!rawPath) {
      console.warn("[brand-logo] skipped: primary entry has no path");
      return { dataUrl: null, bytes: null, svgText: null, skipReason: "no_path" };
    }

    const declaredMime = primary?.contentType || mimeFromPath(rawPath);
    const isSvg = declaredMime === "image/svg+xml" || /\.svg$/i.test(rawPath);

    // Raster marks (and previously cached rasterisations) take the fast path.
    if (!isSvg) {
      const buf = await download(admin, rawPath);
      if (!buf) {
        console.warn("[brand-logo] skipped: download_failed", rawPath);
        return { dataUrl: null, bytes: null, svgText: null, skipReason: "download_failed" };
      }
      if (buf.byteLength > 4 * 1024 * 1024) {
        return { dataUrl: null, bytes: null, svgText: null, skipReason: "too_large" };
      }
      return { dataUrl: `data:${declaredMime};base64,${bytesToB64(buf)}`, bytes: buf, svgText: null, skipReason: null };
    }

    // Source SVG is always needed now (consumers re-color the vector), so it
    // is fetched even when a cached raster exists.
    const svgBytes = await download(admin, rawPath);
    if (!svgBytes) {
      console.warn("[brand-logo] skipped: download_failed", rawPath);
      return { dataUrl: null, bytes: null, svgText: null, skipReason: "download_failed" };
    }
    const svgText = stripSvgBackground(new TextDecoder().decode(svgBytes));

    // Cached raster?
    const cachePath = primary?.png_path || pngPathFor(rawPath);
    const cached = await download(admin, cachePath);
    if (cached && cached.byteLength) {
      return { dataUrl: `data:image/png;base64,${bytesToB64(cached)}`, bytes: cached, svgText, skipReason: null };
    }

    const png = await rasterizeSvgToBytes(svgText, RASTER_WIDTH);
    if (!png || !png.byteLength) {
      console.warn("[brand-logo] rasterisation unavailable for", rawPath);
      return { dataUrl: null, bytes: null, svgText: null, skipReason: "svg_unsupported" };
    }

    // Best-effort cache — a failure here just means we rasterise again later.
    try {
      await admin.storage
        .from(BUCKET)
        .upload(cachePath, png, { contentType: "image/png", upsert: true });
    } catch (e) {
      console.warn("[brand-logo] raster cache upload failed", e);
    }

    return { dataUrl: `data:image/png;base64,${bytesToB64(png)}`, bytes: png, svgText, skipReason: null };
  } catch (e) {
    console.error("[brand-logo] fetchPrimaryLogoBitmap failed", e);
    return { dataUrl: null, bytes: null, svgText: null, skipReason: "exception" };
  }
}

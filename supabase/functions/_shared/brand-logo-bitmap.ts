// Single source of truth for "give me the venture's primary logo as a bitmap
// the image model and the compositor can both use".
//
// Logo Studio saves marks as SVG. Image models and the PNG compositor cannot
// read SVG, so every consumer used to silently skip the logo
// (`logo_skipped: "svg_unsupported"`) and ship a logo-less asset. This module
// rasterises the SVG on demand and caches the PNG back to storage so the next
// call is a straight download.

import { rasterizeSvgToBytes, stripSvgBackground } from "./logo-raster.ts";
import { formToneOf, slotFor, type LogoForm, type LogoTone, type LogoVariant } from "./logo-form.ts";
import { recommendMark, slotsForKind, studioMarkKind } from "./collateral-marks.ts";

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

/** Which lockup shape a placement wants. */
export type LockupPreference = "horizontal" | "stacked";

export type LogoBitmapOpts = {
  /** Prefer the stacked (mark over wordmark) lockup for square / tall boxes. */
  lockup?: LockupPreference;
  /** True when the mark lands on a dark ground — prefers reversed artwork. */
  dark?: boolean;
};

/** Picks the stored logo entry that best matches the requested lockup. */
function pickEntry(logos: any[], opts: LogoBitmapOpts): any {
  const slot = (l: any) => String(l?.variant ?? (l?.primary ? "primary" : "")).toLowerCase();
  const wanted: string[] = [];
  if (opts.lockup === "stacked") {
    wanted.push(opts.dark ? "stacked_reversed" : "stacked", opts.dark ? "stacked" : "stacked_reversed");
  }
  if (opts.dark) wanted.push("reversed");
  for (const w of wanted) {
    const hit = logos.find((l) => slot(l) === w && (l?.path || l?.storage_path));
    if (hit) return hit;
  }
  return logos.find((l) => l?.primary) ?? logos[0];
}

/**
 * Resolves the brand kit's primary logo to PNG/JPEG bytes.
 * SVG marks are rasterised (transparent background) and the result is cached
 * next to the source so later generations skip the wasm round-trip.
 */
export async function fetchPrimaryLogoBitmap(
  admin: any,
  kit: any,
  opts: LogoBitmapOpts = {},
): Promise<LogoBitmap> {
  const logos: any[] = Array.isArray(kit?.logos) ? kit.logos : [];
  if (!logos.length) {
    console.warn("[brand-logo] skipped: no_logos on brand kit");
    return { dataUrl: null, bytes: null, svgText: null, skipReason: "no_logos" };
  }
  return await loadEntryBitmap(admin, pickEntry(logos, opts));
}

/** Load one logo-set entry to bytes (+ its source SVG when it is vector). */
export async function loadEntryBitmap(admin: any, primary: any): Promise<LogoBitmap> {
  try {
    const rawPath: string | undefined = primary?.svg_path || primary?.path || primary?.storage_path;
    if (!rawPath) {
      console.warn("[brand-logo] skipped: entry has no path");
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

// ---------------------------------------------------------------------------
// Studio mark contract
//
// Social Studio and Content Studio obey the same rules as Branded Collateral:
// a manual Form × Tone pick is the exact source artwork (never substituted,
// never repainted), and an unpicked slot is resolved by the same symmetry
// recommender the collateral worker uses.
// ---------------------------------------------------------------------------

export type StudioMarkIdentity = {
  slot: string;
  form: LogoForm;
  tone: LogoTone;
  variant: LogoVariant;
  source: string;
  mode: "manual" | "auto";
  requested: { form: LogoForm; tone: LogoTone } | null;
  reason: string | null;
};

export type StudioMark = LogoBitmap & { identity: StudioMarkIdentity | null };

/** Raised when an explicitly picked cell has no artwork. Never fall back. */
export class ExactMarkUnavailable extends Error {
  code = "EXACT_LOGO_UNAVAILABLE";
  constructor(public variant: string, public assetKind: string) {
    super(`EXACT_LOGO_UNAVAILABLE:${assetKind}:${variant}`);
  }
}

/**
 * Resolve the mark for a studio asset, honouring a manual pick exactly.
 * `pick` is a stored `{ form, tone }` cell (or null for AI selection).
 */
export async function resolveStudioMark(
  admin: any,
  kit: any,
  opts: {
    assetKind: string;
    pick?: { form?: string; tone?: string } | null;
    fallback?: LogoBitmapOpts;
  },
): Promise<StudioMark> {
  const logos: any[] = Array.isArray(kit?.logos) ? kit.logos : [];
  const kind = studioMarkKind(opts.assetKind);
  const slot = slotsForKind(kind)[0];

  const supplied: { variant: LogoVariant; form: LogoForm; tone: LogoTone; entry: any }[] = [];
  for (const l of logos) {
    const v = l?.variant;
    if (!v || !(l?.svg_path ?? l?.path ?? l?.storage_path)) continue;
    if (supplied.some((s) => s.variant === v)) continue;
    const ft = formToneOf(v);
    supplied.push({ variant: v as LogoVariant, form: ft.form, tone: ft.tone, entry: l });
  }

  const pick = opts.pick && opts.pick.form && opts.pick.tone
    ? { form: opts.pick.form as LogoForm, tone: opts.pick.tone as LogoTone }
    : null;

  if (pick) {
    const wanted = slotFor(pick.form, pick.tone);
    const hit = supplied.find((s) => s.variant === wanted);
    if (!hit) throw new ExactMarkUnavailable(wanted, opts.assetKind);
    const bitmap = await loadEntryBitmap(admin, hit.entry);
    if (!bitmap.bytes) throw new ExactMarkUnavailable(wanted, opts.assetKind);
    console.log(`[studio mark] ${kind}/${slot.id} asked ${wanted} → exact`);
    return {
      ...bitmap,
      identity: {
        slot: slot.id,
        form: hit.form,
        tone: hit.tone,
        variant: hit.variant,
        source: String(hit.entry?.svg_path ?? hit.entry?.path ?? wanted),
        mode: "manual",
        requested: pick,
        reason: null,
      },
    };
  }

  const rec = supplied.length
    ? recommendMark(slot, supplied.map((s) => ({ form: s.form, tone: s.tone })))
    : null;
  if (rec) {
    const variant = slotFor(rec.form, rec.tone);
    const hit = supplied.find((s) => s.variant === variant);
    if (hit) {
      const bitmap = await loadEntryBitmap(admin, hit.entry);
      if (bitmap.bytes) {
        console.log(`[studio mark] ${kind}/${slot.id} auto → ${variant} (${rec.reason})`);
        return {
          ...bitmap,
          identity: {
            slot: slot.id,
            form: hit.form,
            tone: hit.tone,
            variant: hit.variant,
            source: String(hit.entry?.svg_path ?? hit.entry?.path ?? variant),
            mode: "auto",
            requested: null,
            reason: rec.reason,
          },
        };
      }
    }
  }

  // Nothing classified — fall back to the legacy primary-entry heuristic so
  // older ventures with unlabelled marks still get their logo.
  const legacy = await fetchPrimaryLogoBitmap(admin, kit, opts.fallback ?? {});
  return { ...legacy, identity: null };
}

// Public, permanent logo endpoint.
//
// Signed storage URLs expire in days, which is useless inside a website PRD a
// founder pastes into an external builder weeks later. This function serves the
// venture's committed brand mark from a stable address:
//
//   /functions/v1/brand-logo/{snapshotId}
//   /functions/v1/brand-logo/{snapshotId}/horizontal|stacked|mono|knockout
//   /functions/v1/brand-logo/{snapshotId}/auto?on=dark|light|%23112233
//
// The `auto` variant measures the artwork's own ink and returns whichever mark
// stays legible on the requested surface — recolouring or plating it when no
// stored variant clears the contrast bar.
//
// It reads the file server-side with the service role, so nothing about the
// private bucket (or a signing token) is exposed.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  inkPasses,
  isUntintableSvg,
  legibleInkFor,
  platedSvg,
  rasterInkHex,
  surfaceHex,
  svgInkHex,
  tintSvg,
  variantOrder,
} from "../_shared/logo-ink.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "user-media";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VARIANTS = new Set(["mark", "horizontal", "stacked", "mono", "knockout", "auto"]);

function notFound(msg: string) {
  return new Response(msg, { status: 404, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
}

function contentTypeFor(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "svg") return "image/svg+xml";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream";
}

const CACHE = "public, max-age=300, stale-while-revalidate=86400";

function pathFor(primary: any, variant: string): string | null {
  if (variant === "mark") {
    return primary.svg_path ?? primary.path ?? primary.variants?.mark?.path ?? null;
  }
  return primary.variants?.[variant]?.path ?? null;
}

function toDataUri(bytes: Uint8Array, mime: string) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return `data:${mime};base64,${btoa(bin)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    // .../brand-logo/{snapshotId}[/{variant}]
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "brand-logo");
    const snapshotId = idx >= 0 ? parts[idx + 1] : undefined;
    const variant = (idx >= 0 ? parts[idx + 2] : undefined) ?? "mark";

    if (!snapshotId || !UUID_RE.test(snapshotId)) return notFound("Invalid venture id");
    if (!VARIANTS.has(variant)) return notFound("Unknown logo variant");

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: kit } = await supabase
      .from("venture_brand_kits")
      .select("logos")
      .eq("snapshot_id", snapshotId)
      .maybeSingle();

    const logos = Array.isArray(kit?.logos) ? kit!.logos : [];
    const primary = logos.find((l: any) => l && l.primary) ?? logos[0];
    if (!primary) return notFound("No logo published for this venture yet");

    const download = async (path: string) => {
      const { data, error } = await supabase.storage.from(BUCKET).download(path);
      if (error || !data) return null;
      return new Uint8Array(await data.arrayBuffer());
    };

    /* ---------- contrast-aware pick ---------- */
    if (variant === "auto") {
      const surface = surfaceHex(url.searchParams.get("on")) ?? "#FFFFFF";
      const order = variantOrder(surface);

      let fallback: { bytes: Uint8Array; path: string } | null = null;
      for (const v of order) {
        const p = pathFor(primary, v);
        if (!p) continue;
        const bytes = await download(p);
        if (!bytes) continue;
        if (!fallback) fallback = { bytes, path: p };

        const isSvg = p.toLowerCase().endsWith(".svg");
        const text = isSvg ? new TextDecoder().decode(bytes) : "";
        const ink = isSvg ? svgInkHex(text) : await rasterInkHex(bytes);
        if (inkPasses(ink, surface)) {
          return new Response(bytes, {
            headers: { ...corsHeaders, "Content-Type": contentTypeFor(p), "Cache-Control": CACHE },
          });
        }
      }

      // Nothing stored is legible here. Recolour the vector, or plate the raster.
      if (fallback) {
        const isSvg = fallback.path.toLowerCase().endsWith(".svg");
        const text = isSvg ? new TextDecoder().decode(fallback.bytes) : "";
        if (isSvg && !isUntintableSvg(text)) {
          const svg = tintSvg(text, legibleInkFor(surface));
          return new Response(svg, {
            headers: { ...corsHeaders, "Content-Type": "image/svg+xml", "Cache-Control": CACHE },
          });
        }
        const svg = platedSvg(
          toDataUri(fallback.bytes, contentTypeFor(fallback.path)),
          surface,
        );
        return new Response(svg, {
          headers: { ...corsHeaders, "Content-Type": "image/svg+xml", "Cache-Control": CACHE },
        });
      }
      return notFound("No usable logo file for this venture");
    }

    /* ---------- explicit variant ---------- */
    const path =
      variant === "mark"
        ? (primary.svg_path ?? primary.path ?? primary.variants?.mark?.path)
        : (primary.variants?.[variant]?.path ?? primary.svg_path ?? primary.path);
    if (!path) return notFound("That logo variant has not been generated");

    const bytes = await download(path);
    if (!bytes) return notFound("Logo file is unavailable");

    return new Response(bytes, {
      headers: { ...corsHeaders, "Content-Type": contentTypeFor(path), "Cache-Control": CACHE },
    });
  } catch (e) {
    return new Response(`Logo unavailable: ${(e as Error).message}`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});

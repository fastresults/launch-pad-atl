// Public, permanent logo endpoint.
//
// Signed storage URLs expire in days, which is useless inside a website PRD a
// founder pastes into an external builder weeks later. This function serves the
// venture's committed brand mark from a stable address:
//
//   /functions/v1/brand-logo/{snapshotId}
//   /functions/v1/brand-logo/{snapshotId}/horizontal|stacked|mono|knockout
//
// It reads the file server-side with the service role, so nothing about the
// private bucket (or a signing token) is exposed.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "user-media";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VARIANTS = new Set(["mark", "horizontal", "stacked", "mono", "knockout"]);

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

    const path =
      variant === "mark"
        ? (primary.svg_path ?? primary.path ?? primary.variants?.mark?.path)
        : (primary.variants?.[variant]?.path ?? primary.svg_path ?? primary.path);
    if (!path) return notFound("That logo variant has not been generated");

    const { data: file, error } = await supabase.storage.from(BUCKET).download(path);
    if (error || !file) return notFound("Logo file is unavailable");

    return new Response(await file.arrayBuffer(), {
      headers: {
        ...corsHeaders,
        "Content-Type": contentTypeFor(path),
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    return new Response(`Logo unavailable: ${(e as Error).message}`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});

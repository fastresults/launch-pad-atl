// Venture Social Cover — gated, agency-grade per-platform cover art generator.
// Hard-requires a LOCKED Brand Kit. Outputs feed Cover Art tab in Social Studio.

import { createClient } from "npm:@supabase/supabase-js@2";
import { loadVentureContext } from "../_shared/venture-context.ts";
import {
  getPlatform,
  ART_DIRECTIONS,
  type ArtDirectionId,
  type AssetKind,
} from "../_shared/social-platform-specs.ts";
import { buildCoverArtPrompt } from "../_shared/cover-art-director.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/images/generations";
const MODEL = "openai/gpt-image-2";
const BUCKET = "user-media";
const SIGNED_TTL = 60 * 60 * 24 * 7;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function callImageGateway(prompt: string, size: string, apiKey: string) {
  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: { "Lovable-API-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, prompt, size, quality: "low", n: 1 }),
  });
  const text = await res.text();
  if (!res.ok) {
    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch { /* */ }
    const err: any = new Error(parsed?.error?.message || `AI gateway error (${res.status})`);
    err.status = res.status;
    throw err;
  }
  const data = JSON.parse(text);
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("AI gateway returned no image");
  return b64 as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const client = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await client.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = (await req.json().catch(() => ({}))) as any;
    const action = body?.action ?? "generate";
    const snapshotId = body?.snapshotId as string | undefined;
    if (!snapshotId) return json({ error: "snapshotId required" }, 400);

    // Snapshot ownership
    const { data: snap } = await admin
      .from("venture_snapshots")
      .select("id, user_id")
      .eq("id", snapshotId)
      .maybeSingle();
    if (!snap || snap.user_id !== userId) return json({ error: "Forbidden" }, 403);

    // ---- LIST ----
    if (action === "list") {
      const { data } = await admin
        .from("venture_social_assets")
        .select("*")
        .eq("snapshot_id", snapshotId)
        .order("created_at", { ascending: false });
      return json({ assets: data ?? [] });
    }

    // ---- DELETE ----
    if (action === "delete") {
      const assetId = body?.assetId as string;
      if (!assetId) return json({ error: "assetId required" }, 400);
      const { data: row } = await admin
        .from("venture_social_assets")
        .select("user_id, storage_path")
        .eq("id", assetId)
        .maybeSingle();
      if (!row || row.user_id !== userId) return json({ error: "Not found" }, 404);
      if (row.storage_path) {
        await admin.storage.from(BUCKET).remove([row.storage_path]).catch(() => {});
      }
      await admin.from("venture_social_assets").delete().eq("id", assetId);
      return json({ ok: true });
    }

    // ---- SELECT ----
    if (action === "select") {
      const assetId = body?.assetId as string;
      if (!assetId) return json({ error: "assetId required" }, 400);
      const { data: row } = await admin
        .from("venture_social_assets")
        .select("*")
        .eq("id", assetId)
        .maybeSingle();
      if (!row || row.user_id !== userId) return json({ error: "Not found" }, 404);
      await admin
        .from("venture_social_assets")
        .update({ is_selected: false })
        .eq("snapshot_id", snapshotId)
        .eq("platform", row.platform)
        .eq("asset_kind", row.asset_kind);
      const { data: updated } = await admin
        .from("venture_social_assets")
        .update({ is_selected: true })
        .eq("id", assetId)
        .select()
        .single();
      return json({ asset: updated });
    }

    // ---- GENERATE ----
    if (action !== "generate") return json({ error: `Unknown action: ${action}` }, 400);

    // HARD GATE: brand kit must exist & be locked.
    const { data: kit } = await admin
      .from("venture_brand_kits")
      .select("*")
      .eq("snapshot_id", snapshotId)
      .maybeSingle();
    if (!kit || kit.status !== "locked") {
      return json({
        error: "Brand Wizard must be completed and locked before generating social cover art.",
        code: "BRAND_NOT_LOCKED",
      }, 400);
    }

    const platformName = String(body?.platform || "");
    const assetKind = String(body?.asset || body?.assetKind || "") as AssetKind;
    const direction = String(body?.direction || "editorial") as ArtDirectionId;
    const platform = getPlatform(platformName);
    if (!platform) return json({ error: `Unknown platform: ${platformName}` }, 400);
    const asset = platform.assets.find((a) => a.kind === assetKind);
    if (!asset) return json({ error: `Unknown asset kind: ${assetKind}` }, 400);
    if (!ART_DIRECTIONS.some((d) => d.id === direction)) {
      return json({ error: `Unknown direction: ${direction}` }, 400);
    }

    const ctx = await loadVentureContext(admin, snapshotId);
    const prompt = buildCoverArtPrompt({ platform: platform.label, asset, direction, kit, ctx });

    let b64: string;
    try {
      b64 = await callImageGateway(prompt, asset.modelSize, apiKey);
    } catch (e: any) {
      const status = e?.status;
      const out: any = { error: e?.message ?? "Generation failed", upstreamStatus: status };
      if (status === 402) { out.code = "PAYMENT_REQUIRED"; out.reason = "ai_credits_exhausted"; }
      else if (status === 429) { out.code = "RATE_LIMITED"; }
      return json(out, 200);
    }

    const bytes = b64ToBytes(b64);
    const fileId = crypto.randomUUID();
    const storagePath = `social-cover/${userId}/${snapshotId}/${platform.platform}/${asset.kind}/${direction}-${fileId}.png`;

    const { error: upErr } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, bytes, { contentType: "image/png", upsert: false });
    if (upErr) throw upErr;

    const { data: signed } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, SIGNED_TTL);
    const expiresAt = new Date(Date.now() + SIGNED_TTL * 1000).toISOString();

    const { data: row, error: insErr } = await admin
      .from("venture_social_assets")
      .insert({
        snapshot_id: snapshotId,
        user_id: userId,
        platform: platform.platform,
        asset_kind: asset.kind,
        art_direction: direction,
        storage_path: storagePath,
        signed_url: signed?.signedUrl ?? null,
        signed_url_expires_at: expiresAt,
        width: asset.width,
        height: asset.height,
        prompt_used: prompt,
        model_used: MODEL,
        brand_kit_locked_at: kit.locked_at,
        is_selected: false,
      })
      .select()
      .single();
    if (insErr) throw insErr;

    return json({ asset: row });
  } catch (e) {
    console.error("venture-social-cover error", e);
    return json({ error: (e as Error).message ?? "Internal error" }, 500);
  }
});

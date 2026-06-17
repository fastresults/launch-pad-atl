// Brand Creative edge function — admin-only.
// Generates social brand images via Lovable AI Gateway, stores them in user-media,
// and records metadata in social_brand_assets.
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildPrompt, nearestGptImageSize, type AssetType } from "./prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/images/generations";
const DEFAULT_MODEL = "openai/gpt-image-2";
const STORAGE_BUCKET = "user-media";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

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

type GenerateBody = {
  action: "generate";
  assetType: AssetType;
  vibe: string;
  colorMood: string;
  subject: string;
  brandName?: string;
  platform?: string | null;
  width: number;
  height: number;
  count?: number; // 1..4
  model?: string;
};

type DeleteBody = { action: "delete"; assetId: string };
type SelectBody = { action: "select"; assetId: string; clearSiblings?: boolean };

async function callAiGateway(prompt: string, size: string, apiKey: string, model: string) {
  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      "Lovable-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      quality: "low",
      n: 1,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch { /* ignore */ }
    const err: any = new Error(
      parsed?.error?.message || parsed?.error || `AI gateway error (${res.status})`,
    );
    err.status = res.status;
    err.code = parsed?.error?.code;
    throw err;
  }
  const data = JSON.parse(text);
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("AI gateway returned no image data");
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
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    // Admin gate
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (roleRows ?? []).map((r: any) => r.role);
    if (!roles.includes("admin") && !roles.includes("super_admin")) {
      return json({ error: "Forbidden" }, 403);
    }

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = (await req.json().catch(() => ({}))) as
      | GenerateBody | DeleteBody | SelectBody | { action?: string };
    const action = (body as any)?.action;

    if (action === "delete") {
      const { assetId } = body as DeleteBody;
      if (!assetId) return json({ error: "assetId required" }, 400);
      const { data: row } = await admin
        .from("social_brand_assets")
        .select("user_id, storage_path")
        .eq("id", assetId)
        .maybeSingle();
      if (!row || row.user_id !== userId) return json({ error: "Not found" }, 404);
      if (row.storage_path) {
        await admin.storage.from(STORAGE_BUCKET).remove([row.storage_path]).catch(() => {});
      }
      await admin.from("social_brand_assets").delete().eq("id", assetId);
      return json({ ok: true });
    }

    if (action === "select") {
      const { assetId, clearSiblings } = body as SelectBody;
      if (!assetId) return json({ error: "assetId required" }, 400);
      const { data: row } = await admin
        .from("social_brand_assets")
        .select("*")
        .eq("id", assetId)
        .maybeSingle();
      if (!row || row.user_id !== userId) return json({ error: "Not found" }, 404);
      if (clearSiblings) {
        await admin
          .from("social_brand_assets")
          .update({ is_selected: false })
          .eq("user_id", userId)
          .eq("asset_type", row.asset_type)
          .eq("platform", row.platform ?? null);
      }
      const { data: updated } = await admin
        .from("social_brand_assets")
        .update({ is_selected: true })
        .eq("id", assetId)
        .select()
        .single();
      return json({ asset: updated });
    }

    if (action !== "generate") {
      return json({ error: `Unknown action: ${action}` }, 400);
    }

    const g = body as GenerateBody;
    if (!g.assetType || !g.vibe || !g.colorMood || !g.subject || !g.width || !g.height) {
      return json({ error: "Missing required fields" }, 400);
    }
    const count = Math.min(Math.max(g.count ?? 3, 1), 4);
    const model = g.model || DEFAULT_MODEL;
    const size = nearestGptImageSize(g.width, g.height);
    const prompt = buildPrompt({
      assetType: g.assetType,
      vibe: g.vibe,
      colorMood: g.colorMood,
      subject: g.subject,
      brandName: g.brandName,
      width: g.width,
      height: g.height,
    });

    // Generate variations sequentially to avoid 429s on the gateway burst.
    const variations: any[] = [];
    for (let i = 0; i < count; i++) {
      try {
        const b64 = await callAiGateway(prompt, size, apiKey, model);
        const bytes = b64ToBytes(b64);
        const fileId = crypto.randomUUID();
        const storagePath = `social-brand/${userId}/${g.assetType}/${fileId}.png`;

        const { error: upErr } = await admin.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, bytes, { contentType: "image/png", upsert: false });
        if (upErr) throw upErr;

        const { data: signed } = await admin.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

        const expiresAt = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString();

        const { data: row, error: insErr } = await admin
          .from("social_brand_assets")
          .insert({
            user_id: userId,
            asset_type: g.assetType,
            platform: g.platform ?? null,
            aspect_ratio: `${g.width}:${g.height}`,
            width: g.width,
            height: g.height,
            storage_path: storagePath,
            signed_url: signed?.signedUrl ?? null,
            signed_url_expires_at: expiresAt,
            vibe: g.vibe,
            color_mood: g.colorMood,
            prompt_used: prompt,
            model_used: model,
            is_selected: false,
          })
          .select()
          .single();
        if (insErr) throw insErr;
        variations.push(row);
      } catch (e: any) {
        // Surface partial success — return what we have plus the error.
        if (variations.length === 0) {
          const status = e?.status;
          const body: any = {
            error: e?.message ?? "Generation failed",
            upstreamStatus: status,
          };
          if (status === 402) {
            body.code = "PAYMENT_REQUIRED";
            body.reason = "ai_credits_exhausted";
          } else if (status === 429) {
            body.code = "RATE_LIMITED";
          }
          return json(body, 200);
        }
        return json({ variations, partial_error: e?.message }, 200);
      }
    }

    return json({ variations });
  } catch (e) {
    console.error("brand-creative error", e);
    return json({ error: (e as Error).message ?? "Internal error" }, 500);
  }
});

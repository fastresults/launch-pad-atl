// Venture Social Cover — gated, agency-grade per-platform cover art generator.
// Hard-requires a LOCKED Brand Kit. Generates logo-aware avatars and covers
// using Gemini multimodal (logo + palette/type tiles as image input) with an
// OpenAI text-only fallback.

import { createClient } from "npm:@supabase/supabase-js@2";
import { loadVentureContext } from "../_shared/venture-context.ts";
import {
  getPlatform,
  ART_DIRECTIONS,
  type ArtDirectionId,
  type AssetKind,
  type AssetSpec,
} from "../_shared/social-platform-specs.ts";
import { buildCoverArtPrompt, buildAvatarPrompt } from "../_shared/cover-art-director.ts";
import { buildCanvasPlan, pickAvatarSurface, type CanvasPlan } from "../_shared/canvas-plan.ts";
import { buildPaletteTilePngBytes, bytesToDataUrl } from "../_shared/palette-tile.ts";
import { runContrastQa, logoDominantInk } from "../_shared/image-qa.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/images/generations";
const MODEL_MULTIMODAL = "google/gemini-3-pro-image";
const MODEL_FALLBACK = "openai/gpt-image-2";
const BUCKET = "user-media";
const SIGNED_TTL = 60 * 60 * 24 * 7;

function gatewayHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function gatewayError(text: string, status: number, label: string) {
  let parsed: any = {};
  try { parsed = JSON.parse(text); } catch { /* non-json gateway body */ }
  const message =
    parsed?.error?.message ||
    parsed?.message ||
    parsed?.details ||
    `${label} gateway error (${status})`;
  const err: any = new Error(message);
  err.status = status;
  err.code = parsed?.error?.type || parsed?.error?.code || parsed?.type || parsed?.code;
  err.details = parsed?.details;
  return err;
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}

function mimeFromPath(p: string): string {
  const ext = (p.split(".").pop() || "").toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "svg") return "image/svg+xml";
  return "image/png";
}

// Fetch the brand kit's primary logo as raw bytes + data URL.
// Returns nulls if no logo is available or anything fails — caller degrades.
async function fetchPrimaryLogo(
  admin: any,
  kit: any,
): Promise<{ dataUrl: string | null; bytes: Uint8Array | null }> {
  try {
    const logos: any[] = Array.isArray(kit?.logos) ? kit.logos : [];
    if (!logos.length) return { dataUrl: null, bytes: null };
    const primary = logos.find((l) => l?.primary) ?? logos[0];
    const path = primary?.path || primary?.storage_path;
    if (!path) return { dataUrl: null, bytes: null };
    const { data, error } = await admin.storage.from(BUCKET).download(path);
    if (error || !data) return { dataUrl: null, bytes: null };
    const buf = new Uint8Array(await data.arrayBuffer());
    if (buf.byteLength > 4 * 1024 * 1024) return { dataUrl: null, bytes: null };
    const mime = primary?.contentType || mimeFromPath(path);
    if (mime === "image/svg+xml") return { dataUrl: null, bytes: null };
    return { dataUrl: `data:${mime};base64,${bytesToB64(buf)}`, bytes: buf };
  } catch (e) {
    console.error("fetchPrimaryLogo failed", e);
    return { dataUrl: null, bytes: null };
  }
}

// Multimodal call: Gemini image model via OpenRouter chat shape. Returns b64 PNG.
async function callMultimodal(
  prompt: string,
  imagesDataUrls: string[],
  apiKey: string,
): Promise<string> {
  const content: any[] = [{ type: "text", text: prompt }];
  for (const url of imagesDataUrls) {
    if (url) content.push({ type: "image_url", image_url: { url } });
  }
  const body = {
    model: MODEL_MULTIMODAL,
    messages: [{ role: "user", content }],
    modalities: ["image", "text"],
  };
  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: gatewayHeaders(apiKey),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw gatewayError(text, res.status, "Multimodal");
  }
  const data = JSON.parse(text);
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) {
    const err: any = new Error("Multimodal gateway returned no image");
    err.status = 502;
    throw err;
  }
  return b64;
}

// Fallback: text-only OpenAI image gen at medium quality.
async function callTextOnly(prompt: string, size: string, apiKey: string): Promise<string> {
  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: gatewayHeaders(apiKey),
    body: JSON.stringify({
      model: MODEL_FALLBACK,
      prompt,
      size,
      quality: "medium",
      n: 1,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw gatewayError(text, res.status, "Fallback");
  }
  const data = JSON.parse(text);
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("Fallback gateway returned no image");
  return b64;
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
    const userFeedback = typeof body?.feedback === "string" ? body.feedback.slice(0, 600) : "";
    const platform = getPlatform(platformName);
    if (!platform) return json({ error: `Unknown platform: ${platformName}` }, 400);
    const asset = platform.assets.find((a) => a.kind === assetKind);
    if (!asset) return json({ error: `Unknown asset kind: ${assetKind}` }, 400);
    if (!ART_DIRECTIONS.some((d) => d.id === direction)) {
      return json({ error: `Unknown direction: ${direction}` }, 400);
    }

    const ctx = await loadVentureContext(admin, snapshotId);
    const { dataUrl: logoDataUrl, bytes: logoBytes } = await fetchPrimaryLogo(admin, kit);

    const isAvatar = asset.kind === "avatar";

    // --- Canvas plan: pre-decide exact surface/ink/accent/signature hexes ---
    let plan: CanvasPlan;
    if (isAvatar) {
      const ink = logoBytes ? logoDominantInk(logoBytes) : null;
      const { surface } = pickAvatarSurface(kit, ink);
      plan = {
        surface,
        ink: ink || "#0B0F19",
        accent: surface,
        signature: surface,
        signatureRole: "avatar-surface",
        signatureMinCoveragePct: 0,
        surfaceRole: "avatar-surface",
        forbiddenPairs: [],
      };
    } else {
      plan = buildCanvasPlan({ kit, asset, direction });
    }


    // --- Palette tile so the model SEES the only colors it may use ---
    let paletteTileDataUrl: string | null = null;
    try {
      paletteTileDataUrl = bytesToDataUrl(buildPaletteTilePngBytes(plan));
    } catch (e) {
      console.warn("palette tile build failed", e);
    }

    // Variation seed forces meaningful change on every regenerate, even when
    // feedback text is identical or empty (otherwise the prompt is byte-identical
    // and the model returns a near-duplicate image).
    const variationSeed = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;

    const buildPrompt = (retryNote?: string) =>
      isAvatar
        ? buildAvatarPrompt({
            platform: platform.label,
            asset,
            surfaceHex: plan.surface,
            userFeedback,
            retryNote,
            variationSeed,
          })
        : buildCoverArtPrompt({
            platform: platform.label,
            asset,
            direction,
            kit,
            ctx,
            plan,
            hasLogoImage: !!logoDataUrl,
            retryNote,
            userFeedback,
            variationSeed,
          });

    const generate = async (retryNote?: string) => {
      const prompt = buildPrompt(retryNote);
      const refs = [logoDataUrl, paletteTileDataUrl].filter(Boolean) as string[];
      try {
        if (refs.length) {
          const b64 = await callMultimodal(prompt, refs, apiKey);
          return { b64, modelUsed: MODEL_MULTIMODAL, prompt };
        }
        const b64 = await callTextOnly(prompt, asset.modelSize, apiKey);
        return { b64, modelUsed: MODEL_FALLBACK, prompt };
      } catch (e: any) {
        const status = e?.status;
        // Do not mask billing/auth/rate-limit errors by making a second fallback
        // request; preserve the real gateway message for the UI.
        if (refs.length && ![401, 402, 403, 429].includes(status)) {
          const b64 = await callTextOnly(prompt, asset.modelSize, apiKey);
          return { b64, modelUsed: MODEL_FALLBACK + " (multimodal fallback)", prompt };
        }
        throw e;
      }
    };

    let result: { b64: string; modelUsed: string; prompt: string };
    try {
      result = await generate();
    } catch (e: any) {
      const status = e?.status;
      const out: any = { error: e?.message ?? "Generation failed", upstreamStatus: status };
      if (status === 402) { out.code = "PAYMENT_REQUIRED"; out.reason = "ai_credits_exhausted"; }
      else if (status === 403 && e?.code === "credit_limit_reached") { out.code = "AI_CREDIT_LIMIT_REACHED"; out.reason = "workspace_credit_limit"; }
      else if (status === 429) { out.code = "RATE_LIMITED"; }
      else if (e?.code) { out.code = e.code; }
      if (e?.details) out.details = e.details;
      return json(out, 200);
    }

    // --- Post-gen contrast QA + one retry if it fails ---
    let bytes = b64ToBytes(result.b64);
    let qa = isAvatar ? { ok: true, reasons: [], observed: { dominantBg: plan.surface, dominantFg: plan.ink, ratio: 21 } } : runContrastQa(bytes, plan);
    if (!qa.ok) {
      console.warn("contrast QA failed, retrying once", qa.reasons);
      try {
        const sigNote = (qa.observed.signatureCoveragePct ?? 100) < plan.signatureMinCoveragePct
          ? ` The brand signature color ${plan.signature} was only ${qa.observed.signatureCoveragePct}% of the canvas — make it cover ≥${plan.signatureMinCoveragePct}% as a confident solid shape, sidebar, block, or duotone wash, NOT a hairline.`
          : "";
        const retryNote = `Your previous attempt produced ${qa.observed.dominantFg} on ${qa.observed.dominantBg} (only ${qa.observed.ratio}:1 contrast — illegible). Use ONLY surface=${plan.surface}, ink=${plan.ink}, signature=${plan.signature}, accent=${plan.accent}. Background must fill with ${plan.surface} exactly.${sigNote}`;
        const retry = await generate(retryNote);
        const retryBytes = b64ToBytes(retry.b64);
        const retryQa = runContrastQa(retryBytes, plan);
        // Keep retry if it's better, otherwise keep original.
        if (retryQa.observed.ratio > qa.observed.ratio) {
          bytes = retryBytes;
          qa = retryQa;
          result = retry;
        }
      } catch (e) {
        console.warn("QA retry failed", e);
      }
    }

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
        prompt_used: result.prompt,
        model_used: result.modelUsed,
        brand_kit_locked_at: kit.locked_at,
        is_selected: false,
        canvas_plan: plan as any,
        qa_status: qa.ok ? "pass" : "fail",
        qa_notes: qa as any,
        last_feedback: userFeedback || null,
        last_regenerated_at: userFeedback ? new Date().toISOString() : null,
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

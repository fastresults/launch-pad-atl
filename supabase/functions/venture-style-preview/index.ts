// Venture Style Preview — generates brand-aware preview thumbnails for
// Social Studio Step 4 "Pick a look". One thumbnail per art direction.
// Uses the same multimodal pipeline as venture-social-cover (logo + palette
// tile -> Gemini multimodal, OpenAI text-only fallback) so the previews
// look like what Step 5 will actually produce.

import { createClient } from "npm:@supabase/supabase-js@2";
import { loadVentureContext } from "../_shared/venture-context.ts";
import { ART_DIRECTIONS, type ArtDirectionId, type AssetSpec } from "../_shared/social-platform-specs.ts";
import { buildCoverArtPrompt } from "../_shared/cover-art-director.ts";
import { buildCanvasPlan, applyPaletteOverride, type CanvasPlan } from "../_shared/canvas-plan.ts";
import { buildPaletteTilePngBytes, bytesToDataUrl } from "../_shared/palette-tile.ts";
import { runContrastQa } from "../_shared/image-qa.ts";
import { compositeLogo, placementForAssetKind, normalizeLogoSize, readLogoAspect, logoSafeZone, type LogoSize } from "../_shared/logo-compositor.ts";
import { compositeSignatureSplash } from "../_shared/signature-compositor.ts";
import { fetchPrimaryLogoBitmap } from "../_shared/brand-logo-bitmap.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/images/generations";
const MODEL_MULTIMODAL = "google/gemini-3-pro-image";
const MODEL_FALLBACK = "openai/gpt-image-2";
const BUCKET = "user-media";
const SIGNED_TTL = 60 * 60 * 24 * 7;

// Synthetic asset spec used for preview tiles. Square, headline-led card.
const PREVIEW_ASSET: AssetSpec = {
  kind: "pinned_post",
  label: "Style preview",
  width: 1080,
  height: 1080,
  guidance: "square preview tile, focal headline upper portion, generous whitespace",
  modelSize: "1024x1024",
};

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

async function fetchPrimaryLogo(
  admin: any,
  kit: any,
): Promise<{ dataUrl: string | null; bytes: Uint8Array | null }> {
  // Shared loader — rasterises SVG marks so the logo is never silently dropped.
  const { dataUrl, bytes } = await fetchPrimaryLogoBitmap(admin, kit);
  return { dataUrl, bytes };
}


async function callMultimodal(prompt: string, imagesDataUrls: string[], apiKey: string): Promise<string> {
  const content: any[] = [{ type: "text", text: prompt }];
  for (const url of imagesDataUrls) if (url) content.push({ type: "image_url", image_url: { url } });
  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL_MULTIMODAL,
      messages: [{ role: "user", content }],
      modalities: ["image", "text"],
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw gatewayError(text, res.status, "Multimodal");
  }
  const data = JSON.parse(text);
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) { const e: any = new Error("Multimodal gateway returned no image"); e.status = 502; throw e; }
  return b64;
}

async function callTextOnly(prompt: string, size: string, apiKey: string): Promise<string> {
  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL_FALLBACK, prompt, size, quality: "medium", n: 1 }),
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

    const { data: snap } = await admin
      .from("venture_snapshots")
      .select("id, user_id")
      .eq("id", snapshotId)
      .maybeSingle();
    if (!snap || snap.user_id !== userId) return json({ error: "Forbidden" }, 403);

    if (action === "list") {
      const { data } = await admin
        .from("venture_style_previews")
        .select("*")
        .eq("snapshot_id", snapshotId);
      return json({ previews: data ?? [] });
    }

    if (action === "delete") {
      const direction = body?.direction as string | undefined;
      if (!direction) return json({ error: "direction required" }, 400);
      const { data: row } = await admin
        .from("venture_style_previews")
        .select("id, user_id, storage_path")
        .eq("snapshot_id", snapshotId)
        .eq("direction", direction)
        .maybeSingle();
      if (!row) return json({ ok: true });
      if (row.user_id !== userId) return json({ error: "Forbidden" }, 403);
      if (row.storage_path) {
        await admin.storage.from(BUCKET).remove([row.storage_path]).catch(() => {});
      }
      await admin.from("venture_style_previews").delete().eq("id", row.id);
      return json({ ok: true });
    }

    if (action !== "generate") return json({ error: `Unknown action: ${action}` }, 400);

    const { data: kit } = await admin
      .from("venture_brand_kits")
      .select("*")
      .eq("snapshot_id", snapshotId)
      .maybeSingle();
    if (!kit || kit.status !== "locked") {
      return json({ error: "Brand Wizard must be completed and locked.", code: "BRAND_NOT_LOCKED" }, 400);
    }

    const direction = String(body?.direction || "editorial") as ArtDirectionId;
    if (!ART_DIRECTIONS.some((d) => d.id === direction)) {
      return json({ error: `Unknown direction: ${direction}` }, 400);
    }
    const userFeedback = typeof body?.feedback === "string" ? body.feedback.slice(0, 600) : "";

    const signatureIntensity = (["subtle", "balanced", "bold"] as const).includes(body?.signatureIntensity)
      ? body.signatureIntensity
      : undefined;
    const signaturePlacement = (
      ["auto", "anchor_block", "sidebar_stripe", "duotone_wash", "focal_shape", "corner_mark", "framed_border"] as const
    ).includes(body?.signaturePlacement) ? body.signaturePlacement : undefined;
    const signatureMinCoveragePct = typeof body?.signatureMinCoveragePct === "number"
      ? body.signatureMinCoveragePct
      : undefined;
    const signatureCfg = (signatureIntensity || signaturePlacement || signatureMinCoveragePct !== undefined)
      ? { intensity: signatureIntensity, placement: signaturePlacement, minCoveragePct: signatureMinCoveragePct }
      : undefined;

    const paletteOverride = body?.paletteOverride && typeof body.paletteOverride === "object"
      ? {
          surface: body.paletteOverride.surface,
          ink: body.paletteOverride.ink,
          accent: body.paletteOverride.accent,
          signature: body.paletteOverride.signature,
        }
      : undefined;

    const rawHl = body?.headlineOverride;
    const headlineOverride =
      rawHl && typeof rawHl === "object" && ["auto", "custom", "none"].includes(rawHl.mode)
        ? {
            mode: rawHl.mode as "auto" | "custom" | "none",
            text: typeof rawHl.text === "string" ? rawHl.text.slice(0, 64) : undefined,
          }
        : undefined;
    console.log("[style-preview] headline override:", JSON.stringify(headlineOverride ?? null));

    const logoSize: LogoSize = normalizeLogoSize(body?.logoSize);
    console.log("[style-preview] logo size:", logoSize);


    const ctx = await loadVentureContext(admin, snapshotId);
    const { dataUrl: logoDataUrl, bytes: logoBytes } = await fetchPrimaryLogo(admin, kit);

    let plan: CanvasPlan = buildCanvasPlan({ kit, asset: PREVIEW_ASSET, direction, signature: signatureCfg });
    plan = applyPaletteOverride(plan, paletteOverride);

    const logoAspect = (await readLogoAspect(logoBytes)) ?? 1;
    const logoPlacement = placementForAssetKind(PREVIEW_ASSET.kind);
    const logoZoneHint = logoSafeZone(logoPlacement, logoSize, logoAspect, PREVIEW_ASSET.width, PREVIEW_ASSET.height);

    let paletteTileDataUrl: string | null = null;
    try { paletteTileDataUrl = bytesToDataUrl(buildPaletteTilePngBytes(plan)); }
    catch (e) { console.warn("palette tile failed", e); }

    const buildPrompt = (retryNote?: string) =>
      buildCoverArtPrompt({
        platform: "Style preview",
        asset: PREVIEW_ASSET,
        direction,
        kit,
        ctx,
        plan,
        hasLogoImage: !!logoDataUrl,
        retryNote,
        userFeedback,
        headlineOverride,
        logoZone: logoZoneHint,
      });

    const generate = async (retryNote?: string) => {
      const prompt = buildPrompt(retryNote);
      const refs = [logoDataUrl, paletteTileDataUrl].filter(Boolean) as string[];
      try {
        if (refs.length) {
          const b64 = await callMultimodal(prompt, refs, apiKey);
          return { b64, modelUsed: MODEL_MULTIMODAL, prompt };
        }
        const b64 = await callTextOnly(prompt, PREVIEW_ASSET.modelSize, apiKey);
        return { b64, modelUsed: MODEL_FALLBACK, prompt };
      } catch (e: any) {
        const status = e?.status;
        if (refs.length && ![401, 402, 403, 429].includes(status)) {
          const b64 = await callTextOnly(prompt, PREVIEW_ASSET.modelSize, apiKey);
          return { b64, modelUsed: MODEL_FALLBACK + " (multimodal fallback)", prompt };
        }
        throw e;
      }
    };

    let result: { b64: string; modelUsed: string; prompt: string };
    try {
      result = await generate();
    } catch (e: any) {
      const out: any = { error: e?.message ?? "Generation failed", upstreamStatus: e?.status };
      if (e?.status === 402) { out.code = "PAYMENT_REQUIRED"; out.reason = "ai_credits_exhausted"; }
      else if (e?.status === 403 && e?.code === "credit_limit_reached") { out.code = "AI_CREDIT_LIMIT_REACHED"; out.reason = "workspace_credit_limit"; }
      else if (e?.status === 429) { out.code = "RATE_LIMITED"; }
      else if (e?.code) { out.code = e.code; }
      if (e?.details) out.details = e.details;
      return json(out, 200);
    }

    let bytes = b64ToBytes(result.b64);
    let qa = runContrastQa(bytes, plan);
    if (!qa.ok) {
      try {
        const sigVisible = qa.observed.signatureVisible !== false;
        const sigNote = !sigVisible
          ? ` CRITICAL: no perceptible ${plan.displaySignature} pixels in the previous render — image read as black-and-white. Add a confident ${plan.displaySignature} block, sidebar, or duotone wash covering ≥${plan.signatureMinCoveragePct}% of the canvas, using the exact hex.`
          : (qa.observed.signatureCoveragePct ?? 100) < plan.signatureMinCoveragePct
          ? ` Signature ${plan.displaySignature} only covered ${qa.observed.signatureCoveragePct}% — make it cover ≥${plan.signatureMinCoveragePct}% as a confident block/sidebar/wash, NOT a hairline.`
          : "";
        const retryNote = `Previous attempt: ${qa.observed.dominantFg} on ${qa.observed.dominantBg} (${qa.observed.ratio}:1). Use ONLY surface=${plan.surface}, ink=${plan.ink}, signature=${plan.displaySignature}, accent=${plan.accent}. Fill background with ${plan.surface} exactly.${sigNote}`;
        const retry = await generate(retryNote);
        const retryBytes = b64ToBytes(retry.b64);
        const retryQa = runContrastQa(retryBytes, plan);
        const retryBetter =
          (retryQa.observed.signatureVisible && !sigVisible) ||
          (retryQa.observed.signatureCoveragePct ?? 0) > (qa.observed.signatureCoveragePct ?? 0) ||
          retryQa.observed.ratio > qa.observed.ratio;
        if (retryBetter) {
          bytes = retryBytes; qa = retryQa; result = retry;
        }
      } catch (e) { console.warn("QA retry failed", e); }
    }

    const minPct = (plan.signatureMinCoveragePct ?? 12) * 0.75;
    const signatureMissing = qa.observed.signatureVisible === false ||
      ((qa.observed.signatureCoveragePct ?? 0) < minPct);
    if (signatureMissing) {
      bytes = compositeSignatureSplash(bytes, plan);
      qa = runContrastQa(bytes, plan);
      (qa as any).signature_composited = true;
    } else {
      (qa as any).signature_composited = false;
    }

    // Guaranteed logo placement on the preview tile.
    let logoComposited = false;
    if (logoBytes) {
      try {
        bytes = await compositeLogo(bytes, logoBytes, {
          placement: logoPlacement,
          surfaceHex: plan.surface,
          inkHex: plan.ink,
          logoSize,
        });
        logoComposited = true;
      } catch (e) {
        console.warn("style preview logo composite failed", e);
      }
    }
    (qa as any).logo_composited = logoComposited;
    (qa as any).logo_size = logoSize;



    // Delete previous storage object if any (we upsert one preview per direction).
    const { data: existing } = await admin
      .from("venture_style_previews")
      .select("id, storage_path")
      .eq("snapshot_id", snapshotId)
      .eq("direction", direction)
      .maybeSingle();
    if (existing?.storage_path) {
      await admin.storage.from(BUCKET).remove([existing.storage_path]).catch(() => {});
    }

    const fileId = crypto.randomUUID();
    const storagePath = `style-preview/${userId}/${snapshotId}/${direction}-${fileId}.png`;
    const { error: upErr } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, bytes, { contentType: "image/png", upsert: false });
    if (upErr) throw upErr;

    const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(storagePath, SIGNED_TTL);
    const expiresAt = new Date(Date.now() + SIGNED_TTL * 1000).toISOString();

    const row = {
      snapshot_id: snapshotId,
      user_id: userId,
      direction,
      storage_path: storagePath,
      signed_url: signed?.signedUrl ?? null,
      signed_url_expires_at: expiresAt,
      canvas_plan: plan as any,
      qa_status: qa.ok ? "pass" : "fail",
      qa_notes: qa as any,
      prompt_used: result.prompt,
      model_used: result.modelUsed,
      last_feedback: userFeedback || null,
      last_headline: headlineOverride
        ? (headlineOverride.mode === "none" ? "" : (headlineOverride.text ?? null))
        : null,
      last_logo_size: logoSize,
      brand_kit_locked_at: kit.locked_at,
      updated_at: new Date().toISOString(),
    };

    const { data: saved, error: insErr } = await admin
      .from("venture_style_previews")
      .upsert(row, { onConflict: "snapshot_id,direction" })
      .select()
      .single();
    if (insErr) throw insErr;

    return json({ preview: saved });
  } catch (e) {
    console.error("venture-style-preview error", e);
    return json({ error: (e as Error).message ?? "Internal error" }, 500);
  }
});

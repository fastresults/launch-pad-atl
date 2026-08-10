// Venture Social Cover — gated, agency-grade per-platform cover art generator.
// Hard-requires a LOCKED Brand Kit. Generates logo-aware avatars and covers
// using Gemini multimodal (logo + palette/type tiles as image input) with an
// OpenAI text-only fallback.

import { createClient } from "npm:@supabase/supabase-js@2";
import { capacityProvider } from "../_shared/capacity-error.ts";
import { loadVentureContext } from "../_shared/venture-context.ts";
import {
  getPlatform,
  ART_DIRECTIONS,
  type ArtDirectionId,
  type AssetKind,
  type AssetSpec,
} from "../_shared/social-platform-specs.ts";
import { buildCoverArtPrompt, buildAvatarPrompt, resolveSceneDirective, type SceneDirective } from "../_shared/cover-art-director.ts";
import { ensureSceneBrief, checkSceneRelevance } from "../_shared/scene-brief.ts";

import { buildCanvasPlan, pickAvatarSurface, applyPaletteOverride, type CanvasPlan } from "../_shared/canvas-plan.ts";
import { buildPaletteTilePngBytes, bytesToDataUrl } from "../_shared/palette-tile.ts";
import { runContrastQa, logoDominantInk } from "../_shared/image-qa.ts";
import { compositeLogo, placementForAssetKind, normalizeLogoSize, readLogoAspect, logoSafeZone, type LogoSize } from "../_shared/logo-compositor.ts";
import { compositeSignatureSplash } from "../_shared/signature-compositor.ts";
import { fetchPrimaryLogoBitmap } from "../_shared/brand-logo-bitmap.ts";
import { replaceSupersededAssets } from "../_shared/replace-asset.ts";
import { compositeHeadline, type AdAspect } from "../_shared/headline-compositor.ts";
import { PNG } from "npm:pngjs@7.0.0";

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

// Flat single-color PNG — used for deterministic avatars (brand surface, then
// the real logo composited on top).
function solidPngBytes(width: number, height: number, hex: string): Uint8Array {
  const h = String(hex || "#0B0F19").replace("#", "");
  const ok = /^[0-9a-fA-F]{6}$/.test(h) ? h : "0B0F19";
  const r = parseInt(ok.slice(0, 2), 16);
  const g = parseInt(ok.slice(2, 4), 16);
  const b = parseInt(ok.slice(4, 6), 16);
  const png = new PNG({ width, height });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = r; png.data[i + 1] = g; png.data[i + 2] = b; png.data[i + 3] = 255;
  }
  return new Uint8Array(PNG.sync.write(png));
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

// Brand-kit primary logo as a bitmap the model + compositor can both read.
// SVG marks (what Logo Studio saves) are rasterised on demand by the shared
// helper, so covers are never generated blind to the brand mark.
export type { LogoSkipReason } from "../_shared/brand-logo-bitmap.ts";

async function fetchPrimaryLogo(admin: any, kit: any) {
  return await fetchPrimaryLogoBitmap(admin, kit);
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

// Fallback: text-only OpenAI image gen. This path CANNOT see the logo or the
// palette tile, so the caller appends an inline palette description and we run
// it at high quality — a fallback render still has to be shippable.
async function callTextOnly(prompt: string, size: string, apiKey: string): Promise<string> {
  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: gatewayHeaders(apiKey),
    body: JSON.stringify({
      model: MODEL_FALLBACK,
      prompt,
      size,
      quality: "high",
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

    // Admin impersonation support
    const { data: adminRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "super_admin"]);
    const isAdmin = (adminRoles ?? []).length > 0;

    // Snapshot ownership
    const { data: snap } = await admin
      .from("venture_snapshots")
      .select("id, user_id")
      .eq("id", snapshotId)
      .maybeSingle();
    if (!snap || (snap.user_id !== userId && !isAdmin)) return json({ error: "Forbidden" }, 403);
    const ownerId = snap.user_id as string;

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
      if (!row || row.user_id !== ownerId && !isAdmin) return json({ error: "Not found" }, 404);
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
      if (!row || row.user_id !== ownerId && !isAdmin) return json({ error: "Not found" }, 404);
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

    // Configurable brand-signature rules (palette-agnostic — works for any brand color).
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

    // Optional per-generation palette override (from Regenerate/Generate modal swatches).
    const paletteOverride = body?.paletteOverride && typeof body.paletteOverride === "object"
      ? {
          surface: body.paletteOverride.surface,
          ink: body.paletteOverride.ink,
          accent: body.paletteOverride.accent,
          signature: body.paletteOverride.signature,
        }
      : undefined;

    // Optional headline override: { mode: "auto"|"custom"|"none", text? }
    const rawHl = body?.headlineOverride;
    const headlineOverride =
      rawHl && typeof rawHl === "object" && ["auto", "custom", "none"].includes(rawHl.mode)
        ? {
            mode: rawHl.mode as "auto" | "custom" | "none",
            text: typeof rawHl.text === "string" ? rawHl.text.slice(0, 64) : undefined,
          }
        : undefined;
    console.log("[social-cover] headline override:", JSON.stringify(headlineOverride ?? null));

    // Optional logo size preference: 'sm' | 'md' | 'lg' — governs both the
    // reserved-zone dimensions in the prompt AND the compositor chip size.
    const logoSize: LogoSize = normalizeLogoSize(body?.logoSize);
    console.log("[social-cover] logo size:", logoSize);


    const platform = getPlatform(platformName);
    if (!platform) return json({ error: `Unknown platform: ${platformName}` }, 400);
    const asset = platform.assets.find((a) => a.kind === assetKind);
    if (!asset) return json({ error: `Unknown asset kind: ${assetKind}` }, 400);
    if (!ART_DIRECTIONS.some((d) => d.id === direction)) {
      return json({ error: `Unknown direction: ${direction}` }, 400);
    }

    const ctx = await loadVentureContext(admin, snapshotId);

    // Venture-specific scene brief: what THIS business actually looks like at
    // work. Derived once from the venture brain and cached on the snapshot.
    const sceneOverride = typeof body?.sceneOverride === "string" ? body.sceneOverride.slice(0, 400) : "";
    const refreshScenes = body?.refreshScenes === true;
    let sceneBrief: any = null;
    try {
      sceneBrief = await ensureSceneBrief(admin, snapshotId, ctx, { force: refreshScenes });
    } catch (e) {
      console.warn("[social-cover] scene brief unavailable", e);
    }
    if (sceneBrief) (ctx as any).sceneBrief = sceneBrief;

    const { dataUrl: logoDataUrl, bytes: logoBytes, svgText: logoSvgText, skipReason: logoSkipReason } = await fetchPrimaryLogo(admin, kit);


    const isAvatar = asset.kind === "avatar";

    // An avatar without the mark is just a colored square — never ship one
    // silently. Covers still generate (the logo is composited afterwards), but
    // the avatar IS the logo, so a missing mark is a hard failure.
    if (isAvatar && !logoBytes) {
      return json({
        error:
          "Your brand logo could not be loaded, so the avatar would be a blank square. Re-save the mark in Logo Studio, then try again.",
        code: "LOGO_UNAVAILABLE",
        reason: logoSkipReason,
      }, 400);
    }


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
        displaySignature: surface,
        signatureRole: "avatar-surface",
        signatureMinCoveragePct: 0,
        signatureIntensity: "balanced",
        signaturePlacement: "auto",
        signaturePlacementBrief: "",
        surfaceRole: "avatar-surface",
        forbiddenPairs: [],
      };
    } else {
      plan = buildCanvasPlan({ kit, asset, direction, signature: signatureCfg });
    }
    plan = applyPaletteOverride(plan, paletteOverride);

    // Aspect-aware logo safe zone hint for the prompt (must match compositor).
    const logoAspect = (await readLogoAspect(logoBytes)) ?? 1;
    const logoPlacement = placementForAssetKind(asset.kind);
    // No reserved zone is requested from the model any more — asking for one is
    // what produced the painted plate behind the mark. The compositor owns the
    // logo pixels; the prompt only asks for a quiet corner.
    const logoZoneHint = undefined;
    void logoAspect;
    void logoSafeZone;

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

    // Server-rendered headline: the model paints ZERO glyphs and reserves the
    // top band; we typeset the founder's headline afterwards in real type.
    // This is the only way to guarantee correct spelling.
    const serverHeadline =
      !isAvatar && headlineOverride?.mode === "custom" && (headlineOverride.text ?? "").trim()
        ? (headlineOverride.text ?? "").trim()
        : "";

    // Resolve the scene ONCE so the prompt, the QA pass and the UI all agree
    // on which scene was commissioned.
    const scene: SceneDirective | undefined = isAvatar
      ? undefined
      : resolveSceneDirective(ctx, {
          discriminator: `${asset.kind}|${platform.id ?? platform.label}|${variationSeed}`,
          assetNotes: userFeedback || null,
          override: sceneOverride || null,
        });

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
            headlineOverride,
            logoZone: logoZoneHint,
            scene,
            serverRenderedHeadline: true,
          });


    // The text-only fallback never sees the palette tile or the logo, so spell
    // the palette out inline for that path.
    const inlinePalette = [
      "",
      "## Palette (no reference images available on this path — obey these hexes literally)",
      `- Background surface: ${plan.surface}`,
      `- Ink / marks: ${plan.ink}`,
      `- Signature brand color (must be a confident visible shape): ${plan.displaySignature}`,
      `- Accent, used sparingly: ${plan.accent}`,
      "- Use no other colors. No gradients between them. Zero lettering of any kind.",
      "",
    ].join("\n");

    let usedFallback = false;

    const generate = async (retryNote?: string) => {
      const prompt = buildPrompt(retryNote);
      const refs = [logoDataUrl, paletteTileDataUrl].filter(Boolean) as string[];
      const runFallback = async () => {
        usedFallback = true;
        return await callTextOnly(prompt + inlinePalette, asset.modelSize, apiKey);
      };
      try {
        if (refs.length) {
          try {
            const b64 = await callMultimodal(prompt, refs, apiKey);
            return { b64, modelUsed: MODEL_MULTIMODAL, prompt };
          } catch (e: any) {
            const status = e?.status;
            // One retry on a transient upstream failure before dropping to the
            // blind, lower-fidelity fallback model.
            if ([401, 402, 403, 429].includes(status)) throw e;
            console.warn("[social-cover] multimodal failed, retrying once", status, e?.message);
            const b64 = await callMultimodal(prompt, refs, apiKey);
            return { b64, modelUsed: MODEL_MULTIMODAL + " (retry)", prompt };
          }
        }
        const b64 = await runFallback();
        return { b64, modelUsed: MODEL_FALLBACK, prompt };
      } catch (e: any) {
        const status = e?.status;
        // Do not mask billing/auth/rate-limit errors by making a second fallback
        // request; preserve the real gateway message for the UI.
        if (refs.length && ![401, 402, 403, 429].includes(status)) {
          const b64 = await runFallback();
          return { b64, modelUsed: MODEL_FALLBACK + " (multimodal fallback)", prompt };
        }
        throw e;
      }
    };

    let result: { b64: string; modelUsed: string; prompt: string };
    try {
      if (isAvatar) {
        // Avatars are deterministic: a flat brand surface plus the real mark,
        // composited below. No model call — nothing for it to get wrong.
        result = {
          b64: bytesToB64(solidPngBytes(asset.width, asset.height, plan.surface)),
          modelUsed: "deterministic (flat brand surface + composited mark)",
          prompt: buildPrompt(),
        };
      } else {
        result = await generate();
      }
    } catch (e: any) {
      const status = e?.status;
      const out: any = { error: e?.message ?? "Generation failed", upstreamStatus: status };
      if (status === 402) { out.code = "PAYMENT_REQUIRED"; out.reason = "ai_credits_exhausted"; }
      else if (status === 403 && e?.code === "credit_limit_reached") { out.code = "AI_CREDIT_LIMIT_REACHED"; out.reason = "workspace_credit_limit"; }
      else if (status === 429) { out.code = "RATE_LIMITED"; }
      else if (e?.code) { out.code = e.code; }
      if (e?.details) out.details = e.details;
      if (out.code === "PAYMENT_REQUIRED" || out.code === "AI_CREDIT_LIMIT_REACHED" || out.code === "RATE_LIMITED") {
        out.providers = [
          out.code === "AI_CREDIT_LIMIT_REACHED"
            ? capacityProvider("lovable", "image generation")
            : capacityProvider(e?.model ?? result?.modelUsed ?? null, "image generation"),
        ];
      }
      return json(out, 200);
    }

    // --- Post-gen contrast QA + one retry if it fails ---
    let bytes = b64ToBytes(result.b64);
    let qa = isAvatar ? { ok: true, reasons: [], observed: { dominantBg: plan.surface, dominantFg: plan.ink, ratio: 21 } } : runContrastQa(bytes, plan);
    if (!qa.ok) {
      console.warn("contrast QA failed, retrying once", qa.reasons);
      try {
        const sigVisible = qa.observed.signatureVisible !== false;
        const sigNote = !sigVisible
          ? ` CRITICAL: the previous render contained NO perceptible ${plan.displaySignature} pixels — the entire image read as black-and-white or neutral. You MUST add a confident ${plan.displaySignature} block, full-bleed sidebar, large flat shape, or duotone wash covering ≥${plan.signatureMinCoveragePct}% of the canvas. Use the exact hex ${plan.displaySignature}, do not darken or desaturate it.`
          : (qa.observed.signatureCoveragePct ?? 100) < plan.signatureMinCoveragePct
          ? ` The brand signature color ${plan.displaySignature} was only ${qa.observed.signatureCoveragePct}% of the canvas — make it cover ≥${plan.signatureMinCoveragePct}% as a confident solid shape, sidebar, block, or duotone wash, NOT a hairline.`
          : "";
        const retryNote = `Your previous attempt produced ${qa.observed.dominantFg} on ${qa.observed.dominantBg} (only ${qa.observed.ratio}:1 contrast — illegible). Use ONLY surface=${plan.surface}, ink=${plan.ink}, signature=${plan.displaySignature}, accent=${plan.accent}. Background must fill with ${plan.surface} exactly.${sigNote}`;
        const retry = await generate(retryNote);
        const retryBytes = b64ToBytes(retry.b64);
        const retryQa = runContrastQa(retryBytes, plan);
        const currentSig = qa.observed.signatureCoveragePct ?? 0;
        const retrySig = retryQa.observed.signatureCoveragePct ?? 0;
        // Prefer the retry when it improves the signature color first, then contrast.
        const retryBetter =
          (retryQa.observed.signatureVisible && !sigVisible) ||
          retrySig > currentSig ||
          retryQa.observed.ratio > qa.observed.ratio;
        if (retryBetter) {
          bytes = retryBytes;
          qa = retryQa;
          result = retry;
        }
      } catch (e) {
        console.warn("QA retry failed", e);
      }
    }

    // Prompts are advisory; the brand signature splash must be visible in pixels.
    // If generation/retry still missed it, force a deterministic brand-color element.
    if (!isAvatar) {
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
    }

    // --- Relevance QA: does the frame actually depict the commissioned scene
    // for this line of work? One corrective retry, then ship the better of the two.
    if (scene) {
      (qa as any).scene = {
        depict: scene.depict,
        setting: scene.setting,
        camera: scene.camera,
        composition: scene.composition,
        source: sceneOverride ? "founder_override" : (sceneBrief ? "venture_brief" : "library_fallback"),
      };
      const businessLine = sceneBrief?.business_line
        || [ctx?.snap?.sub_industry, ctx?.snap?.industry].filter(Boolean).join(" / ")
        || "this venture";
      try {
        const rel = await checkSceneRelevance({
          pngB64: bytesToB64(bytes),
          depict: scene.depict,
          businessLine,
        });
        (qa as any).scene_relevant = rel.ok;
        if (!rel.ok) {
          console.warn("[social-cover] scene relevance failed:", rel.note);
          const retry = await generate(
            `${rel.note} Rebuild the frame around the SCENE DIRECTIVE exactly: ${scene.depict} Setting: ${scene.setting}. It must be unmistakably about ${businessLine}.`,
          );
          const retryBytes = b64ToBytes(retry.b64);
          const retryRel = await checkSceneRelevance({
            pngB64: retry.b64,
            depict: scene.depict,
            businessLine,
          });
          const retryQa = runContrastQa(retryBytes, plan);
          if (retryRel.ok && retryQa.observed.ratio >= qa.observed.ratio * 0.8) {
            bytes = retryBytes;
            result = retry;
            qa = retryQa;
            if (!isAvatar) {
              const minPct2 = (plan.signatureMinCoveragePct ?? 12) * 0.75;
              if (qa.observed.signatureVisible === false || (qa.observed.signatureCoveragePct ?? 0) < minPct2) {
                bytes = compositeSignatureSplash(bytes, plan);
                qa = runContrastQa(bytes, plan);
                (qa as any).signature_composited = true;
              }
            }
            (qa as any).scene = {
              depict: scene.depict,
              setting: scene.setting,
              camera: scene.camera,
              composition: scene.composition,
              source: sceneOverride ? "founder_override" : (sceneBrief ? "venture_brief" : "library_fallback"),
            };
            (qa as any).scene_relevant = true;
            (qa as any).scene_retried = true;
          } else {
            (qa as any).scene_retried = true;
            (qa as any).scene_note = rel.note;
          }
        }
      } catch (e) {
        console.warn("[social-cover] relevance QA skipped", e);
      }
    }



    // --- Guaranteed logo placement: composite the user's actual brand mark
    // into the reserved zone (or center, for avatars). The model only paints
    // a clean negative-space chip; we own the final logo pixels.
    let logoComposited = false;
    if (logoBytes) {
      try {
        const res = await compositeLogo(bytes, logoBytes, {
          placement: logoPlacement,
          surfaceHex: plan.surface,
          inkHex: plan.ink,
          logoSize,
          svgText: logoSvgText,
        });
        bytes = res.bytes;
        logoComposited = true;
        (qa as any).logo_contrast = Number(res.contrast.toFixed(2));
        (qa as any).logo_ink = res.inkHex;
        (qa as any).logo_scrim = res.scrim;
      } catch (e) {
        console.warn("logo composite failed, shipping un-composited image", e);
      }
    }
    (qa as any).logo_composited = logoComposited;
    (qa as any).logo_size = logoSize;
    if (!logoComposited && logoSkipReason) (qa as any).logo_skipped = logoSkipReason;
    (qa as any).used_fallback = usedFallback;

    // --- Server-rendered headline: real typography, correctly spelled.
    if (serverHeadline) {
      try {
        const aspect: AdAspect = asset.height > asset.width ? "4:5" : "1:1";
        const withText = await compositeHeadline(bytes, plan, aspect, serverHeadline);
        const changed = withText !== bytes;
        bytes = withText;
        (qa as any).headline_composited = changed;
      } catch (e) {
        console.warn("headline composite failed", e);
        (qa as any).headline_composited = false;
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
        user_id: ownerId,
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
        last_headline: headlineOverride
          ? (headlineOverride.mode === "none" ? "" : (headlineOverride.text ?? null))
          : null,
        last_logo_size: logoSize,
      })
      .select()
      .single();
    if (insErr) throw insErr;

    // Regenerate means replace: drop every earlier cover in this slot.
    const superseded = await replaceSupersededAssets({
      admin,
      bucket: BUCKET,
      table: "venture_social_assets",
      match: { snapshot_id: snapshotId, platform: platform.platform, asset_kind: asset.kind },
      keepId: row.id,
    });
    let finalRow = row;
    if (superseded.wasSelected) {
      const { data: reselected } = await admin
        .from("venture_social_assets")
        .update({ is_selected: true })
        .eq("id", row.id)
        .select()
        .single();
      if (reselected) finalRow = reselected;
    }

    return json({ asset: finalRow });
  } catch (e) {
    console.error("venture-social-cover error", e);
    return json({ error: (e as Error).message ?? "Internal error" }, 500);
  }
});

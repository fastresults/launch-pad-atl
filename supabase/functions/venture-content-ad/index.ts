// Venture Content Ad — generates 1:1 / 4:5 / 9:16 social ads for a specific
// post from the parsed 90-day content calendar. Mirrors venture-social-cover
// architecture (brand-gated, canvas plan + palette tile + logo composite +
// contrast + signature-splash retry), but keyed by (post_id, aspect) instead
// of (platform, asset_kind).

import { createClient } from "npm:@supabase/supabase-js@2";
import { loadVentureContext } from "../_shared/venture-context.ts";
import { buildCanvasPlan, applyPaletteOverride, type CanvasPlan } from "../_shared/canvas-plan.ts";
import { buildPaletteTilePngBytes, bytesToDataUrl } from "../_shared/palette-tile.ts";
import { runContrastQa } from "../_shared/image-qa.ts";
import { placementForAssetKind, normalizeLogoSize, readLogoAspect, logoSafeZone, type LogoSize } from "../_shared/logo-compositor.ts";
import { compositeSignatureSplash } from "../_shared/signature-compositor.ts";
import { buildContentAdPrompt, specForAspect, resolveAdHeadline, type AdAspect } from "../_shared/content-ad-director.ts";
import { buildContentAdSvgBytes, type PosterLayout } from "../_shared/content-ad-svg.ts";
import { buildPosterCopy } from "../_shared/poster-copy.ts";
import { ART_DIRECTIONS, type ArtDirectionId } from "../_shared/social-platform-specs.ts";
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function gwHeaders(k: string) {
  return { Authorization: `Bearer ${k}`, "Content-Type": "application/json" };
}

function gatewayError(text: string, status: number, label: string) {
  let parsed: any = {};
  try { parsed = JSON.parse(text); } catch { /* non-json */ }
  const msg = parsed?.error?.message || parsed?.message || parsed?.details || `${label} gateway error (${status})`;
  const err: any = new Error(msg);
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
  for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(s);
}
function mimeFromPath(p: string): string {
  const ext = (p.split(".").pop() || "").toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "svg") return "image/svg+xml";
  return "image/png";
}

async function fetchPrimaryLogo(admin: any, kit: any) {
  // Shared loader — rasterises SVG marks so the logo is never silently dropped.
  // svgText is kept so the poster compositor can re-render the mark as vector
  // ink (no plate, recolored for contrast).
  const { dataUrl, bytes, svgText } = await fetchPrimaryLogoBitmap(admin, kit);
  return { dataUrl, bytes, svgText };
}



// Per-call timeout so a hung upstream doesn't idle the whole 150s request.
// gemini-3-pro-image can take 60–90s; cap at 110s to leave headroom for
// composite/upload work before Deno's 150s idle limit trips.
const GATEWAY_TIMEOUT_MS = 110_000;

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (e: any) {
    if (e?.name === "AbortError") {
      const err: any = new Error(`Image generation timed out after ${Math.round(timeoutMs / 1000)}s`);
      err.status = 504;
      err.code = "UPSTREAM_TIMEOUT";
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}

async function callMultimodal(prompt: string, imagesDataUrls: string[], apiKey: string) {
  const content: any[] = [{ type: "text", text: prompt }];
  for (const url of imagesDataUrls) if (url) content.push({ type: "image_url", image_url: { url } });
  const body = { model: MODEL_MULTIMODAL, messages: [{ role: "user", content }], modalities: ["image", "text"] };
  const res = await fetchWithTimeout(AI_GATEWAY, { method: "POST", headers: gwHeaders(apiKey), body: JSON.stringify(body) }, GATEWAY_TIMEOUT_MS);
  const text = await res.text();
  if (!res.ok) throw gatewayError(text, res.status, "Multimodal");
  const data = JSON.parse(text);
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) { const e: any = new Error("Multimodal gateway returned no image"); e.status = 502; throw e; }
  return b64 as string;
}

async function callTextOnly(prompt: string, size: string, apiKey: string) {
  const res = await fetchWithTimeout(AI_GATEWAY, {
    method: "POST", headers: gwHeaders(apiKey),
    body: JSON.stringify({ model: MODEL_FALLBACK, prompt, size, quality: "medium", n: 1 }),
  }, GATEWAY_TIMEOUT_MS);
  const text = await res.text();
  if (!res.ok) throw gatewayError(text, res.status, "Fallback");
  const data = JSON.parse(text);
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("Fallback gateway returned no image");
  return b64 as string;
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const startedAt = Date.now();
  const reqId = crypto.randomUUID().slice(0, 8);
  const step = (label: string, extra?: unknown) =>
    console.log(`[content-ad ${reqId}] +${Date.now() - startedAt}ms ${label}${extra === undefined ? "" : " " + JSON.stringify(extra)}`);

  try {
    const requestStartedAt = startedAt;
    step("request received");
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

    const { data: adminRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "super_admin"]);
    const isAdmin = (adminRoles ?? []).length > 0;

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
        .from("venture_content_ads")
        .select("*")
        .eq("snapshot_id", snapshotId)
        .order("created_at", { ascending: false });
      return json({ ads: data ?? [] });
    }

    // ---- DELETE ----
    if (action === "delete") {
      const adId = body?.adId as string;
      if (!adId) return json({ error: "adId required" }, 400);
      const { data: row } = await admin
        .from("venture_content_ads")
        .select("user_id, storage_path")
        .eq("id", adId)
        .maybeSingle();
      if (!row || row.user_id !== ownerId) return json({ error: "Not found" }, 404);
      if (row.storage_path) await admin.storage.from(BUCKET).remove([row.storage_path]).catch(() => {});
      await admin.from("venture_content_ads").delete().eq("id", adId);
      return json({ ok: true });
    }

    // ---- SELECT ----
    if (action === "select") {
      const adId = body?.adId as string;
      if (!adId) return json({ error: "adId required" }, 400);
      const { data: row } = await admin
        .from("venture_content_ads")
        .select("*")
        .eq("id", adId)
        .maybeSingle();
      if (!row || row.user_id !== ownerId) return json({ error: "Not found" }, 404);
      await admin
        .from("venture_content_ads")
        .update({ is_selected: false })
        .eq("snapshot_id", snapshotId)
        .eq("post_id", row.post_id)
        .eq("aspect", row.aspect);
      const { data: updated } = await admin
        .from("venture_content_ads")
        .update({ is_selected: true })
        .eq("id", adId)
        .select()
        .single();
      return json({ ad: updated });
    }

    // ---- GENERATE ----
    if (action !== "generate") return json({ error: `Unknown action: ${action}` }, 400);

    // HARD GATE: brand kit must be locked
    const { data: kit } = await admin
      .from("venture_brand_kits")
      .select("*")
      .eq("snapshot_id", snapshotId)
      .maybeSingle();
    if (!kit || kit.status !== "locked") {
      return json({
        error: "Brand Wizard must be completed and locked before generating content ads.",
        code: "BRAND_NOT_LOCKED",
      }, 400);
    }

    const postId = String(body?.postId || "");
    if (!postId) return json({ error: "postId required" }, 400);
    const aspect = (["1:1", "4:5", "9:16"] as const).includes(body?.aspect) ? body.aspect as AdAspect : "1:1";
    const direction = String(body?.direction || "editorial") as ArtDirectionId;
    if (!ART_DIRECTIONS.some((d) => d.id === direction)) return json({ error: `Unknown direction: ${direction}` }, 400);
    const posterLayout: PosterLayout = (["bottom-scrim", "centered-plate", "edge-rule"] as const).includes(body?.posterLayout)
      ? body.posterLayout
      : "bottom-scrim";

    const { data: post } = await admin
      .from("venture_content_calendar_posts")
      .select("*")
      .eq("id", postId)
      .maybeSingle();
    if (!post || post.user_id !== ownerId || post.snapshot_id !== snapshotId) {
      return json({ error: "Post not found in this venture" }, 404);
    }

    const userFeedback = typeof body?.feedback === "string" ? body.feedback.slice(0, 600) : "";
    const signatureIntensity = (["subtle", "balanced", "bold"] as const).includes(body?.signatureIntensity) ? body.signatureIntensity : undefined;
    const signaturePlacement = (["auto", "anchor_block", "sidebar_stripe", "duotone_wash", "focal_shape", "corner_mark", "framed_border"] as const).includes(body?.signaturePlacement) ? body.signaturePlacement : undefined;
    const signatureMinCoveragePct = typeof body?.signatureMinCoveragePct === "number" ? body.signatureMinCoveragePct : undefined;
    const signatureCfg = (signatureIntensity || signaturePlacement || signatureMinCoveragePct !== undefined)
      ? { intensity: signatureIntensity, placement: signaturePlacement, minCoveragePct: signatureMinCoveragePct }
      : undefined;

    const paletteOverride = body?.paletteOverride && typeof body.paletteOverride === "object"
      ? { surface: body.paletteOverride.surface, ink: body.paletteOverride.ink, accent: body.paletteOverride.accent, signature: body.paletteOverride.signature }
      : undefined;

    const rawHl = body?.headlineOverride;
    const stripTrailingEllipsis = (s: string) =>
      s.replace(/(?:\.{3}|…)+\s*$/g, "").replace(/[\s,;:\-–—]+$/g, "").trim();
    const headlineOverride = rawHl && typeof rawHl === "object" && ["auto", "custom", "none"].includes(rawHl.mode)
      ? {
          mode: rawHl.mode as "auto" | "custom" | "none",
          text: typeof rawHl.text === "string" ? stripTrailingEllipsis(rawHl.text).slice(0, 200) : undefined,
        }
      : undefined;

    // Content Studio: default to SMALL logo so the wordmark doesn't dominate
    // a square/portrait ad, and place it on the OPPOSITE corner from the
    // headline (headline anchors top-left in Editorial), unless the founder
    // has explicitly suppressed on-image text.
    const requestedLogoSize = body?.logoSize;
    const logoSize: LogoSize = requestedLogoSize
      ? normalizeLogoSize(requestedLogoSize)
      : "sm";
    const headlineSuppressed = headlineOverride?.mode === "none";
    const cornerOverride: "top-left" | "bottom-right" | undefined = headlineSuppressed
      ? undefined
      : "bottom-right";

    const asset = specForAspect(aspect);
    const ctx = await loadVentureContext(admin, snapshotId);
    step("venture context loaded");
    const { dataUrl: logoDataUrl, bytes: logoBytes, svgText: logoSvgText } = await fetchPrimaryLogo(admin, kit);
    step("logo loaded", { bytes: logoBytes?.byteLength ?? 0, svg: !!logoSvgText });

    let plan: CanvasPlan = buildCanvasPlan({ kit, asset, direction, signature: signatureCfg });
    plan = applyPaletteOverride(plan, paletteOverride);

    const logoAspect = (await readLogoAspect(logoBytes)) ?? 1;
    const logoPlacement = placementForAssetKind(asset.kind);
    const logoZoneHint = logoSafeZone(logoPlacement, logoSize, logoAspect, asset.width, asset.height, cornerOverride);

    let paletteTileDataUrl: string | null = null;
    try { paletteTileDataUrl = bytesToDataUrl(buildPaletteTilePngBytes(plan)); }
    catch (e) { console.warn("palette tile build failed", e); }


    const variationSeed = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;

    const buildPrompt = (retryNote?: string) => buildContentAdPrompt({
      aspect,
      direction,
      kit,
      ctx,
      plan,
      post: {
        id: post.id,
        pillar: post.pillar, platform: post.platform, format: post.format,
        hook: post.hook, body: post.body, cta: post.cta, asset_notes: post.asset_notes,
      },
      hasLogoImage: false, // logo is composited server-side, not sent to the model
      retryNote,
      userFeedback,
      variationSeed,
      headlineOverride,
      logoZone: logoZoneHint,
      // Headline is composited server-side by compositeHeadline() below; the
      // model must leave the top band as unmarked negative space.
      serverRenderedHeadline: true,
      posterLayout,
    });


    const generate = async (retryNote?: string) => {
      const prompt = buildPrompt(retryNote);
      // Intentionally OMIT the wordmark logo from multimodal refs: passing the
      // wordmark invites the image model to echo the brand text into the scene
      // (bottom band / signage / sticker), which then duplicates when our
      // compositor places the real logo on top. Palette tile is enough to lock
      // colors; the logo is composited after generation.
      const refs = [paletteTileDataUrl].filter(Boolean) as string[];
      try {
        if (refs.length) {
          const b64 = await callMultimodal(prompt, refs, apiKey);
          return { b64, modelUsed: MODEL_MULTIMODAL, prompt };
        }
        const b64 = await callTextOnly(prompt, asset.modelSize, apiKey);
        return { b64, modelUsed: MODEL_FALLBACK, prompt };

      } catch (e: any) {
        const status = e?.status;
        if (refs.length && ![401, 402, 403, 429].includes(status)) {
          const b64 = await callTextOnly(prompt, asset.modelSize, apiKey);
          return { b64, modelUsed: MODEL_FALLBACK + " (multimodal fallback)", prompt };
        }
        throw e;
      }
    };

    let result: { b64: string; modelUsed: string; prompt: string };
    step("image gateway call start");
    try { result = await generate(); }
    catch (e: any) {
      const status = e?.status;
      console.error(`[content-ad ${reqId}] gateway failed`, { name: e?.name, status, code: e?.code, message: e?.message });
      const out: any = { error: e?.message ?? "Generation failed", upstreamStatus: status };
      if (status === 402) { out.code = "PAYMENT_REQUIRED"; out.reason = "ai_credits_exhausted"; }
      else if (status === 403 && e?.code === "credit_limit_reached") { out.code = "AI_CREDIT_LIMIT_REACHED"; out.reason = "workspace_credit_limit"; }
      else if (status === 429) { out.code = "RATE_LIMITED"; }
      else if (status === 504 || e?.code === "UPSTREAM_TIMEOUT") { out.code = "UPSTREAM_TIMEOUT"; }
      else if (e?.code) { out.code = e.code; }
      if (e?.details) out.details = e.details;
      return json(out, 200);
    }
    step("image gateway call done", { model: result.modelUsed });

    let bytes = b64ToBytes(result.b64);
    let qa = runContrastQa(bytes, plan);
    step("contrast QA done", { ok: qa.ok, plateBytes: bytes.byteLength });
    // Skip the QA retry if we've already burned most of our 150s budget on the
    // first generation — a second slow call would push us past IDLE_TIMEOUT.
    // Reserve enough headroom for compositing, storage upload and signed URLs:
    // the poster pass (plate decode + vector ink + SVG) is CPU-heavy.
    const timeBudgetOkForRetry = (Date.now() - requestStartedAt) < 45_000;
    if (!qa.ok && timeBudgetOkForRetry) {
      try {
        const sigVisible = qa.observed.signatureVisible !== false;
        const sigNote = !sigVisible
          ? ` CRITICAL: previous render contained NO perceptible ${plan.displaySignature} pixels. You MUST add a confident ${plan.displaySignature} block, sidebar, or duotone wash covering ≥${plan.signatureMinCoveragePct}% of the canvas.`
          : (qa.observed.signatureCoveragePct ?? 100) < plan.signatureMinCoveragePct
          ? ` Brand signature ${plan.displaySignature} was only ${qa.observed.signatureCoveragePct}% of canvas — cover ≥${plan.signatureMinCoveragePct}% as a confident solid shape.`
          : "";
        const retryNote = `Previous attempt produced ${qa.observed.dominantFg} on ${qa.observed.dominantBg} (${qa.observed.ratio}:1 — illegible). Use ONLY surface=${plan.surface}, ink=${plan.ink}, signature=${plan.displaySignature}, accent=${plan.accent}.${sigNote}`;
        const retry = await generate(retryNote);
        const retryBytes = b64ToBytes(retry.b64);
        const retryQa = runContrastQa(retryBytes, plan);
        const currentSig = qa.observed.signatureCoveragePct ?? 0;
        const retrySig = retryQa.observed.signatureCoveragePct ?? 0;
        const retryBetter =
          (retryQa.observed.signatureVisible && !sigVisible) ||
          retrySig > currentSig ||
          retryQa.observed.ratio > qa.observed.ratio;
        if (retryBetter) { bytes = retryBytes; qa = retryQa; result = retry; }
        step("QA retry done", { used: retryBetter });
      } catch (e) { console.warn("QA retry failed", e); }
    }

    const minPct = (plan.signatureMinCoveragePct ?? 12) * 0.75;
    const signatureMissing = qa.observed.signatureVisible === false || ((qa.observed.signatureCoveragePct ?? 0) < minPct);
    if (signatureMissing) {
      bytes = compositeSignatureSplash(bytes, plan);
      qa = runContrastQa(bytes, plan);
      (qa as any).signature_composited = true;
      step("signature splash composited");
    }


    // ---- Editorial poster typography (server-side SVG overlay) ----
    // The model paints only the photographic plate; the kicker / display
    // headline / CTA lockup is typeset here in real brand fonts.
    const resolvedHeadline = resolveAdHeadline(post.hook, headlineOverride, aspect);
    const posterCopy = await buildPosterCopy({
      apiKey,
      brandName: ctx?.company_name ?? kit?.company_name ?? null,
      valueProp: ctx?.value_proposition ?? null,
      post: { hook: post.hook, body: post.body, cta: post.cta, pillar: post.pillar, platform: post.platform },
      headlineOverride: resolvedHeadline.mode === "none"
        ? { mode: "none" }
        : resolvedHeadline.mode === "custom"
        ? { mode: "custom", text: resolvedHeadline.text }
        : { mode: "auto" },
    });

    const headlineComposited = !!posterCopy.headline;
    const logoComposited = !!(logoSvgText || logoBytes || logoDataUrl);
    const platePngBytes = bytes;
    const poster = await buildContentAdSvgBytes({
      baseImageB64: bytesToB64(platePngBytes),
      basePngBytes: platePngBytes,
      baseMime: "image/png",
      width: asset.width,
      height: asset.height,
      plan,
      aspect,
      layout: posterLayout,
      kicker: posterCopy.kicker,
      headline: posterCopy.headline,
      ctaLine: posterCopy.ctaLine,
      logoDataUrl,
      logoSvgText,
      logoBytes,
      logoAspect,
      logoSize,
      // The compositor picks the quietest legal corner; bottom-right is only
      // the starting preference when the headline is suppressed.
      logoCorner: undefined,
    });
    bytes = poster.bytes;
    (qa as any).headline_composited = headlineComposited;
    (qa as any).logo_composited = logoComposited;
    (qa as any).logo_size = logoSize;
    (qa as any).poster_layout = posterLayout;
    (qa as any).poster_copy = posterCopy;
    Object.assign(qa as any, poster.metrics);



    const fileId = crypto.randomUUID();
    const safeAspect = aspect.replace(":", "x");
    const storagePath = `content-ad/${ownerId}/${snapshotId}/${post.week}/${postId}/${safeAspect}-${direction}-${fileId}.svg`;

    const { error: upErr } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, bytes, { contentType: "image/svg+xml", upsert: false });
    if (upErr) throw upErr;

    const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(storagePath, SIGNED_TTL);
    const expiresAt = new Date(Date.now() + SIGNED_TTL * 1000).toISOString();

    const { data: row, error: insErr } = await admin
      .from("venture_content_ads")
      .insert({
        snapshot_id: snapshotId,
        user_id: ownerId,
        post_id: postId,
        aspect,
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
        last_headline: posterCopy.headline || (resolvedHeadline.mode === "none" ? "" : post.hook ?? null),
        last_logo_size: logoSize,

      })
      .select()
      .single();
    if (insErr) throw insErr;

    return json({ ad: row });
  } catch (e) {
    console.error("venture-content-ad error", e);
    return json({ error: (e as Error).message ?? "Internal error" }, 500);
  }
});

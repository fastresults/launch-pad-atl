// Founders Hub — generate one venture document.
// Loads the snapshot + document_type spec + any dependency docs, asks the
// Lovable AI Gateway to produce markdown, scores it, and persists the row.
//
// Context flow (post AI-first refactor):
//   1. loadVentureContext()  — single read, shared with every AI function
//   2. compactPreamble()     — ~600-token venture preamble (replaces 8-12KB of raw JSON)
//   3. pickBrainSlice()      — only the brain keys this deliverable needs
//   4. distillDeps()         — upstream docs as 3-5 bullet summaries, not full markdown
//   5. writeBackIntake()     — intake answers flow into canonical store for future docs

import { createClient } from "npm:@supabase/supabase-js@2";
import { deriveIntakeAnswers, derivedIntakeBlock, type DerivedIntake } from "../_shared/intake-derive.ts";
import {
  BRAND_KIT_REQUIRED_TYPES,
  brandKitBlock,
  compactPreamble,
  distillDeps,
  isBrandKitUsable,
  loadBrandKit,
  loadVentureContext,
  pickBrainSlice,
} from "../_shared/venture-context.ts";
import { ensureBrandKit } from "../_shared/brand-derive.ts";

import { ensureSnapshotBrain, markSnapshotBrainDirty } from "../_shared/snapshot-brain.ts";
import { brainCorpusBlock } from "../_shared/brain-corpus.ts";
import { trackTone } from "../_shared/track-tones.ts";
import {
  BASE_SYSTEM_PROMPT,
  modelForTier,
  specializedPrompt,
  stripCitations,
} from "../_shared/deliverable-prompts.ts";
import { renderSourcingBlock } from "../_shared/sourcing-classifier.ts";
import { profileFor } from "../_shared/prompt-profiles.ts";
import { checkIdentity, correctionPrompt, substituteIdentity } from "../_shared/identity-guard.ts";
import { brandLogoUrl } from "../_shared/venture-context.ts";
import { archetypeForPrompt } from "../_shared/site-art-direction.ts";
import {
  brandFactsFromKit,
  enforceWebsitePrdDepth,
  expandWebsitePrdMasterPrompt,
  masterPromptStats,
  prdQualityMetrics,
  type PrdVentureFacts,
} from "../_shared/website-prd.ts";
import { aiFetch } from "../_shared/ai-fetch.ts";
import { jsonResponse, requireSnapshotOwner, requireUser } from "../_shared/auth.ts";

const MAX_USER_PROMPT_CHARS = 120_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;


// Intake → canonical writeback map. When a deliverable's intake collects one
// of these fields, persist it back to attendee_profiles / brief tables so the
// next deliverable's intake (and the Profile page) reuses it automatically.
const INTAKE_TO_PROFILE: Record<string, string> = {
  monthly_burn: "monthly_burn",
  current_revenue: "current_revenue",
  funding_raised: "funding_raised",
  runway_months: "runway_months",
  business_model: "business_model",
  target_market: "target_market",
  target_customer: "target_market",
  problem_solved: "problem_solved",
  primary_goal: "primary_goal",
};
const INTAKE_TO_BRIEF: Record<string, string> = {
  pricing_idea: "pricing_idea",
  offer_description: "offer_description",
  unique_insight: "unique_insight",
  twelve_month_vision: "twelve_month_vision",
};

async function writeBackIntake(
  supabase: any,
  userId: string | null,
  answers: Record<string, any> | null,
) {
  if (!userId || !answers) return;
  const profilePatch: Record<string, any> = {};
  const briefPatch: Record<string, any> = {};
  for (const [k, v] of Object.entries(answers)) {
    if (v === null || v === undefined || v === "") continue;
    if (INTAKE_TO_PROFILE[k]) profilePatch[INTAKE_TO_PROFILE[k]] = v;
    if (INTAKE_TO_BRIEF[k]) briefPatch[INTAKE_TO_BRIEF[k]] = v;
  }
  const ops: Promise<any>[] = [];
  if (Object.keys(profilePatch).length) {
    ops.push(
      supabase
        .from("attendee_profiles")
        .upsert({ user_id: userId, ...profilePatch }, { onConflict: "user_id" }),
    );
  }
  if (Object.keys(briefPatch).length) {
    ops.push(
      supabase
        .from("attendee_business_brief")
        .upsert({ user_id: userId, ...briefPatch }, { onConflict: "user_id" }),
    );
  }
  if (ops.length) await Promise.allSettled(ops);
}



class GatewayError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(gatewayMessage(status, detail));
    this.name = "GatewayError";
    this.status = status;
    this.detail = detail;
  }
}

function gatewayMessage(status: number, detail: string) {
  const normalized = detail.toLowerCase();
  if (status === 403 && normalized.includes("credit_limit_reached")) {
    return "AI generation is paused because the workspace AI Gateway credit limit has been reached.";
  }
  if (status === 402 || normalized.includes("credits exhausted")) {
    return "AI generation is paused because AI credits are exhausted.";
  }
  if (status === 429) {
    return "AI generation is temporarily rate limited. Please try again in a few minutes.";
  }
  if (status === 401 || status === 403) {
    return "AI generation is currently unavailable because the AI Gateway rejected the request.";
  }
  return "AI generation is currently unavailable. Please try again shortly.";
}

// Track tones, specialized prompts, model-tier routing, and the citation
// stripper all live in supabase/functions/_shared/ so the single-doc path
// and the bulk path produce identical quality for the same document_type.

export async function generateOne(
  supabase: any,
  snapshotId: string,
  documentType: string,
  rewriteFeedback?: string,
  rewriteTags?: string[],
  intakeAnswers?: Record<string, any>,
) {
  const [ctx, { data: type }] = await Promise.all([
    loadVentureContext(supabase, snapshotId),
    supabase.from("venture_document_types").select("*").eq("type", documentType).maybeSingle(),
  ]);
  const snap = ctx.snap;
  if (!type) throw new Error(`Unknown document type: ${documentType}`);

  // Brand-kit gate: these deliverables need a brand. Prefer the founder's
  // locked kit; otherwise infer a provisional one from finished assets.
  // Brand context is loaded for EVERY asset (palette, typography, mood board,
  // voice, CTAs). Only BRAND_KIT_REQUIRED_TYPES hard-block when it's missing.
  let brandKit: Awaited<ReturnType<typeof loadBrandKit>> =
    await ensureBrandKit(supabase, snapshotId, ctx.userId ?? snap.user_id, snap);
  if (!isBrandKitUsable(brandKit)) brandKit = null;
  if (BRAND_KIT_REQUIRED_TYPES.has(documentType)) {
    if (!isBrandKitUsable(brandKit)) {
      // Reset to pending so the UI shows the gate, not a "Needs another try" state.
      await supabase.from("venture_documents").upsert({
        snapshot_id: snapshotId,
        document_type: documentType,
        status: "pending",
      }, { onConflict: "snapshot_id,document_type" });
      const err = new Error("We couldn't infer your brand — open the Brand Wizard to set it.");
      (err as any).code = "brand_kit_required";
      throw err;
    }
  }


  // Ensure a snapshot brain exists AND is fresh (recomputes when dirty —
  // dirty flag is set by source-extract / intake-writeback / concept-refine).
  if (snap.concept_summary || snap.research_brief || snap.business_concept) {
    try {
      ctx.brain = await ensureSnapshotBrain(supabase, snapshotId);
    } catch (e) {
      console.warn("brain ensure failed, falling back to raw blobs", e);
    }
  }

  // Resolve intake answers: prefer caller-provided, otherwise reuse any previously saved on the doc row.
  let effectiveIntake: Record<string, any> | null =
    intakeAnswers && Object.keys(intakeAnswers).length ? intakeAnswers : null;
  if (!effectiveIntake) {
    const { data: prior } = await supabase
      .from("venture_documents")
      .select("intake_answers")
      .eq("snapshot_id", snapshotId)
      .eq("document_type", documentType)
      .maybeSingle();
    if (prior?.intake_answers && Object.keys(prior.intake_answers).length) {
      effectiveIntake = prior.intake_answers;
    }
  }

  // Intake gate: infer the inputs from the venture's finished assets rather
  // than writing the asset on air. Same behaviour as the bulk generator.
  let derivedIntake: DerivedIntake | null = null;
  if (!effectiveIntake && type?.intake_schema) {
    try {
      derivedIntake = await deriveIntakeAnswers(
        supabase, snapshotId, snap, documentType, type.name, type.intake_schema,
      );
    } catch (e) {
      console.warn("intake derive threw", e);
    }
    if (derivedIntake) effectiveIntake = derivedIntake.answers;
  }

  // Write fresh intake answers back into canonical store (S4). Best-effort —
  // never blocks generation. Compounds: next deliverable's intake prefills
  // from these, the Profile page shows them, and re-runs reuse them.
  if (intakeAnswers && Object.keys(intakeAnswers).length) {
    // F13: await so the writeback completes BEFORE we mark the brain dirty.
    // Previously fire-and-forget raced markSnapshotBrainDirty and the next
    // generator could recompute the brain with stale facts.
    try {
      await writeBackIntake(supabase, ctx.userId, intakeAnswers);
    } catch (e) {
      console.warn("intake writeback failed", e);
    }
    await markSnapshotBrainDirty(supabase, snapshotId).catch(() => {});
  }

  // Mark as generating (preserve any intake answers we resolved).
  await supabase.from("venture_documents").upsert({
    snapshot_id: snapshotId,
    document_type: documentType,
    status: "generating",
    ...(effectiveIntake ? { intake_answers: effectiveIntake } : {}),
  }, { onConflict: "snapshot_id,document_type" });

  // Load dependency docs and distill them to bullet summaries (S3 — replaces
  // raw 600-900-word markdown dumps per upstream).
  const deps: string[] = type.dependencies ?? [];
  let depContext = "";
  if (deps.length) {
    const { data: depDocs } = await supabase
      .from("venture_documents")
      .select("document_type, content")
      .eq("snapshot_id", snapshotId)
      .in("document_type", deps);
    depContext = distillDeps(depDocs ?? []);
  }

  const baseSystemPrompt = specializedPrompt(documentType) ?? BASE_SYSTEM_PROMPT;
  const tone = trackTone(snap.track);
  const profile = profileFor(documentType);
  const systemPrompt = [baseSystemPrompt, tone, profile.systemExtra].filter(Boolean).join("\n\n");

  // Build the user prompt. If we have a brain, use the sliced brain JSON
  // instead of dumping raw extracted_data + research_brief. Saves ~70% of
  // the previous prompt size and eliminates signal dilution.
  const brainSlice = pickBrainSlice(ctx.brain, type.context_keys ?? null);
  const preamble = compactPreamble(ctx, { hasBrandKit: !!brandKit });

  const brandBlock = brandKitBlock(brandKit, snapshotId);

  const sourcingBlock = renderSourcingBlock(snap.sourcing_profile, snap.research_brief?.sourcing);

  // Ground the document in the founder's Second Brain corpus (uploaded
  // materials + notes), retrieved for this specific deliverable.
  let corpusBlock = "";
  try {
    corpusBlock = await brainCorpusBlock(
      supabase,
      ctx.userId,
      snapshotId,
      [type.name, type.description ?? "", snap.concept_summary ?? ""].filter(Boolean).join(" \u2014 "),
      10,
    );
  } catch (e) {
    console.warn("brain corpus retrieval failed", e);
  }

  const userPrompt = [
    `# Document to produce: ${type.name}`,
    `Description: ${type.description}`,
    `Category: ${type.category}`,
    brandBlock,
    preamble,
    corpusBlock,
    sourcingBlock,
    brainSlice
      ? `\n## Venture brain (compressed, authoritative — every section must reflect these)\n${JSON.stringify(brainSlice, null, 2)}`
      : `\n## Venture brief (fallback — brain not yet computed)\n${JSON.stringify(snap.extracted_data ?? {}, null, 2)}`,
    // Only dump the raw research brief when the brain doesn't yet exist.
    !ctx.brain && snap.research_brief
      ? `\n## Research brief (background evidence — synthesize as analyst judgment, NO footnotes or citations in the output)\n${JSON.stringify(snap.research_brief, null, 2).slice(0, 8000)}`
      : "",
    !ctx.brain && snap.business_concept ? `\n## Founder's raw concept\n${snap.business_concept}` : "",
    depContext ? `\n## Upstream documents you should build on (distilled)\n${depContext}` : "",
    derivedIntake
      ? derivedIntakeBlock(derivedIntake, type.intake_schema?.fields ?? [])
      : effectiveIntake
        ? `\n## Intake answers (TOP PRIORITY — the founder provided these as ground-truth assumptions. Use every value verbatim; do not invent contradictory numbers.)\n${JSON.stringify(effectiveIntake, null, 2)}`
        : "",

    (rewriteFeedback && rewriteFeedback.trim()) || (rewriteTags && rewriteTags.length)
      ? `\n## Rewrite guidance from the founder (TOP PRIORITY — the previous version missed the mark, address every point below in this rewrite)\n${
          rewriteTags && rewriteTags.length ? `Tags: ${rewriteTags.join(", ")}\n\n` : ""
        }${rewriteFeedback?.trim() ?? ""}`
      : "",
  ].filter(Boolean).join("\n\n").slice(0, MAX_USER_PROMPT_CHARS);

  // S5 — Per-deliverable model tier ('pro' | 'flash' | 'lite').
  // website_prd is force-upgraded to Pro + extra output tokens so the
  // 1,800–2,400-word master prompt block can finish without truncation.
  const isPrd = documentType === "website_prd";
  const modelId = isPrd ? modelForTier("flash") : modelForTier(type.model_tier);
  const maxTokens = isPrd ? 16000 : 16000;

  let aiRes: Response;
  try {
    aiRes = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelId,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    }, { timeoutMs: isPrd ? 180_000 : 90_000, retries: isPrd ? 0 : 2 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("venture_documents").update({ status: "failed" })
      .eq("snapshot_id", snapshotId).eq("document_type", documentType);
    await supabase.from("venture_generation_failures").insert({
      snapshot_id: snapshotId, document_type: documentType, error: `Gateway request failed: ${msg.slice(0, 300)}`,
    });
    throw e;
  }



  if (!aiRes.ok) {
    const txt = await aiRes.text();
    await supabase.from("venture_documents").update({ status: "failed" })
      .eq("snapshot_id", snapshotId).eq("document_type", documentType);
    await supabase.from("venture_generation_failures").insert({
      snapshot_id: snapshotId, document_type: documentType, error: `Gateway ${aiRes.status}: ${txt.slice(0, 300)}`,
    });
    throw new GatewayError(aiRes.status, txt);
  }

  const aiJson = await aiRes.json();
  let raw = aiJson.choices?.[0]?.message?.content ?? "";
  const finishReason = aiJson.choices?.[0]?.finish_reason ?? aiJson.choices?.[0]?.finishReason ?? "";
  let truncated = String(finishReason).toLowerCase() === "length";

  // Extract quality score line
  let quality = 75;
  const qm = raw.match(/QUALITY_SCORE:\s*(\d{1,3})/i);
  if (qm) {
    quality = Math.max(0, Math.min(100, parseInt(qm[1], 10)));
    raw = raw.replace(/QUALITY_SCORE:\s*\d{1,3}\s*$/i, "").trim();
  }

  // Strip any citation residue the model may have produced despite instructions.
  raw = stripCitations(raw);

  // ---- Identity guard: the company name and the committed logo are not optional.
  const lockedName = (snap.company_name ?? "").trim() || null;
  const lockedLogo = brandKit && Array.isArray(brandKit.logos) && brandKit.logos.length
    ? brandLogoUrl(snapshotId)
    : null;
  raw = substituteIdentity(raw, lockedName);

  const identity = checkIdentity(raw, {
    companyName: lockedName,
    logoUrl: lockedLogo,
    requireImagery: isPrd,
  });
  if (!identity.ok) {
    console.warn("identity guard failed", documentType, identity);
    try {
      const fixRes = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelId,
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
            { role: "assistant", content: raw.slice(0, 40_000) },
            { role: "user", content: correctionPrompt(identity, { companyName: lockedName, logoUrl: lockedLogo }) },
          ],
        }),
      }, { timeoutMs: isPrd ? 180_000 : 90_000, retries: 0 });
      if (fixRes.ok) {
        const fixJson = await fixRes.json();
        let fixed = stripCitations(fixJson.choices?.[0]?.message?.content ?? "");
        fixed = substituteIdentity(fixed, lockedName);
        const recheck = checkIdentity(fixed, {
          companyName: lockedName,
          logoUrl: lockedLogo,
          requireImagery: isPrd,
        });
        // Only accept the repair when it is both substantial and better.
        if (fixed.length > raw.length * 0.6 && (recheck.ok || (!recheck.nameMissing && identity.nameMissing))) {
          raw = fixed;
          truncated = String(fixJson.choices?.[0]?.finish_reason ?? "").toLowerCase() === "length";
        }
      } else {
        await fixRes.text();
      }
    } catch (e) {
      console.warn("identity repair pass failed", e);
    }
  }

  if (isPrd) {
    raw = await expandWebsitePrdMasterPrompt(raw);
    raw = enforceWebsitePrdDepth(raw);
    const stats = masterPromptStats(raw);
    if (stats.complete && stats.words >= 1800) truncated = false;
  }


  if (truncated) {
    quality = Math.min(quality, 60);
    if (!raw.includes("<!-- TRUNCATED -->")) {
      raw = `${raw}\n\n<!-- TRUNCATED -->\n`;
    }
  }


  const wordCount = raw.split(/\s+/).filter(Boolean).length;

  // Read existing for version history
  const { data: existing } = await supabase
    .from("venture_documents")
    .select("version, content, content_version_history")
    .eq("snapshot_id", snapshotId)
    .eq("document_type", documentType)
    .maybeSingle();

  const nextVersion = existing?.content ? (existing.version ?? 1) + 1 : 1;
  const history = Array.isArray(existing?.content_version_history) ? existing.content_version_history : [];
  if (existing?.content) {
    history.unshift({ version: existing.version ?? 1, content: existing.content, archived_at: new Date().toISOString() });
  }

  await supabase.from("venture_documents").upsert({
    snapshot_id: snapshotId,
    document_type: documentType,
    status: "complete",
    content: raw,
    word_count: wordCount,
    quality_score: quality,
    version: nextVersion,
    content_version_history: history.slice(0, 10),
    ...(effectiveIntake ? { intake_answers: effectiveIntake } : {}),
  }, { onConflict: "snapshot_id,document_type" });

  if (documentType === "visual_identity_brief") {
    const m = raw.match(/```json\s*([\s\S]*?)```/);
    if (m) {
      try {
        const tokens = JSON.parse(m[1]);
        await supabase.from("venture_snapshots").update({ brand_tokens: tokens }).eq("id", snapshotId);
      } catch { /* ignore */ }
    }
  }

  // Fire-and-forget hero image generation (Nano Banana Pro). Best-effort.
  // Force regeneration when the content has actually changed (rewrite path);
  // otherwise the image function will no-op if one already exists.
  const forceImage = nextVersion > 1;
  try {
    fetch(`${SUPABASE_URL}/functions/v1/venture-document-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ snapshotId, documentType, force: forceImage }),
    }).catch(() => {});
  } catch { /* ignore */ }

  return { wordCount, quality };
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { snapshotId, documentType, rewriteFeedback, rewriteTags, intakeAnswers } = await req.json();
    if (!snapshotId || !documentType) {
      return jsonResponse({ error: "snapshotId and documentType required" }, 400, corsHeaders);
    }
    const auth = await requireUser(req, corsHeaders);
    if (auth.error) return auth.error;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const own = await requireSnapshotOwner(supabase, snapshotId, auth.userId!, corsHeaders);
    if (own.error) return own.error;
    if (!own.snapshot || own.snapshot.concept_status !== "locked") {
      return jsonResponse({ error: "Lock your concept summary before generating documents." }, 409, corsHeaders);
    }
    const result = await generateOne(
      supabase,
      snapshotId,
      documentType,
      rewriteFeedback,
      Array.isArray(rewriteTags) ? rewriteTags : undefined,
      intakeAnswers && typeof intakeAnswers === "object" ? intakeAnswers : undefined,
    );
    return new Response(JSON.stringify({ ok: true, ...result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if ((e as any)?.code === "brand_kit_required") {
      return new Response(
        JSON.stringify({ ok: false, error: "brand_kit_required", message }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (e instanceof GatewayError) {
      return new Response(JSON.stringify({ ok: false, error: message, gatewayStatus: e.status }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // F7: friendly 409 when the partial unique inflight index trips —
    // another worker is already generating this same document.
    if (/venture_documents_inflight_unique|duplicate key value/i.test(message)) {
      return new Response(
        JSON.stringify({ ok: false, error: "This document is already being generated. Please wait for it to finish before retrying." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

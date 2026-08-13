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
import { stripEmbeddedMarkup } from "../_shared/strip-markup.ts";

import { ensureSnapshotBrain, markSnapshotBrainDirty } from "../_shared/snapshot-brain.ts";
import { brainCorpusBlock, brainCorpusBlockMulti } from "../_shared/brain-corpus.ts";
import { brainFactsBlock, brainFactTokens } from "../_shared/brain-facts.ts";
import {
  brandVisionInstruction,
  collectBrandVisionImages,
  visionUserContent,
} from "../_shared/prd-brand-vision.ts";
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
import { renderPrdPortraits } from "../_shared/prd-portraits.ts";
import {
  brandFactsFromKit,
  applyCraftContract,
  expandWebsitePrdMasterPrompt,
  expandWebsitePrdPageCopy,
  masterPromptStats,
  prdQualityMetrics,
  repairWebsitePrdCraft,
  type PrdVentureFacts,
} from "../_shared/website-prd.ts";
import { aiFetch } from "../_shared/ai-fetch.ts";
import { capacityProvider } from "../_shared/capacity-error.ts";
import { logGenEvent } from "../_shared/gen-events.ts";
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
    return "Generation is paused — our team has been notified.";
  }
  if (status === 429) {
    return "AI generation is temporarily rate limited. Please try again in a few minutes.";
  }
  if (status === 401 || status === 403) {
    return "AI generation is currently unavailable because the AI Gateway rejected the request.";
  }
  return "AI generation is currently unavailable. Please try again shortly.";
}

/**
 * Assets that require a *locked* brand — not merely an inferred one — plus the
 * brand assets they are derived from. These are excluded from bulk runs and
 * are only ever written when the founder asks for them.
 */
export const BRAND_LOCK_REQUIRED_TYPES = new Set<string>(["website_prd"]);

/** Brand assets that must be finished before a brand-locked asset can build. */
const BRAND_SOURCE_TYPES = ["visual_identity_brief", "logo_brand_asset_pack"];

async function checkBrandLock(
  supabase: any,
  snapshotId: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { data: kit } = await supabase
    .from("venture_brand_kits")
    .select("status, locked_at, palette, typography, logos")
    .eq("snapshot_id", snapshotId)
    .maybeSingle();

  if (kit?.status !== "locked") {
    return {
      ok: false,
      reason: "Lock your brand first — the website brief is built from your final marks, palette and type.",
    };
  }

  const { data: brandDocs } = await supabase
    .from("venture_documents")
    .select("document_type, status")
    .eq("snapshot_id", snapshotId)
    .in("document_type", BRAND_SOURCE_TYPES);
  const done = new Set(
    (brandDocs ?? [])
      .filter((d: any) => d.status === "complete")
      .map((d: any) => d.document_type),
  );
  const missing = BRAND_SOURCE_TYPES.filter((t) => !done.has(t));
  if (missing.length) {
    return {
      ok: false,
      reason: "Your brand assets aren't finished yet — the website brief unlocks once they are.",
    };
  }
  return { ok: true };
}


// Track tones, specialized prompts, model-tier routing, and the citation
// stripper all live in supabase/functions/_shared/ so the single-doc path
// and the bulk path produce identical quality for the same document_type.

/**
 * Phases (Website PRD only — every other deliverable runs "full"):
 *   draft  — one model call, then the draft is CHECKPOINTED to the row and the
 *            refine phase is self-invoked. A killed worker can no longer lose
 *            the whole run.
 *   refine — reads the checkpointed draft, runs copy expansion, the bounded
 *            identity-repair loop, the master prompt and portraits, then
 *            terminalizes the row.
 */
export type GenPhase = "full" | "draft" | "refine";

export async function generateOne(
  supabase: any,
  snapshotId: string,
  documentType: string,
  rewriteFeedback?: string,
  rewriteTags?: string[],
  intakeAnswers?: Record<string, any>,
  phase: GenPhase = "full",
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

  // Brand-lock gate (Website PRD only). The PRD is the most brand-dependent
  // artifact we produce, so it is never written from a provisional kit or a
  // half-finished brand: the founder locks the brand first, then triggers it.
  if (BRAND_LOCK_REQUIRED_TYPES.has(documentType) && phase !== "refine") {
    const gate = await checkBrandLock(supabase, snapshotId);
    if (!gate.ok) {
      await supabase.from("venture_documents").upsert({
        snapshot_id: snapshotId,
        document_type: documentType,
        status: "pending",
        blocked_reason: gate.reason,
      }, { onConflict: "snapshot_id,document_type" });
      await logGenEvent(supabase, {
        snapshotId, documentType, phase, outcome: "blocked", error: gate.reason,
      });
      const err = new Error(gate.reason);
      (err as any).code = "brand_lock_required";
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

  // Mark as generating (preserve any intake answers we resolved). The refine
  // phase must NOT clobber the checkpointed draft, so it only touches status.
  if (phase !== "refine") {
    await supabase.from("venture_documents").upsert({
      snapshot_id: snapshotId,
      document_type: documentType,
      status: "generating",
      ...(effectiveIntake ? { intake_answers: effectiveIntake } : {}),
    }, { onConflict: "snapshot_id,document_type" });
  }

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

  // Website PRDs get a committed art direction (one archetype per venture) so
  // every generated site expresses a real design point of view instead of the
  // same hero → 3-up grid → pricing stack.
  const isPrd = documentType === "website_prd";
  const art = isPrd
    ? archetypeForPrompt({
      snapshotId,
      track: snap.track,
      brandKit: brandKit as Record<string, any> | null,
      freeText: [snap.concept_summary, snap.value_proposition].filter(Boolean).join(" "),
    })
    : null;

  const systemPrompt = [baseSystemPrompt, tone, profile.systemExtra, art?.block]
    .filter(Boolean).join("\n\n");


  // Build the user prompt. If we have a brain, use the sliced brain JSON
  // instead of dumping raw extracted_data + research_brief. Saves ~70% of
  // the previous prompt size and eliminates signal dilution.
  //
  // The Website PRD is the exception: a site brief needs the WHOLE venture —
  // offer, pricing, segments, objections, proof, financials, voice, geography,
  // founder story — so it gets the full brain rather than a keyed slice.
  const brainSlice = isPrd
    ? (ctx.brain ?? pickBrainSlice(ctx.brain, type.context_keys ?? null))
    : pickBrainSlice(ctx.brain, type.context_keys ?? null);
  const preamble = compactPreamble(ctx, { hasBrandKit: !!brandKit });

  const brandBlock = brandKitBlock(brandKit, snapshotId);

  const sourcingBlock = renderSourcingBlock(snap.sourcing_profile, snap.research_brief?.sourcing);

  // Ground the document in the founder's Second Brain corpus (uploaded
  // materials + notes), retrieved for this specific deliverable. The PRD runs
  // a multi-query retrieval so audience, offer, proof and technical evidence
  // all make it in rather than whichever topic happened to rank highest.
  let corpusBlock = "";
  try {
    if (isPrd) {
      const concept = snap.concept_summary ?? "";
      const res = await brainCorpusBlockMulti(
        supabase,
        ctx.userId,
        snapshotId,
        [
          `target audience, segments and objections — ${concept}`,
          `offer, packaging and pricing — ${concept}`,
          `proof, testimonials, credentials and results — ${concept}`,
          `brand voice, story and founder background — ${concept}`,
          `operations, logistics and technical requirements — ${concept}`,
        ],
        8,
        40,
      );
      corpusBlock = res.block;
    } else {
      corpusBlock = await brainCorpusBlock(
        supabase,
        ctx.userId,
        snapshotId,
        [type.name, type.description ?? "", snap.concept_summary ?? ""].filter(Boolean).join(" \u2014 "),
        10,
      );
    }
  } catch (e) {
    console.warn("brain corpus retrieval failed", e);
  }

  // Distinctive facts the PRD copy has to echo (checked after generation).
  const factTokens = isPrd
    ? brainFactTokens(ctx.brain ?? snap.extracted_data ?? null, {
      concept: snap.concept_summary,
      value: snap.value_proposition,
      brief: snap.research_brief,
    })
    : [];

  // The real artwork, as images — so the art direction is read off the mark
  // instead of inferred from hex strings.
  let visionImages: Awaited<ReturnType<typeof collectBrandVisionImages>> = [];
  if (isPrd) {
    try {
      visionImages = await collectBrandVisionImages(brandKit as Record<string, any> | null);
    } catch (e) {
      console.warn("brand vision collection failed", e);
    }
  }
  const visionBlock = brandVisionInstruction(visionImages);


  const userPrompt = [
    `# Document to produce: ${type.name}`,
    `Description: ${type.description}`,
    `Category: ${type.category}`,
    brandBlock,
    visionBlock,
    preamble,
    corpusBlock,
    brainFactsBlock(factTokens),
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
  ].filter(Boolean).join("\n\n").slice(0, isPrd ? 220_000 : MAX_USER_PROMPT_CHARS);

  // S5 — Per-deliverable model tier ('pro' | 'flash' | 'lite').
  // website_prd runs on Pro: it is the longest and most design-sensitive
  // document in the system, and Flash flattens layout and copy quality.
  const modelId = isPrd ? modelForTier("pro") : modelForTier(type.model_tier);
  const maxTokens = isPrd ? 24000 : 16000;

  const lockedName = (snap.company_name ?? "").trim() || null;
  const lockedLogo = brandKit && Array.isArray(brandKit.logos) && brandKit.logos.length
    ? brandLogoUrl(snapshotId)
    : null;

  let raw = "";
  let quality = 75;
  let truncated = false;

  // ---- Refine phase: pick the checkpointed draft back up. -------------
  if (phase === "refine") {
    const { data: checkpoint } = await supabase
      .from("venture_documents")
      .select("content, quality_score")
      .eq("snapshot_id", snapshotId)
      .eq("document_type", documentType)
      .maybeSingle();
    raw = checkpoint?.content ?? "";
    quality = checkpoint?.quality_score ?? 75;
    if (!raw) {
      // Nothing to refine (checkpoint lost) — fall back to a full run.
      phase = "full";
    }
  }

  if (!raw) {
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
            { role: "user", content: visionUserContent(userPrompt, visionImages) },
          ],
        }),
      }, { timeoutMs: isPrd ? 180_000 : 90_000, retries: isPrd ? 0 : 2 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase.from("venture_documents").update({
        status: "failed",
        last_error: `Gateway request failed: ${msg.slice(0, 300)}`,
      }).eq("snapshot_id", snapshotId).eq("document_type", documentType);
      await supabase.from("venture_generation_failures").insert({
        snapshot_id: snapshotId, document_type: documentType, error: `Gateway request failed: ${msg.slice(0, 300)}`,
      });
      throw e;
    }

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      await supabase.from("venture_documents").update({
        status: "failed",
        last_error: `Gateway ${aiRes.status}: ${txt.slice(0, 300)}`,
      }).eq("snapshot_id", snapshotId).eq("document_type", documentType);
      await supabase.from("venture_generation_failures").insert({
        snapshot_id: snapshotId, document_type: documentType, error: `Gateway ${aiRes.status}: ${txt.slice(0, 300)}`,
      });
      throw new GatewayError(aiRes.status, txt);
    }

    const aiJson = await aiRes.json();
    raw = aiJson.choices?.[0]?.message?.content ?? "";
    const finishReason = aiJson.choices?.[0]?.finish_reason ?? aiJson.choices?.[0]?.finishReason ?? "";
    truncated = String(finishReason).toLowerCase() === "length";

    // Extract quality score line
    const qm = raw.match(/QUALITY_SCORE:\s*(\d{1,3})/i);
    if (qm) {
      quality = Math.max(0, Math.min(100, parseInt(qm[1], 10)));
      raw = raw.replace(/QUALITY_SCORE:\s*\d{1,3}\s*$/i, "").trim();
    }

    // Strip any citation residue the model may have produced despite instructions.
    raw = stripCitations(raw);
    raw = substituteIdentity(raw, lockedName);
    // Reader contract: no head markup (<style>/<link>/:root tokens) in a body.
    raw = stripEmbeddedMarkup(raw);

    // ---- Checkpoint: a real new-engine draft is on the row BEFORE any of
    // the long enrichment passes run, so a killed worker can never leave the
    // founder looking at a months-old document.
    if (isPrd && phase === "draft") {
      await supabase.from("venture_documents").update({
        content: raw,
        word_count: raw.split(/\s+/).filter(Boolean).length,
        quality_score: quality,
        status: "generating",
        last_error: null,
        metadata: { phase: "draft", checkpointed_at: new Date().toISOString() },
      }).eq("snapshot_id", snapshotId).eq("document_type", documentType);

      // Hand the enrichment to a fresh worker with its own wall clock.
      await fetch(`${SUPABASE_URL}/functions/v1/venture-generate-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ snapshotId, documentType, phase: "refine" }),
      }).catch((e) => console.warn("refine handoff failed", e));

      return { wordCount: raw.split(/\s+/).filter(Boolean).length, quality, phase: "draft" };
    }
  }


  // Page copy depth: deepen Section 4 before the guard so a thin-but-fixable
  // draft is expanded rather than fully regenerated.
  if (isPrd) {
    raw = await expandWebsitePrdPageCopy(
      raw,
      { companyName: lockedName, archetype: art?.archetype ?? null },
      LOVABLE_API_KEY,
    );
  }

  const identity = checkIdentity(raw, {
    companyName: lockedName,
    logoUrl: lockedLogo,
    requireImagery: isPrd,
    minImageryRows: 12,
    requireCopyDepth: isPrd,
    archetypeName: art?.archetype.name ?? null,
    requireLogoCraft: isPrd && visionImages.length > 0,
    brainFacts: factTokens,
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
            { role: "user", content: correctionPrompt(identity, { companyName: lockedName, logoUrl: lockedLogo, archetypeName: art?.archetype.name ?? null, minImageryRows: 12, brainFacts: factTokens }) },
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
    minImageryRows: 12,
    requireCopyDepth: isPrd,
    archetypeName: art?.archetype.name ?? null,
    requireLogoCraft: isPrd && visionImages.length > 0,
    brainFacts: factTokens,
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
    const bf = brandFactsFromKit(brandKit as Record<string, any> | null);
    const prdFacts: PrdVentureFacts = {
      companyName: lockedName,
      archetype: art?.archetype ?? null,
      hexes: bf.hexes,
      fonts: bf.fonts,
      ctas: bf.ctas,
      moodboard: bf.moodboard,
      offer: snap.value_proposition ?? snap.concept_summary ?? null,
      logoUrl: lockedLogo,
    };
    raw = await expandWebsitePrdMasterPrompt(raw, prdFacts, LOVABLE_API_KEY);
    raw = applyCraftContract(raw, prdFacts);
    // Layout & interaction gate: a PRD that never specifies a container, real
    // buttons or overlay surfaces produced the edge-to-edge, text-link sites we
    // shipped before. Repair once, then log the verdict either way.
    const craft = await repairWebsitePrdCraft(raw, prdFacts, LOVABLE_API_KEY);
    raw = craft.raw;
    if (!craft.verdict.ok) {
      console.warn("website_prd craft gate", JSON.stringify({
        snapshotId,
        repaired: craft.repaired,
        failures: craft.verdict.failures,
      }));
    }
    // Render the portrait rows ourselves so the builder inherits finished
    // photographs instead of a paragraph of instructions.
    try {
      raw = await renderPrdPortraits(supabase, raw, {
        apiKey: LOVABLE_API_KEY,
        ownerId: ctx.userId ?? snap.user_id,
        snapshotId,
        documentType,
      });
    } catch (e) {
      console.warn("prd portrait pass failed", e);
    }
    const stats = masterPromptStats(raw);
    if (stats.complete && stats.words >= 1800) truncated = false;
    console.log("website_prd metrics", JSON.stringify({
      snapshotId,
      model: modelId,
      truncated,
      ...prdQualityMetrics(raw, prdFacts),
    }));
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
      body: JSON.stringify({ snapshotId, documentType, force: forceImage, quality: "hq" }),
    }).catch(() => {});
  } catch { /* ignore */ }

  return { wordCount, quality };
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { snapshotId, documentType, rewriteFeedback, rewriteTags, intakeAnswers, phase } = await req.json();
    if (!snapshotId || !documentType) {
      return jsonResponse({ error: "snapshotId and documentType required" }, 400, corsHeaders);
    }

    // Internal invocation carries the service key. Two cases: the draft→refine
    // phase handoff, and the orchestrator starting a stage on its own (the
    // website brief, once the brand is locked). Both are already authorised —
    // the orchestrator only ever acts on a venture whose own run authorised it
    // — and both answer immediately with the work running in the background.
    const internal = req.headers.get("x-internal-key") === SERVICE_KEY;
    if (internal) {
      const runPhase = phase === "refine"
        ? "refine"
        : documentType === "website_prd"
        ? "draft"
        : "full";
      const sb = createClient(SUPABASE_URL, SERVICE_KEY);
      const startedAt = Date.now();
      const job = generateOne(sb, snapshotId, documentType, undefined, undefined, undefined, runPhase)
        .then((r: any) =>
          logGenEvent(sb, {
            snapshotId, documentType, phase: r?.phase ?? runPhase,
            durationMs: Date.now() - startedAt,
            outcome: r?.phase === "draft" ? "checkpoint" : "complete",
          })
        )
        .catch(async (err) => {
          const msg = (err instanceof Error ? err.message : String(err)).slice(0, 500);
          await logGenEvent(sb, {
            snapshotId, documentType, phase: runPhase,
            durationMs: Date.now() - startedAt,
            outcome: (err as any)?.code ? "blocked" : "failed",
            error: msg,
          });
          if (!(err as any)?.code) {
            await sb.from("venture_documents").update({
              status: "failed",
              last_error: msg,
            }).eq("snapshot_id", snapshotId).eq("document_type", documentType);
          }
        });
      try { (globalThis as any).EdgeRuntime?.waitUntil?.(job); } catch { /* ignore */ }
      return jsonResponse({ ok: true, phase: runPhase, pending: true }, 202, corsHeaders);
    }


    const auth = await requireUser(req, corsHeaders);
    if (auth.error) return auth.error;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const own = await requireSnapshotOwner(supabase, snapshotId, auth.userId!, corsHeaders);
    if (own.error) return own.error;
    if (!own.snapshot || own.snapshot.concept_status !== "locked") {
      return jsonResponse({ error: "Lock your concept summary before generating documents." }, 409, corsHeaders);
    }
    const work = generateOne(
      supabase,
      snapshotId,
      documentType,
      rewriteFeedback,
      Array.isArray(rewriteTags) ? rewriteTags : undefined,
      intakeAnswers && typeof intakeAnswers === "object" ? intakeAnswers : undefined,
      documentType === "website_prd" ? "draft" : "full",
    );


    // Long deliverables (Website PRD, with its copy-expansion and repair
    // passes) routinely run past the platform's 150s request idle timeout.
    // Race a soft deadline: if the work is still running, hand it to the
    // background and answer 202 — the client already polls venture_documents.
    const DEADLINE_MS = 100_000;
    const PENDING = Symbol("pending");
    let settled = false;
    const startedAt = Date.now();
    const guarded = work
      .then((r: any) => {
        settled = true;
        logGenEvent(supabase, {
          snapshotId, documentType, phase: r?.phase ?? "full",
          durationMs: Date.now() - startedAt,
          outcome: r?.phase === "draft" ? "checkpoint" : "complete",
        });
        return r;
      })
      .catch(async (err) => {
        settled = true;
        const msg = (err instanceof Error ? err.message : String(err)).slice(0, 500);
        await logGenEvent(supabase, {
          snapshotId, documentType, durationMs: Date.now() - startedAt,
          outcome: (err as any)?.code ? "blocked" : "failed", error: msg,
        });
        try {
          if (!(err as any)?.code) {
            await supabase.from("venture_documents")
              .update({ status: "failed", last_error: msg })
              .eq("snapshot_id", snapshotId)
              .eq("document_type", documentType);
          }
        } catch { /* ignore */ }
        throw err;
      });
    // Prevent an unhandled rejection when we hand off to the background.
    guarded.catch(() => {});

    const raced = await Promise.race([
      guarded.then((r) => r).catch((e) => { throw e; }),
      new Promise<typeof PENDING>((resolve) => setTimeout(() => resolve(PENDING), DEADLINE_MS)),
    ]).catch((e) => { if (settled) throw e; return PENDING; });

    if (raced === PENDING) {
      try {
        (globalThis as any).EdgeRuntime?.waitUntil?.(guarded.catch(() => {}));
      } catch { /* ignore */ }
      return new Response(
        JSON.stringify({ ok: true, pending: true, status: "generating" }),
        { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ ok: true, ...(raced as Record<string, unknown>) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if ((e as any)?.code === "brand_kit_required") {
      return new Response(
        JSON.stringify({ ok: false, error: "brand_kit_required", message }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if ((e as any)?.code === "brand_lock_required") {
      return new Response(
        JSON.stringify({ ok: false, error: "brand_lock_required", message }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (e instanceof GatewayError) {
      const detail = String((e as any).detail ?? "").toLowerCase();
      const workspaceCap = e.status === 403 && detail.includes("credit_limit_reached");
      const code = e.status === 429
        ? "RATE_LIMITED"
        : workspaceCap
          ? "AI_CREDIT_LIMIT_REACHED"
          : e.status === 402
            ? "PAYMENT_REQUIRED"
            : undefined;
      const body: Record<string, unknown> = { ok: false, error: message, gatewayStatus: e.status };
      if (code) {
        body.code = code;
        body.providers = [
          workspaceCap
            ? capacityProvider("lovable", "document generation")
            : capacityProvider("google", "document generation"),
        ];
      }
      return new Response(JSON.stringify(body), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

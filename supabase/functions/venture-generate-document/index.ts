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

function masterPromptStats(md: string) {
  const m = md.match(/<!--\s*BEGIN_MASTER_PROMPT\s*-->([\s\S]*?)<!--\s*END_MASTER_PROMPT\s*-->/i);
  const prompt = (m?.[1] ?? "").trim();
  const missingSections = Array.from({ length: 11 }, (_, i) => i + 1).filter(
    (n) => !new RegExp(String.raw`(?:^|\n)\s*${n}\)\s+`, "i").test(prompt),
  );
  return {
    prompt,
    words: prompt.split(/\s+/).filter(Boolean).length,
    complete: Boolean(m) && missingSections.length === 0 && /Begin scaffolding now\.\s*Generate all images on first run\.\s*Do not ask clarifying questions\./i.test(prompt),
  };
}

function enforceWebsitePrdDepth(raw: string) {
  const stats = masterPromptStats(raw);
  if (!stats.complete || stats.words >= 1800) return raw;
  const depthAddendum = `

Additional implementation depth requirements: Treat this as a production build, not a starter mockup. Every page must include final, founder-ready copy, visible conversion strategy, accessibility-first UI decisions, and premium imagery direction. Use layout rhythm that alternates editorial storytelling, proof panels, interactive cards, CTA bands, founder education modules, and trust-building operational detail. Avoid generic SaaS filler. The site should feel like Atlanta's most practical startup accelerator: confident, local, fast, specific, and useful for first-time founders who need clarity more than jargon.

For the design system, create reusable primitives before pages: AppShell, SiteHeader, MobileNav, MegaMenu, AnnouncementBar, Hero, SectionHeader, ProofStrip, MetricCard, ProcessTimeline, DeliverableGrid, PricingCard, FAQAccordion, TestimonialCard, CaseStudyCard, FounderStoryPanel, CTASection, NewsletterSignup, Footer, SEOHead, and RouteTransition. Define hover, focus, loading, empty, error, and mobile states. Use shadcn/ui for buttons, cards, dialogs, accordions, tabs, badges, sheets, forms, and toast messages. Ensure all interactive components have keyboard behavior, ARIA labels where useful, visible focus rings, and motion that respects prefers-reduced-motion.

For visual execution, generate or specify every image on first run. Use cinematic workshop photography, founder desk still life, Atlanta skyline textures, whiteboard strategy moments, document close-ups, small-business storefront details, and abstract AI workflow illustrations. Each image should have a clear prompt, alt text, aspect ratio, and placement. Mix full-bleed hero imagery, masked portraits, bento-grid screenshots, soft gradient panels, and subtle background patterns. Do not leave image slots blank. If using generated assets, make them feel original and premium rather than stock-photo generic.

For page-level copy, write every headline, subhead, body paragraph, microcopy label, CTA, form helper line, FAQ answer, testimonial placeholder, and empty-state message. The home page must quickly explain the promise, who it is for, why the three-hour format works, what the user leaves with, how the AI-assisted deliverables are produced, and what to do next. Service pages must explain scope, outcomes, prerequisites, timelines, and proof. Pricing must make the $197 workshop easy to understand, with a clear distinction between the workshop and any later build/support layer. Blog and case-study pages must include realistic starter content rather than placeholders.

For conversion, include primary CTAs above the fold, after proof, after process, after pricing, and in the footer. Use low-friction language such as “Reserve my seat,” “Start with the workshop,” “See what you leave with,” and “Ask a question.” Add trust indicators: cohort size, founder-friendly pacing, executive-summary deliverables, Main Street and tech-startup fit, Atlanta positioning, privacy expectations, and practical outcomes. Build forms with validation, success states, and friendly error states. Include analytics event names for major CTAs, pricing views, form submissions, FAQ opens, and scroll-depth milestones.

For engineering quality, structure files clearly: routes, components, data, lib, assets, and styles. Use typed arrays for nav, FAQs, pricing, services, testimonials, deliverables, and case studies. Avoid hardcoded repeated markup where mapped components are better. Make the site responsive across 360px mobile, tablet, laptop, and wide desktop. Maintain color contrast on light backgrounds. Keep performance high by lazy-loading non-critical imagery, using semantic headings, optimizing image sizes, and avoiding unnecessary animation re-renders. The delivered app should run without missing imports, undefined variables, console errors, or dead routes.

For polish, include scroll-triggered reveal choreography, tasteful page transitions, sticky contextual CTAs, rich card shadows, crisp iconography, premium empty states, and mobile-first navigation that never overflows the viewport. Add realistic operational details throughout: workshop seat count, founder preparation checklist, what happens before/during/after the session, how executive-summary documents are created, how users review or rewrite outputs, and how the Founder Hub supports future iterations.

For content credibility, make the language specific enough that a founder can make a decision without calling sales. Include objections and answers: “Is this only for tech startups?”, “What if I only have an idea?”, “What if I already have documents?”, “Can Main Street businesses use this?”, “What happens after the workshop?”, and “How private is my information?” Every answer should reduce confusion and move the user toward a clear next action.

For final QA, verify that every route has a unique meta title, meta description, canonical path, H1, meaningful above-the-fold CTA, responsive layout, accessible image alt text, no placeholder copy, no broken links, and a strong footer CTA. The result should feel complete enough to ship to paying workshop prospects immediately.`;
  const closing = /Begin scaffolding now\.\s*Generate all images on first run\.\s*Do not ask clarifying questions\./i;
  const nextPrompt = closing.test(stats.prompt)
    ? stats.prompt.replace(closing, `${depthAddendum}\n\nBegin scaffolding now. Generate all images on first run. Do not ask clarifying questions.`)
    : `${stats.prompt}${depthAddendum}\n\nBegin scaffolding now. Generate all images on first run. Do not ask clarifying questions.`;
  return raw.replace(/<!--\s*BEGIN_MASTER_PROMPT\s*-->[\s\S]*?<!--\s*END_MASTER_PROMPT\s*-->/i, `<!-- BEGIN_MASTER_PROMPT -->\n${nextPrompt.trim()}\n<!-- END_MASTER_PROMPT -->`);
}

async function expandWebsitePrdMasterPrompt(raw: string) {
  const stats = masterPromptStats(raw);
  if (!stats.prompt || (stats.complete && stats.words >= 1800)) return raw;
  try {
    const res = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelForTier("flash"),
        max_tokens: 12000,
        messages: [
          {
            role: "system",
            content: "You expand an AI website-builder master prompt. Return ONLY the delimiter-wrapped master prompt. No commentary, no code fences.",
          },
          {
            role: "user",
            content: `Expand the master prompt below to 1,800-2,400 words while preserving all facts, exact numbered sections 1) through 11), and the exact closing line. Each numbered section must be substantive and implementation-ready.\n\n${stats.prompt}`,
          },
        ],
      }),
    }, { timeoutMs: 180_000, retries: 0 });
    if (!res.ok) return raw;
    const json = await res.json();
    const expanded = String(json.choices?.[0]?.message?.content ?? "").trim();
    const expandedStats = masterPromptStats(expanded);
    if (!expandedStats.prompt || !expandedStats.complete || expandedStats.words <= stats.words) return raw;
    return enforceWebsitePrdDepth(raw.replace(/<!--\s*BEGIN_MASTER_PROMPT\s*-->[\s\S]*?<!--\s*END_MASTER_PROMPT\s*-->/i, `<!-- BEGIN_MASTER_PROMPT -->\n${expandedStats.prompt}\n<!-- END_MASTER_PROMPT -->`));
  } catch {
    return enforceWebsitePrdDepth(raw);
  }
}

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

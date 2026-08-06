// Founders Hub — bulk-generate every active venture document in dependency order.
//
// Post-AI-first-refactor pipeline (mirrors venture-generate-document so both
// paths produce identical quality for a given document_type):
//   1. loadVentureContext()  — single read, reused for every doc in this job
//   2. ensureSnapshotBrain() — compute once per job (or reuse cached/clean)
//   3. compactPreamble()     — ~600-token venture preamble per doc
//   4. pickBrainSlice()      — only the brain keys this deliverable needs
//   5. distillDeps()         — upstream docs as 3-5 bullet summaries
//   6. modelForTier()        — pro / flash / lite routing per doc

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  BRAND_KIT_REQUIRED_TYPES,
  brandKitBlock,
  compactPreamble,
  distillDeps,
  loadBrandKit,
  loadVentureContext,
  pickBrainSlice,
  type VentureContext,
} from "../_shared/venture-context.ts";
import { ensureSnapshotBrain } from "../_shared/snapshot-brain.ts";
import { brainCorpusBlock } from "../_shared/brain-corpus.ts";
import { trackTone } from "../_shared/track-tones.ts";
import {
  BASE_SYSTEM_PROMPT,
  modelForTier,
  specializedPrompt,
  stripCitations,
} from "../_shared/deliverable-prompts.ts";
import { renderSourcingBlock } from "../_shared/sourcing-classifier.ts";
import { aiFetch } from "../_shared/ai-fetch.ts";

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
          { role: "system", content: "You expand an AI website-builder master prompt. Return ONLY the delimiter-wrapped master prompt. No commentary, no code fences." },
          { role: "user", content: `Expand the master prompt below to 1,800-2,400 words while preserving all facts, exact numbered sections 1) through 11), and the exact closing line. Each numbered section must be substantive and implementation-ready.\n\n${stats.prompt}` },
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

// How hard the generator tries. Each retry round escalates the mode so we stop
// repeating the exact call that just failed:
//   full    — everything (default, first pass)
//   trimmed — drop the Second Brain corpus + sourcing block, cap deps
//   minimal — preamble + brain slice only, faster tier, longer timeout
type GenMode = "full" | "trimmed" | "minimal";

// Slim per-doc generator. Accepts a pre-loaded ctx so the same context is
// reused across the whole bulk job (we only refresh dep docs per call).
async function generateOne(
  supabase: any,
  ctx: VentureContext,
  documentType: string,
  mode: GenMode = "full",
) {
  const snapshotId = ctx.snapshotId;
  const snap = ctx.snap;
  const { data: type } = await supabase
    .from("venture_document_types")
    .select("*")
    .eq("type", documentType)
    .maybeSingle();
  if (!type) throw new Error(`Unknown document type: ${documentType}`);

  // Brand-kit gate: skip deliverables in BRAND_KIT_REQUIRED_TYPES until the
  // founder has locked their Brand Wizard. Mark the doc 'pending' with a
  // blocked_reason — blocked docs are never retried, they need the founder.
  let brandKit: Awaited<ReturnType<typeof loadBrandKit>> = null;
  if (BRAND_KIT_REQUIRED_TYPES.has(documentType)) {
    brandKit = await loadBrandKit(supabase, snapshotId);
    if (!brandKit || brandKit.status !== "locked") {
      await supabase.from("venture_documents").upsert({
        snapshot_id: snapshotId,
        document_type: documentType,
        status: "pending",
        blocked_reason: "Lock your Brand Wizard to unlock this asset.",
      }, { onConflict: "snapshot_id,document_type" });
      // Blocked isn't a failure — clear any stale error row for this doc.
      await supabase.from("venture_generation_failures")
        .delete().eq("snapshot_id", snapshotId).eq("document_type", documentType);
      return; // skip this doc, continue the job
    }
  }

  await supabase.from("venture_documents").upsert({
    snapshot_id: snapshotId,
    document_type: documentType,
    status: "generating",
    blocked_reason: null,
  }, { onConflict: "snapshot_id,document_type" });


  // Load + distill upstream dependency docs (no more full-markdown dumping).
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

  // Pick up any intake answers the founder previously saved for this doc.
  const { data: priorRow } = await supabase
    .from("venture_documents")
    .select("intake_answers")
    .eq("snapshot_id", snapshotId)
    .eq("document_type", documentType)
    .maybeSingle();
  const effectiveIntake = priorRow?.intake_answers && Object.keys(priorRow.intake_answers).length
    ? priorRow.intake_answers
    : null;

  // System prompt: specialized first, fallback to base; layer track tone on top.
  const baseSystemPrompt = specializedPrompt(documentType) ?? BASE_SYSTEM_PROMPT;
  const tone = trackTone(snap.track);
  const systemPrompt = tone ? `${baseSystemPrompt}\n\n${tone}` : baseSystemPrompt;

  // User prompt: compact preamble + brain slice (or raw fallback) + distilled deps.
  const brainSlice = pickBrainSlice(ctx.brain, type.context_keys ?? null);
  const preamble = compactPreamble(ctx);

  const brandBlock = brandKitBlock(brandKit);
  const sourcingBlock = renderSourcingBlock(snap.sourcing_profile, snap.research_brief?.sourcing);

  // Founder's Second Brain corpus, retrieved for this deliverable.
  // Retry rounds drop it — it's the biggest slice of the prompt and the most
  // common cause of context-length / slow-response failures.
  let corpusBlock = "";
  if (mode === "full") {
    try {
      corpusBlock = await brainCorpusBlock(
        supabase,
        ctx.userId,
        snap.id ?? null,
        [type.name, type.description ?? "", snap.concept_summary ?? ""].filter(Boolean).join(" \u2014 "),
        8,
      );
    } catch (e) {
      console.warn("brain corpus retrieval failed", e);
    }
  }


  // Retry rounds shrink the prompt progressively.
  const depBudget = mode === "full" ? 100_000 : mode === "trimmed" ? 6_000 : 0;
  const trimmedDeps = depContext ? depContext.slice(0, depBudget) : "";
  const promptCap = mode === "full"
    ? MAX_USER_PROMPT_CHARS
    : mode === "trimmed"
      ? Math.floor(MAX_USER_PROMPT_CHARS / 2)
      : Math.floor(MAX_USER_PROMPT_CHARS / 4);

  const userPrompt = [
    `# Document to produce: ${type.name}`,
    `Description: ${type.description}`,
    `Category: ${type.category}`,
    brandBlock,
    preamble,
    corpusBlock,
    mode === "full" ? sourcingBlock : "",
    brainSlice
      ? `\n## Venture brain (compressed, authoritative — every section must reflect these)\n${JSON.stringify(brainSlice, null, 2)}`
      : `\n## Venture brief (fallback — brain not yet computed)\n${JSON.stringify(snap.extracted_data ?? {}, null, 2)}`,
    // Only inject the raw research brief when brain isn't available.
    mode === "full" && !ctx.brain && snap.research_brief
      ? `\n## Research brief (background evidence — synthesize as analyst judgment, NO footnotes or citations)\n${JSON.stringify(snap.research_brief, null, 2).slice(0, 8000)}`
      : "",
    trimmedDeps ? `\n## Upstream documents you should build on (distilled)\n${trimmedDeps}` : "",
    effectiveIntake
      ? `\n## Intake answers (TOP PRIORITY — founder-supplied ground truth. Use every value verbatim; do not invent contradictory numbers.)\n${JSON.stringify(effectiveIntake, null, 2)}`
      : "",
  ].filter(Boolean).join("\n\n").slice(0, promptCap);

  // S5 — Honor type.model_tier ('pro' | 'flash' | 'lite'), except website_prd.
  // Website PRDs need a larger output budget, but must remain fast enough for
  // the edge runtime; Flash with max_tokens is more reliable than slow Pro.
  const isPrd = documentType === "website_prd";
  const modelId = mode === "minimal"
    ? modelForTier("flash")
    : isPrd ? modelForTier("flash") : modelForTier(type.model_tier);
  const maxTokens = isPrd ? 16000 : 16000;

  // Count the attempt before we make the call, so a hard crash still shows it.
  await supabase.rpc; // (no-op guard for older clients)
  {
    const { data: attemptRow } = await supabase
      .from("venture_documents")
      .select("generation_attempts")
      .eq("snapshot_id", snapshotId)
      .eq("document_type", documentType)
      .maybeSingle();
    await supabase.from("venture_documents")
      .update({ generation_attempts: (attemptRow?.generation_attempts ?? 0) + 1 })
      .eq("snapshot_id", snapshotId).eq("document_type", documentType);
  }


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
    throw new Error(`Gateway ${aiRes.status}`);
  }

  const aiJson = await aiRes.json();
  let raw = aiJson.choices?.[0]?.message?.content ?? "";
  const finishReason = aiJson.choices?.[0]?.finish_reason ?? aiJson.choices?.[0]?.finishReason ?? "";
  let truncated = String(finishReason).toLowerCase() === "length";
  let quality = 75;
  const qm = raw.match(/QUALITY_SCORE:\s*(\d{1,3})/i);
  if (qm) {
    quality = Math.max(0, Math.min(100, parseInt(qm[1], 10)));
    raw = raw.replace(/QUALITY_SCORE:\s*\d{1,3}\s*$/i, "").trim();
  }
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
  }, { onConflict: "snapshot_id,document_type" });

  // Cache brand_tokens for fast read by Brand Studio + website_prd.
  if (documentType === "visual_identity_brief") {
    const m = raw.match(/```json\s*([\s\S]*?)```/);
    if (m) {
      try {
        const tokens = JSON.parse(m[1]);
        await supabase.from("venture_snapshots").update({ brand_tokens: tokens }).eq("id", snapshotId);
      } catch { /* ignore parse error */ }
    }
  }

  // Hero image generation is lazy (DocumentViewer fires it on first open).
}


// Group document types into dependency layers (Kahn's algorithm).
// Each layer can run fully in parallel since all its deps are in earlier layers.
function dependencyLayers(types: any[]): any[][] {
  const byKey = new Map(types.map((t) => [t.type, t]));
  const remaining = new Set(types.map((t) => t.type));
  const layers: any[][] = [];
  while (remaining.size) {
    const layer: any[] = [];
    for (const key of remaining) {
      const t = byKey.get(key)!;
      const deps: string[] = t.dependencies ?? [];
      if (deps.every((d) => !remaining.has(d))) layer.push(t);
    }
    if (!layer.length) {
      // Cycle or missing dep — flush the rest so we don't infinite loop.
      layers.push(Array.from(remaining).map((k) => byKey.get(k)!));
      break;
    }
    layer.sort((a, b) => a.sort_order - b.sort_order);
    for (const t of layer) remaining.delete(t.type);
    layers.push(layer);
  }
  return layers;
}

const CONCURRENCY = 6;

async function runLayer(
  supabase: any,
  ctx: VentureContext,
  jobId: string,
  layer: any[],
  state: { done: number; total: number; fails: number; canceled: boolean },
) {
  const snapshotId = ctx.snapshotId;
  const { data: existingDocs } = await supabase
    .from("venture_documents")
    .select("document_type, status")
    .eq("snapshot_id", snapshotId)
    .in("document_type", layer.map((t) => t.type));
  const completeSet = new Set((existingDocs ?? []).filter((d: any) => d.status === "complete").map((d: any) => d.document_type));

  const pending = layer.filter((t) => !completeSet.has(t.type));
  state.done += layer.length - pending.length;

  let cursor = 0;
  async function worker() {
    while (cursor < pending.length) {
      const { data: jobRow } = await supabase
        .from("venture_generation_jobs")
        .select("cancel_requested")
        .eq("id", jobId)
        .maybeSingle();
      if (jobRow?.cancel_requested) { state.canceled = true; return; }

      const t = pending[cursor++];
      await supabase.from("venture_generation_jobs").update({
        current_document_type: t.type,
        heartbeat_at: new Date().toISOString(),
      }).eq("id", jobId);
      try {
        await generateOne(supabase, ctx, t.type);
        state.done++;
        state.fails = 0;
      } catch (e) {
        state.fails++;
        // F11: never let a runLayer crash swallow the failure silently.
        const msg = e instanceof Error ? e.message : String(e);
        try {
          await supabase.from("venture_generation_failures").insert({
            snapshot_id: snapshotId,
            document_type: t.type,
            error: `runLayer: ${msg.slice(0, 300)}`,
          });
        } catch { /* logging best-effort */ }
      }
      await supabase.from("venture_generation_jobs").update({
        progress_pct: Math.round((state.done / state.total) * 100),
        heartbeat_at: new Date().toISOString(),
      }).eq("id", jobId);
      if (state.fails >= 3) return;
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pending.length || 1) }, () => worker()));
}

async function runJob(supabase: any, snapshotId: string, jobId: string, category?: string | null) {
  // Build venture context ONCE per job. Compute or reuse the brain ONCE
  // before any docs run — subsequent generateOne() calls inherit both.
  const ctx = await loadVentureContext(supabase, snapshotId);
  if (!ctx.brain) {
    try {
      ctx.brain = await ensureSnapshotBrain(supabase, snapshotId);
    } catch (e) {
      console.warn("brain compute failed; falling back to raw blobs", e);
    }
  }

  const { data: allTypes } = await supabase
    .from("venture_document_types")
    .select("*")
    .eq("active", true);


  // Documents with an intake_schema require founder input — skip them in
  // bulk runs unless the founder has already saved intake_answers for them.
  const { data: savedIntakes } = await supabase
    .from("venture_documents")
    .select("document_type, intake_answers")
    .eq("snapshot_id", snapshotId);
  const haveAnswers = new Set(
    (savedIntakes ?? [])
      .filter((d: any) => d.intake_answers && Object.keys(d.intake_answers).length)
      .map((d: any) => d.document_type),
  );
  let types = (allTypes ?? []).filter(
    (t: any) => !t.intake_schema || haveAnswers.has(t.type),
  );

  // Skip sourcing-only asset types for non-physical-product ventures so they
  // don't sit as pending forever. Keep them for physical products, and always
  // keep them if the founder has explicitly saved intake for one.
  const SOURCING_ONLY_TYPES = new Set(["supplier_shortlist", "bom_and_landed_cost"]);
  const isPhysical = ctx.snap?.sourcing_profile?.is_physical_product === true;
  if (!isPhysical) {
    types = types.filter((t: any) => !SOURCING_ONLY_TYPES.has(t.type) || haveAnswers.has(t.type));
  }

  if (category && category.trim().length > 0) {
    const wanted = category.trim().toLowerCase();
    types = types.filter((t: any) => String(t.category ?? "").toLowerCase() === wanted);
  }

  const layers = dependencyLayers(types);
  const total = types.length;
  const state = { done: 0, total, fails: 0, canceled: false };

  await supabase.from("venture_generation_jobs").update({
    status: "running",
    started_at: new Date().toISOString(),
    heartbeat_at: new Date().toISOString(),
  }).eq("id", jobId);

  for (const layer of layers) {
    await runLayer(supabase, ctx, jobId, layer, state);
    if (state.canceled) {
      await supabase.from("venture_generation_jobs").update({
        status: "canceled",
        completed_at: new Date().toISOString(),
        progress_pct: Math.round((state.done / total) * 100),
        current_document_type: null,
      }).eq("id", jobId);
      return;
    }
    if (state.fails >= 3) {
      await supabase.from("venture_generation_jobs").update({
        status: "paused",
        circuit_breaker_open: true,
        error: `Paused after 3 consecutive failures`,
        progress_pct: Math.round((state.done / total) * 100),
      }).eq("id", jobId);
      return;
    }
  }

  await supabase.from("venture_generation_jobs").update({
    status: "completed",
    completed_at: new Date().toISOString(),
    progress_pct: 100,
    current_document_type: null,
  }).eq("id", jobId);

  if (!category) {
    await supabase.from("venture_snapshots").update({ status: "complete" }).eq("id", snapshotId);
  }
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { snapshotId, category } = await req.json();
    if (!snapshotId) return new Response(JSON.stringify({ error: "snapshotId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Identify caller from JWT — REQUIRED for every path.
    let callerId: string | null = null;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (authHeader.startsWith("Bearer ")) {
      const { data: userData } = await supabase.auth.getUser(authHeader.slice(7));
      callerId = userData?.user?.id ?? null;
    }
    if (!callerId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Gate: concept must be locked before any docs are generated.
    const { data: gateSnap } = await supabase
      .from("venture_snapshots")
      .select("concept_status, user_id")
      .eq("id", snapshotId)
      .maybeSingle();
    if (!gateSnap || gateSnap.concept_status !== "locked") {
      return new Response(JSON.stringify({ error: "Lock your concept summary before generating documents." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Ownership / admin check applies to EVERY path (full bulk + per-category).
    let isAdmin = false;
    if (gateSnap.user_id !== callerId) {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", callerId)
        .in("role", ["admin", "super_admin"]);
      isAdmin = (roleRow ?? []).length > 0;
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", callerId)
        .in("role", ["admin", "super_admin"]);
      isAdmin = (roleRow ?? []).length > 0;
    }

    // Full-bulk runs additionally require an unlock grant (non-admins).
    const isAllBulk = !category || String(category).trim().length === 0;
    if (isAllBulk && !isAdmin) {
      const { data: grant } = await supabase
        .from("bulk_unlock_grants")
        .select("id")
        .eq("user_id", callerId)
        .eq("snapshot_id", snapshotId)
        .is("revoked_at", null)
        .maybeSingle();
      if (!grant) {
        return new Response(JSON.stringify({ error: "unlock_required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Reuse a running job if there is one
    const { data: existing } = await supabase
      .from("venture_generation_jobs")
      .select("id, status")
      .eq("snapshot_id", snapshotId)
      .in("status", ["queued", "running"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let jobId = existing?.id as string | undefined;
    if (!jobId) {
      const { data: created, error } = await supabase
        .from("venture_generation_jobs")
        .insert({ snapshot_id: snapshotId, status: "queued", progress_pct: 0 })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      jobId = created.id;
    }

    const categoryArg = isAllBulk ? null : String(category);

    // Run in the background so the HTTP response returns immediately.
    // @ts-ignore: EdgeRuntime is provided by Supabase Edge Functions runtime.
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(runJob(supabase, snapshotId, jobId!, categoryArg));
    } else {
      runJob(supabase, snapshotId, jobId!, categoryArg).catch((e) => console.error("bulk job failed", e));
    }

    return new Response(JSON.stringify({ ok: true, jobId, category: categoryArg }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

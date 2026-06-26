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
import {
  compactPreamble,
  distillDeps,
  loadVentureContext,
  pickBrainSlice,
} from "../_shared/venture-context.ts";
import { ensureSnapshotBrain, markSnapshotBrainDirty } from "../_shared/snapshot-brain.ts";
import { trackTone } from "../_shared/track-tones.ts";
import {
  BASE_SYSTEM_PROMPT,
  modelForTier,
  OUTPUT_FOOTER,
  specializedPrompt,
  stripCitations,
} from "../_shared/deliverable-prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

// Remove footnote markers ([^1]) and any trailing Sources/References/Citations section.
function stripCitations(md: string): string {
  let out = md;
  // Drop trailing Sources/References/Citations section (and everything after it).
  out = out.replace(/\n#{1,6}\s*(sources|references|citations|bibliography|footnotes)\s*[\s\S]*$/i, "");
  // Drop inline footnote markers like [^1], [^12].
  out = out.replace(/\[\^[^\]]+\]/g, "");
  // Drop standalone footnote definition lines like [^1]: https://...
  out = out.replace(/^\s*\[\^[^\]]+\]:.*$/gm, "");
  // Collapse 3+ blank lines.
  out = out.replace(/\n{3,}/g, "\n\n");
  return out.trim();
}

// Track tone directives — mirrored from src/lib/tracks.ts. Keep in sync.
const TRACK_TONE: Record<string, string> = {
  lifestyle:
    "TRACK — Main Street Startup (DEFAULT for ~80% of workshop attendees): Write as a pragmatic operator coaching a FIRST-TIME main-street founder opening a real small business — café, salon, trade, local service, indie product, small e-commerce brand, or solo practice. Optimize for opening week, first 100 customers, first $10k in monthly revenue, cash on hand, and word-of-mouth. STRICTLY REPLACE every piece of VC vocabulary: instead of TAM/SAM/SOM use 'local market size + realistic first-year customer count'; instead of 'pitch deck / funding round / Series A' use 'one-page lender or partner summary' and simple funding sources (founder savings, friends & family, SBA microloan, revenue-based financing, local CDFI, grants); skip ARR, NRR, CAC payback, magic number, hockey-stick, unicorn. Use plain English a non-technical owner can act on this week. Prefer concrete dollar figures, named local channels (Google Business Profile, local SEO, neighborhood Instagram/TikTok, foot traffic, referrals, partnerships with neighboring businesses) over abstract growth loops. Budgets are owner-draw + single location by default; do not assume a hiring plan unless the intake specifies it.",
  ecommerce_dtc:
    "TRACK — E-commerce / DTC Brand: Write as a DTC operator coaching a FIRST-TIME brand founder launching a physical product online (Shopify, Amazon, marketplaces). Lead with hero-SKU clarity, COGS / landed cost / contribution margin, MOQ and supplier risk, packaging and unboxing, paid-social creative testing (Meta + TikTok), email/SMS as the owned channel, repeat-purchase rate and LTV, and 3PL vs self-ship fulfillment. Replace VC vocabulary with DTC realities: gross margin %, CAC by channel, AOV, contribution profit, blended ROAS, payback in orders. Skip ARR/NRR/hockey-stick. Use concrete dollar figures and creator/UGC tactics a solo founder can run this week.",
  scalable_tech:
    "TRACK — Scalable Tech / SaaS: Write as an early-stage tech operator briefing a venture-track founder. Lean into product-led growth, defensibility, retention/expansion, unit economics at scale, ICP precision, and venture-readiness. Use SaaS metrics (ARR, NRR, CAC payback, magic number) where relevant.",
  marketplace:
    "TRACK — Marketplace / Platform: Write as a marketplace strategist. Always reason about both/all sides explicitly — supply and demand, liquidity, cold-start, take-rate, trust & safety, network effects. Call out which side is hardest to acquire and why.",
  deep_tech:
    "TRACK — Deep Tech / Frontier: Write as a deep-tech advisor. Treat technical risk, milestone-based de-risking, IP/moat, regulatory pathway, capital intensity, and long time-to-revenue as first-class concerns. Reference grants, non-dilutive funding, and strategic partners alongside venture capital. Avoid lean-startup 'launch in a weekend' framing.",
  social_impact:
    "TRACK — Social Enterprise / Impact: Write as an impact-venture advisor. Hold mission and revenue as co-equal. Use theory-of-change language, measurable impact metrics alongside financial ones, and reference impact-aligned capital (grants, PRIs, blended finance). Avoid extractive growth-at-all-costs framing.",
  corporate:
    "TRACK — Corporate / Institutional: Write as a corporate-innovation / institutional-venture advisor. Treat enterprise procurement, compliance, security review, parent-org politics, and strategic alignment as first-class concerns. Use formal, board-ready language. Reference pilot-to-production motions, RFPs, and channel partnerships rather than viral consumer growth.",
};

// Specialized doc prompts (mirrors bulk-generate SPECIAL map).
// Documents produce only the executive-summary content. A separate edge function
// (`venture-generate-assessment`) produces the McKinsey-grade deep dive on demand.
const OUTPUT_FOOTER = `

OUTPUT RULES — STRICT:
- DO NOT use footnote markers ([^1], [^2], etc.).
- DO NOT add a "## Sources", "## References", or "## Citations" section.
- Present claims as analyst judgment grounded in the supplied research, not as footnoted quotes.

After the markdown, on a final line, output exactly:
QUALITY_SCORE: <0-100 integer reflecting completeness, specificity, and investor-readiness>`;

const QF = OUTPUT_FOOTER;
const SPECIAL: Record<string, string> = {
  website_prd: `You are a senior product writer producing a Website PRD that doubles as a paste-ready prompt for an AI website builder (Lovable, v0, Bolt, Cursor). Output Markdown: # {Company} — Website PRD; ## 1. Paste-ready prompt (single fenced \`\`\` block, 400-600 words); ## 2. Sitemap; ## 3. Page-by-page copy (H1, sub-headline, 3 sections H2 + 2-3 sentences, CTA); ## 4. SEO bundle (title <60ch, meta <160ch, 8-12 keywords with geo-modifiers when local, OG image prompt); ## 5. Tech checklist. Reuse upstream brand_tokens.${QF}`,
  brand_strategy_framework: `You are a brand strategist using Sinek Golden Circle + Aaker + Jung archetypes. Output Markdown: # {Company} — Brand Strategy; ## Purpose; ## Vision; ## Mission; ## Core Values (5); ## Audience Archetypes (2-3); ## Brand Promise; ## Positioning Statement (Geoffrey Moore: "For [target] who [need], [brand] is the [category] that [benefit] unlike [alternative]"); ## Brand Pillars (3-5); ## Personality (primary Jung archetype + 5-trait spectrum 1-5); ## Brand Essence (3-5 words).${QF}`,
  brand_messaging_house: `You are a senior copy chief. Output Markdown: # Messaging House; ## Tagline (primary + 3 alts); ## Elevator Pitch (15/30/60s); ## Brand Story (StoryBrand 7-part); ## Proof Points; ## Key Messages per Audience; ## Language Rules (do, don't, banned).${QF}`,
  visual_identity_brief: `You are a brand designer. Output Markdown: # Visual Identity; ## Logo Direction (concept + 3 moods); ## Color System (table: role, hex, usage, AA pair); ## Typography (heading + body with fallbacks); ## Iconography; ## Photography; ## Layout principles; ## Accessibility. ## Brand Tokens (JSON) — a SINGLE fenced \`\`\`json block, the ONLY JSON in the doc: {"colors":{"primary":"#hex","secondary":"#hex","accent":"#hex","bg":"#hex","fg":"#hex","muted":"#hex"},"fonts":{"heading":"Name","body":"Name"},"radius":"sm|md|lg","mood":["adj","adj","adj"]}. ## AI Logo Prompt — a SINGLE fenced \`\`\` block (200-300 words, no JSON).${QF}`,
  brand_voice_tone_guide: `You are a voice strategist. Output Markdown: # Voice & Tone; ## Voice Attributes (4 dimensions, opposing poles, 1-5 rating); ## Tone Shifts by Context (sales, support, crisis, social, errors); ## Reading Level (Flesch grade); ## Before/After Rewrites (5 examples); ## Inclusive-Language Rules; ## Cheat-sheet.${QF}`,
  brand_guidelines_pdf: `You are compiling the brand guidelines book. Output Markdown: # Brand Guidelines; ## At a Glance; ## Logo Usage (clear-space, min size, do/don'ts); ## Color (table hex/RGB/usage); ## Typography (hierarchy table); ## Imagery & Iconography; ## Voice & Tone summary; ## Messaging quick-reference; ## Asset Usage; ## File-naming; ## Approval Governance.${QF}`,
  social_media_audit_setup: `You are a social media strategist. Output Markdown: # Social Media Audit & Setup; ## Platform Fit Matrix (Instagram, TikTok, LinkedIn, X, YouTube, Facebook, Pinterest, Threads, Reddit — Recommendation [Yes/Maybe/Skip], Why, Effort, Time-to-impact); ## Primary Platforms (per Yes platform: handle checklist + 3 candidates, bio template x3 with char count, link-in-bio structure, profile/cover specs, pinned-post strategy); ## Hashtag & Keyword Seeds (15-25 per primary, geo-tagged if local); ## Accounts to Engage With (25 named from research_brief); ## First-Week Setup Checklist.${QF}`,
  content_strategy_pillars: `You are a content strategist. Output Markdown: # Content Strategy; ## Content Pillars (4-6: name, JTBD, % mix, formats, voice, metric); ## Content-to-Funnel Map (% TOFU/MOFU/BOFU/loyalty); ## POV Statements (3-5); ## Topic Universe (20 evergreen + 10 timely); ## Banned Topics; ## Cadence per platform.${QF}`,
  content_calendar_90day: `You are an editorial planner. Output Markdown: # 90-Day Content Calendar; ## Weeks 1-4 (Drafted) — 3 posts per primary platform per week: Day, Pillar, Platform, Format, Hook, Full body, CTA, Hashtags, Asset notes, Best-time; ## Weeks 5-12 (Outlined) — 3 brief outlines per week per platform; ## Batch Production Schedule; ## Repurposing Matrix (1 long → 5 short template).${QF}`,
  launch_content_kit: `You are a launch strategist. Output Markdown: # Launch Content Kit; ## 10 Launch Posts (Announcement, Founder Story, Problem, Solution Demo, Social Proof, FAQ, Hard CTA, Behind-the-Scenes, Manifesto, Partnership Ask — each with Platform, Caption, Image/Video prompt, Hashtags, Alt-text); ## 5 Email/DM Templates; ## Press One-Pager (headline, dek, 3 paragraphs, founder bio 80w, contact).${QF}`,
  community_engagement_playbook: `You are a community manager. Output Markdown: # Community Engagement Playbook; ## 10 Reply Scripts; ## Comment-Prompt Formulas (5); ## DM Funnel; ## UGC Scripts (3 with consent); ## Crisis-Response Decision Tree; ## Daily Ritual (60 min/day timeboxes); ## KPI Dashboard (reach, saves, shares, replies, profile→site→lead with target ranges).${QF}`,
  influencer_partnership_brief: `You are a creator-partnerships lead. Output Markdown: # Influencer & Partnership Brief; ## Tier Strategy (nano/micro/mid counts + budgets); ## 25 Named Candidate Creators (table: Name/Handle, Tier, Platform, Audience fit, Rate range, Why); ## Outreach Scripts (cold DM x3); ## Partnership Terms Template; ## Performance Tracking.${QF}`,
  paid_ads_starter_pack: `You are a performance marketer. Output Markdown: # Paid Ads Starter Pack; ## Budget Tiers ($300/$1k/$3k monthly with platform allocation); ## Audience Definitions (3 saved); ## Creative Concepts (top 2 platforms × 3 ads: Hook, Body, CTA, Visual prompt, Format); ## Conversion Tracking (Pixel/CAPI checklist, event names); ## Test-and-Iterate Framework (week-by-week plan, kill criteria).${QF}`,
  budget_pro_forma: `You are a CFO-grade financial analyst writing a Budget & Pro Forma for a founder. You will be given the founder's specific assumptions in an "## Intake answers" block — treat every number there as ground truth and propagate it through the model. Output Markdown:
# {Company} — Budget & Pro Forma
## Executive Summary (4-6 sentences: starting cash, break-even month, peak cash need / lowest cash month, runway, top 3 sensitivities, recommended funding ask if any)
## Key Assumptions (markdown table echoing the founder's intake answers — Item / Value / Notes — plus any derived figures you computed)
## 12-Month Operating Budget (markdown table; columns = M1..M12; rows = Revenue, COGS, Gross Profit, Gross Margin %, Payroll (incl. owner draw + planned hires phased by start month), Recurring Fixed Costs, One-Time Costs, Operating Expenses, EBITDA, Funding Inflows, Net Cash Flow, Ending Cash. Show currency with $ and thousands separators.)
## 3-Year Pro Forma (annual table; columns = Y1 / Y2 / Y3; rows = Revenue, COGS, Gross Profit, OpEx, EBITDA, Cash Flow, Headcount EOY. Y1 must reconcile to the 12-month budget totals. Y2 and Y3 must clearly state the growth assumption used.)
## Headcount Plan (table: Role / Start month / Monthly cost / Fully-loaded annual cost. Include the founder.)
## Sensitivity Scenarios (3 short tables — Base / Downside (-30% revenue ramp) / Upside (+30% revenue ramp). For each: Break-even month, Lowest cash month, Lowest cash balance, Required funding to stay above $0.)
## Funding Gap & Recommendation (1 short paragraph: when cash dips, how much to raise, what the money buys, and the suggested instrument given the track.)
Numbers must reconcile across sections. Never use TBD or placeholders. If a required input is missing from the intake, make a clearly-labeled reasonable assumption in the Key Assumptions table.${QF}`,
};

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

  // Ensure a snapshot brain exists — compute on demand if missing. This is
  // the compounded context every later deliverable will reuse.
  if (!ctx.brain && (snap.concept_summary || snap.research_brief || snap.business_concept)) {
    try {
      ctx.brain = await computeSnapshotBrain(supabase, snapshotId);
    } catch (e) {
      console.warn("brain compute failed, falling back to raw blobs", e);
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

  // Write fresh intake answers back into canonical store (S4). Best-effort —
  // never blocks generation. Compounds: next deliverable's intake prefills
  // from these, the Profile page shows them, and re-runs reuse them.
  if (intakeAnswers && Object.keys(intakeAnswers).length) {
    writeBackIntake(supabase, ctx.userId, intakeAnswers).catch((e) =>
      console.warn("intake writeback failed", e),
    );
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

  const baseSystem = `You are an AI venture analyst writing investor-grade documents.
Produce a single document in clean Markdown. Use ## headings, short paragraphs, and bullet lists.
Be specific, plausible, and actionable. Never use filler like "TBD" or "[insert ...]".
Target ~600-900 words unless the doc type is brief.${OUTPUT_FOOTER}`;

  const baseSystemPrompt = SPECIAL[documentType] ?? baseSystem;
  const trackTone = snap.track ? TRACK_TONE[snap.track] : null;
  const systemPrompt = trackTone
    ? `${baseSystemPrompt}\n\n${trackTone}`
    : baseSystemPrompt;

  // Build the user prompt. If we have a brain, use the sliced brain JSON
  // instead of dumping raw extracted_data + research_brief. Saves ~70% of
  // the previous prompt size and eliminates signal dilution.
  const brainSlice = pickBrainSlice(ctx.brain, type.context_keys ?? null);
  const preamble = compactPreamble(ctx);

  const userPrompt = [
    `# Document to produce: ${type.name}`,
    `Description: ${type.description}`,
    `Category: ${type.category}`,
    preamble,
    brainSlice
      ? `\n## Venture brain (compressed, authoritative — every section must reflect these)\n${JSON.stringify(brainSlice, null, 2)}`
      : `\n## Venture brief (fallback — brain not yet computed)\n${JSON.stringify(snap.extracted_data ?? {}, null, 2)}`,
    // Only dump the raw research brief when the brain doesn't yet exist.
    !ctx.brain && snap.research_brief
      ? `\n## Research brief (background evidence — synthesize as analyst judgment, NO footnotes or citations in the output)\n${JSON.stringify(snap.research_brief, null, 2).slice(0, 8000)}`
      : "",
    !ctx.brain && snap.business_concept ? `\n## Founder's raw concept\n${snap.business_concept}` : "",
    depContext ? `\n## Upstream documents you should build on (distilled)\n${depContext}` : "",
    effectiveIntake
      ? `\n## Intake answers (TOP PRIORITY — the founder provided these as ground-truth assumptions. Use every value verbatim; do not invent contradictory numbers.)\n${JSON.stringify(effectiveIntake, null, 2)}`
      : "",
    (rewriteFeedback && rewriteFeedback.trim()) || (rewriteTags && rewriteTags.length)
      ? `\n## Rewrite guidance from the founder (TOP PRIORITY — the previous version missed the mark, address every point below in this rewrite)\n${
          rewriteTags && rewriteTags.length ? `Tags: ${rewriteTags.join(", ")}\n\n` : ""
        }${rewriteFeedback?.trim() ?? ""}`
      : "",
  ].filter(Boolean).join("\n\n");


  // S5 — Per-deliverable model tier. Heavy strategy / financial docs use Pro
  // for deeper reasoning; everything else stays on Flash for speed + cost.
  const modelId = type.model_tier === "pro"
    ? "google/gemini-3.1-pro-preview"
    : "google/gemini-3-flash-preview";

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });


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

  // Extract quality score line
  let quality = 75;
  const qm = raw.match(/QUALITY_SCORE:\s*(\d{1,3})/i);
  if (qm) {
    quality = Math.max(0, Math.min(100, parseInt(qm[1], 10)));
    raw = raw.replace(/QUALITY_SCORE:\s*\d{1,3}\s*$/i, "").trim();
  }

  // Strip any citation residue the model may have produced despite instructions.
  raw = stripCitations(raw);

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
      return new Response(JSON.stringify({ error: "snapshotId and documentType required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: gateSnap } = await supabase
      .from("venture_snapshots")
      .select("concept_status")
      .eq("id", snapshotId)
      .maybeSingle();
    if (!gateSnap || gateSnap.concept_status !== "locked") {
      return new Response(JSON.stringify({ error: "Lock your concept summary before generating documents." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
    if (e instanceof GatewayError) {
      return new Response(JSON.stringify({ ok: false, error: message, gatewayStatus: e.status }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

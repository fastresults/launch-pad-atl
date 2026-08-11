// Founders Hub — Founder Roadmap & Workshop Synthesis.
// Reads the whole venture (snapshot + every completed document + research) and
// produces a single value-packed strategy debrief: verdict, opportunities, risks,
// a tactical 45-day sprint, and a sequenced 12-month plan.
// Persists onto venture_snapshots.roadmap_*.

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  compactPreamble,
  loadVentureContext,
  pickBrainSlice,
  type VentureContext,
} from "../_shared/venture-context.ts";
import { ensureSnapshotBrain } from "../_shared/snapshot-brain.ts";
import { brainCorpusBlock } from "../_shared/brain-corpus.ts";
import { stripCitations } from "../_shared/deliverable-prompts.ts";
import { aiFetch } from "../_shared/ai-fetch.ts";
import { jsonResponse, requireSnapshotOwner, requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const MAX_PROMPT_CHARS = 200_000;
const EXEC_SUMMARY_TYPE = "executive_summary";
// Strategy assets whose full text MUST be preserved even under budget pressure.
// Every other completed asset gets a large excerpt (see EXPANDED_EXCERPT_CHARS).
const PROTECTED_TYPES = new Set([
  EXEC_SUMMARY_TYPE,
  "financial_model",
  "budget_pro_forma",
  "value_proposition",
  "go_to_market_plan",
  "customer_personas",
  "problem_solution",
  "competitive_positioning",
  "market_analysis",
  "vision_mission",
  "brand_strategy_framework",
  "brand_messaging_house",
  "sales_playbook",
  "pricing_offer_sheet",
  "operating_plan",
]);
const EXPANDED_EXCERPT_CHARS = 3500;

// Track classification (mirrors src/lib/asset-tracks.ts). Kept in-file so the
// edge function has zero cross-package imports.
type AssetTrack = "Introduction" | "Education" | "Tracking" | "Action";
const ASSET_TRACK: Record<string, AssetTrack> = {
  executive_summary: "Introduction", vision_mission: "Introduction", problem_solution: "Introduction",
  ai_tool_stack_recommendation: "Education",
  value_proposition: "Introduction", pricing_offer_sheet: "Action",
  customer_personas: "Introduction", first_50_warm_list: "Tracking", crm_pipeline_starter: "Tracking",
  pre_sell_offer_test: "Action", landing_page_waitlist_test: "Action", presell_landing_prd: "Education",
  competitive_positioning: "Introduction", market_analysis: "Education",
  go_to_market_plan: "Education", sales_playbook: "Education", outbound_dm_email_scripts: "Action",
  booking_calendar_setup: "Action", sales_call_recording_stack: "Tracking", supplier_shortlist: "Action",
  brand_messaging: "Introduction", brand_messaging_house: "Introduction",
  brand_voice_tone_guide: "Education", brand_strategy_framework: "Education",
  legal_structure_brief: "Education", terms_privacy_refund_pack: "Action", insurance_starter: "Action",
  payments_checkout_setup: "Action", business_bank_books_starter: "Action",
  domain_email_dns_checklist: "Action", analytics_pixel_setup: "Tracking", email_marketing_setup: "Action",
  website_prd: "Education", visual_identity_brief: "Introduction", logo_brand_asset_pack: "Action",
  fulfillment_sop: "Education", customer_support_starter: "Action", operating_plan: "Education",
  ai_support_bot_setup: "Action", automation_recipes_starter: "Action", bom_and_landed_cost: "Tracking",
  launch_content_kit: "Action", content_calendar_90day: "Tracking", social_media_audit_setup: "Tracking",
  founder_operating_cadence: "Tracking",
  paid_ads_starter_pack: "Action", reviews_testimonials_kit: "Action", financial_model: "Tracking",
  ad_creative_pack: "Action", referral_affiliate_starter: "Action",
};
const TRACK_ORDER: AssetTrack[] = ["Introduction", "Education", "Tracking", "Action"];
function trackFor(k: string): AssetTrack { return ASSET_TRACK[k] ?? "Action"; }
function labelFor(k: string): string {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
const STRUCTURE_VERSION = 2;

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
  const n = detail.toLowerCase();
  if (status === 403 && n.includes("credit_limit_reached")) {
    return "Founder Roadmap is paused because the workspace AI Gateway credit limit has been reached.";
  }
  if (status === 402 || n.includes("credits exhausted")) {
    return "Founder Roadmap is paused — our team has been notified.";
  }
  if (status === 429) return "Founder Roadmap is rate limited. Please try again shortly.";
  if (status === 401 || status === 403) return "Founder Roadmap is unavailable — AI Gateway rejected the request.";
  return "Founder Roadmap is currently unavailable. Please try again shortly.";
}

// stripCitations is imported from _shared/deliverable-prompts.ts

function smartExcerpt(md: string, budget: number): string {
  if (!md) return "";
  if (md.length <= budget) return md;
  const headLen = Math.floor(budget * 0.6);
  const tailLen = Math.floor(budget * 0.25);
  const head = md.slice(0, headLen);
  const tail = md.slice(-tailLen);
  const headings = (md.match(/^#{1,6}\s.+$/gm) ?? []).slice(0, 50).join("\n");
  return `${head}\n\n…\n\n[outline of skipped sections]\n${headings}\n\n…\n\n${tail}`;
}

const SYSTEM_PROMPT = `You are a senior founding partner writing the closing playbook for a founder who has just spent 14 days in a deep AI-first venture workshop and now holds a full startup kit spanning four tracks: Introduction (positioning, personas, vision), Education (strategy, playbooks, PRDs), Tracking (financials, calendars, pipelines, analytics), and Action (legal, payments, ops, ads, brand pack, automations). The exact number of assets in this kit is stated in the "KIT FACTS" block at the top of the user message — always use THAT number, never a memorized figure. This roadmap is the capstone — the single document they will hand to their co-founder, spouse, angel, or VC. It must feel like the most valuable artifact from the workshop: narrative, confident, encouraging, brutally specific, and grounded in the actual assets they built.

ANTI-LEGACY GUARDRAILS — CRITICAL
The source assets in this bundle may themselves contain outdated counts, prices, timelines, or program shapes from an earlier version of the workshop (e.g. "34 deliverables", "12-week incubator", "$197 workshop", "single morning"). These figures are stale. Do NOT quote them. Rules:
- The only trustworthy counts of assets, tracks, and sprint length are in the "KIT FACTS" block. Prefer those numbers verbatim.
- If a source asset states a deliverable count, program length, price, or bundle description that contradicts KIT FACTS, silently supersede it with the KIT FACTS value. Do not caveat.
- Never write phrases like "34 deliverables", "in a single morning", "12-week incubator", "$197 workshop seat" unless those exact figures appear in KIT FACTS.
- When describing what the founder has built, describe the assets by category and use the actual count from KIT FACTS ("your kit of N founder-ready assets across four tracks"), not any legacy shorthand from an older program version.

VOICE & TONE
- Second person. Warm, confident, partner-to-founder. Never patronizing, never hype.
- Use the founder's first name in the opening verdict and the closing note.
- Use the company name verbatim throughout.
- Every Part and every Chapter opens with 2–3 sentences of prose before any list or table. Prose carries meaning; lists and tables only support it.
- Cite real numbers, real prices, real channels, real ICP names, real hires, real vendors, real domains, real ad spend from the kit. No generic startup advice. No filler phrases ("leverage synergies", "unlock potential", "in today's fast-paced landscape", "robust solution").
- Do NOT summarize documents one-by-one. Synthesize across them.

SOURCE TAGS — REQUIRED
Every substantive claim, number, or recommendation must carry an inline source tag in the form \`[from: Asset Name]\` using the human-readable asset name (e.g. \`[from: Financial Model]\`, \`[from: Go To Market Plan]\`). Rules:
- Max 2 tags per paragraph, placed at the end of the sentence they support.
- Only tag assets that actually appear in the "All completed assets" bundle.
- Never invent asset names. If a fact cannot be traced to an asset, don't tag it.

OUTPUT FORMAT — clean Markdown only. Begin with this exact H1:

# Your Founder Roadmap

Then the following H2 sections IN THIS EXACT ORDER, using these EXACT headings.

## Cover & Verdict
One short paragraph. Name the founder by first name. Name the company. State in one plain sentence what the business is. End with a confident-but-honest one-line verdict. Avoid percentages you cannot defend from the kit.

## Stat Strip
A markdown table with two columns, header row \`| Metric | Value |\`. Include **6 to 8 rows** chosen dynamically from what the kit actually contains. Each row must reflect a fact traceable to a specific asset, and each row's Value must end with a source tag \`[from: Asset Name]\`. Suggested candidates (pick the strongest 6–8): Target ICP, Market opportunity, Assets built this sprint, Sprint days completed, Recommended Year-1 revenue, Recommended raise, Startup costs to open, Breakeven month, Primary GTM channel, Brand system status, Financial model status, Legal structure, Payments stack, Analytics stack, First key hire. Keep each value under 55 characters (excluding the tag).

## Part I — The Business You've Built
_Synthesized from: Executive Summary, Vision & Mission, Problem/Solution, Value Proposition, Pricing Offer Sheet, Customer Personas._

### Chapter 1 — The concept in plain English
Narrative prose, 4–6 paragraphs. Concept, wedge, ICP at a glance, pricing logic, GTM motion. End with a single italicized line: *Why this matters:* …

### Chapter 2 — Who you're building for
One paragraph naming the ICP in plain English. Then a vivid 4–6 sentence day-in-the-life vignette of one named archetype. Then three bold lead-ins: **What they're trying to do** · **What they've already tried** · **What "good" looks like to them**. End with a markdown table: Trigger | Buying moment | Where to find them | What they need to hear first (3–4 rows).

### Chapter 3 — Why this can win
One paragraph framing the strategic case. Then three numbered narrative arguments (1., 2., 3.) — each anchored to a specific asset by name via source tag and ending with one concrete proof point.

## Part II — The Market You're Entering
_Synthesized from: Competitive Positioning, Market Analysis, Brand Strategy Framework._

### Chapter 4 — The field
One paragraph reading the market like a strategist. Then **The players you'll be compared to** — one paragraph naming 3–5 real competitors and how they compete. Then **Where you win** — markdown table: Competitor | How they win today | Where they're weak | Your move (3–5 rows). Then **The shift in your favor** — one paragraph on the macro trend. Then **What would have to be true for them to copy you** — 2–3 honest sentences on defensibility.

### Chapter 5 — The honest fight ahead
One paragraph of encouragement framing risk as the work, not the verdict. Then a markdown table: Challenge | Why it's real | How you'll meet it | Asset already in your kit (4–6 rows). No fear-mongering.

## Part III — Your Growth Engine
_Synthesized from: Go To Market Plan, Sales Playbook, Outbound DM & Email Scripts, First 50 Warm List, CRM Pipeline Starter, Content Calendar 90-Day, Launch Content Kit, Paid Ads Starter Pack, Ad Creative Pack, Referral & Affiliate Starter, Email Marketing Setup, Reviews & Testimonials Kit._

Open with 2–3 sentences on the shape of the growth engine the founder has assembled. Then four bold lead-ins:
**The channel mix you've committed to** — one paragraph naming the primary + secondary channels, with source tags.
**Your sales motion, day-by-day** — one paragraph tracing lead → qualified → close, referencing playbook + pipeline stages.
**The 90-day content and ads plan** — markdown table: Week | Content beat | Paid asset | Owner | KPI (5–7 rows).
**Compounders you've already set up** — 3–5 bullet lines naming referral, reviews, email nurture, retargeting — each tagged.

## Part IV — Your Brand System
_Synthesized from: Brand Strategy Framework, Brand Messaging House, Brand Voice & Tone Guide, Visual Identity Brief, Logo & Brand Asset Pack._

Open with 2–3 sentences on the strategic role the brand plays for this specific ICP. Then:
**Positioning in one line** — the sharpest single-sentence statement of what you stand for, drawn verbatim from the messaging house.
**Voice in three words** — three adjectives, each with a one-line "how you sound / how you don't" contrast.
**How the brand shows up** — a short paragraph naming the primary visual moves (color, mark, typography, imagery direction) and where they appear first (site, deck, pack, ads).
**What to lock next** — 3–4 bullet lines of the next brand decisions to make (naming variants, iconography, brand video, packaging, etc.).

## Part V — Your Operating System
_Synthesized from: Legal Structure Brief, Terms/Privacy/Refund Pack, Insurance Starter, Payments Checkout Setup, Business Bank & Books Starter, Domain/Email/DNS Checklist, Analytics Pixel Setup, Fulfillment SOP, Customer Support Starter, Operating Plan, AI Support Bot Setup, Automation Recipes Starter, Founder Operating Cadence._

Open with 2–3 sentences: the machine that keeps the business running while the founder sells. Then a markdown table: Layer | What's live | What's next | Asset (5–8 rows covering Legal, Money, Web/DNS, Analytics, Fulfillment, Support, Automation, Cadence). Then **The five automations doing the most work for you** — a numbered list, each with the trigger → action → asset.

## Part VI — Money, Runway & Unit Economics
_Synthesized from: Financial Model, Budget/Pro Forma, Pricing Offer Sheet, BOM & Landed Cost (if present)._

Open with 2–3 sentences of plain-English narrative: starting cash, monthly burn, when money runs out, what to raise, when to raise it. Then a markdown table: Metric | Value | Source (rows: Starting cash · Monthly burn · Breakeven month · Funding gap · Recommended raise · Best window to raise · Gross margin · CAC:LTV target). Use real numbers; if a number is missing, say so plainly and name the asset to update next.

## Part VII — The Next 90 Days (Day 15 → Day 105)
Open with one paragraph: the 14-Day Sprint is finished; this is the 90 days that turn plan into proof. Numbering starts at Day 15 because the founder already completed Days 1–14. Then four subsections, each opening with a 1–2 sentence theme paragraph before the action list:
### Days 15–30 — Validation fortnight
### Days 31–50 — First commitments
### Days 51–75 — Build the proof
### Days 76–105 — Pitch-ready
Each action: concrete verb-first line · owner role · dependency · success metric · source tag. End with a bold standalone line **By Day 105, you will have:** followed by 4–6 bullet outcomes.

## Part VIII — Year One, In Three Phases
Open with one paragraph explicitly picking up from the Day-105 outcomes. Then three named phases as H3s, each with a 1-paragraph narrative lead before the month list:
### Phase 1 — Validate (Months 4–6)
### Phase 2 — Build (Months 7–9)
### Phase 3 — Compound (Months 10–12)
Inside each phase, list each month with: month label · theme · 2–3 outcomes · the single KPI to watch · source tag. Year must be internally consistent with Part VII.

## Part IX — How to Talk About This
### Your 60-second pitch
Ready-to-read-aloud paragraph in the founder's first-person voice ("We are…"). ~120 words.
### The 1-paragraph email version
4–5 sentence version for a cold email. First-person.
### Three numbers to memorize
Three lines, each: the number · what it means · why an investor (or banker/partner for lifestyle track) will care.
### Three questions a smart reader will ask
Three Q/A pairs. Each answer 2–3 sentences, anchored by source tag.

## Part X — Your Operating Cadence
One paragraph on habits that compound. Then three bold lead-ins: **Weekly** · **Monthly** · **Quarterly** — each 2–4 lines tailored to this venture's track and stage.

## Read Next From Your Kit
One short paragraph, then a markdown table: Track | Read next | Why now | Do next | Why now — one row per track (Introduction, Education, Tracking, Action). Each cell in the "Read next" and "Do next" columns must name a real asset from this kit, using its human-readable name. Pick assets the founder is most likely to have skimmed but not fully worked through.

## Why This Matters
One personal-tone paragraph to the founder by first name. Then three bold lead-ins: **The bigger shift you're part of** · **Who is better off if you win** · **The story you'll get to tell in 5 years**. Close with the single italic line: *This is why it's worth the next 1,000 days.*

## The Road Ahead, and Who's With You
One paragraph leveling with the founder by first name. Then three bold lead-ins: **What the next year will actually ask of you** · **The decisions that will define this year** · **How to stay standing**. Then a clearly framed closing block beginning with this exact bold line on its own:
**You're not doing this alone — Team Evove is here.**
Follow with a 4–6 sentence warm partner-voice paragraph naming Team Evove as the standing extended team (senior strategists, technologists, graphic designers, brand and growth specialists). Tie the offer specifically to where THIS venture is weakest. End with this exact italicized sentence: *Whenever you need a second brain, a second pair of hands, or a sounding board — Team Evove is one message away.*

## The One Thing
A single blockquote (> ) of 2–3 sentences naming the ONE move for the next 30 days that will most change their odds. Specific, named, encouraging.

## Closing Note
3 sentences, signed-off feel. Address the founder by first name. Acknowledge the work. Send them moving.

STRICT RULES
- Part VII starts at Day 15 and Part VIII Phase 1 begins at Month 4 — they MUST connect to Day 105 outcomes.
- Every Part opens with the italicized "_Synthesized from: …_" line listing the assets it draws on.
- Be aligned with the Executive Summary. Resolve contradictions inside the prose.
- No footnote markers. No "Sources/References/Citations" sections. No [^1]. Source tags \`[from: …]\` are the ONLY attribution mechanism.
- No doc-by-doc rehash. No filler. No emoji. No headings other than those listed.
- Real names from the kit — assets, ICP, pricing, company, channels — verbatim.

After the markdown, on the LAST two lines, output exactly:
QUALITY_SCORE: <0-100 integer reflecting specificity, actionability, narrative quality, and partner-readiness>
COVERAGE: <JSON object of the form {"used":["Asset Name",...],"skipped":["Asset Name",...]} listing every asset from the kit you meaningfully drew on vs. did not. Names must match the human-readable names shown in the bundle.>`;

function buildContextBundle(ctx: VentureContext, allDocs: any[]) {
  const snap = ctx.snap;
  const sections: { protect: boolean; body: string }[] = [];

  // Compact preamble (founder + location + concept + tokens + confirmed numbers)
  // replaces the legacy founderCard JSON dump + raw extracted_data dump.
  sections.push({ protect: true, body: `# Venture: ${snap.company_name ?? "(unnamed)"}` });
  sections.push({ protect: true, body: compactPreamble(ctx) });

  // KIT FACTS — authoritative counts the model must prefer over any legacy
  // numbers embedded in source assets (e.g. "34 deliverables", "12-week"
  // program, "$197 workshop"). These are the ONLY trustworthy figures for
  // program shape, asset count, and sprint length.
  const completedDocs = allDocs.filter((d: any) => d.content);
  const kitByTrack: Record<AssetTrack, number> = { Introduction: 0, Education: 0, Tracking: 0, Action: 0 };
  for (const d of completedDocs) kitByTrack[trackFor(d.document_type)]++;
  const kitFacts = [
    `## KIT FACTS — authoritative counts (override any legacy figures in source assets)`,
    `- Total completed assets in this kit: **${completedDocs.length}**`,
    `- Tracks covered: Introduction (${kitByTrack.Introduction}), Education (${kitByTrack.Education}), Tracking (${kitByTrack.Tracking}), Action (${kitByTrack.Action})`,
    `- Sprint length: **14 days** (Days 1–14 completed; roadmap Day 15 → Day 365 forward-looking)`,
    `- If a source asset mentions "34 deliverables", "12-week incubator", "$197 workshop", "single morning", or any earlier program shape, treat it as stale and use these KIT FACTS instead. Do not repeat those legacy phrases.`,
  ].join("\n");
  sections.push({ protect: true, body: kitFacts });

  // Brain slice — every key, since the roadmap synthesizes across the entire venture.
  const brainSlice = pickBrainSlice(ctx.brain, null);
  if (brainSlice) {
    sections.push({
      protect: true,
      body: `## Venture brain (compressed, authoritative)\n${JSON.stringify(brainSlice, null, 2)}`,
    });
  } else if (snap.extracted_data) {
    // Fallback when no brain yet — keep the raw blob.
    sections.push({
      protect: true,
      body: `## Venture brief (fallback)\n${JSON.stringify(snap.extracted_data, null, 2)}`,
    });
  }

  if (snap.research_brief) {
    sections.push({
      protect: false,
      body: `## Research brief (background evidence — NO citations in output)\n${JSON.stringify(snap.research_brief, null, 2)}`,
    });
  }

  // Executive Summary first, untouched
  const exec = allDocs.find((d) => d.document_type === EXEC_SUMMARY_TYPE);
  if (exec?.content) {
    sections.push({
      protect: true,
      body: `## EXECUTIVE SUMMARY — north-star narrative the roadmap MUST align with\n${exec.content}`,
    });
  }

  // All other completed sibling docs — grouped by track so the model can
  // synthesize per bucket (Introduction / Education / Tracking / Action).
  const siblings = allDocs.filter((d: any) => d.content && d.document_type !== EXEC_SUMMARY_TYPE);
  if (siblings.length) {
    const byTrack: Record<AssetTrack, any[]> = { Introduction: [], Education: [], Tracking: [], Action: [] };
    for (const d of siblings) byTrack[trackFor(d.document_type)].push(d);
    for (const t of TRACK_ORDER) {
      byTrack[t].sort((a, b) => a.document_type.localeCompare(b.document_type));
    }
    const trackBlocks: string[] = [];
    for (const t of TRACK_ORDER) {
      if (!byTrack[t].length) continue;
      const rows: string[] = [];
      for (const d of byTrack[t]) {
        const protect = PROTECTED_TYPES.has(d.document_type);
        const intake = d.intake_answers && Object.keys(d.intake_answers).length
          ? `\n_intake answers:_ ${JSON.stringify(d.intake_answers)}\n`
          : "";
        const body = protect ? d.content : smartExcerpt(d.content, EXPANDED_EXCERPT_CHARS);
        const dassess = d.deep_assessment ? `\n\n_deep assessment:_\n${smartExcerpt(d.deep_assessment, 1200)}` : "";
        rows.push(`#### ${labelFor(d.document_type)} \`(${d.document_type})\`${protect ? " [PROTECTED]" : ""}${intake}\n${body}${dassess}`);
      }
      trackBlocks.push(`### Track: ${t}\n${rows.join("\n\n---\n\n")}`);
    }
    sections.push({ protect: false, body: `## All completed assets (grouped by track)\n${trackBlocks.join("\n\n===\n\n")}` });
  }

  return sections;
}

function fitToBudget(sections: { protect: boolean; body: string }[]): string {
  let total = sections.reduce((n, s) => n + s.body.length, 0);
  if (total <= MAX_PROMPT_CHARS) return sections.map((s) => s.body).join("\n\n");
  const order = sections
    .map((s, i) => ({ i, len: s.body.length, protect: s.protect }))
    .filter((x) => !x.protect)
    .sort((a, b) => b.len - a.len);
  for (const { i } of order) {
    if (total <= MAX_PROMPT_CHARS) break;
    const overflow = total - MAX_PROMPT_CHARS;
    const targetLen = Math.max(1200, sections[i].body.length - overflow - 200);
    const before = sections[i].body.length;
    sections[i].body = smartExcerpt(sections[i].body, targetLen);
    total -= before - sections[i].body.length;
  }
  return sections.map((s) => s.body).join("\n\n");
}

async function generateRoadmap(supabase: any, snapshotId: string) {
  // Shared builder: single read for snap + brief + founder + market + profile
  // + brain + source materials. Eliminates the per-function snapshot reload.
  const ctx = await loadVentureContext(supabase, snapshotId);
  // Honor the brain dirty flag — recompute if intake / source / concept changed.
  try { ctx.brain = await ensureSnapshotBrain(supabase, snapshotId); } catch { /* fall through to fallback */ }

  const { data: allDocs } = await supabase
    .from("venture_documents")
    .select("document_type, content, intake_answers, deep_assessment, status")
    .eq("snapshot_id", snapshotId)
    .eq("status", "complete");
  if (!allDocs || !allDocs.length) throw new Error("No completed documents to synthesize");

  await supabase
    .from("venture_snapshots")
    .update({ roadmap_status: "generating" })
    .eq("id", snapshotId);

  const bundle = buildContextBundle(ctx, allDocs);

  // Founder's Second Brain corpus — protected so budget-fitting keeps it.
  try {
    const corpus = await brainCorpusBlock(
      supabase,
      ctx.userId,
      snapshotId,
      [ctx.snap.company_name ?? "", ctx.snap.concept_summary ?? "", "365-day roadmap"].filter(Boolean).join(" \u2014 "),
      8,
    );
    if (corpus) bundle.push({ protect: true, body: corpus });
  } catch (e) {
    console.warn("brain corpus retrieval failed", e);
  }

  const userPrompt = fitToBudget(bundle);
  const snap = ctx.snap;

  const TRACK_ADDENDUM: Record<string, string> = {
    lifestyle: `\n\nTRACK OVERRIDE — Main Street Startup (first-time founder opening a real small business: café, salon, trade, local service, indie product, small e-commerce brand). Apply these adjustments to every chapter:
- Chapter 4 "The Field You're Entering" focuses on HYPERLOCAL competitors within 5–10 miles, not category leaders.
- Chapter 6 "Your First 45 Days" is framed as OPENING-WEEK milestones (permits, suppliers, soft launch, first 10 paying customers, first review on Google) — not fundraising milestones.
- Chapter 8 "Money & Runway" replaces "raise / instrument" with startup costs, working capital, owner draw, and simple funding sources (savings, friends & family, SBA microloan, revenue-based financing, local CDFI, grants).
- Chapter 9 "How to Talk About This" pitches a one-page lender/partner summary, NOT a VC pitch. The "investor will ask" Q&A becomes "a banker or local partner will ask".
- Stat Strip: replace "Recommended raise" with "Startup costs to open" and "Market opportunity" with "Realistic Year-1 customer count".
- Throughout: zero VC vocabulary (no TAM/SAM/SOM, no Series A, no ARR, no hockey-stick). Plain English, dollar figures, named local channels (Google Business Profile, neighborhood Instagram, foot traffic, referrals, partnerships with neighboring businesses).`,
  };
  const trackAddendum = snap.track && TRACK_ADDENDUM[snap.track] ? TRACK_ADDENDUM[snap.track] : "";
  const systemPrompt = SYSTEM_PROMPT + trackAddendum;

  const aiRes = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  }, { timeoutMs: 120_000 });

  if (!aiRes.ok) {
    const txt = await aiRes.text();
    await supabase
      .from("venture_snapshots")
      .update({ roadmap_status: "failed" })
      .eq("id", snapshotId);
    await supabase.from("venture_generation_failures").insert({
      snapshot_id: snapshotId,
      document_type: "founder_roadmap",
      error: `Roadmap gateway ${aiRes.status}: ${txt.slice(0, 300)}`,
    });
    throw new GatewayError(aiRes.status, txt);
  }

  const aiJson = await aiRes.json();
  let raw = aiJson.choices?.[0]?.message?.content ?? "";

  // Parse QUALITY_SCORE + COVERAGE trailers (either order, either on last lines).
  let quality = 80;
  const qm = raw.match(/QUALITY_SCORE:\s*(\d{1,3})/i);
  if (qm) {
    quality = Math.max(0, Math.min(100, parseInt(qm[1], 10)));
    raw = raw.replace(/^\s*QUALITY_SCORE:\s*\d{1,3}\s*$/im, "").trim();
  }
  let modelCoverage: { used?: string[]; skipped?: string[] } | null = null;
  const cm = raw.match(/COVERAGE:\s*(\{[\s\S]*\})\s*$/i);
  if (cm) {
    try { modelCoverage = JSON.parse(cm[1]); } catch { modelCoverage = null; }
    raw = raw.replace(/^\s*COVERAGE:\s*\{[\s\S]*\}\s*$/im, "").trim();
  }

  raw = stripCitations(raw);
  if (!/^#\s*Your Founder Roadmap/im.test(raw)) {
    raw = `# Your Founder Roadmap\n\n${raw}`;
  }
  const wordCount = raw.split(/\s+/).filter(Boolean).length;

  // Coverage manifest: cross-reference what the model claims vs what we actually
  // detect via [from: Asset Name] tags in the markdown, grouped by track.
  const allNames = new Map<string, string>(); // labelLower -> document_type
  for (const d of allDocs as any[]) allNames.set(labelFor(d.document_type).toLowerCase(), d.document_type);
  const tagRegex = /\[from:\s*([^\]]+?)\]/gi;
  const detectedLabels = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(raw)) !== null) {
    const name = m[1].trim();
    if (allNames.has(name.toLowerCase())) detectedLabels.add(name);
  }
  const usedTypes = new Set<string>();
  for (const label of detectedLabels) {
    const t = allNames.get(label.toLowerCase());
    if (t) usedTypes.add(t);
  }
  // Union with model-declared "used"
  for (const label of modelCoverage?.used ?? []) {
    const t = allNames.get(label.toLowerCase());
    if (t) usedTypes.add(t);
  }
  const perTrack: Record<AssetTrack, { total: number; used: number }> = {
    Introduction: { total: 0, used: 0 }, Education: { total: 0, used: 0 },
    Tracking: { total: 0, used: 0 }, Action: { total: 0, used: 0 },
  };
  const skipped: string[] = [];
  for (const d of allDocs as any[]) {
    const t = trackFor(d.document_type);
    perTrack[t].total += 1;
    if (usedTypes.has(d.document_type)) perTrack[t].used += 1;
    else skipped.push(labelFor(d.document_type));
  }
  const coverage = {
    version: STRUCTURE_VERSION,
    total_assets: (allDocs as any[]).length,
    used_count: usedTypes.size,
    used_types: [...usedTypes],
    skipped_labels: skipped,
    tag_matches: [...detectedLabels],
    per_track: perTrack,
  };

  await supabase
    .from("venture_snapshots")
    .update({
      roadmap_content: raw,
      roadmap_quality_score: quality,
      roadmap_word_count: wordCount,
      roadmap_status: "complete",
      roadmap_generated_at: new Date().toISOString(),
      roadmap_coverage: coverage,
      roadmap_structure_version: STRUCTURE_VERSION,
    })
    .eq("id", snapshotId);

  return { quality, wordCount, coverage };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { snapshotId } = await req.json();
    if (!snapshotId) {
      return jsonResponse({ error: "snapshotId required" }, 400, corsHeaders);
    }
    const auth = await requireUser(req, corsHeaders);
    if (auth.error) return auth.error;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const own = await requireSnapshotOwner(supabase, snapshotId, auth.userId!, corsHeaders);
    if (own.error) return own.error;
    const result = await generateRoadmap(supabase, snapshotId);
    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (e instanceof GatewayError) {
      return new Response(JSON.stringify({ ok: false, error: message, gatewayStatus: e.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

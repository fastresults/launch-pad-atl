// Founders Hub — generate one venture document.
// Loads the snapshot + document_type spec + any dependency docs, asks the
// Lovable AI Gateway to produce markdown, scores it, and persists the row.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

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
    "TRACK — Lifestyle / Main Street: Write as a pragmatic operator coaching a sole founder. Optimize for cash flow, simplicity, low overhead, and local credibility. Avoid VC jargon, TAM/SAM/SOM framing, hockey-stick growth, and unicorn aspirations. Use concrete, plain-English tactics a non-technical owner can execute this week.",
  small_business:
    "TRACK — Small Business / Traditional: Write as a seasoned small-business advisor. Emphasize unit economics, margin, repeat customers, operational discipline, and steady regional growth. Avoid venture-capital framing; prefer SBA / bank-financing realities and proven owner-operator playbooks.",
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
//
// Every doc is rendered in TWO parts:
//   1. "## Executive Summary" — the concise, investor-ready structure spec'd per-doc below.
//   2. "## McKinsey-Grade Assessment" — a rigorous analytical deep dive.
// No citations, no footnotes, no Sources section.
const DEEP_DIVE = `

OUTPUT STRUCTURE — MANDATORY, applies to EVERY document type:

Produce TWO sections in this exact order:

## Executive Summary
Follow the document-specific structure described above verbatim (headings, tables, JSON blocks, fenced prompt blocks all live inside this section). Keep it concise, scannable, investor-ready (~500-700 words; brief doc types can be shorter).

---

## McKinsey-Grade Assessment
A rigorous, partner-level analytical deep dive tailored to THIS document type (~700-1100 words). Use these subsections (### h3) — adapt wording so they read natural for the doc, but cover every angle:

### Situation & Context
Frame the problem, the founder's position, and what's actually at stake. Reference specifics from the venture brief and research.

### Key Assumptions
Numbered list. For each: the assumption + confidence (High / Medium / Low) + why.

### Pressure Test — What Could Go Wrong
3-6 sharpest counter-arguments, market realities, competitive responses, or execution traps an experienced partner would raise.

### Quantified Sensitivities / Scenarios
Where the doc has any numbers (pricing, CAC, conversion, runway, market size, channel mix, etc.) include a small Markdown table with Base / Upside / Downside columns and the key drivers. If the doc is purely qualitative (e.g. brand voice), substitute a 2x2 or trade-off matrix.

### Risks & Mitigations
Table: Risk | Likelihood (H/M/L) | Impact (H/M/L) | Mitigation.

### What Would Have to Be True
3-5 crisp, testable conditions for this plan to succeed.

### 30 / 60 / 90-Day Actions
Concrete actions per horizon. Each action: owner role + verifiable outcome.

### Confidence Summary
1-2 sentences: overall confidence in this document, the biggest unknown, and the next single action that would most reduce risk.

CITATION RULES — STRICT:
- DO NOT use footnote markers ([^1], [^2], etc.).
- DO NOT add a "## Sources", "## References", or "## Citations" section.
- Present conclusions as analyst judgment grounded in the supplied research, not as footnoted quotes.

After the markdown, on a final line, output exactly:
QUALITY_SCORE: <0-100 integer reflecting completeness, specificity, investor-readiness, and analytical rigor of both sections>`;

const QF = DEEP_DIVE;
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
};

export async function generateOne(
  supabase: any,
  snapshotId: string,
  documentType: string,
  rewriteFeedback?: string,
  rewriteTags?: string[],
) {
  const [{ data: snap }, { data: type }] = await Promise.all([
    supabase.from("venture_snapshots").select("*").eq("id", snapshotId).maybeSingle(),
    supabase.from("venture_document_types").select("*").eq("type", documentType).maybeSingle(),
  ]);
  if (!snap) throw new Error("Snapshot not found");
  if (!type) throw new Error(`Unknown document type: ${documentType}`);

  // Mark as generating
  await supabase.from("venture_documents").upsert({
    snapshot_id: snapshotId,
    document_type: documentType,
    status: "generating",
  }, { onConflict: "snapshot_id,document_type" });

  // Load dependency docs for context
  const deps: string[] = type.dependencies ?? [];
  let depContext = "";
  if (deps.length) {
    const { data: depDocs } = await supabase
      .from("venture_documents")
      .select("document_type, content")
      .eq("snapshot_id", snapshotId)
      .in("document_type", deps);
    depContext = (depDocs ?? [])
      .filter((d: any) => d.content)
      .map((d: any) => `## ${d.document_type}\n${d.content}`)
      .join("\n\n---\n\n");
  }

  const baseSystem = `You are an AI venture analyst writing investor-grade documents.
Produce a single document in clean Markdown. Use ## headings, short paragraphs, and bullet lists.
Be specific, plausible, and actionable. Never use filler like "TBD" or "[insert ...]".

The "## Executive Summary" section targets ~500-700 words (shorter for brief doc types).${DEEP_DIVE}`;

  // Always append the two-part / no-citations / quality-score appendix to per-doc specs
  // (SPECIAL entries already include it via the QF constant; baseSystem includes it inline).
  const baseSystemPrompt = SPECIAL[documentType] ?? baseSystem;
  const trackTone = snap.track ? TRACK_TONE[snap.track] : null;
  const systemPrompt = trackTone
    ? `${baseSystemPrompt}\n\n${trackTone}`
    : baseSystemPrompt;

  const founderCard = {
    founder: { name: snap.founder_name, email: snap.founder_email, phone: snap.founder_phone },
    location: { city: snap.city, region: snap.region, country: snap.country },
    market_scope: snap.market_scope,
    industry: snap.industry,
    sub_industry: snap.sub_industry,
    track: snap.track,
    company_name: snap.company_name,
    website_url: snap.website_url,
  };

  const conceptBlock = snap.concept_summary
    ? `\n## NORTH-STAR CONCEPT (locked by founder — every section must stay consistent with this)\nSummary: ${snap.concept_summary}\nValue proposition: ${snap.value_proposition ?? ""}`
    : "";

  const brandBlock = snap.brand_tokens
    ? `\n## Brand tokens (reuse colors, fonts, mood when rendering visuals or builder prompts)\n${JSON.stringify(snap.brand_tokens, null, 2)}`
    : "";

  const userPrompt = [
    `# Document to produce: ${type.name}`,
    `Description: ${type.description}`,
    `Category: ${type.category}`,
    conceptBlock,
    brandBlock,
    `\n## Founder & market (always reflect these accurately)\n${JSON.stringify(founderCard, null, 2)}`,
    `\n## Venture brief (extracted_data)\n${JSON.stringify(snap.extracted_data ?? {}, null, 2)}`,
    snap.research_brief ? `\n## Research brief (background evidence — synthesize as analyst judgment, NO footnotes or citations in the output)\n${JSON.stringify(snap.research_brief, null, 2)}` : "",
    snap.business_concept ? `\n## Founder's raw concept\n${snap.business_concept}` : "",
    depContext ? `\n## Upstream documents you should build on\n${depContext}` : "",
    (rewriteFeedback && rewriteFeedback.trim()) || (rewriteTags && rewriteTags.length)
      ? `\n## Rewrite guidance from the founder (TOP PRIORITY — the previous version missed the mark, address every point below in this rewrite)\n${
          rewriteTags && rewriteTags.length ? `Tags: ${rewriteTags.join(", ")}\n\n` : ""
        }${rewriteFeedback?.trim() ?? ""}`
      : "",
  ].filter(Boolean).join("\n\n");

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
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
  try {
    fetch(`${SUPABASE_URL}/functions/v1/venture-document-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ snapshotId, documentType }),
    }).catch(() => {});
  } catch { /* ignore */ }

  return { wordCount, quality };
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { snapshotId, documentType, rewriteFeedback, rewriteTags } = await req.json();
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
    const result = await generateOne(supabase, snapshotId, documentType, rewriteFeedback, Array.isArray(rewriteTags) ? rewriteTags : undefined);
    return new Response(JSON.stringify({ ok: true, ...result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (e instanceof GatewayError) {
      return new Response(JSON.stringify({ ok: false, error: message, gatewayStatus: e.status }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

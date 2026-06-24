// Founders Hub — bulk-generate all 20 venture documents in dependency order.
// Creates a venture_generation_jobs row, then runs each doc inline with a
// circuit breaker. Idempotent on (snapshot_id, document_type).

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

// ============== SPECIALIZED PROMPTS ==============
const QUALITY_FOOTER = `\n\nEnd with a "## Sources" section listing any [^n] footnotes used, then on a final line output exactly:\nQUALITY_SCORE: <0-100 integer>`;

const SPECIAL: Record<string, string> = {
  website_prd: `You are a senior product writer producing a Website PRD that doubles as a paste-ready prompt for an AI website builder (Lovable, v0, Bolt, Cursor).
Output clean Markdown with: # {Company} — Website PRD; ## 1. Paste-ready prompt (single fenced \`\`\` block, 400-600 words, self-contained instructions); ## 2. Sitemap; ## 3. Page-by-page copy (H1, sub-headline, 3 sections each with H2 + 2-3 sentence body, primary CTA); ## 4. SEO bundle (title <60ch, meta <160ch, 8-12 keywords with geo-modifiers when market scope is local, OG image prompt); ## 5. Tech checklist. Reuse upstream brand_tokens (colors/fonts) in the fenced prompt when present.${QUALITY_FOOTER}`,

  brand_strategy_framework: `You are a brand strategist. Produce a recognized brand-strategy doc grounded in Simon Sinek's Golden Circle, Aaker's brand identity prism, and Jung's 12 archetypes.
Output clean Markdown with: # {Company} — Brand Strategy; ## Purpose (Why); ## Vision (10-year picture); ## Mission (what we do today); ## Core Values (5 with short rationale); ## Audience Archetypes (2-3 named); ## Brand Promise (one sentence); ## Positioning Statement (use Geoffrey Moore template: "For [target] who [need], [brand] is the [category] that [benefit] unlike [alternative]."); ## Brand Pillars (3-5 with 1-line definitions); ## Personality (primary Jung archetype + 5-trait spectrum rated 1-5: serious↔playful, classic↔modern, etc.); ## Brand Essence (3-5 word phrase).${QUALITY_FOOTER}`,

  brand_messaging_house: `You are a senior copy chief building a messaging architecture.
Output clean Markdown with: # Messaging House; ## Tagline (primary + 3 alternates); ## Elevator Pitch (15-second / 30-second / 60-second versions); ## Brand Story (Donald Miller StoryBrand 7-part: Character, Problem, Guide, Plan, Call to Action, Failure, Success); ## Proof Points (4-6 evidenced bullets); ## Key Messages per Audience (one block per ICP); ## Language Rules (do-use list, do-not-use list, banned buzzwords).${QUALITY_FOOTER}`,

  visual_identity_brief: `You are a brand designer. Produce a Visual Identity Brief AND a machine-readable brand-tokens block.
Output clean Markdown with: # Visual Identity; ## Logo Direction (concept rationale + 3 mood pairings); ## Color System (table with role, hex, usage, AA contrast pair); ## Typography (heading + body pair with web-safe fallbacks); ## Iconography style; ## Photography direction; ## Layout principles; ## Accessibility checklist.
## Brand Tokens (JSON)
A SINGLE fenced \`\`\`json block, the ONLY JSON in the doc, with this exact shape:
{"colors":{"primary":"#hex","secondary":"#hex","accent":"#hex","bg":"#hex","fg":"#hex","muted":"#hex"},"fonts":{"heading":"Font Name","body":"Font Name"},"radius":"sm|md|lg","mood":["adj1","adj2","adj3"]}
## AI Logo Prompt
A SINGLE fenced \`\`\` block: a paste-ready prompt for Midjourney/Ideogram (200-300 words, no JSON).${QUALITY_FOOTER}`,

  brand_voice_tone_guide: `You are a voice & tone strategist.
Output clean Markdown with: # Voice & Tone; ## Voice Attributes (4 dimensions each with two opposing poles and a 1-5 rating, e.g. Formal 1—5 Casual); ## Tone Shifts by Context (sales, support, crisis, social, error states); ## Reading Level target (Flesch grade); ## Before/After Rewrites (5 examples — bad copy → on-brand rewrite); ## Inclusive-Language Rules; ## Quick reference cheat-sheet.${QUALITY_FOOTER}`,

  brand_guidelines_pdf: `You are compiling the consolidated brand guidelines book.
Output clean Markdown with: # Brand Guidelines; ## Brand at a Glance (purpose, promise, positioning); ## Logo Usage (clear-space, min size, do/don'ts); ## Color (palette table with hex/RGB/usage); ## Typography (hierarchy table); ## Imagery & Iconography; ## Voice & Tone summary; ## Messaging quick-reference; ## Asset Usage (where each goes); ## File-naming convention; ## Approval Governance (who approves what). Reuse upstream brand_tokens and voice attributes when present.${QUALITY_FOOTER}`,

  social_media_audit_setup: `You are a social media strategist.
Output clean Markdown with: # Social Media Audit & Setup; ## Platform Fit Matrix (table of Instagram, TikTok, LinkedIn, X, YouTube, Facebook, Pinterest, Threads, Reddit with columns: Recommendation [Yes/Maybe/Skip], Why, Effort, Time-to-impact); ## Primary Platforms (deep dive on each Yes platform: handle availability checklist + 3 candidate handles, bio template x3 with character count, link-in-bio structure, profile-image and cover-image spec, pinned-post strategy, highlights or featured collections); ## Hashtag & Keyword Seeds (15-25 per primary platform, geo-tagged when market scope is local); ## Accounts to Engage With (25 named accounts derived from research_brief competitors + adjacent voices); ## First-Week Setup Checklist.${QUALITY_FOOTER}`,

  content_strategy_pillars: `You are a content strategist.
Output clean Markdown with: # Content Strategy; ## Content Pillars (4-6, each with: Pillar Name, JTBD it serves, % of mix, formats, voice notes, success metric); ## Content-to-Funnel Map (% allocation across TOFU/MOFU/BOFU/loyalty with rationale); ## POV Statements (3-5 strong opinions the brand holds); ## Topic Universe (20 evergreen topics + 10 timely topics); ## Banned Topics; ## Cadence (posts/week per platform).${QUALITY_FOOTER}`,

  content_calendar_90day: `You are an editorial planner. Produce a 90-day calendar that is genuinely usable.
Output clean Markdown with: # 90-Day Content Calendar; ## Weeks 1-4 (Drafted Posts) — for EACH of weeks 1-4 produce 3 posts per primary platform with: Day, Pillar, Platform, Format, Hook (first line), Full body draft, CTA, Hashtags, Asset notes (image/video prompt), Best-time slot; ## Weeks 5-12 (Outlined Briefs) — for each week, 3 brief outlines per platform (title + hook + 2-line angle + format + pillar); ## Batch Production Schedule (one shoot/write day per week with what to capture); ## Repurposing Matrix (1 long-form → 5 short-form derivatives template).${QUALITY_FOOTER}`,

  launch_content_kit: `You are a launch strategist producing ready-to-paste assets.
Output clean Markdown with: # Launch Content Kit; ## 10 Launch Posts — one block each for: Announcement, Founder Story, Problem Post, Solution Demo, Social Proof, FAQ, Hard CTA, Behind-the-Scenes, Manifesto, Partnership Ask. For each: Platform recommendation, Caption (paste-ready, with line breaks and emoji where appropriate), Image/Video prompt (paste-ready), Hashtags, Alt-text; ## 5 Email/DM Templates (warm intro, cold outreach, press pitch, customer ask, partner ask); ## Press One-Pager (headline, dek, 3 boilerplate paragraphs, founder bio 80 words, contact block).${QUALITY_FOOTER}`,

  community_engagement_playbook: `You are a community manager.
Output clean Markdown with: # Community Engagement Playbook; ## 10 Reply Scripts (positive comment, critical comment, question, complaint, sales-curious, troll, competitor mention, press inquiry, partnership inquiry, support issue); ## Comment-Prompt Formulas (5 templates that earn replies); ## DM Funnel (greeting → qualify → offer → close); ## UGC + Testimonial Collection Scripts (3 scripts with consent language); ## Crisis-Response Decision Tree (when to acknowledge / explain / escalate / silence); ## Daily Ritual (60-min/day breakdown with timeboxes); ## KPI Dashboard (reach, saves, shares, replies, profile visits → site visits → leads, with target ranges).${QUALITY_FOOTER}`,

  influencer_partnership_brief: `You are a creator-partnerships lead.
Output clean Markdown with: # Influencer & Partnership Brief; ## Tier Strategy (nano <10k / micro 10-100k / mid 100k-1M target counts and budgets); ## 25 Named Candidate Creators (derived from research_brief and industry context — table with Name/Handle, Tier, Platform, Audience fit, Estimated rate range, Why-this-creator); ## Outreach Scripts (cold DM x3 styles: warm intro / value-led / paid offer); ## Partnership Terms Template (deliverables, exclusivity, usage rights, payment, timeline); ## Performance Tracking template (UTM convention, conversion targets).${QUALITY_FOOTER}`,

  paid_ads_starter_pack: `You are a performance marketer.
Output clean Markdown with: # Paid Ads Starter Pack; ## Budget Tiers ($300, $1,000, $3,000 monthly — each with platform allocation table); ## Audience Definitions (3 saved audiences with parameters); ## Creative Concepts — for the top 2 recommended platforms, produce 3 ad creative concepts each with: Hook, Body copy, CTA, Visual prompt (paste-ready), Format; ## Conversion Tracking Setup (Pixel/CAPI checklist, event names, key conversions); ## Test-and-Iterate Framework (week-by-week test plan, learning matrix, kill criteria).${QUALITY_FOOTER}`,
};

function specializedPrompt(t: string): string | null {
  return SPECIAL[t] ?? null;
}

// Inline single-doc generator (kept local so we don't share files across functions).
async function generateOne(supabase: any, snapshotId: string, documentType: string) {
  const [{ data: snap }, { data: type }] = await Promise.all([
    supabase.from("venture_snapshots").select("*").eq("id", snapshotId).maybeSingle(),
    supabase.from("venture_document_types").select("*").eq("type", documentType).maybeSingle(),
  ]);
  if (!snap) throw new Error("Snapshot not found");
  if (!type) throw new Error(`Unknown document type: ${documentType}`);

  await supabase.from("venture_documents").upsert({
    snapshot_id: snapshotId,
    document_type: documentType,
    status: "generating",
  }, { onConflict: "snapshot_id,document_type" });

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
Produce a single document in clean Markdown. Use ## headings, short paragraphs, bullets.
Be specific, plausible, actionable. Never use filler like "TBD".
Target ~600-900 words.

CITATIONS:
- When a claim comes from the research brief, cite it inline with footnote markers like [^1], [^2], reusing numbers when re-citing the same source.
- At the very end of the document, before the QUALITY_SCORE line, output a "## Sources" section listing each footnote on its own line: [^1]: https://source-url — short label.
- If a section has no research support, write the claim plainly without a footnote rather than inventing a source.

After the markdown, on a final line, output exactly:
QUALITY_SCORE: <0-100 integer>`;

  const systemPrompt = specializedPrompt(documentType) ?? baseSystem;

  const founderCard = {
    founder: { name: snap.founder_name, email: snap.founder_email, phone: snap.founder_phone },
    location: { city: snap.city, region: snap.region, country: snap.country },
    market_scope: snap.market_scope,
    industry: snap.industry,
    sub_industry: snap.sub_industry,
    company_name: snap.company_name,
    website_url: snap.website_url,
  };

  const conceptBlock = snap.concept_summary
    ? `\n## NORTH-STAR CONCEPT (locked by founder — every section must stay consistent with this)\nSummary (${snap.concept_summary.trim().split(/\s+/).filter(Boolean).length} words): ${snap.concept_summary}\nValue proposition: ${snap.value_proposition ?? ""}`
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
    `\n## Venture brief (founder-reviewed)\n${JSON.stringify(snap.extracted_data ?? {}, null, 2)}`,
    snap.research_brief ? `\n## Research brief (use for evidence + citations)\n${JSON.stringify(snap.research_brief, null, 2)}` : "",
    depContext ? `\n## Upstream docs\n${depContext}` : "",
  ].filter(Boolean).join("\n\n");

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
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
    throw new Error(`Gateway ${aiRes.status}`);
  }

  const aiJson = await aiRes.json();
  let raw = aiJson.choices?.[0]?.message?.content ?? "";
  let quality = 75;
  const qm = raw.match(/QUALITY_SCORE:\s*(\d{1,3})/i);
  if (qm) {
    quality = Math.max(0, Math.min(100, parseInt(qm[1], 10)));
    raw = raw.replace(/QUALITY_SCORE:\s*\d{1,3}\s*$/i, "").trim();
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

  // Fire-and-forget hero image (Nano Banana Pro). Best-effort.
  try {
    fetch(`${SUPABASE_URL}/functions/v1/venture-document-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ snapshotId, documentType }),
    }).catch(() => {});
  } catch { /* ignore */ }
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

const CONCURRENCY = 4;

async function runLayer(supabase: any, snapshotId: string, jobId: string, layer: any[], state: { done: number; total: number; fails: number; canceled: boolean }) {
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
        await generateOne(supabase, snapshotId, t.type);
        state.done++;
        state.fails = 0;
      } catch (_e) {
        state.fails++;
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

async function runJob(supabase: any, snapshotId: string, jobId: string) {
  const { data: types } = await supabase
    .from("venture_document_types")
    .select("*")
    .eq("active", true);

  const layers = dependencyLayers(types ?? []);
  const total = (types ?? []).length;
  const state = { done: 0, total, fails: 0, canceled: false };

  await supabase.from("venture_generation_jobs").update({
    status: "running",
    started_at: new Date().toISOString(),
    heartbeat_at: new Date().toISOString(),
  }).eq("id", jobId);

  for (const layer of layers) {
    await runLayer(supabase, snapshotId, jobId, layer, state);
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

  await supabase.from("venture_snapshots").update({ status: "complete" }).eq("id", snapshotId);
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { snapshotId } = await req.json();
    if (!snapshotId) return new Response(JSON.stringify({ error: "snapshotId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Gate: concept must be locked before any docs are generated.
    const { data: gateSnap } = await supabase
      .from("venture_snapshots")
      .select("concept_status")
      .eq("id", snapshotId)
      .maybeSingle();
    if (!gateSnap || gateSnap.concept_status !== "locked") {
      return new Response(JSON.stringify({ error: "Lock your concept summary before generating documents." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

    // Run in the background so the HTTP response returns immediately.
    // @ts-ignore: EdgeRuntime is provided by Supabase Edge Functions runtime.
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(runJob(supabase, snapshotId, jobId!));
    } else {
      runJob(supabase, snapshotId, jobId!).catch((e) => console.error("bulk job failed", e));
    }

    return new Response(JSON.stringify({ ok: true, jobId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

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

// Specialized doc prompts (mirrors bulk-generate SPECIAL map).
const QF = `\n\nEnd with a "## Sources" section listing any [^n] footnotes used, then on a final line output exactly:\nQUALITY_SCORE: <0-100 integer>`;
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

export async function generateOne(supabase: any, snapshotId: string, documentType: string) {
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
Target ~600-900 words unless the doc type is brief.

CITATIONS:
- Cite research-brief claims inline with [^1], [^2] footnote markers (reuse numbers).
- End with a "## Sources" section listing each footnote: [^1]: url — label.

After the markdown, on a final line, output exactly:
QUALITY_SCORE: <0-100 integer reflecting completeness, specificity, and investor-readiness>`;

  const systemPrompt = SPECIAL[documentType] ?? baseSystem;

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
    snap.research_brief ? `\n## Research brief (use for evidence + citations)\n${JSON.stringify(snap.research_brief, null, 2)}` : "",
    snap.business_concept ? `\n## Founder's raw concept\n${snap.business_concept}` : "",
    depContext ? `\n## Upstream documents you should build on\n${depContext}` : "",
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

  // Extract quality score line
  let quality = 75;
  const qm = raw.match(/QUALITY_SCORE:\s*(\d{1,3})/i);
  if (qm) {
    quality = Math.max(0, Math.min(100, parseInt(qm[1], 10)));
    raw = raw.replace(/QUALITY_SCORE:\s*\d{1,3}\s*$/i, "").trim();
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
  }, { onConflict: "snapshot_id,document_type" });

  return { wordCount, quality };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { snapshotId, documentType } = await req.json();
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
    const result = await generateOne(supabase, snapshotId, documentType);
    return new Response(JSON.stringify({ ok: true, ...result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

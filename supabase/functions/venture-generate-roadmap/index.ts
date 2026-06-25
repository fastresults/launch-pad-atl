// Founders Hub — Founder Roadmap & Workshop Synthesis.
// Reads the whole venture (snapshot + every completed document + research) and
// produces a single value-packed strategy debrief: verdict, opportunities, risks,
// a tactical 45-day sprint, and a sequenced 12-month plan.
// Persists onto venture_snapshots.roadmap_*.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const MAX_PROMPT_CHARS = 140_000;
const EXEC_SUMMARY_TYPE = "executive_summary";
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
]);

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
    return "Founder Roadmap is paused because AI credits are exhausted.";
  }
  if (status === 429) return "Founder Roadmap is rate limited. Please try again shortly.";
  if (status === 401 || status === 403) return "Founder Roadmap is unavailable — AI Gateway rejected the request.";
  return "Founder Roadmap is currently unavailable. Please try again shortly.";
}

function stripCitations(md: string): string {
  let out = md;
  out = out.replace(/\n#{1,6}\s*(sources|references|citations|bibliography|footnotes)\s*[\s\S]*$/i, "");
  out = out.replace(/\[\^[^\]]+\]/g, "");
  out = out.replace(/^\s*\[\^[^\]]+\]:.*$/gm, "");
  out = out.replace(/\n{3,}/g, "\n\n");
  return out.trim();
}

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

const SYSTEM_PROMPT = `You are a senior founding partner writing the closing playbook for a founder who has just spent days in a deep AI-first venture workshop. You have full visibility into their venture brief, all research that was gathered, and every deliverable produced. You are writing the single document this founder will hand to their co-founder, their spouse, an angel investor, and eventually a VC. It must feel like the most valuable thing they got from the workshop — narrative, confident, encouraging, brutally specific, and investor-ready.

VOICE & TONE
- Second person. Warm, confident, partner-to-founder. Never patronizing, never hype.
- Use the founder's first name in the opening verdict and in the closing note.
- Use the company name verbatim throughout.
- Every chapter OPENS with 2–3 sentences of prose before any list or table. Prose carries the meaning; lists and tables only support it.
- Cite real numbers, real prices, real channels, real ICP names, real hires from the kit. No generic startup advice. No "leverage synergies." No "in today's fast-paced landscape." No "robust solution." No "unlock potential."
- A stranger should be able to read this and understand the business in 10 minutes.
- Do NOT summarize documents one-by-one. Synthesize across them.

OUTPUT FORMAT — clean Markdown only. Begin with this exact H1:

# Your Founder Roadmap

Then the following H2 sections, IN THIS EXACT ORDER, using these EXACT headings:

## Cover & Verdict
One short paragraph. Name the founder by first name. Name the company. State in one plain sentence what the business is. End with a confident-but-honest one-line verdict, e.g. "You are closer than you think — and here is why." Avoid percentages you cannot defend from the kit.

## Stat Strip
A markdown table with exactly two columns, header row \`| Metric | Value |\`. Include 6 rows in this order: Target ICP, Market opportunity, Recommended Year-1 revenue, Recommended raise, Breakeven month, Confidence in story. Use real values from the kit (financial_model, market research, ICP doc). Keep each value under 50 characters. This is the only table allowed before Chapter 1.

## Chapter 1 — What You've Built
Narrative prose, no bullets. In 4–6 paragraphs, tell the story of what the workshop produced: the concept in plain English, the wedge, the ICP at a glance, the pricing logic and why it makes sense, the GTM motion. End with a single italicized line: *Why this matters:* …

## Chapter 2 — Who You're Building For
Open with one paragraph naming the ICP segment in plain English (drawn from customer_personas). Then a vivid 4–6 sentence **day-in-the-life vignette** of one named archetype: their job title, their context, what their Tuesday morning actually looks like, the friction they live with, and the moment your product enters their day. Then three short labeled blocks (bold lead-ins, not headings):
**What they're trying to do** — the job-to-be-done in their words.
**What they've already tried** — current workarounds and why those fall short.
**What "good" looks like to them** — the outcome they will pay for.
End with a markdown table: Trigger | Buying moment | Where to find them | What they need to hear first. 3–4 rows grounded in customer_personas and go_to_market_plan.

## Chapter 3 — Why This Can Win
Open with one paragraph framing the strategic case. Then three numbered narrative arguments (1., 2., 3.) — each a short paragraph, each anchored to a specific deliverable by name (e.g. "your Competitive Positioning"), each ending with one concrete proof point from the kit.

## Chapter 4 — The Field You're Entering
Open with one paragraph that reads the market like a strategist: who is already there, the shape of the market (fragmented / consolidating / dormant / hot), and where the white space sits. Then:
**The players you will be compared to** — one paragraph naming 3–5 real competitors from competitive_positioning / market_analysis, with one line each on how they actually compete (price, channel, brand, depth).
**Where you win** — markdown table: Competitor | How they win today | Where they're weak | Your move. 3–5 rows.
**The shift in your favor** — one paragraph on the macro trend, regulation, behavior change, or technology shift that makes this the right moment.
**What would have to be true for them to copy you** — 2–3 sentences honestly assessing defensibility.

## Chapter 5 — The Honest Fight Ahead
Open with one paragraph of encouragement framing risk as the work, not the verdict. Then a markdown table: Challenge | Why it's real | How you'll meet it | Deliverable already in your kit. 4–6 rows. No fear-mongering.

## Chapter 6 — Your First 45 Days
Open with one paragraph: this is the sprint that turns plan into proof. Then four subsections, each opening with a 1–2 sentence theme paragraph before the action list.
### Days 1–7 — Validation fortnight
### Days 8–21 — First commitments
### Days 22–35 — Build the proof
### Days 36–45 — Pitch-ready
Each action: concrete verb-first line · owner role · dependency · success metric · which deliverable it pulls from. End the chapter with a bold standalone line **By Day 45, you will have:** followed by a bullet list of 4–6 outcomes the founder will be able to show.

## Chapter 7 — Your First Year
Open with one paragraph that explicitly picks up from the Day-45 outcomes. Then three named phases as H3s, each with a 1-paragraph narrative lead before the month list:
### Phase 1 — Validate (Months 1–4)
### Phase 2 — Build (Months 5–8)
### Phase 3 — Compound (Months 9–12)
Inside each phase, list each month with: month label · theme · 2–3 outcomes · the single KPI to watch · the deliverable that powers it. The year must be internally consistent with Chapter 6.

## Chapter 8 — Money & Runway, In Plain English
Open with 2–3 sentences of plain-English narrative anyone could understand: starting cash, monthly burn, when money runs out, what to raise, when to raise it. Then a small supporting table: Starting cash · Monthly burn · Breakeven month · Funding gap · Recommended raise · Best window to raise. Use real numbers from financial_model and budget_pro_forma when present; if they're missing, say so plainly and state what should be modeled next.

## Chapter 9 — How to Talk About This
This is the chapter that makes the document shareable with investors. Use these subsections in order:
### Your 60-second pitch
A ready-to-read-aloud paragraph, written in the founder's first-person voice ("We are…"), grounded in the kit. ~120 words.
### The 1-paragraph email version
A 4–5 sentence version a founder can paste into a cold email. First-person.
### Three numbers to memorize
Three lines, each: the number · what it means · why an investor will care.
### Three questions an investor will ask
Three Q/A pairs. Each answer in 2–3 sentences, anchored to a deliverable by name.

## Chapter 10 — Why This Matters
Open with a personal-tone paragraph addressed to the founder by first name about why this work is worth their years. Then three labeled blocks (bold lead-ins, not headings):
**The bigger shift you're part of** — one paragraph placing the venture inside a larger movement, industry change, or human need (drawn from vision_mission and market_analysis).
**Who is better off if you win** — a short list of 3–5 lines naming concrete beneficiaries (customers, employees, partners, family, community). No slogans.
**The story you'll get to tell in 5 years** — a 3-sentence forward-looking narrative, written as if the founder is recounting it on a stage. Specific, grounded in the kit's pricing and scale assumptions.
Close the chapter with a single italic line: *This is why it's worth the next 1,000 days.*

## Chapter 11 — Your Operating Cadence
Open with one paragraph about the habits that compound. Then three labeled blocks (bold lead-ins, not headings): **Weekly**, **Monthly**, **Quarterly** — each with a 2–4 line cadence tailored to this venture's track and stage.

## Chapter 12 — Read Next From Your Kit
Open with one short paragraph. Then a numbered list of exactly 5 documents from this kit, by their real names, in the order the founder should read them. Each line: **Document name** — one sentence on why now.


## The One Thing
A single blockquote (> ) of 2–3 sentences naming the ONE move for the next 30 days that will most change their odds. Specific, named, encouraging.

## Closing Note
3 sentences, signed-off feel. Address the founder by first name. Acknowledge the work they put into the workshop. Send them moving.

STRICT RULES
- Chapter 4 exit list and Chapter 5 Phase 1 MUST connect — Month 1 begins from Day-45 outcomes.
- Be aligned with the Executive Summary. Resolve contradictions inside the prose.
- No footnote markers. No "Sources/References/Citations" sections. No [^1].
- No doc-by-doc rehash. No filler. No emoji. No headings other than those listed.
- Real names from the kit — deliverables, ICP, pricing, company, channels — verbatim.

After the markdown, on a final line, output exactly:
QUALITY_SCORE: <0-100 integer reflecting specificity, actionability, narrative quality, and partner-readiness>`;

function buildContextBundle(snap: any, allDocs: any[]) {
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

  const sections: { protect: boolean; body: string }[] = [];
  sections.push({ protect: true, body: `# Venture: ${snap.company_name ?? "(unnamed)"}` });
  if (snap.concept_summary) {
    sections.push({
      protect: true,
      body: `## North-star concept\n${snap.concept_summary}\nValue proposition: ${snap.value_proposition ?? ""}`,
    });
  }
  sections.push({ protect: true, body: `## Founder & market\n${JSON.stringify(founderCard, null, 2)}` });
  sections.push({
    protect: true,
    body: `## Venture brief (extracted_data)\n${JSON.stringify(snap.extracted_data ?? {}, null, 2)}`,
  });

  if (snap.research_brief) {
    sections.push({
      protect: false,
      body: `## Research brief (background evidence — NO citations in output)\n${JSON.stringify(snap.research_brief, null, 2)}`,
    });
  }
  const extraResearch: Record<string, any> = {};
  for (const k of ["enrichment_data", "enrichment_summary", "deep_research", "market_research", "competitor_research"]) {
    if (snap[k] && (typeof snap[k] !== "object" || Object.keys(snap[k]).length)) extraResearch[k] = snap[k];
  }
  if (Object.keys(extraResearch).length) {
    sections.push({ protect: false, body: `## Additional research / enrichment\n${JSON.stringify(extraResearch, null, 2)}` });
  }

  // Executive Summary first, untouched
  const exec = allDocs.find((d) => d.document_type === EXEC_SUMMARY_TYPE);
  if (exec?.content) {
    sections.push({
      protect: true,
      body: `## EXECUTIVE SUMMARY — north-star narrative the roadmap MUST align with\n${exec.content}`,
    });
  }

  // All other completed sibling docs
  const siblings = allDocs.filter((d) => d.content && d.document_type !== EXEC_SUMMARY_TYPE);
  siblings.sort((a, b) => a.document_type.localeCompare(b.document_type));
  if (siblings.length) {
    const blocks: string[] = [];
    for (const d of siblings) {
      const protect = PROTECTED_TYPES.has(d.document_type);
      const intake = d.intake_answers && Object.keys(d.intake_answers).length
        ? `\n_intake answers:_ ${JSON.stringify(d.intake_answers)}\n`
        : "";
      const body = protect ? d.content : smartExcerpt(d.content, 1800);
      const dassess = d.deep_assessment ? `\n\n_deep assessment:_\n${smartExcerpt(d.deep_assessment, 800)}` : "";
      blocks.push(`### ${d.document_type}${protect ? " [PROTECTED]" : ""}${intake}\n${body}${dassess}`);
    }
    sections.push({ protect: false, body: `## All completed deliverables\n${blocks.join("\n\n---\n\n")}` });
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
  const [{ data: snap }, { data: allDocs }] = await Promise.all([
    supabase.from("venture_snapshots").select("*").eq("id", snapshotId).maybeSingle(),
    supabase
      .from("venture_documents")
      .select("document_type, content, intake_answers, deep_assessment, status")
      .eq("snapshot_id", snapshotId)
      .eq("status", "complete"),
  ]);
  if (!snap) throw new Error("Snapshot not found");
  if (!allDocs || !allDocs.length) throw new Error("No completed documents to synthesize");

  await supabase
    .from("venture_snapshots")
    .update({ roadmap_status: "generating" })
    .eq("id", snapshotId);

  const bundle = buildContextBundle(snap, allDocs);
  const userPrompt = fitToBudget(bundle);

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!aiRes.ok) {
    const txt = await aiRes.text();
    await supabase
      .from("venture_snapshots")
      .update({ roadmap_status: "failed" })
      .eq("id", snapshotId);
    throw new GatewayError(aiRes.status, txt);
  }

  const aiJson = await aiRes.json();
  let raw = aiJson.choices?.[0]?.message?.content ?? "";

  let quality = 80;
  const qm = raw.match(/QUALITY_SCORE:\s*(\d{1,3})/i);
  if (qm) {
    quality = Math.max(0, Math.min(100, parseInt(qm[1], 10)));
    raw = raw.replace(/QUALITY_SCORE:\s*\d{1,3}\s*$/i, "").trim();
  }
  raw = stripCitations(raw);
  if (!/^#\s*Your Founder Roadmap/im.test(raw)) {
    raw = `# Your Founder Roadmap\n\n${raw}`;
  }
  const wordCount = raw.split(/\s+/).filter(Boolean).length;

  await supabase
    .from("venture_snapshots")
    .update({
      roadmap_content: raw,
      roadmap_quality_score: quality,
      roadmap_word_count: wordCount,
      roadmap_status: "complete",
      roadmap_generated_at: new Date().toISOString(),
    })
    .eq("id", snapshotId);

  return { quality, wordCount };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { snapshotId } = await req.json();
    if (!snapshotId) {
      return new Response(JSON.stringify({ error: "snapshotId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
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

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
  "pricing_strategy",
  "go_to_market",
  "icp_personas",
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

const SYSTEM_PROMPT = `You are a senior strategy partner debriefing a founder who has just completed a deep AI-first venture workshop. You have full visibility into their venture brief, all research that was gathered, and every deliverable that was produced. Your job is to produce a single, value-packed founder-facing synthesis that turns those artifacts into a clear, sequenced action plan.

Output clean Markdown. Begin with this exact H1:

# Your Founder Roadmap

Then the following H2 sections, in order. Be brutally specific to THIS venture: name the ICP, cite real numbers, price points, channels, hires, and deliverables from the kit. No platitudes. No generic startup advice. Do NOT summarize the documents one-by-one — synthesize across them.

## 1. Executive Verdict
3 sentences. Partner-grade verdict on the venture's current readiness, naming the single highest-leverage move the founder should make next.

## 2. What the Workshop Discovered About Your Venture
Synthesized, named insights across all documents (market shape, ICP, wedge, pricing, GTM, economics, brand, team gaps). 5–8 bullets, each a real insight — not a doc summary.

## 3. Your Strategic Position
Markdown table with columns: Pillar | Strength | Confidence (H/M/L) | What's missing. Cover at minimum: market, ICP, product/wedge, pricing, GTM, economics, brand, team.

## 4. Top 5 Opportunities
Ranked 1–5. For each: the move · why it works for THIS venture (cite the deliverable name) · expected outcome · effort (S/M/L) · which existing deliverable to execute from.

## 5. Top 5 Risks & How to De-risk Them
Ranked 1–5. For each: the risk · mitigation · which deliverable already addresses it.

## 6. Next 45 Days — Tactical Sprint Plan
Sprint plan a founder can execute Monday morning. Group by horizon:
### Days 1–7
### Days 8–21
### Days 22–35
### Days 36–45
Each item: concrete action · owner role · dependency · success metric · which deliverable it pulls from.
End the section with a bold **Exit criteria (Day 45):** list — what must be true on Day 45 to proceed into the 12-month plan.

## 7. 12-Month Sequenced Plan
Month-by-month M1–M12 grouped into clear phases (e.g. Validate → Build → Scale). The plan MUST pick up exactly from the Day-45 exit criteria. For each month: theme · 2–4 outcomes · KPIs · deliverable(s) it draws on.

## 8. 6 & 12-Month Milestones
Measurable targets (revenue, customers, hires, fundraise, product) anchored to the financial model and pricing.

## 9. Money & Runway Reality
Synthesize from financial_model and budget_pro_forma if present: starting cash, monthly burn, breakeven, funding gap, recommended raise size and timing. If those docs aren't present, say what's missing.

## 10. Founder Operating Cadence
Weekly / monthly / quarterly rituals tailored to this venture's stage and track (sales reviews, KPI dashboard, customer-discovery cadence, board / advisor sync).

## 11. Read-Next Path Through Your Kit
The 5 documents the founder should read FIRST (not all of them) in order, each with a one-line reason tied to where they are right now.

## 12. The Single Most Important Thing
A short boxed callout (use a blockquote) naming the ONE move that will most change their odds in the next 30 days.

STRICT RULES
- The 45-day sprint and the 12-month plan must be internally consistent — the 12-month plan begins from the Day-45 exit criteria.
- Be aligned with the Executive Summary. Flag and resolve any contradictions inside the text where relevant.
- No footnote markers, no "Sources/References/Citations" sections.
- No doc-by-doc rehash. Synthesize.
- Use real names from the kit (deliverables, ICP, pricing, company name) verbatim.

After the markdown, on a final line, output exactly:
QUALITY_SCORE: <0-100 integer reflecting specificity, actionability, and partner-readiness>`;

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

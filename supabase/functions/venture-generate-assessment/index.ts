// Founders Hub — on-demand McKinsey-grade deep assessment for a single document.
// Uses the shared venture-context builder so the deep dive aligns with the rest
// of the venture and avoids duplicating raw blobs the snapshot brain already
// summarizes. Routes to Gemini Pro because this is the highest-rigor surface.

import { createClient } from "npm:@supabase/supabase-js@2";
import { compactPreamble, distillDeps, loadVentureContext, pickBrainSlice } from "../_shared/venture-context.ts";
import { ensureSnapshotBrain } from "../_shared/snapshot-brain.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const MAX_PROMPT_CHARS = 120_000;
const EXEC_SUMMARY_TYPE = "executive_summary";

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
    return "Deep assessment is paused because the workspace AI Gateway credit limit has been reached.";
  }
  if (status === 402 || normalized.includes("credits exhausted")) {
    return "Deep assessment is paused because AI credits are exhausted.";
  }
  if (status === 429) {
    return "Deep assessment is temporarily rate limited. Please try again in a few minutes.";
  }
  if (status === 401 || status === 403) {
    return "Deep assessment is currently unavailable because the AI Gateway rejected the request.";
  }
  return "Deep assessment is currently unavailable. Please try again shortly.";
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
  const headHalf = Math.floor(budget * 0.55);
  const tailHalf = Math.floor(budget * 0.25);
  const head = md.slice(0, headHalf);
  const tail = md.slice(-tailHalf);
  const headings = (md.match(/^#{1,6}\s.+$/gm) ?? []).slice(0, 40).join("\n");
  return [head, "\n\n…\n\n[outline of skipped sections]\n" + headings + "\n\n…\n\n", tail].join("");
}

const SYSTEM_PROMPT = `You are a senior McKinsey-style strategy partner reviewing the document below.
Produce ONLY a rigorous analytical deep dive. Do NOT restate or rewrite the document.

You have the founder's FULL venture context: the venture brief, all research gathered, every completed deliverable, and the Executive Summary. Your assessment of THIS document must be internally consistent with the Executive Summary and with the numbers, positioning, ICP, pricing, GTM and economics established in the other documents. Explicitly call out any contradictions between this document and the rest of the venture as risks.

Output clean Markdown that begins with this exact H2:

## McKinsey-Grade Assessment

Then use these ### subsections in order — adapt wording so they read natural for THIS document type, but cover every angle. ~700-1100 words total.

### Situation & Context
Frame the problem, the founder's position, and what's actually at stake. Reference specifics from the venture brief, the Executive Summary, and the research.

### Key Assumptions
Numbered list. For each: the assumption + confidence (High / Medium / Low) + 1-line rationale. Where an assumption conflicts with the Executive Summary or another deliverable, say so.

### Pressure Test — What Could Go Wrong
3-6 sharpest counter-arguments, market realities, competitive responses, or execution traps an experienced partner would raise. Include at least one bullet flagging any misalignment between this document and the Executive Summary or other completed deliverables (or state "no material misalignment found" if genuinely none).

### Quantified Sensitivities / Scenarios
Where the doc has any numbers (pricing, CAC, conversion, runway, market size, channel mix, etc.) include a small Markdown table with Base / Upside / Downside columns and the key drivers. If the doc is purely qualitative (e.g. brand voice), substitute a 2x2 or trade-off matrix.

### Risks & Mitigations
Markdown table with columns: Risk | Likelihood (H/M/L) | Impact (H/M/L) | Mitigation.

### What Would Have to Be True
3-5 crisp, testable conditions for this plan to succeed.

### 30 / 60 / 90-Day Actions
Concrete actions per horizon. Each action: owner role + verifiable outcome.

### Confidence Summary
1-2 sentences: overall confidence in this document, the biggest unknown, and the next single action that would most reduce risk.

Finally, on its own line, emit a single italic provenance line listing the venture artifacts you actually drew on, e.g.:
_Grounded in: venture brief, research brief, executive_summary, financial_model, pricing_strategy_

STRICT RULES:
- DO NOT use footnote markers ([^1], [^2], etc.).
- DO NOT add a "## Sources", "## References", or "## Citations" section.
- DO NOT repeat the executive-summary content; assume the reader has it directly above.
- Be specific, quantitative when possible, and brutally honest.

After the markdown, on a final line, output exactly:
QUALITY_SCORE: <0-100 integer reflecting analytical rigor, specificity, and partner-readiness>`;

function buildContextBundle(
  snap: any,
  allDocs: any[],
  type: any,
  documentType: string,
): { sections: string[]; provenance: string[] } {
  const deps: string[] = type.dependencies ?? [];
  const depSet = new Set(deps);
  const provenance: string[] = ["venture brief"];

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

  const sections: string[] = [];
  sections.push(`# Document under review: ${type.name} (type: ${documentType})\nDescription: ${type.description}`);

  if (snap.concept_summary) {
    sections.push(`## North-star concept\n${snap.concept_summary}\nValue proposition: ${snap.value_proposition ?? ""}`);
  }
  sections.push(`## Founder & market\n${JSON.stringify(founderCard, null, 2)}`);
  sections.push(`## Venture brief (extracted_data)\n${JSON.stringify(snap.extracted_data ?? {}, null, 2)}`);

  if (snap.research_brief) {
    provenance.push("research brief");
    sections.push(
      `## Research brief (background evidence — synthesize as analyst judgment, NO citations in output)\n${JSON.stringify(snap.research_brief, null, 2)}`,
    );
  }

  // Additional research-bearing fields on the snapshot
  const extraResearchKeys = [
    "enrichment_data",
    "enrichment_summary",
    "deep_research",
    "market_research",
    "competitor_research",
  ];
  const extraResearch: Record<string, any> = {};
  for (const k of extraResearchKeys) {
    if (snap[k] && (typeof snap[k] !== "object" || Object.keys(snap[k]).length)) {
      extraResearch[k] = snap[k];
    }
  }
  if (Object.keys(extraResearch).length) {
    provenance.push("enrichment");
    sections.push(`## Additional research / enrichment\n${JSON.stringify(extraResearch, null, 2)}`);
  }

  // Executive Summary (when it isn't the doc under review)
  const execDoc = allDocs.find((d) => d.document_type === EXEC_SUMMARY_TYPE && d.document_type !== documentType);
  if (execDoc?.content) {
    provenance.push(EXEC_SUMMARY_TYPE);
    sections.push(
      `## EXEC SUMMARY — north-star narrative this assessment MUST align with\n${execDoc.content}`,
    );
  }

  // All other completed sibling docs (excluding the one under review and exec summary already shown)
  const siblings = allDocs.filter(
    (d) =>
      d.content &&
      d.document_type !== documentType &&
      d.document_type !== EXEC_SUMMARY_TYPE,
  );
  if (siblings.length) {
    // Order: primary upstream deps first, then everything else
    siblings.sort((a, b) => {
      const aDep = depSet.has(a.document_type) ? 0 : 1;
      const bDep = depSet.has(b.document_type) ? 0 : 1;
      return aDep - bDep || a.document_type.localeCompare(b.document_type);
    });
    const blocks: string[] = [];
    for (const d of siblings) {
      const tag = depSet.has(d.document_type) ? "PRIMARY UPSTREAM" : "context";
      const intake = d.intake_answers && Object.keys(d.intake_answers).length
        ? `\n_intake answers:_ ${JSON.stringify(d.intake_answers)}\n`
        : "";
      const body = smartExcerpt(d.content, 1500);
      blocks.push(`### ${d.document_type}  [${tag}]${intake}\n${body}`);
      provenance.push(d.document_type);
    }
    sections.push(`## All completed deliverables for this venture\n${blocks.join("\n\n---\n\n")}`);
  }

  return { sections, provenance };
}

function fitToBudget(sections: string[], protectedIdx: Set<number>): string {
  let total = sections.reduce((n, s) => n + s.length, 0);
  if (total <= MAX_PROMPT_CHARS) return sections.join("\n\n");
  // Truncate non-protected sections progressively
  const order = sections
    .map((s, i) => ({ i, len: s.length }))
    .filter((x) => !protectedIdx.has(x.i))
    .sort((a, b) => b.len - a.len);
  for (const { i } of order) {
    if (total <= MAX_PROMPT_CHARS) break;
    const overflow = total - MAX_PROMPT_CHARS;
    const targetLen = Math.max(800, sections[i].length - overflow - 200);
    const before = sections[i].length;
    sections[i] = smartExcerpt(sections[i], targetLen);
    total -= before - sections[i].length;
  }
  return sections.join("\n\n");
}

async function generateAssessment(
  supabase: any,
  snapshotId: string,
  documentType: string,
  feedback?: string,
  tags?: string[],
) {
  const [{ data: snap }, { data: doc }, { data: type }, { data: allDocs }] = await Promise.all([
    supabase.from("venture_snapshots").select("*").eq("id", snapshotId).maybeSingle(),
    supabase.from("venture_documents").select("*").eq("snapshot_id", snapshotId).eq("document_type", documentType).maybeSingle(),
    supabase.from("venture_document_types").select("*").eq("type", documentType).maybeSingle(),
    supabase
      .from("venture_documents")
      .select("document_type, content, intake_answers, status")
      .eq("snapshot_id", snapshotId)
      .eq("status", "complete"),
  ]);
  if (!snap) throw new Error("Snapshot not found");
  if (!doc || !doc.content) throw new Error("Document must be generated before running a deep assessment");
  if (!type) throw new Error(`Unknown document type: ${documentType}`);

  await supabase
    .from("venture_documents")
    .update({ deep_assessment_status: "generating" })
    .eq("snapshot_id", snapshotId)
    .eq("document_type", documentType);

  const { sections, provenance } = buildContextBundle(snap, allDocs ?? [], type, documentType);

  // The document under review — always last, always full
  const docSectionIdx = sections.length;
  sections.push(`## The document to assess (founder is reading this now)\n${doc.content}`);

  // Founder guidance — appended after fitting so it's never truncated
  const guidance = (feedback && feedback.trim()) || (tags && tags.length)
    ? `## Founder guidance for THIS deep assessment (highest priority — focus the analysis here)\n${
        tags && tags.length ? `Tags: ${tags.join(", ")}\n\n` : ""
      }${feedback?.trim() ?? ""}`
    : "";

  // Protect: doc under review, venture brief (idx 2), founder card (idx 1), title (idx 0), concept (if present)
  const protectedIdx = new Set<number>([0, docSectionIdx]);
  // Mark founder card, concept summary, venture brief as protected
  sections.forEach((s, i) => {
    if (
      s.startsWith("## Founder & market") ||
      s.startsWith("## Venture brief") ||
      s.startsWith("## North-star concept") ||
      s.startsWith("## EXEC SUMMARY")
    ) {
      protectedIdx.add(i);
    }
  });

  let userPrompt = fitToBudget(sections, protectedIdx);
  if (guidance) userPrompt += "\n\n" + guidance;

  const TRACK_ADDENDUM: Record<string, string> = {
    lifestyle: `\n\nTRACK OVERRIDE — Main Street Startup (first-time founder opening a real small business: café, salon, trade, local service, indie product, small e-commerce brand). Tune the assessment accordingly:
- Replace TAM modeling and venture-readiness scoring with: unit economics per transaction, breakeven covers/customers per day, neighborhood density and foot-traffic realism, repeat-purchase rate, word-of-mouth loops.
- Pressure-test against HYPERLOCAL competitors within 5–10 miles, not category leaders.
- 30/60/90 actions are framed as opening-week / first-100-customers actions, not fundraising actions.
- Funding language: startup costs, working capital, owner draw, savings, friends & family, SBA microloan, revenue-based, local CDFI, grants. NOT Series A / pitch deck / VC.
- Zero VC vocabulary (no TAM/SAM/SOM, no ARR/NRR/CAC payback, no hockey-stick, no unicorn). Plain English a non-technical owner can act on.`,
  };
  const trackAddendum = snap.track && TRACK_ADDENDUM[snap.track] ? TRACK_ADDENDUM[snap.track] : "";
  const systemPrompt = SYSTEM_PROMPT + trackAddendum;

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            `Artifacts available to you for THIS assessment: ${provenance.join(", ")}.\n\n` +
            userPrompt,
        },
      ],
    }),
  });

  if (!aiRes.ok) {
    const txt = await aiRes.text();
    await supabase
      .from("venture_documents")
      .update({ deep_assessment_status: "failed" })
      .eq("snapshot_id", snapshotId)
      .eq("document_type", documentType);
    throw new GatewayError(aiRes.status, txt);
  }

  const aiJson = await aiRes.json();
  let raw = aiJson.choices?.[0]?.message?.content ?? "";

  let quality = 75;
  const qm = raw.match(/QUALITY_SCORE:\s*(\d{1,3})/i);
  if (qm) {
    quality = Math.max(0, Math.min(100, parseInt(qm[1], 10)));
    raw = raw.replace(/QUALITY_SCORE:\s*\d{1,3}\s*$/i, "").trim();
  }
  raw = stripCitations(raw);

  if (!/^##\s*McKinsey/im.test(raw)) {
    raw = `## McKinsey-Grade Assessment\n\n${raw}`;
  }

  await supabase
    .from("venture_documents")
    .update({
      deep_assessment: raw,
      deep_assessment_quality_score: quality,
      deep_assessment_status: "complete",
      deep_assessment_generated_at: new Date().toISOString(),
    })
    .eq("snapshot_id", snapshotId)
    .eq("document_type", documentType);

  return { quality, wordCount: raw.split(/\s+/).filter(Boolean).length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { snapshotId, documentType, feedback, tags } = await req.json();
    if (!snapshotId || !documentType) {
      return new Response(
        JSON.stringify({ error: "snapshotId and documentType required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const result = await generateAssessment(
      supabase,
      snapshotId,
      documentType,
      typeof feedback === "string" ? feedback : undefined,
      Array.isArray(tags) ? tags : undefined,
    );
    return new Response(
      JSON.stringify({ ok: true, ...result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (e instanceof GatewayError) {
      return new Response(
        JSON.stringify({ ok: false, error: message, gatewayStatus: e.status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

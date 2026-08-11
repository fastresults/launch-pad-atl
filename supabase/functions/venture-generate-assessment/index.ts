// Founders Hub — on-demand McKinsey-grade deep assessment for a single document.
// Uses the shared venture-context builder so the deep dive aligns with the rest
// of the venture and avoids duplicating raw blobs the snapshot brain already
// summarizes. Routes to Gemini Pro because this is the highest-rigor surface.

import { createClient } from "npm:@supabase/supabase-js@2";
import { compactPreamble, distillDeps, loadVentureContext, pickBrainSlice } from "../_shared/venture-context.ts";
import { ensureSnapshotBrain } from "../_shared/snapshot-brain.ts";
import { brainCorpusBlock } from "../_shared/brain-corpus.ts";
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
    return "Deep assessment is paused — our team has been notified.";
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

## Deep Dive


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
  ctx: any,
  allDocs: any[],
  type: any,
  documentType: string,
): { sections: string[]; provenance: string[] } {
  const deps: string[] = type.dependencies ?? [];
  const depSet = new Set(deps);
  const provenance: string[] = ["venture preamble"];

  const sections: string[] = [];
  sections.push(`# Document under review: ${type.name ?? documentType} (type: ${documentType})\nDescription: ${type.description ?? ""}`);

  // 1. Compact authoritative preamble (replaces founder card + raw brief JSON)
  sections.push(compactPreamble(ctx));

  // 2. Snapshot brain — pick the slice relevant to THIS document
  const slice = pickBrainSlice(ctx.brain, type.context_keys);
  if (slice && Object.keys(slice).length) {
    provenance.push("snapshot brain");
    sections.push(`## Snapshot brain (relevant facts only)\n\`\`\`json\n${JSON.stringify(slice, null, 2)}\n\`\`\``);
  }

  // 3. Executive Summary (when it isn't the doc under review) — always in full
  const execDoc = allDocs.find((d) => d.document_type === EXEC_SUMMARY_TYPE && d.document_type !== documentType);
  if (execDoc?.content) {
    provenance.push(EXEC_SUMMARY_TYPE);
    sections.push(`## EXEC SUMMARY — north-star narrative this assessment MUST align with\n${execDoc.content}`);
  }

  // 4. Primary upstream deps — distilled summaries instead of full markdown
  const primaryDeps = allDocs.filter(
    (d) => d.content && d.document_type !== documentType && d.document_type !== EXEC_SUMMARY_TYPE && depSet.has(d.document_type),
  );
  if (primaryDeps.length) {
    provenance.push(...primaryDeps.map((d) => d.document_type));
    sections.push(`## Primary upstream dependencies (distilled)\n${distillDeps(primaryDeps)}`);
  }

  // 5. Other completed siblings — distilled outline
  const otherDocs = allDocs.filter(
    (d) => d.content && d.document_type !== documentType && d.document_type !== EXEC_SUMMARY_TYPE && !depSet.has(d.document_type),
  );
  if (otherDocs.length) {
    provenance.push(...otherDocs.map((d) => d.document_type));
    sections.push(`## Other completed deliverables (outline only)\n${distillDeps(otherDocs)}`);
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
  const [ctx, { data: doc }, { data: type }, { data: allDocs }] = await Promise.all([
    loadVentureContext(supabase, snapshotId),
    supabase.from("venture_documents").select("*").eq("snapshot_id", snapshotId).eq("document_type", documentType).maybeSingle(),
    supabase.from("venture_document_types").select("*").eq("type", documentType).maybeSingle(),
    supabase
      .from("venture_documents")
      .select("document_type, content, intake_answers, status")
      .eq("snapshot_id", snapshotId)
      .eq("status", "complete"),
  ]);
  if (!doc || !doc.content) throw new Error("Document must be generated before running a deep assessment");
  if (!type) throw new Error(`Unknown document type: ${documentType}`);

  // Ensure brain exists (lazy compute on first deep assessment for this venture)
  ctx.brain = (await ensureSnapshotBrain(supabase, snapshotId)) ?? ctx.brain;

  await supabase
    .from("venture_documents")
    .update({ deep_assessment_status: "generating" })
    .eq("snapshot_id", snapshotId)
    .eq("document_type", documentType);

  const { sections, provenance } = buildContextBundle(ctx, allDocs ?? [], type, documentType);

  // Founder's Second Brain corpus for this deliverable.
  try {
    const corpus = await brainCorpusBlock(
      supabase,
      ctx.userId,
      snapshotId,
      [type.name ?? documentType, type.description ?? ""].filter(Boolean).join(" \u2014 "),
      8,
    );
    if (corpus) {
      sections.push(corpus);
      provenance.push("second brain corpus");
    }
  } catch (e) {
    console.warn("brain corpus retrieval failed", e);
  }

  // The document under review — always last, always full
  const docSectionIdx = sections.length;
  sections.push(`## The document to assess (founder is reading this now)\n${doc.content}`);

  // Founder guidance — appended after fitting so it's never truncated
  const guidance = (feedback && feedback.trim()) || (tags && tags.length)
    ? `## Founder guidance for THIS deep assessment (highest priority — focus the analysis here)\n${
        tags && tags.length ? `Tags: ${tags.join(", ")}\n\n` : ""
      }${feedback?.trim() ?? ""}`
    : "";

  // Protect: title, preamble, brain slice, exec summary, doc under review
  const protectedIdx = new Set<number>([0, docSectionIdx]);
  sections.forEach((s, i) => {
    if (
      s.startsWith("## Venture preamble") ||
      s.startsWith("## Snapshot brain") ||
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
  const trackAddendum = ctx.snap.track && TRACK_ADDENDUM[ctx.snap.track] ? TRACK_ADDENDUM[ctx.snap.track] : "";
  const systemPrompt = SYSTEM_PROMPT + trackAddendum;

  // Deep assessments are the highest-rigor surface — route to Gemini Pro.
  const aiRes = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-pro-preview",
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
  }, { timeoutMs: 120_000 });

  if (!aiRes.ok) {
    const txt = await aiRes.text();
    await supabase
      .from("venture_documents")
      .update({ deep_assessment_status: "failed" })
      .eq("snapshot_id", snapshotId)
      .eq("document_type", documentType);
    await supabase.from("venture_generation_failures").insert({
      snapshot_id: snapshotId,
      document_type: documentType,
      error: `Assessment gateway ${aiRes.status}: ${txt.slice(0, 300)}`,
    });
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

  if (!/^##\s*(Deep\s+Dive|McKinsey)/im.test(raw)) {
    raw = `## Deep Dive\n\n${raw}`;
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
      return jsonResponse({ error: "snapshotId and documentType required" }, 400, corsHeaders);
    }
    const auth = await requireUser(req, corsHeaders);
    if (auth.error) return auth.error;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const own = await requireSnapshotOwner(supabase, snapshotId, auth.userId!, corsHeaders);
    if (own.error) return own.error;
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

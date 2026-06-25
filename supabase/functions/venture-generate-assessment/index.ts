// Founders Hub — on-demand McKinsey-grade deep assessment for a single document.
// Reads the existing document + snapshot + a few upstream deps and produces a
// partner-level analytical deep dive that is stored in `venture_documents.deep_assessment`.

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

const SYSTEM_PROMPT = `You are a senior McKinsey-style strategy partner reviewing the document below.
Produce ONLY a rigorous analytical deep dive. Do NOT restate or rewrite the document.

Output clean Markdown that begins with this exact H2:

## McKinsey-Grade Assessment

Then use these ### subsections in order — adapt wording so they read natural for THIS document type, but cover every angle. ~700-1100 words total.

### Situation & Context
Frame the problem, the founder's position, and what's actually at stake. Reference specifics from the venture brief and research.

### Key Assumptions
Numbered list. For each: the assumption + confidence (High / Medium / Low) + 1-line rationale.

### Pressure Test — What Could Go Wrong
3-6 sharpest counter-arguments, market realities, competitive responses, or execution traps an experienced partner would raise.

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

STRICT RULES:
- DO NOT use footnote markers ([^1], [^2], etc.).
- DO NOT add a "## Sources", "## References", or "## Citations" section.
- DO NOT repeat the executive-summary content; assume the reader has it directly above.
- Be specific, quantitative when possible, and brutally honest.

After the markdown, on a final line, output exactly:
QUALITY_SCORE: <0-100 integer reflecting analytical rigor, specificity, and partner-readiness>`;

async function generateAssessment(
  supabase: any,
  snapshotId: string,
  documentType: string,
  feedback?: string,
  tags?: string[],
) {
  const [{ data: snap }, { data: doc }, { data: type }] = await Promise.all([
    supabase.from("venture_snapshots").select("*").eq("id", snapshotId).maybeSingle(),
    supabase.from("venture_documents").select("*").eq("snapshot_id", snapshotId).eq("document_type", documentType).maybeSingle(),
    supabase.from("venture_document_types").select("*").eq("type", documentType).maybeSingle(),
  ]);
  if (!snap) throw new Error("Snapshot not found");
  if (!doc || !doc.content) throw new Error("Document must be generated before running a deep assessment");
  if (!type) throw new Error(`Unknown document type: ${documentType}`);

  // Mark as generating
  await supabase
    .from("venture_documents")
    .update({ deep_assessment_status: "generating" })
    .eq("snapshot_id", snapshotId)
    .eq("document_type", documentType);

  // Pull upstream dep docs for grounding
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

  const userPrompt = [
    `# Document under review: ${type.name} (type: ${documentType})`,
    `Description: ${type.description}`,
    snap.concept_summary ? `\n## North-star concept\n${snap.concept_summary}\nValue proposition: ${snap.value_proposition ?? ""}` : "",
    `\n## Founder & market\n${JSON.stringify(founderCard, null, 2)}`,
    `\n## Venture brief (extracted_data)\n${JSON.stringify(snap.extracted_data ?? {}, null, 2)}`,
    snap.research_brief ? `\n## Research brief (background evidence — synthesize as analyst judgment, NO citations in output)\n${JSON.stringify(snap.research_brief, null, 2)}` : "",
    depContext ? `\n## Upstream documents for context\n${depContext}` : "",
    `\n## The document to assess (Executive Summary the founder has just read)\n${doc.content}`,
    (feedback && feedback.trim()) || (tags && tags.length)
      ? `\n## Founder guidance for THIS deep assessment (highest priority — focus the analysis here)\n${
          tags && tags.length ? `Tags: ${tags.join(", ")}\n\n` : ""
        }${feedback?.trim() ?? ""}`
      : "",
  ].filter(Boolean).join("\n\n");

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

  // Ensure heading present
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

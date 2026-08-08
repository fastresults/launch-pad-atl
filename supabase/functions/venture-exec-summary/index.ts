// Executive summary generator.
//
// Reads every completed asset for a venture, extracts the venture's own money
// figures from its finance / pricing / market assets, and writes a four-paragraph
// executive summary that includes a data-backed forecast. Both the prose and the
// structured metric set are cached on venture_snapshots so the public showcase and
// the second brain can serve them instantly.
//
//   POST { snapshotId, force? }   owner / admin JWT, or the service role key.

import { createClient } from "npm:@supabase/supabase-js@2";
import { aiFetch } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-impersonate-user, x-internal-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const MAX_DOCS = 40;
const CHARS_PER_DOC = 900;
/** Money-bearing assets get a much larger budget so tables survive intact. */
const CHARS_PER_MONEY_DOC = 6000;
const FRESH_MS = 24 * 60 * 60 * 1000;

/** Assets that actually carry figures worth forecasting from. */
const MONEY_TYPES = [
  "financial_model",
  "unit_economics",
  "budget_pro_forma",
  "pricing_offer_sheet",
  "funding_strategy",
  "market_analysis",
  "bom_and_landed_cost",
  "go_to_market_plan",
  "paid_ads_starter_pack",
  "operating_plan",
];

export interface ExecMetric {
  label: string;
  value: string;
  note?: string | null;
  source?: string | null;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * Streamed call to the gateway Responses API. Reasoning models routinely run for
 * minutes, so the request always streams and the deltas are accumulated here.
 */
async function respondText(input: string, instructions: string): Promise<string> {
  const res = await aiFetch(
    "https://ai.gateway.lovable.dev/v1/responses",
    {
      method: "POST",
      headers: {
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "fetch",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        input: [
          { role: "developer", content: [{ type: "input_text", text: instructions }] },
          { role: "user", content: [{ type: "input_text", text: input }] },
        ],
        stream: true,
        reasoning: { effort: "low", summary: "auto" },
      }),
    },
    { timeoutMs: 240_000 },
  );

  if (!res.ok || !res.body) {
    const txt = await res.text().catch(() => "");
    const err = new Error(`gateway ${res.status}: ${txt.slice(0, 300)}`);
    (err as any).status = res.status;
    throw err;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let out = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === "[DONE]") continue;
      try {
        const evt = JSON.parse(raw);
        if (evt?.type === "response.output_text.delta" && typeof evt.delta === "string") {
          out += evt.delta;
        } else if (evt?.type === "response.completed" && !out) {
          const parts = evt?.response?.output ?? [];
          for (const item of parts) {
            for (const c of item?.content ?? []) {
              if (c?.type === "output_text" && typeof c.text === "string") out += c.text;
            }
          }
        }
      } catch {
        /* partial frame — ignore */
      }
    }
  }
  return out.trim();
}

/** Pulls the first JSON object out of a model reply, fenced or not. */
function parseJsonObject(text: string): any | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

function cleanMetrics(raw: any): ExecMetric[] {
  const list = Array.isArray(raw?.metrics) ? raw.metrics : [];
  const out: ExecMetric[] = [];
  const seen = new Set<string>();
  for (const m of list) {
    const label = String(m?.label ?? "").trim();
    const value = String(m?.value ?? "").trim();
    const source = String(m?.source ?? "").trim();
    if (!label || !value) continue;
    // A figure with no named source asset is not evidence — drop it.
    if (!source) continue;
    if (/^(n\/?a|unknown|tbd|none)$/i.test(value)) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      label: label.slice(0, 40),
      value: value.slice(0, 24),
      note: String(m?.note ?? "").trim().slice(0, 90) || null,
      source: source.slice(0, 60),
    });
    if (out.length >= 6) break;
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const internal = req.headers.get("x-internal-key") === SERVICE_KEY || token === SERVICE_KEY;

    const body = await req.json().catch(() => ({}));
    const snapshotId: string | undefined = body?.snapshotId;
    const force = body?.force === true;
    if (!snapshotId) return json({ error: "snapshotId required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: snap } = await admin
      .from("venture_snapshots")
      .select(
        "id,user_id,company_name,industry,city,region,value_proposition,concept_summary,business_concept,executive_summary,executive_metrics,executive_summary_at",
      )
      .eq("id", snapshotId)
      .maybeSingle();
    if (!snap) return json({ error: "Venture not found" }, 404);

    if (!internal) {
      if (!token) return json({ error: "Missing auth" }, 401);
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: auth } },
      });
      const { data: userRes } = await userClient.auth.getUser();
      const userId = userRes?.user?.id ?? null;
      if (!userId) return json({ error: "Not signed in" }, 401);
      if (snap.user_id !== userId) {
        const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userId);
        const isAdmin = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "super_admin");
        if (!isAdmin) return json({ error: "Forbidden" }, 403);
      }
    }

    const fresh =
      !!snap.executive_summary &&
      !!snap.executive_summary_at &&
      Date.now() - new Date(snap.executive_summary_at).getTime() < FRESH_MS;
    if (fresh && !force) {
      return json({
        ok: true,
        cached: true,
        summary: snap.executive_summary,
        metrics: snap.executive_metrics ?? [],
      });
    }

    const [docsRes, typesRes] = await Promise.all([
      admin
        .from("venture_documents")
        .select("document_type,content")
        .eq("snapshot_id", snapshotId)
        .eq("status", "complete"),
      admin.from("venture_document_types").select("type,name,category,sort_order").eq("active", true),
    ]);

    const meta = new Map((typesRes.data ?? []).map((t: any) => [t.type, t]));
    const nameOf = (t: string) => meta.get(t)?.name ?? t.replace(/_/g, " ");

    const docs = (docsRes.data ?? [])
      .filter((d: any) => (d.content ?? "").trim() && d.document_type !== "ai_tool_stack_recommendation")
      .sort(
        (a: any, b: any) =>
          (meta.get(a.document_type)?.sort_order ?? 999) - (meta.get(b.document_type)?.sort_order ?? 999),
      );

    if (!docs.length) return json({ error: "No completed assets to summarize yet." }, 400);

    const inventory = docs.map((d: any) => `- ${nameOf(d.document_type)}`).join("\n");

    // ---- 1. The money assets, in full ---------------------------------------
    const moneyDocs = MONEY_TYPES.map((t) => docs.find((d: any) => d.document_type === t)).filter(
      Boolean,
    ) as any[];

    const moneyText = moneyDocs
      .map(
        (d) =>
          `## ${nameOf(d.document_type)}\n${String(d.content).slice(0, CHARS_PER_MONEY_DOC)}`,
      )
      .join("\n\n");

    // ---- 2. Extract the venture's own figures --------------------------------
    let metrics: ExecMetric[] = [];
    if (moneyDocs.length) {
      const extractInstructions = [
        "You extract hard figures from a founder's own financial documents. Return json only.",
        "",
        "Read the assets and return this json shape and nothing else:",
        '{"metrics":[{"label":"","value":"","note":"","source":""}]}',
        "",
        "Rules:",
        "- 3 to 6 metrics, most decision-relevant first.",
        "- Every figure must appear in, or follow by simple arithmetic from, the supplied text. Never estimate, benchmark, or invent.",
        "- If a figure is not present, omit that metric entirely. Fewer real metrics beats more invented ones.",
        "- value: short and display-ready, e.g. \"$4,800/mo\", \"18 clients\", \"62%\", \"$45,000\", \"Month 5\".",
        "- label: 2-4 plain words, e.g. \"Price per client\", \"Breakeven at\", \"Month-12 revenue\", \"Gross margin\", \"Startup capital\", \"Reachable market\".",
        "- note: optional one-line assumption behind the figure (max 12 words).",
        "- source: the exact asset heading the figure came from.",
        "- No markdown, no commentary — json only.",
      ].join("\n");

      try {
        const raw = await respondText(
          `Venture: ${snap.company_name ?? "Untitled venture"}\n\n${moneyText}`,
          extractInstructions,
        );
        metrics = cleanMetrics(parseJsonObject(raw));
      } catch (e) {
        console.error("[venture-exec-summary] metric extraction failed", e);
      }
    }

    // Fewer than three real figures is not a forecast — fall back to prose only.
    const hasForecast = metrics.length >= 3;
    if (!hasForecast) metrics = [];

    // ---- 3. Write the summary around those figures ---------------------------
    const excerpts = docs
      .slice(0, MAX_DOCS)
      .map((d: any) => `## ${nameOf(d.document_type)}\n${String(d.content).slice(0, CHARS_PER_DOC)}`)
      .join("\n\n");

    const figureBlock = metrics
      .map((m) => `- ${m.label}: ${m.value}${m.note ? ` (${m.note})` : ""} — from ${m.source}`)
      .join("\n");

    const system = [
      "You are an award-winning strategist writing the executive summary that opens a founder's venture showcase.",
      "Write for an outsider — an investor, partner, lender or first hire — who has 60 seconds.",
      "",
      "Rules:",
      hasForecast
        ? "- Exactly four short paragraphs, 320-360 words total."
        : "- Exactly three short paragraphs, 280-320 words total.",
      "- Paragraph 1: what the startup is, who it serves, and the promise, in concrete language.",
      "- Paragraph 2: what has already been built — name the real artifacts from the asset list and why that set de-risks the launch.",
      hasForecast
        ? "- Paragraph 3: the forecast. Use the verified figures to lay out the revenue path — price, customers needed, projected revenue, margin, capital required — and name the assumption each rests on. Frame it as the venture's own projection, not a guarantee."
        : "",
      hasForecast
        ? "- Paragraph 4: how to use these assets in the next 14 days to reach a first paying customer, tied to the breakeven number."
        : "- Paragraph 3: how to use these assets in the next 14 days to reach a first paying customer.",
      "",
      hasForecast
        ? "Figure discipline: you may use ONLY the figures in the VERIFIED FIGURES block, written exactly as given. No rounding drift, no new percentages, no invented dates, customers, traction or partners. Simple, stated arithmetic between two verified figures is allowed."
        : "- No numbers, dates, customers or partners that are not stated in the assets.",
      "- Plain prose. No headings, no bullets, no markdown, no hype adjectives.",
      "- Never call this a plan, blueprint, playbook or roadmap. It is a built startup.",
    ]
      .filter(Boolean)
      .join("\n");

    const userMsg = [
      `Startup: ${snap.company_name ?? "Untitled venture"}`,
      snap.industry ? `Industry: ${snap.industry}` : "",
      [snap.city, snap.region].filter(Boolean).length
        ? `Location: ${[snap.city, snap.region].filter(Boolean).join(", ")}`
        : "",
      snap.value_proposition ? `Promise: ${snap.value_proposition}` : "",
      snap.concept_summary || snap.business_concept
        ? `Concept: ${snap.concept_summary || snap.business_concept}`
        : "",
      "",
      hasForecast ? "# VERIFIED FIGURES (the only numbers you may use)" : "",
      hasForecast ? figureBlock : "",
      "",
      `# Asset inventory (${docs.length} built assets)`,
      inventory,
      "",
      "# Asset excerpts",
      excerpts,
    ]
      .filter(Boolean)
      .join("\n");

    let summary = "";
    try {
      summary = await respondText(userMsg, system);
    } catch (e: any) {
      const status = e?.status ?? 0;
      console.error("[venture-exec-summary] gateway", status, String(e?.message ?? e).slice(0, 300));
      if (status === 429) return json({ error: "Rate limited — try again shortly." }, 429);
      if (status === 402) return json({ error: "AI credits exhausted." }, 402);
      return json({ error: "Could not write the executive summary." }, 502);
    }
    if (!summary) return json({ error: "The summary came back empty." }, 502);

    const { error: upErr } = await admin
      .from("venture_snapshots")
      .update({
        executive_summary: summary,
        executive_metrics: metrics,
        executive_summary_at: new Date().toISOString(),
      })
      .eq("id", snapshotId);
    if (upErr) {
      console.error("[venture-exec-summary] save failed", upErr.message);
      return json({ error: "Could not save the summary." }, 500);
    }

    return json({ ok: true, cached: false, summary, metrics, assetCount: docs.length });
  } catch (e) {
    console.error("[venture-exec-summary]", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

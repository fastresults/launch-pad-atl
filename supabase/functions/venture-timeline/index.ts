// Venture launch timeline generator.
//
// Reads the venture's own assets and emits an effort-based schedule — steps,
// dependencies, milestones and a revenue model — that the client turns into
// dates for whatever scenario the founder dials in. Nothing here is dated:
// dates are a function of who is building and how many hours they have.
//
//   POST { snapshotId, force? }   owner / admin JWT, or the service role key.

import { createClient } from "npm:@supabase/supabase-js@2";
import { aiFetch } from "../_shared/ai-fetch.ts";
import { FALLBACK_TIMELINE, normalizeTimeline, type Timeline } from "./schema.ts";

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

const MAX_DOCS = 34;
const CHARS_PER_DOC = 900;
const CHARS_PER_MONEY_DOC = 4500;
const FRESH_MS = 24 * 60 * 60 * 1000;

const MONEY_TYPES = [
  "financial_model",
  "unit_economics",
  "budget_pro_forma",
  "pricing_offer_sheet",
  "operating_plan",
  "go_to_market_plan",
];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Streamed Responses call — reasoning models routinely run for minutes. */
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
    throw new Error(`gateway ${res.status}: ${txt.slice(0, 300)}`);
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
          for (const item of evt?.response?.output ?? []) {
            for (const c of item?.content ?? []) {
              if (c?.type === "output_text" && typeof c.text === "string") out += c.text;
            }
          }
        }
      } catch {
        /* partial frame */
      }
    }
  }
  return out.trim();
}

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

const INSTRUCTIONS = [
  "You sequence the real work of getting a small business from an idea to money in the bank.",
  "You are writing for a first-time founder — someone leaving a job, running a trade, or building with their partner. Not a venture-backed software startup.",
  "Return json only, no commentary, no markdown fence.",
  "",
  "Shape:",
  '{"steps":[{"id":"","title":"","lane":"founder|builder|marketer","phase":"idea|validate|foundation|offer|presell|launch|prove|cashflow","effortHours":0,"why":"","doneWhen":"","dependsOn":[],"assetKey":"","moneyCanAccelerate":false,"waitDays":0}],',
  '"milestones":[{"id":"","label":"","afterStep":"","kind":"proof|launch|cash|ops"}],',
  '"revenue":{"firstCashMilestone":"","monthlyTargetUsd":0,"rampMonths":6,"monthlyCostUsd":0,"source":""},',
  '"rationale":""}',
  "",
  "Rules:",
  "- 22 to 32 steps, covering all eight phases, ending with the business cash-flowing a quarter after launch.",
  "- effortHours is real person-hours of work for ONE person, never a duration in days. Be honest: 20 customer conversations is 20-30 hours, a landing page is 12-20, a fulfilment SOP is 10-16.",
  "- lane: founder = talks to customers, prices, closes. builder = sets it up so it runs. marketer = fills the top of the funnel.",
  "- dependsOn uses step ids only, and must never form a loop. Keep the graph shallow — most steps have 1-2 dependencies.",
  "- waitDays only for unavoidable calendar waits nobody can work through (state filing, licence, inspection, supplier lead time).",
  "- moneyCanAccelerate true ONLY where a contractor or paid media could genuinely take the work (site build, brand production, ad reach, some fulfilment setup). Never true for customer conversations, pricing decisions, regulatory waits, or founder relationships.",
  "- assetKey must be one of the asset types listed in the prompt, or omitted. Never invent asset keys.",
  "- title: 3-8 plain words, an action. doneWhen: a checkable result, not an activity. why: one sentence, only when it earns its place.",
  "- Tailor to THIS venture: a physical or inventory business gets supplier, premises and stock steps with real lead times; a service business gets a compressed pre-sell and a heavier delivery lane; a regulated business gets licensing steps with waitDays.",
  "- revenue: monthlyTargetUsd and monthlyCostUsd ONLY if the supplied finance assets state or imply them arithmetically. Omit rather than invent. source names the asset.",
  "- Milestones mark moments, not tasks: problem confirmed, offer priced, page live, first dollar in, open for business, repeatable sales motion, breakeven.",
  "- Never call the venture a plan, blueprint, playbook or roadmap. It is a business being built.",
  "- json only.",
].join("\n");

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
        "id,user_id,company_name,industry,sub_industry,city,region,country,track,value_proposition,concept_summary,business_concept,venture_timeline,venture_timeline_at,executive_metrics",
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
      !!snap.venture_timeline &&
      !!snap.venture_timeline_at &&
      Date.now() - new Date(snap.venture_timeline_at).getTime() < FRESH_MS;
    if (fresh && !force) return json({ ok: true, cached: true, timeline: snap.venture_timeline });

    const [docsRes, typesRes] = await Promise.all([
      admin
        .from("venture_documents")
        .select("document_type,content")
        .eq("snapshot_id", snapshotId)
        .eq("status", "complete"),
      admin.from("venture_document_types").select("type,name,sort_order").eq("active", true),
    ]);

    const meta = new Map((typesRes.data ?? []).map((t: any) => [t.type, t]));
    const nameOf = (t: string) => meta.get(t)?.name ?? t.replace(/_/g, " ");
    const docs = (docsRes.data ?? [])
      .filter((d: any) => (d.content ?? "").trim())
      .sort(
        (a: any, b: any) =>
          (meta.get(a.document_type)?.sort_order ?? 999) - (meta.get(b.document_type)?.sort_order ?? 999),
      );

    const assetKeys = docs.map((d: any) => d.document_type);
    const moneyText = MONEY_TYPES.map((t) => docs.find((d: any) => d.document_type === t))
      .filter(Boolean)
      .map((d: any) => `## ${nameOf(d.document_type)}\n${String(d.content).slice(0, CHARS_PER_MONEY_DOC)}`)
      .join("\n\n");

    const excerpts = docs
      .slice(0, MAX_DOCS)
      .map((d: any) => `## ${nameOf(d.document_type)}\n${String(d.content).slice(0, CHARS_PER_DOC)}`)
      .join("\n\n");

    const input = [
      `Venture: ${snap.company_name ?? "Untitled venture"}`,
      snap.industry ? `Industry: ${snap.industry}${snap.sub_industry ? ` / ${snap.sub_industry}` : ""}` : "",
      [snap.city, snap.region, snap.country].filter(Boolean).length
        ? `Location: ${[snap.city, snap.region, snap.country].filter(Boolean).join(", ")}`
        : "",
      snap.track ? `Track: ${snap.track}` : "",
      snap.concept_summary || snap.business_concept
        ? `Concept: ${snap.concept_summary || snap.business_concept}`
        : "",
      snap.value_proposition ? `Promise: ${snap.value_proposition}` : "",
      "",
      `Valid assetKey values (use only these): ${assetKeys.join(", ") || "none"}`,
      "",
      moneyText ? `# Finance and pricing assets (verbatim)\n${moneyText}` : "",
      "",
      excerpts ? `# Everything else this venture has built\n${excerpts}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    let timeline: Timeline | null = null;
    try {
      const raw = await respondText(input, INSTRUCTIONS);
      timeline = normalizeTimeline(parseJsonObject(raw), new Set(assetKeys));
    } catch (e) {
      console.error("[venture-timeline] generation failed", e);
    }

    // Storing a schedule that failed validation is worse than storing nothing —
    // the client renders its own honest default cadence when this column is null.
    if (!timeline) {
      return json({ error: "Could not sequence this venture yet. Try again in a moment." }, 502);
    }
    timeline.generatedAt = new Date().toISOString();

    const { error: upErr } = await admin
      .from("venture_snapshots")
      .update({
        venture_timeline: timeline,
        venture_timeline_at: new Date().toISOString(),
      })
      .eq("id", snapshotId);
    if (upErr) {
      console.error("[venture-timeline] save failed", upErr.message);
      return json({ error: "Could not save the timeline." }, 500);
    }

    return json({
      ok: true,
      cached: false,
      timeline,
      stepCount: timeline.steps.length,
    });

  } catch (e) {
    console.error("[venture-timeline]", e);
    return json({ error: "Could not build the timeline." }, 500);
  }
});

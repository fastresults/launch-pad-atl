// Founders Hub — concept refinement gateway.
// Lets the founder draft, brainstorm, innovate, critique, apply and lock a 50-60
// word concept summary + value proposition that anchors all 21 documents.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const MAX_ITERATIONS = 20;
const WORD_MIN = 50;
const WORD_MAX = 60;

function wc(s: string | null | undefined) {
  return (s ?? "").trim().split(/\s+/).filter(Boolean).length;
}

async function callAI(messages: any[], jsonMode = true) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gateway ${res.status}: ${t.slice(0, 300)}`);
  }
  const j = await res.json();
  const raw = j.choices?.[0]?.message?.content ?? "";
  if (!jsonMode) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("AI returned invalid JSON");
  }
}

function contextBlock(snap: any) {
  return [
    `Company: ${snap.company_name ?? "(unnamed)"}`,
    snap.industry ? `Industry: ${snap.industry}${snap.sub_industry ? ` / ${snap.sub_industry}` : ""}` : "",
    snap.market_scope ? `Market scope: ${snap.market_scope}` : "",
    [snap.city, snap.region, snap.country].filter(Boolean).join(", ") ? `Location: ${[snap.city, snap.region, snap.country].filter(Boolean).join(", ")}` : "",
    snap.business_concept ? `\nFounder's raw concept:\n${snap.business_concept}` : "",
    snap.differentiation_statement ? `\nFounder's differentiator:\n${snap.differentiation_statement}` : "",
    snap.research_brief ? `\nResearch brief:\n${JSON.stringify(snap.research_brief).slice(0, 8000)}` : "",
    snap.extracted_data ? `\nExtracted data:\n${JSON.stringify(snap.extracted_data).slice(0, 4000)}` : "",
  ].filter(Boolean).join("\n");
}

async function appendIteration(supabase: any, snapshotId: string, entry: any) {
  const { data } = await supabase
    .from("venture_snapshots")
    .select("concept_iterations")
    .eq("id", snapshotId)
    .maybeSingle();
  const list = Array.isArray(data?.concept_iterations) ? data.concept_iterations : [];
  list.unshift({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...entry });
  await supabase
    .from("venture_snapshots")
    .update({ concept_iterations: list.slice(0, 50) })
    .eq("id", snapshotId);
}

async function actionDraft(supabase: any, snap: any) {
  const sys = `You write tight founder-grade concept summaries.
Return JSON: { "summary": string (EXACTLY ${WORD_MIN}-${WORD_MAX} words, single paragraph, no headings), "value_proposition": string (1-2 sentences, competitive, specific), "rationale": string (one short sentence on why this framing wins) }.
Be concrete: name the customer, the problem, the offer, the unfair edge. No buzzwords ("synergy", "revolutionary", "leverage", "best-in-class").`;
  const user = `Draft a concept for this venture.\n\n${contextBlock(snap)}`;
  let out = await callAI([{ role: "system", content: sys }, { role: "user", content: user }]);
  if (wc(out.summary) < WORD_MIN || wc(out.summary) > WORD_MAX) {
    out = await callAI([
      { role: "system", content: sys },
      { role: "user", content: user },
      { role: "assistant", content: JSON.stringify(out) },
      { role: "user", content: `Your summary was ${wc(out.summary)} words. Rewrite so the summary is EXACTLY ${WORD_MIN}-${WORD_MAX} words. Same JSON shape.` },
    ]);
  }
  return out;
}

async function actionBrainstorm(supabase: any, snap: any, payload: any) {
  const sys = `You generate sharp alternative positionings. Return JSON: { "ideas": [ { "title": string, "summary": string (${WORD_MIN}-${WORD_MAX} words), "value_proposition": string, "why_it_works": string, "risks": string } ] } with 3 to 5 ideas.
Each idea must be a meaningfully different angle (different wedge, customer, business model, channel, or pricing). Ground each in the research_brief competitors/market_trends when available.`;
  const user = `Generate alternative concept angles.\n\n${contextBlock(snap)}\n\nCurrent summary:\n${snap.concept_summary ?? "(none)"}\n\nUser hint (optional): ${payload?.hint ?? ""}`;
  return await callAI([{ role: "system", content: sys }, { role: "user", content: user }]);
}

async function actionInnovate(supabase: any, snap: any, payload: any) {
  const sys = `You push concepts to be more ambitious without abandoning feasibility. Return JSON: { "summary": string (${WORD_MIN}-${WORD_MAX} words), "value_proposition": string, "delta": string (what changed vs the original and why it's stronger) }.`;
  const user = `Reframe the concept to be more ambitious or distinctive.\n\n${contextBlock(snap)}\n\nCurrent summary:\n${snap.concept_summary ?? "(none)"}\n\nChallenge constraint / direction: ${payload?.prompt ?? "Challenge the most generic assumption."}`;
  let out = await callAI([{ role: "system", content: sys }, { role: "user", content: user }]);
  if (wc(out.summary) < WORD_MIN || wc(out.summary) > WORD_MAX) {
    out = await callAI([
      { role: "system", content: sys },
      { role: "user", content: user },
      { role: "assistant", content: JSON.stringify(out) },
      { role: "user", content: `Rewrite so summary is EXACTLY ${WORD_MIN}-${WORD_MAX} words.` },
    ]);
  }
  return out;
}

async function actionCritique(supabase: any, snap: any) {
  const sys = `You are a venture red-team. Return JSON: { "weaknesses": [ { "issue": string, "evidence": string } ], "suggested_rewrite": { "summary": string (${WORD_MIN}-${WORD_MAX} words), "value_proposition": string } }.`;
  const user = `Critique the current concept against competitors and customer voice in the research brief.\n\n${contextBlock(snap)}\n\nCurrent summary:\n${snap.concept_summary ?? "(none)"}\nCurrent value prop:\n${snap.value_proposition ?? "(none)"}`;
  return await callAI([{ role: "system", content: sys }, { role: "user", content: user }]);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    const body = await req.json();
    const { snapshot_id, action, payload } = body ?? {};
    if (!snapshot_id || !action) throw new Error("snapshot_id and action required");

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const userId = userRes?.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: snap } = await supabase.from("venture_snapshots").select("*").eq("id", snapshot_id).maybeSingle();
    if (!snap) return new Response(JSON.stringify({ error: "Snapshot not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (snap.user_id !== userId) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (["draft", "brainstorm", "innovate", "critique"].includes(action)) {
      const iters = Array.isArray(snap.concept_iterations) ? snap.concept_iterations.length : 0;
      if (iters >= MAX_ITERATIONS) {
        return new Response(JSON.stringify({ error: `Refinement cap reached (${MAX_ITERATIONS}). Lock the current concept to continue.` }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    let result: any = {};

    if (action === "draft") {
      result = await actionDraft(supabase, snap);
      await appendIteration(supabase, snapshot_id, { kind: "draft", output: result });
      await supabase.from("venture_snapshots").update({ concept_status: "refining" }).eq("id", snapshot_id);
    } else if (action === "brainstorm") {
      result = await actionBrainstorm(supabase, snap, payload);
      await appendIteration(supabase, snapshot_id, { kind: "brainstorm", input: payload, output: result });
    } else if (action === "innovate") {
      result = await actionInnovate(supabase, snap, payload);
      await appendIteration(supabase, snapshot_id, { kind: "innovate", input: payload, output: result });
    } else if (action === "critique") {
      result = await actionCritique(supabase, snap);
      await appendIteration(supabase, snapshot_id, { kind: "critique", output: result });
    } else if (action === "apply") {
      const summary = String(payload?.summary ?? "").trim();
      const value_proposition = String(payload?.value_proposition ?? "").trim();
      if (!summary || !value_proposition) throw new Error("summary and value_proposition required");
      await supabase.from("venture_snapshots").update({
        concept_summary: summary,
        value_proposition,
        concept_status: "refining",
      }).eq("id", snapshot_id);
      await appendIteration(supabase, snapshot_id, { kind: "user_edit", output: { summary, value_proposition } });
      result = { ok: true, word_count: wc(summary) };
    } else if (action === "lock") {
      const summary = String(payload?.summary ?? snap.concept_summary ?? "").trim();
      const value_proposition = String(payload?.value_proposition ?? snap.value_proposition ?? "").trim();
      const w = wc(summary);
      if (w < WORD_MIN || w > WORD_MAX) throw new Error(`Summary must be ${WORD_MIN}-${WORD_MAX} words (currently ${w}).`);
      if (!value_proposition) throw new Error("Value proposition is required");
      await supabase.from("venture_snapshots").update({
        concept_summary: summary,
        value_proposition,
        concept_status: "locked",
        concept_locked_at: new Date().toISOString(),
      }).eq("id", snapshot_id);
      await appendIteration(supabase, snapshot_id, { kind: "lock", output: { summary, value_proposition } });
      result = { ok: true, locked: true };
    } else if (action === "unlock") {
      await supabase.from("venture_snapshots").update({
        concept_status: "refining",
        concept_locked_at: null,
      }).eq("id", snapshot_id);
      result = { ok: true, locked: false };
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

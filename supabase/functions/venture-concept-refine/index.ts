// Founders Hub — concept refinement gateway.
// Lets the founder draft, brainstorm, innovate, critique, apply and lock a 50-60
// word concept summary + value proposition that anchors all 21 documents.

import { createClient } from "npm:@supabase/supabase-js@2";
import { markSnapshotBrainDirty } from "../_shared/snapshot-brain.ts";
import { aiFetch } from "../_shared/ai-fetch.ts";
import { resolveOwner } from "../_shared/impersonation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
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
  const res = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
  return repairAndParseJson(raw);
}

function repairAndParseJson(s: string): any {
  const tryParse = (x: string) => { try { return JSON.parse(x); } catch { return undefined; } };
  let v = tryParse(s);
  if (v !== undefined) return v;
  const m = s.match(/\{[\s\S]*\}/);
  let candidate = m ? m[0] : s;
  candidate = candidate
    .replace(/```json|```/g, "")
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  v = tryParse(candidate);
  if (v !== undefined) return v;
  let braces = 0, brackets = 0, inStr = false, esc = false;
  for (const c of candidate) {
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{") braces++;
    else if (c === "}") braces--;
    else if (c === "[") brackets++;
    else if (c === "]") brackets--;
  }
  if (inStr) candidate += '"';
  while (brackets-- > 0) candidate += "]";
  while (braces-- > 0) candidate += "}";
  v = tryParse(candidate);
  if (v !== undefined) return v;
  throw new Error("AI returned invalid JSON");
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

// ===================== EPIPHANY ENGINE =====================
// Multi-step pipeline: signal-mine → diverge → critique/merge → score → rank.
// Returns up to 3 enhancement cards anchored in evidence.

async function epiphanyPipeline(snap: any) {
  const ctx = contextBlock(snap);

  // Step 1 — signal mining
  const signalsSys = `You extract sharp market signals from a research corpus.
Return JSON: { "signals": [ { "id": "s1", "kind": "unmet_jtbd|competitor_gap|customer_complaint|pricing_anomaly|regulatory_tailwind|tech_enabler", "text": string, "source_hint": string } ] } — 10 to 20 items.`;
  const signals = await callAI([
    { role: "system", content: signalsSys },
    { role: "user", content: `${ctx}\n\nMine signals from the research above.` },
  ]);

  // Step 2 — divergent ideas (forced 5-lens diversity)
  const divergeSys = `You generate enhancement ideas that EXTEND the founder's locked concept (additive, not pivots).
Return JSON: { "ideas": [ { "id": "i1", "lens": "product_feature|new_channel|new_monetization|segment_addon|ai_native", "title": string, "summary": string, "extends_concept": string (1 sentence on how it builds on the current concept), "signal_ids": string[] (cite at least one signal id) } ] } — 8 to 12 ideas, balanced across the 5 lenses.`;
  const ideasRaw = await callAI([
    { role: "system", content: divergeSys },
    { role: "user", content: `${ctx}\n\nLocked concept:\n${snap.concept_summary ?? "(none)"}\nValue prop:\n${snap.value_proposition ?? "(none)"}\n\nSignals:\n${JSON.stringify(signals.signals ?? [])}\n\nGenerate enhancement ideas.` },
  ]);

  // Step 3 — critique/merge (drop weak, dedupe, must extend, must be testable)
  const mergeSys = `You are a venture editor. Filter ideas: keep only those that (a) clearly EXTEND the locked concept (not replace it), (b) cite at least one signal id, (c) are testable in <=30 days by a small founding team. Merge near-duplicates. Return JSON: { "kept": [ ...same shape as input ideas, max 6 ] }.`;
  const kept = await callAI([
    { role: "system", content: mergeSys },
    { role: "user", content: `Locked concept:\n${snap.concept_summary ?? "(none)"}\n\nIdeas to filter:\n${JSON.stringify(ideasRaw.ideas ?? [])}` },
  ]);

  // Step 4 — score viability + attractiveness with anchored rubric
  const scoreSys = `You score venture enhancement ideas with this rubric.
VIABILITY (100): demand_signal (0-20), competitive_whitespace (0-20), feasibility (0-20), time_to_revenue (0-20: <30d=20,<90d=15,<6mo=10,>6mo=5), defensibility (0-20).
ATTRACTIVENESS (100): customer_pull (0-25), margin_upside (0-25), strategic_optionality (0-25), brand_lift (0-25).
Each sub-score needs a 1-line justification AND cites at least one signal_id; if no evidence, justification must say "no_evidence" and that sub-score is capped at 50% of max.
Return JSON: { "scored": [ { ...original idea fields, "why_now": string (1 sentence), "first_30_days": string[] (3 items), "risks": string[] (2 items), "viability": { "demand_signal": {"score": int, "why": string, "signals": string[]}, "competitive_whitespace": {...}, "feasibility": {...}, "time_to_revenue": {...}, "defensibility": {...}, "total": int }, "attractiveness": { "customer_pull": {...}, "margin_upside": {...}, "strategic_optionality": {...}, "brand_lift": {...}, "total": int }, "combined": int (viability.total + attractiveness.total) } ] }`;
  const scored = await callAI([
    { role: "system", content: scoreSys },
    { role: "user", content: `Locked concept:\n${snap.concept_summary ?? "(none)"}\n\nSignals:\n${JSON.stringify(signals.signals ?? [])}\n\nIdeas:\n${JSON.stringify(kept.kept ?? [])}` },
  ]);

  // Step 5 — rank, pick top 3, exec note
  const list = (scored.scored ?? []).filter((c: any) => c?.combined);
  list.sort((a: any, b: any) => (b.combined - a.combined) || ((b.attractiveness?.total ?? 0) - (a.attractiveness?.total ?? 0)));
  const top3 = list.slice(0, 3);

  let exec_note = "";
  if (top3.length > 0) {
    try {
      const note = await callAI([
        { role: "system", content: `Return JSON: { "exec_note": string (2 sentences explaining why these three rose to the top) }` },
        { role: "user", content: `Locked concept:\n${snap.concept_summary ?? "(none)"}\n\nTop ideas:\n${JSON.stringify(top3.map((c: any) => ({ title: c.title, lens: c.lens, combined: c.combined })))}` },
      ]);
      exec_note = note.exec_note ?? "";
    } catch { /* optional */ }
  }

  return { signals: signals.signals ?? [], top3, exec_note };
}

async function actionFoldEnhancement(supabase: any, snap: any, card: any) {
  const sys = `You rewrite a concept to FOLD IN a specific enhancement while staying ${WORD_MIN}-${WORD_MAX} words.
Return JSON: { "summary": string (${WORD_MIN}-${WORD_MAX} words), "value_proposition": string, "delta": string }.`;
  const user = `Current summary:\n${snap.concept_summary ?? "(none)"}\nCurrent value prop:\n${snap.value_proposition ?? "(none)"}\n\nFold in this enhancement:\n${JSON.stringify({ title: card.title, summary: card.summary, why_now: card.why_now })}\n\n${contextBlock(snap)}`;
  let out = await callAI([{ role: "system", content: sys }, { role: "user", content: user }]);
  const wcv = (out.summary ?? "").trim().split(/\s+/).filter(Boolean).length;
  if (wcv < WORD_MIN || wcv > WORD_MAX) {
    out = await callAI([
      { role: "system", content: sys }, { role: "user", content: user },
      { role: "assistant", content: JSON.stringify(out) },
      { role: "user", content: `Summary was ${wcv} words. Rewrite to be EXACTLY ${WORD_MIN}-${WORD_MAX} words.` },
    ]);
  }
  return out;
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
    let userId = userRes?.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Impersonation: an admin may act on a member's behalf (validated server-side).
    const actorId = userId;
    const _own = await resolveOwner(req, actorId, userClient, corsHeaders);
    if (_own.error) return _own.error;
    userId = _own.userId;

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
      const summary = String(payload?.summary ?? snap.concept_summary ?? "").trim();
      const value_proposition = String(payload?.value_proposition ?? snap.value_proposition ?? "").trim();
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
    } else if (action === "epiphany") {
      // 24h rate limit: max 3 runs per snapshot
      const runs = Array.isArray(snap.epiphany_runs) ? snap.epiphany_runs : [];
      const recent = runs.filter((r: any) => Date.now() - new Date(r.created_at).getTime() < 24 * 3600 * 1000).length;
      if (recent >= 3) {
        return new Response(JSON.stringify({ error: "Epiphany cap reached (3 runs / 24h). Try again tomorrow." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t0 = Date.now();
      const pipeline = await epiphanyPipeline(snap);
      const run = { id: crypto.randomUUID(), created_at: new Date().toISOString(), took_ms: Date.now() - t0, ...pipeline };
      const next = [run, ...runs].slice(0, 10);
      await supabase.from("venture_snapshots").update({ epiphany_runs: next }).eq("id", snapshot_id);
      await appendIteration(supabase, snapshot_id, { kind: "epiphany", output: { top3: pipeline.top3.map((c: any) => ({ title: c.title, combined: c.combined })) } });
      result = { top3: pipeline.top3, exec_note: pipeline.exec_note, signals_count: pipeline.signals.length };
    } else if (action === "save_enhancement") {
      const card = payload?.card;
      if (!card?.title) throw new Error("card required");
      const saved = Array.isArray(snap.saved_enhancements) ? snap.saved_enhancements : [];
      saved.unshift({ id: crypto.randomUUID(), saved_at: new Date().toISOString(), status: "saved", card });
      await supabase.from("venture_snapshots").update({ saved_enhancements: saved.slice(0, 20) }).eq("id", snapshot_id);
      result = { ok: true };
    } else if (action === "dismiss_enhancement") {
      const id = payload?.id;
      const saved = (Array.isArray(snap.saved_enhancements) ? snap.saved_enhancements : []).map((s: any) =>
        s.id === id ? { ...s, status: "dismissed" } : s,
      );
      await supabase.from("venture_snapshots").update({ saved_enhancements: saved }).eq("id", snapshot_id);
      result = { ok: true };
    } else if (action === "fold_enhancement") {
      const card = payload?.card;
      if (!card?.title) throw new Error("card required");
      const folded = await actionFoldEnhancement(supabase, snap, card);
      await supabase.from("venture_snapshots").update({
        concept_summary: folded.summary,
        value_proposition: folded.value_proposition,
        concept_status: "refining",
      }).eq("id", snapshot_id);
      // Mark saved card as folded (if it was saved)
      if (payload?.id) {
        const saved = (Array.isArray(snap.saved_enhancements) ? snap.saved_enhancements : []).map((s: any) =>
          s.id === payload.id ? { ...s, status: "folded", folded_at: new Date().toISOString() } : s,
        );
        await supabase.from("venture_snapshots").update({ saved_enhancements: saved }).eq("id", snapshot_id);
      }
      await appendIteration(supabase, snapshot_id, { kind: "fold", input: { title: card.title }, output: folded });
      result = { ok: true, summary: folded.summary, value_proposition: folded.value_proposition, delta: folded.delta };
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    // Concept-changing actions invalidate the brain so the next deliverable
    // is regenerated from the new concept rather than a stale summary.
    // F9: include `apply` — it writes a new concept_summary + value_proposition
    // directly into the snapshot, so the brain must be recomputed.
    if (["lock", "unlock", "apply", "fold_enhancement"].includes(action)) {
      markSnapshotBrainDirty(supabase, snapshot_id).catch(() => {});
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// Founders Hub — bulk-generate every active venture document in dependency order.
//
// Post-AI-first-refactor pipeline (mirrors venture-generate-document so both
// paths produce identical quality for a given document_type):
//   1. loadVentureContext()  — single read, reused for every doc in this job
//   2. ensureSnapshotBrain() — compute once per job (or reuse cached/clean)
//   3. compactPreamble()     — ~600-token venture preamble per doc
//   4. pickBrainSlice()      — only the brain keys this deliverable needs
//   5. distillDeps()         — upstream docs as 3-5 bullet summaries
//   6. modelForTier()        — pro / flash / lite routing per doc

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  compactPreamble,
  distillDeps,
  loadVentureContext,
  pickBrainSlice,
  type VentureContext,
} from "../_shared/venture-context.ts";
import { ensureSnapshotBrain } from "../_shared/snapshot-brain.ts";
import { trackTone } from "../_shared/track-tones.ts";
import {
  BASE_SYSTEM_PROMPT,
  modelForTier,
  specializedPrompt,
  stripCitations,
} from "../_shared/deliverable-prompts.ts";
import { aiFetch } from "../_shared/ai-fetch.ts";

const MAX_USER_PROMPT_CHARS = 120_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

// Slim per-doc generator. Accepts a pre-loaded ctx so the same context is
// reused across the whole bulk job (we only refresh dep docs per call).
async function generateOne(
  supabase: any,
  ctx: VentureContext,
  documentType: string,
) {
  const snapshotId = ctx.snapshotId;
  const snap = ctx.snap;
  const { data: type } = await supabase
    .from("venture_document_types")
    .select("*")
    .eq("type", documentType)
    .maybeSingle();
  if (!type) throw new Error(`Unknown document type: ${documentType}`);

  await supabase.from("venture_documents").upsert({
    snapshot_id: snapshotId,
    document_type: documentType,
    status: "generating",
  }, { onConflict: "snapshot_id,document_type" });

  // Load + distill upstream dependency docs (no more full-markdown dumping).
  const deps: string[] = type.dependencies ?? [];
  let depContext = "";
  if (deps.length) {
    const { data: depDocs } = await supabase
      .from("venture_documents")
      .select("document_type, content")
      .eq("snapshot_id", snapshotId)
      .in("document_type", deps);
    depContext = distillDeps(depDocs ?? []);
  }

  // Pick up any intake answers the founder previously saved for this doc.
  const { data: priorRow } = await supabase
    .from("venture_documents")
    .select("intake_answers")
    .eq("snapshot_id", snapshotId)
    .eq("document_type", documentType)
    .maybeSingle();
  const effectiveIntake = priorRow?.intake_answers && Object.keys(priorRow.intake_answers).length
    ? priorRow.intake_answers
    : null;

  // System prompt: specialized first, fallback to base; layer track tone on top.
  const baseSystemPrompt = specializedPrompt(documentType) ?? BASE_SYSTEM_PROMPT;
  const tone = trackTone(snap.track);
  const systemPrompt = tone ? `${baseSystemPrompt}\n\n${tone}` : baseSystemPrompt;

  // User prompt: compact preamble + brain slice (or raw fallback) + distilled deps.
  const brainSlice = pickBrainSlice(ctx.brain, type.context_keys ?? null);
  const preamble = compactPreamble(ctx);

  const userPrompt = [
    `# Document to produce: ${type.name}`,
    `Description: ${type.description}`,
    `Category: ${type.category}`,
    preamble,
    brainSlice
      ? `\n## Venture brain (compressed, authoritative — every section must reflect these)\n${JSON.stringify(brainSlice, null, 2)}`
      : `\n## Venture brief (fallback — brain not yet computed)\n${JSON.stringify(snap.extracted_data ?? {}, null, 2)}`,
    // Only inject the raw research brief when brain isn't available.
    !ctx.brain && snap.research_brief
      ? `\n## Research brief (background evidence — synthesize as analyst judgment, NO footnotes or citations)\n${JSON.stringify(snap.research_brief, null, 2).slice(0, 8000)}`
      : "",
    depContext ? `\n## Upstream documents you should build on (distilled)\n${depContext}` : "",
    effectiveIntake
      ? `\n## Intake answers (TOP PRIORITY — founder-supplied ground truth. Use every value verbatim; do not invent contradictory numbers.)\n${JSON.stringify(effectiveIntake, null, 2)}`
      : "",
  ].filter(Boolean).join("\n\n").slice(0, MAX_USER_PROMPT_CHARS);

  // S5 — Honor type.model_tier ('pro' | 'flash' | 'lite'), except website_prd.
  // Website PRDs need a larger output budget, but must remain fast enough for
  // the edge runtime; Flash with max_tokens is more reliable than slow Pro.
  const isPrd = documentType === "website_prd";
  const modelId = isPrd ? modelForTier("flash") : modelForTier(type.model_tier);
  const maxTokens = isPrd ? 16000 : 16000;

  const aiRes = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modelId,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  }, { timeoutMs: isPrd ? 180_000 : 90_000, retries: isPrd ? 0 : 2 });

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
  const finishReason = aiJson.choices?.[0]?.finish_reason ?? aiJson.choices?.[0]?.finishReason ?? "";
  const truncated = String(finishReason).toLowerCase() === "length";
  let quality = 75;
  const qm = raw.match(/QUALITY_SCORE:\s*(\d{1,3})/i);
  if (qm) {
    quality = Math.max(0, Math.min(100, parseInt(qm[1], 10)));
    raw = raw.replace(/QUALITY_SCORE:\s*\d{1,3}\s*$/i, "").trim();
  }
  raw = stripCitations(raw);
  if (truncated) {
    quality = Math.min(quality, 60);
    if (!raw.includes("<!-- TRUNCATED -->")) {
      raw = `${raw}\n\n<!-- TRUNCATED -->\n`;
    }
  }
  const wordCount = raw.split(/\s+/).filter(Boolean).length;

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

  // Cache brand_tokens for fast read by Brand Studio + website_prd.
  if (documentType === "visual_identity_brief") {
    const m = raw.match(/```json\s*([\s\S]*?)```/);
    if (m) {
      try {
        const tokens = JSON.parse(m[1]);
        await supabase.from("venture_snapshots").update({ brand_tokens: tokens }).eq("id", snapshotId);
      } catch { /* ignore parse error */ }
    }
  }

  // Hero image generation is lazy (DocumentViewer fires it on first open).
}


// Group document types into dependency layers (Kahn's algorithm).
// Each layer can run fully in parallel since all its deps are in earlier layers.
function dependencyLayers(types: any[]): any[][] {
  const byKey = new Map(types.map((t) => [t.type, t]));
  const remaining = new Set(types.map((t) => t.type));
  const layers: any[][] = [];
  while (remaining.size) {
    const layer: any[] = [];
    for (const key of remaining) {
      const t = byKey.get(key)!;
      const deps: string[] = t.dependencies ?? [];
      if (deps.every((d) => !remaining.has(d))) layer.push(t);
    }
    if (!layer.length) {
      // Cycle or missing dep — flush the rest so we don't infinite loop.
      layers.push(Array.from(remaining).map((k) => byKey.get(k)!));
      break;
    }
    layer.sort((a, b) => a.sort_order - b.sort_order);
    for (const t of layer) remaining.delete(t.type);
    layers.push(layer);
  }
  return layers;
}

const CONCURRENCY = 6;

async function runLayer(
  supabase: any,
  ctx: VentureContext,
  jobId: string,
  layer: any[],
  state: { done: number; total: number; fails: number; canceled: boolean },
) {
  const snapshotId = ctx.snapshotId;
  const { data: existingDocs } = await supabase
    .from("venture_documents")
    .select("document_type, status")
    .eq("snapshot_id", snapshotId)
    .in("document_type", layer.map((t) => t.type));
  const completeSet = new Set((existingDocs ?? []).filter((d: any) => d.status === "complete").map((d: any) => d.document_type));

  const pending = layer.filter((t) => !completeSet.has(t.type));
  state.done += layer.length - pending.length;

  let cursor = 0;
  async function worker() {
    while (cursor < pending.length) {
      const { data: jobRow } = await supabase
        .from("venture_generation_jobs")
        .select("cancel_requested")
        .eq("id", jobId)
        .maybeSingle();
      if (jobRow?.cancel_requested) { state.canceled = true; return; }

      const t = pending[cursor++];
      await supabase.from("venture_generation_jobs").update({
        current_document_type: t.type,
        heartbeat_at: new Date().toISOString(),
      }).eq("id", jobId);
      try {
        await generateOne(supabase, ctx, t.type);
        state.done++;
        state.fails = 0;
      } catch (e) {
        state.fails++;
        // F11: never let a runLayer crash swallow the failure silently.
        const msg = e instanceof Error ? e.message : String(e);
        try {
          await supabase.from("venture_generation_failures").insert({
            snapshot_id: snapshotId,
            document_type: t.type,
            error: `runLayer: ${msg.slice(0, 300)}`,
          });
        } catch { /* logging best-effort */ }
      }
      await supabase.from("venture_generation_jobs").update({
        progress_pct: Math.round((state.done / state.total) * 100),
        heartbeat_at: new Date().toISOString(),
      }).eq("id", jobId);
      if (state.fails >= 3) return;
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pending.length || 1) }, () => worker()));
}

async function runJob(supabase: any, snapshotId: string, jobId: string, category?: string | null) {
  // Build venture context ONCE per job. Compute or reuse the brain ONCE
  // before any docs run — subsequent generateOne() calls inherit both.
  const ctx = await loadVentureContext(supabase, snapshotId);
  if (!ctx.brain) {
    try {
      ctx.brain = await ensureSnapshotBrain(supabase, snapshotId);
    } catch (e) {
      console.warn("brain compute failed; falling back to raw blobs", e);
    }
  }

  const { data: allTypes } = await supabase
    .from("venture_document_types")
    .select("*")
    .eq("active", true);


  // Documents with an intake_schema require founder input — skip them in
  // bulk runs unless the founder has already saved intake_answers for them.
  const { data: savedIntakes } = await supabase
    .from("venture_documents")
    .select("document_type, intake_answers")
    .eq("snapshot_id", snapshotId);
  const haveAnswers = new Set(
    (savedIntakes ?? [])
      .filter((d: any) => d.intake_answers && Object.keys(d.intake_answers).length)
      .map((d: any) => d.document_type),
  );
  let types = (allTypes ?? []).filter(
    (t: any) => !t.intake_schema || haveAnswers.has(t.type),
  );

  if (category && category.trim().length > 0) {
    const wanted = category.trim().toLowerCase();
    types = types.filter((t: any) => String(t.category ?? "").toLowerCase() === wanted);
  }

  const layers = dependencyLayers(types);
  const total = types.length;
  const state = { done: 0, total, fails: 0, canceled: false };

  await supabase.from("venture_generation_jobs").update({
    status: "running",
    started_at: new Date().toISOString(),
    heartbeat_at: new Date().toISOString(),
  }).eq("id", jobId);

  for (const layer of layers) {
    await runLayer(supabase, ctx, jobId, layer, state);
    if (state.canceled) {
      await supabase.from("venture_generation_jobs").update({
        status: "canceled",
        completed_at: new Date().toISOString(),
        progress_pct: Math.round((state.done / total) * 100),
        current_document_type: null,
      }).eq("id", jobId);
      return;
    }
    if (state.fails >= 3) {
      await supabase.from("venture_generation_jobs").update({
        status: "paused",
        circuit_breaker_open: true,
        error: `Paused after 3 consecutive failures`,
        progress_pct: Math.round((state.done / total) * 100),
      }).eq("id", jobId);
      return;
    }
  }

  await supabase.from("venture_generation_jobs").update({
    status: "completed",
    completed_at: new Date().toISOString(),
    progress_pct: 100,
    current_document_type: null,
  }).eq("id", jobId);

  if (!category) {
    await supabase.from("venture_snapshots").update({ status: "complete" }).eq("id", snapshotId);
  }
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { snapshotId, category } = await req.json();
    if (!snapshotId) return new Response(JSON.stringify({ error: "snapshotId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Identify caller from JWT — REQUIRED for every path.
    let callerId: string | null = null;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (authHeader.startsWith("Bearer ")) {
      const { data: userData } = await supabase.auth.getUser(authHeader.slice(7));
      callerId = userData?.user?.id ?? null;
    }
    if (!callerId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Gate: concept must be locked before any docs are generated.
    const { data: gateSnap } = await supabase
      .from("venture_snapshots")
      .select("concept_status, user_id")
      .eq("id", snapshotId)
      .maybeSingle();
    if (!gateSnap || gateSnap.concept_status !== "locked") {
      return new Response(JSON.stringify({ error: "Lock your concept summary before generating documents." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Ownership / admin check applies to EVERY path (full bulk + per-category).
    let isAdmin = false;
    if (gateSnap.user_id !== callerId) {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", callerId)
        .in("role", ["admin", "super_admin"]);
      isAdmin = (roleRow ?? []).length > 0;
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", callerId)
        .in("role", ["admin", "super_admin"]);
      isAdmin = (roleRow ?? []).length > 0;
    }

    // Full-bulk runs additionally require an unlock grant (non-admins).
    const isAllBulk = !category || String(category).trim().length === 0;
    if (isAllBulk && !isAdmin) {
      const { data: grant } = await supabase
        .from("bulk_unlock_grants")
        .select("id")
        .eq("user_id", callerId)
        .eq("snapshot_id", snapshotId)
        .is("revoked_at", null)
        .maybeSingle();
      if (!grant) {
        return new Response(JSON.stringify({ error: "unlock_required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Reuse a running job if there is one
    const { data: existing } = await supabase
      .from("venture_generation_jobs")
      .select("id, status")
      .eq("snapshot_id", snapshotId)
      .in("status", ["queued", "running"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let jobId = existing?.id as string | undefined;
    if (!jobId) {
      const { data: created, error } = await supabase
        .from("venture_generation_jobs")
        .insert({ snapshot_id: snapshotId, status: "queued", progress_pct: 0 })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      jobId = created.id;
    }

    const categoryArg = isAllBulk ? null : String(category);

    // Run in the background so the HTTP response returns immediately.
    // @ts-ignore: EdgeRuntime is provided by Supabase Edge Functions runtime.
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(runJob(supabase, snapshotId, jobId!, categoryArg));
    } else {
      runJob(supabase, snapshotId, jobId!, categoryArg).catch((e) => console.error("bulk job failed", e));
    }

    return new Response(JSON.stringify({ ok: true, jobId, category: categoryArg }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

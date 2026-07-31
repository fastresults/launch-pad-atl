// Dashboard pipeline worker — generates `attendee_deliverables` content for a
// single key or, when { bulk: true }, every remaining triggerable deliverable
// in dependency order. Writes structured JSON content into content_current /
// content_ai and marks an `ai_pipeline_runs` row complete when finished.
//
// Invoked directly by src/lib/userPipeline.functions.ts — no polling worker.

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  compactPreamble,
  distillDeps,
  loadVentureContext,
  type VentureContext,
} from "../_shared/venture-context.ts";
import { ensureSnapshotBrain } from "../_shared/snapshot-brain.ts";
import { brainCorpusBlockMulti } from "../_shared/brain-corpus.ts";
import { profileFor } from "../_shared/prompt-profiles.ts";
import { MODELS, modelForTier } from "../_shared/models.ts";
import { aiFetch } from "../_shared/ai-fetch.ts";

const MAX_USER_PROMPT_CHARS = 120_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

type DType = {
  key: string;
  label: string;
  description: string | null;
  stage_label: string | null;
  depends_on_keys: string[] | null;
  default_model: string | null;
  user_can_trigger: boolean | null;
  auto_runnable: boolean | null;
};

type Content = {
  title: string;
  summary: string;
  sections: { heading: string; body_markdown: string }[];
  action_items: string[];
};

function safeJson(text: string): Content | null {
  // Strip ``` fences
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try {
    const parsed = JSON.parse(t);
    if (
      parsed && typeof parsed === "object" &&
      typeof parsed.title === "string" &&
      Array.isArray(parsed.sections)
    ) {
      return {
        title: parsed.title,
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
        sections: parsed.sections
          .filter((s: any) => s && typeof s.heading === "string")
          .map((s: any) => ({
            heading: String(s.heading),
            body_markdown: String(s.body_markdown ?? s.body ?? ""),
          })),
        action_items: Array.isArray(parsed.action_items)
          ? parsed.action_items.filter((x: any) => typeof x === "string")
          : [],
      };
    }
  } catch { /* ignore */ }
  return null;
}

async function callModel(model: string, system: string, user: string): Promise<string> {
  const res = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gateway ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

/** Parse a `{ sections: [...] }` batch response. Tolerates fences. */
function safeSections(text: string): { heading: string; body_markdown: string }[] {
  let t = String(text ?? "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```\s*$/i);
  if (fence) t = fence[1].trim();
  try {
    const parsed = JSON.parse(t);
    const arr = Array.isArray(parsed) ? parsed : parsed?.sections;
    if (Array.isArray(arr)) {
      return arr
        .filter((s: any) => s && typeof s.heading === "string")
        .map((s: any) => ({
          heading: String(s.heading),
          body_markdown: String(s.body_markdown ?? s.body ?? ""),
        }));
    }
  } catch { /* ignore */ }
  return [];
}

async function generateOne(
  type: DType,
  ctx: {
    venture: VentureContext | null;
    brief: any;
    founder: any;
    market: any;
    upstream: Record<string, Content>;
    feedback?: string;
    tags?: string[];
    previous?: Content | null;
    admin?: any;
    userId?: string | null;
    snapshotId?: string | null;
  },
): Promise<Content> {
  // Honor deliverable_types.default_model with safe tier mapping.
  const model = modelForTier(type.default_model, MODELS.flash);
  const profile = profileFor(type.key);

  // Upstream dependencies: distilled, not full markdown dump.
  const upstreamEntries = Object.entries(ctx.upstream);
  const upstreamDistilled = upstreamEntries.length
    ? distillDeps(
        upstreamEntries.map(([k, c]) => ({
          document_type: k,
          content:
            (c.summary ? c.summary + "\n\n" : "") +
            c.sections.map((s) => `## ${s.heading}\n${s.body_markdown}`).join("\n\n"),
        })),
      )
    : "";

  // Preferred path: venture context + snapshot brain (shared with Hub).
  let contextBlock: string;
  if (ctx.venture) {
    const brainBlock = ctx.venture.brain
      ? `## Snapshot brain (authoritative compressed venture summary)\n\`\`\`json\n${JSON.stringify(ctx.venture.brain, null, 2)}\n\`\`\``
      : "";
    contextBlock = [compactPreamble(ctx.venture), brainBlock].filter(Boolean).join("\n\n");
  } else {
    // Fallback for users without a venture snapshot — keep current behavior
    // but tighter: brief only (no raw founder/market dumps).
    contextBlock = `## Founder's Startup Brief\n${JSON.stringify(ctx.brief ?? {}, null, 2)}`;
  }

  // Retrieval over the founder's Second Brain corpus — the actual uploaded
  // materials and notes. Long documents run one query per topic so retrieval
  // covers the whole spine instead of a single subject.
  let corpusBlock = "";
  let corpusChunks = 0;
  if (ctx.admin && ctx.userId) {
    const baseQuery = [
      type.label,
      type.description ?? "",
      ctx.venture?.snap?.concept_summary ?? ctx.venture?.snap?.business_concept ?? "",
    ].filter(Boolean).join(" — ");
    try {
      const queries = [baseQuery, ...(profile.corpusQueries ?? [])].filter(Boolean);
      const multi = await brainCorpusBlockMulti(
        ctx.admin,
        ctx.userId,
        ctx.snapshotId ?? null,
        queries,
        profile.corpusLimitPerQuery ?? 10,
        profile.multiPass ? 48 : 16,
      );
      corpusBlock = multi.block;
      corpusChunks = multi.chunkCount;
    } catch (e) {
      console.warn("brain corpus retrieval failed", e);
    }
  }
  console.log(
    `[corpus] key=${type.key} user=${ctx.userId} snapshot=${ctx.snapshotId ?? "null"} chunks=${corpusChunks} corpus_chars=${corpusBlock.length}`,
  );
  if (corpusBlock) contextBlock = [contextBlock, corpusBlock].join("\n\n");

  const lengthRule = `Aim for ${profile.sectionsMin}-${profile.sectionsMax} sections, ${profile.wordsMin}-${profile.wordsMax} words each.`;
  const baseVoice =
    "Use plain English, concrete numbers, named channels. No filler, no citations, no footnotes.";

  const hasFeedback = (ctx.feedback && ctx.feedback.trim()) || (ctx.tags && ctx.tags.length);
  const rewriteBlock = hasFeedback
    ? [
        "## Rewrite guidance from the founder (TOP PRIORITY — the previous version missed the mark, address every point below in this rewrite)",
        ctx.tags && ctx.tags.length ? `Tags: ${ctx.tags.join(", ")}` : "",
        ctx.feedback?.trim() ?? "",
        ctx.previous ? `\n## Previous version (rewrite this — don't repeat its mistakes)\n${JSON.stringify(ctx.previous).slice(0, 4000)}` : "",
      ].filter(Boolean).join("\n")
    : "";

  const sharedContext = [
    `# Deliverable: ${type.label}`,
    type.description ? `Purpose: ${type.description}` : "",
    type.stage_label ? `Stage: ${type.stage_label}` : "",
    "",
    contextBlock,
    upstreamDistilled ? `\n## Upstream deliverables (stay consistent — distilled)\n${upstreamDistilled}` : "",
    rewriteBlock ? `\n${rewriteBlock}` : "",
  ].filter(Boolean).join("\n");

  // ---- Long-form path: outline-free, spine-driven, batched -----------------
  if (profile.multiPass) {
    return await generateLongForm(type, profile, model, sharedContext, {
      lengthRule,
      baseVoice,
      corpusChars: corpusBlock.length,
    });
  }

  // ---- Standard single-pass path ------------------------------------------
  const system = `You are a senior startup coach writing a single founder-ready deliverable.
Output STRICT JSON (no markdown fences) with this shape:
{
  "title": string,
  "summary": string (2-3 sentences),
  "sections": [{ "heading": string, "body_markdown": string }],
  "action_items": [string, ...]
}
${lengthRule} ${baseVoice}${profile.systemExtra ? `\n${profile.systemExtra}` : ""}`;

  const user = [sharedContext, "", "Return ONLY the JSON object."]
    .join("\n")
    .slice(0, MAX_USER_PROMPT_CHARS);

  const raw = await callModel(model, system, user);
  const parsed = safeJson(raw);
  if (!parsed) {
    return {
      title: type.label,
      summary: "Draft generated. The model returned unstructured output — review and edit.",
      sections: [{ heading: "Draft", body_markdown: String(raw).slice(0, 4000) }],
      action_items: [],
    };
  }
  return parsed;
}

/**
 * Batched generation for long documents. One completion can't hold a 10,000-word
 * PRD, so the spine is written in small batches that each see the same grounding
 * context plus the headings already written (to avoid repetition).
 */
async function generateLongForm(
  type: DType,
  profile: ReturnType<typeof profileFor>,
  model: string,
  sharedContext: string,
  meta: { lengthRule: string; baseVoice: string; corpusChars: number },
): Promise<Content> {
  const batchSize = profile.batchSize ?? 3;

  // 1. Spine — either declared by the profile, or planned by the model.
  let spine = profile.spine ?? [];
  if (!spine.length) {
    const planRaw = await callModel(
      model,
      `You plan long founder documents. Output STRICT JSON: {"title": string, "summary": string, "sections": [string, ...]}. Plan ${profile.sectionsMin}-${profile.sectionsMax} section headings, in the order they should be written. Headings only — no bodies.`,
      `${sharedContext}\n\nReturn ONLY the JSON object.`.slice(0, MAX_USER_PROMPT_CHARS),
    );
    try {
      const t = planRaw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed?.sections)) {
        spine = parsed.sections.filter((s: any) => typeof s === "string");
      }
    } catch { /* fall through */ }
  }
  if (!spine.length) {
    spine = ["Overview", "Details", "Specification", "Next steps"];
  }

  const system = `You are a senior startup operator writing part of a single founder-ready document: "${type.label}".
Output STRICT JSON (no prose outside JSON, no markdown fences around the JSON) with this shape:
{ "sections": [{ "heading": string, "body_markdown": string }] }
Write ONLY the headings you are asked for, in order, one object each.
Each body_markdown must be ${profile.wordsMin}-${profile.wordsMax} words of substantive, specific markdown. ${meta.baseVoice}${profile.systemExtra ? `\n${profile.systemExtra}` : ""}`;

  // Batches are written in parallel (bounded) — a 14-section PRD written
  // serially blows past the edge function's wall clock. The full spine is
  // included in every prompt so each batch knows what the others cover.
  const batches: string[][] = [];
  for (let i = 0; i < spine.length; i += batchSize) batches.push(spine.slice(i, i + batchSize));
  const fullSpine = spine.map((h, n) => `${n + 1}. ${h}`).join("\n");

  const writeBatch = async (batch: string[], offset: number) => {
    const user = [
      sharedContext,
      `\n## Full document outline (other sections are written separately — do NOT write them, do NOT repeat their content)\n${fullSpine}`,
      `\n## Write these sections now (exactly these headings, in this order)\n${batch.map((h, n) => `${offset + n + 1}. ${h}`).join("\n")}`,
      "\nReturn ONLY the JSON object with these sections.",
    ].filter(Boolean).join("\n").slice(0, MAX_USER_PROMPT_CHARS);
    try {
      const raw = await callModel(model, system, user);
      const got = safeSections(raw);
      if (got.length) return got;
      return [{ heading: batch[0], body_markdown: String(raw).slice(0, 8000) }];
    } catch (e) {
      console.error(`[longform] batch failed for ${type.key} @${offset}`, e);
      return [] as { heading: string; body_markdown: string }[];
    }
  };

  const CONCURRENCY = 4;
  const results: { heading: string; body_markdown: string }[][] = new Array(batches.length).fill(null).map(() => []);
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const slice = batches.slice(i, i + CONCURRENCY);
    const written = await Promise.all(slice.map((b, n) => writeBatch(b, (i + n) * batchSize)));
    written.forEach((w, n) => { results[i + n] = w; });
  }
  const sections = results.flat();


  if (!sections.length) throw new Error(`Long-form generation produced no sections for ${type.key}`);

  // 2. Title + summary + action items, written against the finished document.
  let title = type.label;
  let summary = "";
  let action_items: string[] = [];
  try {
    const headings = sections.map((s) => `- ${s.heading}`).join("\n");
    const openers = sections
      .slice(0, 6)
      .map((s) => `### ${s.heading}\n${s.body_markdown.slice(0, 700)}`)
      .join("\n\n");
    const raw = await callModel(
      model,
      `Output STRICT JSON: {"title": string, "summary": string (3-4 sentences), "action_items": [string, ...] (5-8 concrete next steps)}. No fences.`,
      `Document: ${type.label}\n\nSections:\n${headings}\n\nExcerpts:\n${openers}\n\nReturn ONLY the JSON object.`.slice(
        0,
        MAX_USER_PROMPT_CHARS,
      ),
    );
    const t = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(t);
    if (typeof parsed?.title === "string" && parsed.title.trim()) title = parsed.title.trim();
    if (typeof parsed?.summary === "string") summary = parsed.summary;
    if (Array.isArray(parsed?.action_items)) {
      action_items = parsed.action_items.filter((x: any) => typeof x === "string");
    }
  } catch (e) {
    console.warn("[longform] summary pass failed", e);
  }

  const words = sections.reduce((n, s) => n + s.body_markdown.split(/\s+/).length, 0);
  console.log(
    `[longform] key=${type.key} sections=${sections.length} words=${words} corpus_chars=${meta.corpusChars}`,
  );

  return { title, summary, sections, action_items };
}


function layers(types: DType[]): DType[][] {
  const byKey = new Map(types.map((t) => [t.key, t]));
  const remaining = new Set(types.map((t) => t.key));
  const out: DType[][] = [];
  while (remaining.size) {
    const layer: DType[] = [];
    for (const k of remaining) {
      const t = byKey.get(k)!;
      const deps = (t.depends_on_keys ?? []).filter((d) => byKey.has(d));
      if (deps.every((d) => !remaining.has(d))) layer.push(t);
    }
    if (!layer.length) {
      out.push(Array.from(remaining).map((k) => byKey.get(k)!));
      break;
    }
    for (const t of layer) remaining.delete(t.key);
    out.push(layer);
  }
  return out;
}

async function markStaleRunsFailed(admin: any, userId: string, currentRunId: string) {
  const now = Date.now();
  const queuedCutoff = now - 2 * 60 * 1000;
  const runningCutoff = now - 15 * 60 * 1000;

  const { data: active } = await admin
    .from("ai_pipeline_runs")
    .select("id,status,created_at,started_at")
    .eq("user_id", userId)
    .in("status", ["queued", "running"])
    .neq("id", currentRunId)
    .limit(100);

  const staleIds = (active ?? [])
    .filter((r: any) => {
      const createdAt = r.created_at ? new Date(r.created_at).getTime() : 0;
      const startedAt = r.started_at ? new Date(r.started_at).getTime() : 0;
      if (r.status === "queued") return createdAt > 0 && createdAt < queuedCutoff;
      if (r.status === "running") return startedAt > 0 && startedAt < runningCutoff;
      return false;
    })
    .map((r: any) => r.id);

  if (!staleIds.length) return 0;

  await admin
    .from("ai_pipeline_runs")
    .update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error: "Restarted by Force run remaining after the previous generation appeared stuck.",
    })
    .in("id", staleIds);

  console.log(`Force run marked ${staleIds.length} stale pipeline run(s) failed for ${userId}`);
  return staleIds.length;
}

async function runJob(admin: any, userId: string, runId: string, opts: { key?: string; keys?: string[]; onlyMissing?: boolean; bulk?: boolean; runUpstream?: boolean; forceRun?: boolean; maxDocs?: number; feedback?: string; tags?: string[] }) {
  await admin.from("ai_pipeline_runs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", runId);

  try {
    const [{ data: allTypes }, { data: brief }, { data: founder }, { data: market }, { data: existing }, { data: primarySnap }] = await Promise.all([
      admin.from("deliverable_types").select("key,label,description,stage_label,depends_on_keys,default_model,user_can_trigger,auto_runnable,sort_order").eq("active", true).order("sort_order"),
      admin.from("attendee_business_brief").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("attendee_founder_profile").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("attendee_market_profile").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("attendee_deliverables").select("deliverable_key, content_current").eq("user_id", userId),
      admin
        .from("venture_snapshots")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // Load shared venture context + brain once per job (not per doc). This is
    // the same context surface the Hub generators use, so Workflow output now
    // aligns with Hub output instead of reasoning off raw blobs.
    let venture: VentureContext | null = null;
    if (primarySnap?.id) {
      try {
        venture = await loadVentureContext(admin, primarySnap.id);
        // Always go through ensureSnapshotBrain: it returns the cached brain
        // when clean and recomputes when the corpus changed (new material,
        // rebuilt memory), so Generate never reuses a stale summary.
        venture.brain = (await ensureSnapshotBrain(admin, primarySnap.id)) ?? venture.brain;
      } catch (e) {
        console.warn("loadVentureContext failed, falling back to raw brief", e);
        venture = null;
      }
    }

    const typesByKey = new Map<string, DType>((allTypes ?? []).map((t: any) => [t.key, t]));
    const upstream: Record<string, Content> = {};
    for (const row of existing ?? []) {
      const c = row.content_current as Content | null;
      if (c && c.title) upstream[row.deliverable_key] = c;
    }

    // Pick targets
    let targets: DType[] = [];
    if (opts.key) {
      const t = typesByKey.get(opts.key);
      if (!t) throw new Error(`Unknown deliverable: ${opts.key}`);
      targets = [t];
      if (opts.runUpstream) {
        const visited = new Set<string>();
        const walk = (k: string) => {
          if (visited.has(k)) return;
          visited.add(k);
          const tt = typesByKey.get(k);
          if (!tt) return;
          for (const d of tt.depends_on_keys ?? []) walk(d);
        };
        walk(opts.key);
        targets = Array.from(visited).map((k) => typesByKey.get(k)!).filter(Boolean);
      }
    } else if (opts.keys && opts.keys.length) {
      // Ordered subset (a category run). One server-side run in dependency
      // order instead of N racing invocations from the browser.
      const wanted = opts.keys
        .map((k) => typesByKey.get(k))
        .filter(Boolean) as DType[];
      targets = opts.onlyMissing === false ? wanted : wanted.filter((t) => !upstream[t.key]);
      if (!targets.length) throw new Error("Nothing to generate for those keys");
    } else if (opts.bulk) {
      targets = (allTypes ?? []).filter((t: any) =>
        t.user_can_trigger !== false && !upstream[t.key]
      );
    } else {
      throw new Error("Must pass { key }, { keys } or { bulk: true }");
    }

    const orderedAll = layers(targets).flat();
    const maxDocs = Number.isFinite(opts.maxDocs) && opts.maxDocs! > 0 ? Math.floor(opts.maxDocs!) : null;
    const ordered = maxDocs ? orderedAll.slice(0, maxDocs) : orderedAll;

    // Seed a step row per target so the dashboard can show live per-card state
    // (queued → running → completed/failed) instead of one opaque spinner.
    if (ordered.length) {
      await admin.from("ai_pipeline_steps").insert(
        ordered.map((t) => ({
          run_id: runId,
          user_id: userId,
          deliverable_key: t.key,
          status: "queued",
          model: modelForTier(t.default_model, MODELS.flash),
        })),
      );
    }

    const setStep = async (key: string, patch: Record<string, unknown>) => {
      try {
        await admin.from("ai_pipeline_steps").update(patch).eq("run_id", runId).eq("deliverable_key", key);
      } catch (e) {
        console.warn("step update failed", key, e);
      }
    };

    let done = 0, failed = 0;
    for (const t of ordered) {
      try {
        await setStep(t.key, { status: "running", started_at: new Date().toISOString() });
        await admin.from("attendee_deliverables").upsert({
          user_id: userId,
          deliverable_key: t.key,
          review_status: "pending_review",
        }, { onConflict: "user_id,deliverable_key" });

        const isTarget = !!opts.key && t.key === opts.key;
        const content = await generateOne(t, {
          venture,
          brief: brief ?? null,
          founder: founder ?? null,
          market: market ?? null,
          upstream,
          feedback: isTarget ? opts.feedback : undefined,
          tags: isTarget ? opts.tags : undefined,
          previous: isTarget ? (upstream[t.key] ?? null) : null,
          admin,
          userId,
          snapshotId: primarySnap?.id ?? null,
        });


        await admin.from("attendee_deliverables").update({
          content_current: content as any,
          content_ai: content as any,
          content_source: "ai",
          ai_generated_at: new Date().toISOString(),
          last_run_id: runId,
        }).eq("user_id", userId).eq("deliverable_key", t.key);

        upstream[t.key] = content;
        done++;
        await setStep(t.key, { status: "completed", finished_at: new Date().toISOString() });
      } catch (e) {
        failed++;
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`Generation failed for ${t.key}:`, e);
        await setStep(t.key, { status: "failed", finished_at: new Date().toISOString(), error: msg.slice(0, 500) });
      }
    }


    const remaining = Math.max(orderedAll.length - done, 0);

    await admin.from("ai_pipeline_runs").update({
      status: failed > 0 && done === 0 ? "failed" : remaining > 0 ? "partial" : "completed",
      finished_at: new Date().toISOString(),
      error: failed > 0 ? `${failed} of ${ordered.length} failed` : null,
    }).eq("id", runId);

    return { total: orderedAll.length, attempted: ordered.length, done, failed, remaining };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await admin.from("ai_pipeline_runs").update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error: message,
    }).eq("id", runId);
    throw e;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: ures } = await userClient.auth.getUser();
    const callerId = ures?.user?.id;
    if (!callerId) return new Response(JSON.stringify({ error: "Not signed in" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const targetUserId = body.userId ?? callerId;
    const opts = {
      key: body.key as string | undefined,
      keys: Array.isArray(body.keys)
        ? body.keys.filter((x: any) => typeof x === "string").slice(0, 40)
        : undefined,
      onlyMissing: body.onlyMissing !== false,
      bulk: !!body.bulk,
      runUpstream: !!body.runUpstream,
      forceRun: !!body.forceRun,
      maxDocs: typeof body.maxDocs === "number" ? Math.max(1, Math.min(5, Math.floor(body.maxDocs))) : undefined,
      feedback: typeof body.feedback === "string" ? body.feedback.slice(0, 4000) : undefined,
      tags: Array.isArray(body.tags) ? body.tags.filter((x: any) => typeof x === "string").slice(0, 12) : undefined,
    };


    // If targeting another user, require admin
    if (targetUserId !== callerId) {
      const admin = createClient(SUPABASE_URL, SERVICE_KEY);
      const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", callerId);
      const isAdmin = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "super_admin");
      if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: run, error: runErr } = await admin.from("ai_pipeline_runs").insert({
      user_id: targetUserId,
      status: "queued",
      triggered_by: callerId,
      options: opts as any,
    }).select("id").single();
    if (runErr) throw new Error(runErr.message);

    if (opts.forceRun) {
      const staleRunsReset = await markStaleRunsFailed(admin, targetUserId, run.id);
      const result = await runJob(admin, targetUserId, run.id, opts);
      return new Response(JSON.stringify({ ok: true, runId: run.id, staleRunsReset, ...result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Run in background so the HTTP response returns immediately.
    // @ts-ignore EdgeRuntime is provided by Supabase Edge Functions runtime
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(runJob(admin, targetUserId, run.id, opts));
    } else {
      runJob(admin, targetUserId, run.id, opts).catch((e) => console.error("run failed", e));
    }

    return new Response(JSON.stringify({ ok: true, runId: run.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

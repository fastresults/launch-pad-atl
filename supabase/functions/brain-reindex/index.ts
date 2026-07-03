// Rebuild the founder's brain memory from their existing startup assets.
// Runs as a background job so it doesn't hit the edge-function idle timeout,
// with a queryable progress row in `brain_indexing_jobs`.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chunkText, embedTexts, toVectorLiteral } from "../_shared/brain-embed.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const EMBEDDING_BATCH_SIZE = 8;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) return json({ error: "Missing auth" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: ures } = await userClient.auth.getUser();
    const userId = ures?.user?.id;
    if (!userId) return json({ error: "Not signed in" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json().catch(() => ({}));
    const snapshotId: string | null = typeof body?.snapshotId === "string" && body.snapshotId ? body.snapshotId : null;

    if (snapshotId) {
      // Confirm the venture belongs to this user before we scope work to it.
      const { data: snap } = await admin
        .from("venture_snapshots")
        .select("id, user_id")
        .eq("id", snapshotId)
        .maybeSingle();
      if (!snap || snap.user_id !== userId) return json({ error: "Venture not found" }, 404);
    }

    const { data: job, error: jobErr } = await admin
      .from("brain_indexing_jobs")
      .insert({ user_id: userId, snapshot_id: snapshotId, status: "queued" })
      .select("id")
      .single();
    if (jobErr || !job) return json({ error: jobErr?.message ?? "Job create failed" }, 500);

    // Run the actual work in the background so we return immediately.
    // deno-lint-ignore no-explicit-any
    const anyRuntime = (globalThis as any).EdgeRuntime;
    const work = runJob(admin, userId, job.id, snapshotId);
    if (anyRuntime?.waitUntil) {
      anyRuntime.waitUntil(work);
    } else {
      // Fallback: run without awaiting so the response still returns fast.
      work.catch((e) => console.error("brain-reindex background failed", e));
    }

    return json({ jobId: job.id, status: "queued" }, 202);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

// deno-lint-ignore no-explicit-any
async function runJob(admin: any, userId: string, jobId: string, snapshotId: string | null) {
  const touch = async (patch: Record<string, unknown>) => {
    const { error } = await admin.from("brain_indexing_jobs").update(patch).eq("id", jobId);
    if (error) console.error("brain-reindex job update failed", error.message);
  };

  try {
    await touch({ status: "running", started_at: new Date().toISOString() });

    const notesQuery = admin.from("founder_brain_notes").select("id, content, tags, created_at").eq("user_id", userId);
    if (snapshotId) notesQuery.eq("snapshot_id", snapshotId);
    else notesQuery.is("snapshot_id", null);

    const [
      { data: brief },
      { data: founder },
      { data: market },
      { data: goals },
      { data: delivs },
      { data: vdocs },
      { data: notes },
      { data: snapshot },
    ] = await Promise.all([
      admin.from("attendee_business_brief").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("attendee_founder_profile").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("attendee_market_profile").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("attendee_goals").select("*").eq("user_id", userId),
      admin.from("attendee_deliverables").select("deliverable_key, content_current, deep_assessment").eq("user_id", userId),
      snapshotId
        ? admin
            .from("venture_documents")
            .select("document_type, content, deep_assessment, intake_answers")
            .eq("snapshot_id", snapshotId)
            .eq("status", "complete")
        : Promise.resolve({ data: [] }),
      notesQuery,
      snapshotId
        ? admin.from("venture_snapshots").select("*").eq("id", snapshotId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    // Wipe only this venture's auto-derived rows. Legacy rows (snapshot_id is
    // null) are left alone so pre-migration data still surfaces until the
    // founder rebuilds them explicitly.
    const wipe = admin
      .from("founder_brain_memory")
      .delete()
      .eq("user_id", userId)
      .in("kind", ["brief", "deliverable", "assessment", "goal", "note", "venture"]);
    if (snapshotId) wipe.eq("snapshot_id", snapshotId);
    else wipe.is("snapshot_id", null);
    await wipe;

    type Source = { kind: string; source_ref: string | null; title: string; content: string };
    const sources: Source[] = [];
    const seenDeliv = new Set<string>();
    const seenAssess = new Set<string>();
    const vdocRows = (vdocs ?? []) as Array<{
      document_type: string;
      content: string | null;
      deep_assessment: string | null;
      intake_answers: Record<string, unknown> | null;
    }>;
    const hasRealDeliverables =
      vdocRows.some((r) => (r.content ?? "").trim().length > 0) ||
      (delivs ?? []).some((d: any) => d.content_current && Object.keys(d.content_current).length);

    if (snapshot) {
      // When real deliverables exist, the full snapshot JSON is redundant noise
      // that chunks into 100+ meaningless embeddings. Keep only the fields a
      // founder-facing chat actually cares about.
      const summary = hasRealDeliverables
        ? {
            company_name: snapshot.company_name,
            one_liner: snapshot.one_liner ?? null,
            industry: snapshot.industry ?? null,
            stage: snapshot.stage ?? null,
            target_market: snapshot.target_market ?? null,
            problem_solved: snapshot.problem_solved ?? null,
            value_prop: snapshot.value_prop ?? null,
            business_model: snapshot.business_model ?? null,
          }
        : snapshot;
      sources.push({
        kind: "venture",
        source_ref: snapshotId,
        title: `Venture — ${snapshot.company_name ?? "current venture"}`,
        content: JSON.stringify(summary, null, 2),
      });
    }

    if (brief || founder || market) {
      sources.push({
        kind: "brief",
        source_ref: "brief",
        title: "Startup brief",
        content: JSON.stringify({ brief, founder, market }, null, 2),
      });
    }
    for (const g of goals ?? []) {
      sources.push({
        kind: "goal",
        source_ref: g.id,
        title: g.title ?? "Goal",
        content: `${g.title ?? ""}\n\n${g.detail ?? ""}\n\nStatus: ${g.status ?? "n/a"}`,
      });
    }

    // Current workflow: venture_documents (snapshot-scoped). Index these first
    // so they win the dedup against any legacy attendee_deliverables row.
    for (const v of vdocRows) {
      const key = v.document_type;
      const body = (v.content ?? "").trim();
      if (body && !seenDeliv.has(key)) {
        seenDeliv.add(key);
        const intake = v.intake_answers && Object.keys(v.intake_answers).length
          ? `Intake answers:\n${JSON.stringify(v.intake_answers, null, 2)}\n\n---\n\n`
          : "";
        sources.push({
          kind: "deliverable",
          source_ref: key,
          title: key,
          content: `${intake}${body}`,
        });
      }
      const assess = (v.deep_assessment ?? "").trim();
      if (assess && !seenAssess.has(key)) {
        seenAssess.add(key);
        sources.push({
          kind: "assessment",
          source_ref: key,
          title: `Assessment — ${key}`,
          content: assess,
        });
      }
    }

    for (const d of delivs ?? []) {
      // deno-lint-ignore no-explicit-any
      const c: any = (d as any).content_current;
      const key = (d as { deliverable_key: string }).deliverable_key;
      if (c && typeof c === "object" && Object.keys(c).length && !seenDeliv.has(key)) {
        const md = deliverableToMarkdown(c, key);
        if (md.trim()) {
          seenDeliv.add(key);
          sources.push({ kind: "deliverable", source_ref: key, title: c.title ?? key, content: md });
        }
      }
      // deno-lint-ignore no-explicit-any
      const assess = (d as any).deep_assessment;
      if (assess && typeof assess === "string" && assess.trim() && !seenAssess.has(key)) {
        seenAssess.add(key);
        sources.push({
          kind: "assessment",
          source_ref: key,
          title: `Assessment — ${key}`,
          content: assess,
        });
      }
    }
    for (const n of notes ?? []) {
      sources.push({
        kind: "note",
        source_ref: (n as { id: string }).id,
        title: "Founder note",
        content: (n as { content: string }).content,
      });
    }

    // Pre-chunk everything so we know the total up front.
    type Job = { source: Source; chunkIndex: number; chunkTotal: number; text: string };
    const chunkQueue: Job[] = [];
    for (const s of sources) {
      const chunks = chunkText(s.content);
      for (let i = 0; i < chunks.length; i++) {
        chunkQueue.push({ source: s, chunkIndex: i, chunkTotal: chunks.length, text: chunks[i] });
      }
    }

    await touch({ total_sources: sources.length, total_chunks: chunkQueue.length });

    if (chunkQueue.length === 0) {
      await touch({ status: "done", finished_at: new Date().toISOString() });
      return;
    }

    let embedded = 0;
    let failed = 0;
    let firstError: string | null = null;

    for (let start = 0; start < chunkQueue.length; start += EMBEDDING_BATCH_SIZE) {
      const batch = chunkQueue.slice(start, start + EMBEDDING_BATCH_SIZE);
      try {
        const vectors = await embedTexts(batch.map((job) => `${job.source.title}\n\n${job.text}`));
        const rows = batch.map((job, i) => ({
          user_id: userId,
          snapshot_id: snapshotId,
          kind: job.source.kind,
          source_ref: job.source.source_ref,
          title: job.source.title,
          content: job.text,
          embedding: toVectorLiteral(vectors[i]),
          metadata: { chunk_index: job.chunkIndex, chunk_total: job.chunkTotal },
        }));
        const { error: insErr } = await admin.from("founder_brain_memory").insert(rows);
        if (insErr) throw new Error(`insert: ${insErr.message}`);
        embedded += rows.length;
      } catch (e) {
        failed += batch.length;
        const msg = e instanceof Error ? e.message : String(e);
        if (!firstError) firstError = msg;
        console.error("brain-reindex batch failed", start, msg);
      }

      await touch({ embedded_chunks: embedded, failed_chunks: failed, error_message: firstError });
    }

    await touch({
      embedded_chunks: embedded,
      failed_chunks: failed,
      error_message: firstError,
      status: embedded > 0 ? "done" : "failed",
      finished_at: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("brain-reindex job crashed", msg);
    await admin
      .from("brain_indexing_jobs")
      .update({ status: "failed", error_message: msg, finished_at: new Date().toISOString() })
      .eq("id", jobId)
      .then(() => {});
  }
}

// deno-lint-ignore no-explicit-any
function deliverableToMarkdown(content: any, fallbackTitle: string): string {
  const sections = Array.isArray(content.sections) ? content.sections : [];
  const actionItems = Array.isArray(content.action_items) ? content.action_items : [];
  const parts = [
    content.title ? `# ${String(content.title)}` : `# ${fallbackTitle}`,
    content.summary ? String(content.summary) : "",
    ...sections.map((s: { heading?: unknown; body_markdown?: unknown; body?: unknown; content?: unknown }) => {
      const heading = s.heading ? `## ${String(s.heading)}` : "## Section";
      const body = s.body_markdown ?? s.body ?? s.content ?? "";
      return `${heading}\n${stringifyContent(body)}`;
    }),
    actionItems.length ? `## Action items\n${actionItems.map((a: unknown) => `- ${stringifyContent(a)}`).join("\n")}` : "",
  ].filter((part) => String(part).trim());

  const known = new Set(["title", "summary", "sections", "action_items"]);
  const extra = Object.entries(content)
    .filter(([key, value]) => !known.has(key) && value !== null && value !== undefined && String(stringifyContent(value)).trim())
    .map(([key, value]) => `## ${key.replace(/_/g, " ")}\n${stringifyContent(value)}`);

  return [...parts, ...extra].join("\n\n");
}

function stringifyContent(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(stringifyContent).filter(Boolean).join("\n");
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

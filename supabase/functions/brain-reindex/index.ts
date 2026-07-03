// Rebuild the founder's brain memory from their existing startup assets.
// Runs as a background job so it doesn't hit the edge-function idle timeout,
// with a queryable progress row in `brain_indexing_jobs`.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chunkText, embedText, toVectorLiteral } from "../_shared/brain-embed.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CONCURRENCY = 4;

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

    const { data: job, error: jobErr } = await admin
      .from("brain_indexing_jobs")
      .insert({ user_id: userId, status: "queued" })
      .select("id")
      .single();
    if (jobErr || !job) return json({ error: jobErr?.message ?? "Job create failed" }, 500);

    // Run the actual work in the background so we return immediately.
    // deno-lint-ignore no-explicit-any
    const anyRuntime = (globalThis as any).EdgeRuntime;
    const work = runJob(admin, userId, job.id);
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
async function runJob(admin: any, userId: string, jobId: string) {
  const touch = (patch: Record<string, unknown>) =>
    admin.from("brain_indexing_jobs").update(patch).eq("id", jobId);

  try {
    await touch({ status: "running", started_at: new Date().toISOString() });

    const [{ data: brief }, { data: founder }, { data: market }, { data: goals }, { data: delivs }, { data: notes }] = await Promise.all([
      admin.from("attendee_business_brief").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("attendee_founder_profile").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("attendee_market_profile").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("attendee_goals").select("*").eq("user_id", userId),
      admin.from("attendee_deliverables").select("deliverable_key, content_current, deep_assessment").eq("user_id", userId),
      admin.from("founder_brain_notes").select("id, content, tags, created_at").eq("user_id", userId),
    ]);

    // Wipe only the auto-derived rows; user-written notes-derived rows are
    // regenerated below from the notes table, so this is safe.
    await admin
      .from("founder_brain_memory")
      .delete()
      .eq("user_id", userId)
      .in("kind", ["brief", "deliverable", "assessment", "goal", "note"]);

    type Source = { kind: string; source_ref: string | null; title: string; content: string };
    const sources: Source[] = [];

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
    for (const d of delivs ?? []) {
      // deno-lint-ignore no-explicit-any
      const c: any = (d as any).content_current;
      if (c && (c.title || c.summary || (c.sections ?? []).length)) {
        const md = [
          c.title ? `# ${c.title}` : "",
          c.summary ?? "",
          ...(c.sections ?? []).map((s: { heading?: string; body_markdown?: string }) => `## ${s.heading ?? ""}\n${s.body_markdown ?? ""}`),
          (c.action_items ?? []).length ? `## Action items\n${(c.action_items ?? []).map((a: string) => `- ${a}`).join("\n")}` : "",
        ].filter(Boolean).join("\n\n");
        sources.push({ kind: "deliverable", source_ref: (d as { deliverable_key: string }).deliverable_key, title: c.title ?? (d as { deliverable_key: string }).deliverable_key, content: md });
      }
      // deno-lint-ignore no-explicit-any
      const assess = (d as any).deep_assessment;
      if (assess && typeof assess === "string" && assess.trim()) {
        sources.push({
          kind: "assessment",
          source_ref: (d as { deliverable_key: string }).deliverable_key,
          title: `Assessment — ${(d as { deliverable_key: string }).deliverable_key}`,
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

    let cursor = 0;
    async function worker() {
      while (true) {
        const idx = cursor++;
        if (idx >= chunkQueue.length) return;
        const job = chunkQueue[idx];
        try {
          const vec = await embedText(`${job.source.title}\n\n${job.text}`);
          const { error: insErr } = await admin.from("founder_brain_memory").insert({
            user_id: userId,
            kind: job.source.kind,
            source_ref: job.source.source_ref,
            title: job.source.title,
            content: job.text,
            embedding: toVectorLiteral(vec),
            metadata: { chunk_index: job.chunkIndex, chunk_total: job.chunkTotal },
          });
          if (insErr) throw new Error(`insert: ${insErr.message}`);
          embedded++;
        } catch (e) {
          failed++;
          const msg = e instanceof Error ? e.message : String(e);
          if (!firstError) firstError = msg;
          console.error("brain-reindex chunk failed", job.source.kind, job.source.source_ref, msg);
        }

        // Periodically push progress; every 3 chunks is plenty for the UI.
        if ((embedded + failed) % 3 === 0 || (embedded + failed) === chunkQueue.length) {
          await touch({ embedded_chunks: embedded, failed_chunks: failed, error_message: firstError }).catch(() => {});
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, chunkQueue.length) }, () => worker()));

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

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

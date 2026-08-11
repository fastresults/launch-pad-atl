// Periodic watchdog: unsticks jobs whose heartbeat is older than 3 minutes,
// flips any orphan "generating" documents to "failed" so the UI unsticks, and
// auto-resumes the run (retry-only) up to twice per job before giving up.


import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// The slowest single legal generation (website_prd on Pro, or a "minimal"
// retry) can take up to 240s. The stall window must sit above that, or the
// watchdog kills healthy in-flight work and re-runs it — the old 3-minute
// window did exactly that and froze runs at "62 of 63".
const STALL_MS = 6 * 60 * 1000;
// A single document's own row is touched at the start of its run and at every
// checkpoint, so it can be judged on a tighter clock than a whole job.
const DOC_STALL_MS = 4 * 60 * 1000;
// Paused jobs are swept back into a retry-only run on a slower cadence so one
// stubborn asset can't strand a founder, without burning credits in a loop.
const PAUSED_SWEEP_MS = 20 * 60 * 1000;
const MAX_PAUSED_SWEEPS = 4;
// Per-document recovery budget. Past this we stop resurrecting the same asset
// and park it with a recorded failure so it surfaces in triage.
const MAX_DOC_RECOVERIES = 3;

/**
 * Recover documents wedged in `generating`.
 *
 * A checkpointed draft is never thrown away: the draft/refine split exists so a
 * dropped phase-two worker publishes what it had. We re-invoke refine once, and
 * if that also dies we promote the draft to complete with the unmet work
 * recorded. Only a document with nothing written is failed for the retry engine.
 */
async function recoverStuckDocuments(supabase: any, cutoff: string, snapshotId?: string) {
  let q = supabase
    .from("venture_documents")
    .select("id, snapshot_id, document_type, content, metadata, generation_attempts, word_count")
    .eq("status", "generating")
    .lt("updated_at", cutoff)
    .limit(50);
  if (snapshotId) q = q.eq("snapshot_id", snapshotId);
  const { data: rows } = await q;
  let handled = 0;

  for (const row of rows ?? []) {
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const recoveries = Number(metadata.recovery_attempts ?? 0);
    const draft = typeof row.content === "string" ? row.content.trim() : "";
    handled++;

    if (draft && recoveries < 1) {
      // Phase two never landed — run it again on a fresh wall clock.
      await supabase.from("venture_documents").update({
        metadata: { ...metadata, recovery_attempts: recoveries + 1, recovered_at: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      }).eq("id", row.id);
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/venture-generate-document`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-key": SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({ snapshotId: row.snapshot_id, documentType: row.document_type, phase: "refine" }),
        });
      } catch (e) {
        console.error("refine recovery failed", e);
      }
      continue;
    }

    if (draft) {
      // Publish the checkpoint rather than lose it.
      await supabase.from("venture_documents").update({
        status: "complete",
        word_count: row.word_count ?? draft.split(/\s+/).filter(Boolean).length,
        last_error: null,
        metadata: {
          ...metadata,
          quality_gaps: ["refine_incomplete"],
          published_from: "checkpoint",
        },
      }).eq("id", row.id);
      continue;
    }

    const attempts = Number(row.generation_attempts ?? 0);
    const exhausted = attempts >= MAX_DOC_RECOVERIES;
    await supabase.from("venture_documents").update({
      status: "failed",
      last_error: exhausted
        ? "We tried this asset several times and it kept dropping. Retry it or skip it."
        : "Generation stalled — worker dropped.",
    }).eq("id", row.id);

    if (exhausted) {
      try {
        const { data: already } = await supabase
          .from("venture_generation_failures")
          .select("id")
          .eq("snapshot_id", row.snapshot_id)
          .eq("document_type", row.document_type)
          .maybeSingle();
        if (!already) {
          await supabase.from("venture_generation_failures").insert({
            snapshot_id: row.snapshot_id,
            document_type: row.document_type,
            error: `Recovery budget exhausted after ${attempts} attempts.`,
          });
        }
      } catch { /* best effort */ }
    }
  }
  return handled;
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const cutoff = new Date(Date.now() - STALL_MS).toISOString();

    const { data: stalled } = await supabase
      .from("venture_generation_jobs")
      .select("id, snapshot_id, current_document_type, heartbeat_at, started_at, resume_count")
      .in("status", ["running", "queued"])
      .or(`heartbeat_at.lt.${cutoff},and(heartbeat_at.is.null,started_at.lt.${cutoff})`);

    let paused = 0;
    let unstuck = 0;
    let resumed = 0;
    const resumeRun = async (snapshotId: string) => {
      await fetch(`${SUPABASE_URL}/functions/v1/venture-bulk-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ snapshotId, retryOnly: true }),
      });
    };

    // Standalone documents (generated outside a bulk run — e.g. a single
    // Website PRD rebuild) also strand in `generating` when a worker dies.
    // Terminalize them so the founder gets a retry button instead of an
    // indefinite spinner over stale content.
    {
      const { data: orphanDocs } = await supabase
        .from("venture_documents")
        .select("id")
        .eq("status", "generating")
        .lt("updated_at", cutoff);
      if (orphanDocs?.length) {
        await supabase.from("venture_documents")
          .update({ status: "failed", last_error: "Generation stalled — worker dropped." })
          .in("id", orphanDocs.map((d: any) => d.id));
        unstuck += orphanDocs.length;
      }
    }

    for (const j of stalled ?? []) {

      // Reset docs stuck mid-generation — but only ones whose OWN row has been
      // untouched past the stall window. A long, healthy document still being
      // written must never be flipped to failed underneath the worker.
      const { data: stuckDocs } = await supabase
        .from("venture_documents")
        .select("id")
        .eq("snapshot_id", j.snapshot_id)
        .eq("status", "generating")
        .lt("updated_at", cutoff);
      if (stuckDocs?.length) {
        await supabase.from("venture_documents")
          .update({ status: "failed", last_error: "Generation stalled — worker dropped." })
          .in("id", stuckDocs.map((d: any) => d.id));
        unstuck += stuckDocs.length;
      }

      const resumeCount = j.resume_count ?? 0;
      if (resumeCount < 2) {
        // Auto-resume: re-invoke the bulk function in retry-only mode so a
        // dropped edge worker picks the run back up without the founder.
        await supabase.from("venture_generation_jobs").update({
          status: "running",
          resume_count: resumeCount + 1,
          heartbeat_at: new Date().toISOString(),
          error: null,
        }).eq("id", j.id);
        try {
          await resumeRun(j.snapshot_id);
          resumed++;
          continue;
        } catch (e) {
          console.error("auto-resume failed", e);
        }
      }

      await supabase.from("venture_generation_jobs").update({
        status: "paused",
        error: "Paused — we lost the worker on this asset. You can resume or skip it.",
      }).eq("id", j.id);
      paused++;
    }

    // Paused jobs are not abandoned: sweep them back into a retry-only run on
    // a slow cadence, bounded so a permanently failing asset can't loop.
    const pausedCutoff = new Date(Date.now() - PAUSED_SWEEP_MS).toISOString();
    const { data: pausedJobs } = await supabase
      .from("venture_generation_jobs")
      .select("id, snapshot_id, resume_count, heartbeat_at")
      .eq("status", "paused")
      .lt("heartbeat_at", pausedCutoff)
      .limit(5);
    for (const j of pausedJobs ?? []) {
      const resumeCount = j.resume_count ?? 0;
      if (resumeCount >= MAX_PAUSED_SWEEPS) continue;
      await supabase.from("venture_generation_jobs").update({
        status: "running",
        resume_count: resumeCount + 1,
        heartbeat_at: new Date().toISOString(),
        error: null,
      }).eq("id", j.id);
      try {
        await resumeRun(j.snapshot_id);
        resumed++;
      } catch (e) {
        console.error("paused sweep resume failed", e);
      }
    }


    // Logo stages are durable and browser-resumable. Release abandoned leases
    // so the next studio poll can continue the exact stage instead of starting
    // another paid generation or duplicating a completed direction.
    const now = new Date().toISOString();
    const { data: staleLogoDirections } = await supabase
      .from("brand_logo_directions")
      .select("id, run_id, snapshot_id")
      .in("status", ["developing_vector", "drawing", "reviewing", "rendering_concept"])
      .lt("lease_expires_at", now);
    if (staleLogoDirections?.length) {
      await supabase.from("brand_logo_directions").update({
        status: "retry_wait",
        retry_at: now,
        lease_token: null,
        lease_expires_at: null,
        error_class: "worker_stalled",
        last_error: "Logo worker stopped before this stage completed. The saved run can resume safely.",
      }).in("id", staleLogoDirections.map((row) => row.id));
      unstuck += staleLogoDirections.length;
    }

    const logoCalls: Promise<Response>[] = [];
    const callLogoStage = (snapshotId: string, kind: string, runId: string, directionId?: string) => {
      logoCalls.push(fetch(`${SUPABASE_URL}/functions/v1/venture-brand-assets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ snapshotId, kind, runId, directionId }),
      }));
    };

    // Restart one bounded stage per stale run. Each target operation performs
    // one AI call, while waitUntil lets this watchdog respond immediately.
    const { data: staleLogoRuns } = await supabase
      .from("brand_logo_runs")
      .select("id, snapshot_id, status, created_at")
      .in("status", ["developing_brief", "developing_directions", "rendering"])
      .lt("heartbeat_at", cutoff)
      .order("created_at", { ascending: true })
      .limit(8);

    for (const run of staleLogoRuns ?? []) {
      if (Date.now() - new Date(run.created_at).getTime() > 30 * 60 * 1000) {
        await supabase.from("brand_logo_runs").update({ status: "failed", last_error: "Logo Studio paused after 30 minutes of recovery attempts." }).eq("id", run.id);
        paused++;
        continue;
      }
      await supabase.from("brand_logo_runs").update({ heartbeat_at: now, last_error: null }).eq("id", run.id);
      if (run.status === "developing_brief") {
        callLogoStage(run.snapshot_id, "logo_develop_brief", run.id);
      } else if (run.status === "developing_directions") {
        callLogoStage(run.snapshot_id, "logo_develop_directions", run.id);
      } else {
        const { data: next } = await supabase.from("brand_logo_directions")
          .select("id, current_stage")
          .eq("run_id", run.id)
          .in("status", ["queued", "retry_wait"])
          .lt("attempt_count", 3)
          .or(`retry_at.is.null,retry_at.lte.${now}`)
          .order("slot")
          .limit(1)
          .maybeSingle();
        // Resume the exact stage the direction stopped on, so a stalled render
        // is not silently skipped straight into the vector step.
        if (next) {
          const stage = next.current_stage === "render_concept" ? "logo_render_concept" : "logo_draw_vector";
          callLogoStage(run.snapshot_id, stage, run.id, next.id);
        }
      }
    }

    if (logoCalls.length) {
      const recovery = Promise.allSettled(logoCalls).then((results) => {
        results.forEach((result) => {
          if (result.status === "rejected") console.error("logo auto-resume failed", result.reason);
        });
      });
      const edgeRuntime = (globalThis as typeof globalThis & { EdgeRuntime?: { waitUntil(promise: Promise<unknown>): void } }).EdgeRuntime;
      if (edgeRuntime) edgeRuntime.waitUntil(recovery);
      else await recovery;
      resumed += logoCalls.length;
    }

    // Header-art safety net: any recently touched venture that still has
    // completed assets without illustrations gets swept in the background, so
    // nobody has to open an asset (or a share link) to trigger generation.
    let heroSweeps = 0;
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: gaps } = await supabase
        .from("venture_documents")
        .select("snapshot_id, updated_at")
        .eq("status", "complete")
        .is("hero_image_path", null)
        .gte("updated_at", since)
        .order("updated_at", { ascending: false })
        .limit(200);
      const snapshotIds = Array.from(new Set((gaps ?? []).map((r: any) => r.snapshot_id))).slice(0, 3);
      const sweeps = snapshotIds.map((snapshotId) =>
        fetch(`${SUPABASE_URL}/functions/v1/venture-hero-sweep`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-key": SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({ snapshotId }),
        }).catch((e) => console.error("hero sweep failed", e)),
      );
      heroSweeps = sweeps.length;
      if (sweeps.length) {
        const pending = Promise.allSettled(sweeps);
        const edgeRuntime = (globalThis as any).EdgeRuntime;
        if (edgeRuntime?.waitUntil) edgeRuntime.waitUntil(pending);
        else await pending;
      }
    } catch (e) {
      console.error("hero sweep pass failed", e);
    }

    return new Response(JSON.stringify({ ok: true, paused, unstuck, resumed, heroSweeps }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

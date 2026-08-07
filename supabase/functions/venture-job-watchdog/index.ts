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

const STALL_MS = 3 * 60 * 1000;

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
    for (const j of stalled ?? []) {
      // Reset any docs stuck mid-generation for this snapshot first, so a
      // resumed run treats them as retryable instead of in-flight.
      const { data: stuckDocs } = await supabase
        .from("venture_documents")
        .select("id")
        .eq("snapshot_id", j.snapshot_id)
        .eq("status", "generating");
      if (stuckDocs?.length) {
        await supabase.from("venture_documents")
          .update({ status: "failed", last_error: "Generation stalled — worker dropped." })
          .eq("snapshot_id", j.snapshot_id)
          .eq("status", "generating");
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
          await fetch(`${SUPABASE_URL}/functions/v1/venture-bulk-generate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-key": SERVICE_KEY,
              Authorization: `Bearer ${SERVICE_KEY}`,
            },
            body: JSON.stringify({ snapshotId: j.snapshot_id, retryOnly: true }),
          });
          resumed++;
          continue;
        } catch (e) {
          console.error("auto-resume failed", e);
        }
      }

      await supabase.from("venture_generation_jobs").update({
        status: "paused",
        error: "Watchdog: no heartbeat for 3+ minutes",
      }).eq("id", j.id);
      paused++;
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

    return new Response(JSON.stringify({ ok: true, paused, unstuck, resumed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

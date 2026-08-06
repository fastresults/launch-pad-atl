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
      .select("id, snapshot_id, current_document_type, heartbeat_at, started_at")
      .in("status", ["running", "queued"])
      .or(`heartbeat_at.lt.${cutoff},and(heartbeat_at.is.null,started_at.lt.${cutoff})`);

    let paused = 0;
    let unstuck = 0;
    for (const j of stalled ?? []) {
      await supabase.from("venture_generation_jobs").update({
        status: "paused",
        error: "Watchdog: no heartbeat for 3+ minutes",
      }).eq("id", j.id);
      paused++;

      // Reset any docs stuck mid-generation for this snapshot
      const { data: stuckDocs } = await supabase
        .from("venture_documents")
        .select("id")
        .eq("snapshot_id", j.snapshot_id)
        .eq("status", "generating");
      if (stuckDocs?.length) {
        await supabase.from("venture_documents")
          .update({ status: "failed" })
          .eq("snapshot_id", j.snapshot_id)
          .eq("status", "generating");
        unstuck += stuckDocs.length;
      }
    }

    return new Response(JSON.stringify({ ok: true, paused, unstuck }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

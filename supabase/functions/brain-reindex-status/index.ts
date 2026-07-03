// Poll a brain-reindex job for progress.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) return json({ error: "Missing auth" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: ures } = await userClient.auth.getUser();
    const userId = ures?.user?.id;
    if (!userId) return json({ error: "Not signed in" }, 401);

    const url = new URL(req.url);
    const jobId = url.searchParams.get("jobId");
    if (!jobId) return json({ error: "Missing jobId" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: job, error } = await admin
      .from("brain_indexing_jobs")
      .select("id, user_id, status, total_sources, total_chunks, embedded_chunks, failed_chunks, error_message, started_at, finished_at, created_at")
      .eq("id", jobId)
      .maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!job) return json({ error: "Not found" }, 404);

    // Owner or admin only.
    if (job.user_id !== userId) {
      const { data: admins } = await admin.rpc("is_admin", { _user_id: userId });
      if (!admins) return json({ error: "Forbidden" }, 403);
    }

    return json(job);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

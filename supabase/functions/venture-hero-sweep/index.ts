// Background header-art sweeper.
//
// Finds every completed asset in a venture that has no usable header image
// (never generated, failed, or stuck "generating" past the stale window) and
// produces them a few at a time via venture-document-image. Safe to call
// repeatedly — venture-document-image performs an atomic claim per asset, so
// concurrent sweeps never double-generate.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user, x-internal-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// One worker invocation only does a bounded slice of work; it re-queues itself
// for the rest so we stay inside CPU/wall limits.
const BATCH = 6;
const CONCURRENCY = 2;
const STALE_MS = 3 * 60 * 1000;

function json(body: Record<string, unknown>, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

type Candidate = { document_type: string };

async function findMissing(admin: any, snapshotId: string, force: boolean): Promise<Candidate[]> {
  const { data, error } = await admin
    .from("venture_documents")
    .select("document_type, hero_image_path, hero_image_status, hero_image_started_at")
    .eq("snapshot_id", snapshotId)
    .eq("status", "complete");
  if (error) throw new Error(error.message);

  const staleCutoff = Date.now() - STALE_MS;
  return (data ?? []).filter((d: any) => {
    if (force) return true;
    if (!d.hero_image_path) {
      if (d.hero_image_status === "generating") {
        const started = d.hero_image_started_at ? new Date(d.hero_image_started_at).getTime() : 0;
        return started < staleCutoff;
      }
      return true;
    }
    return d.hero_image_status === "failed";
  }).map((d: any) => ({ document_type: d.document_type }));
}

async function generateOne(snapshotId: string, documentType: string, force: boolean) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/venture-document-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ snapshotId, documentType, force }),
  });
  if (res.ok) {
    await res.json().catch(() => ({}));
    return { ok: true as const, status: res.status };
  }
  const text = await res.text().catch(() => "");
  return { ok: false as const, status: res.status, detail: text.slice(0, 200) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const internal = req.headers.get("x-internal-key") === SERVICE_KEY || token === SERVICE_KEY;

    const body = await req.json().catch(() => ({}));
    const snapshotId: string | undefined = body?.snapshotId;
    const force = body?.force === true;
    if (!snapshotId) return json({ error: "snapshotId required" }, { status: 400 });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    if (!internal) {
      if (!token) return json({ error: "Missing auth" }, { status: 401 });
      const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
      const { data: userRes } = await userClient.auth.getUser();
      const userId = userRes?.user?.id ?? null;
      if (!userId) return json({ error: "Not signed in" }, { status: 401 });

      const { data: snap } = await admin
        .from("venture_snapshots").select("user_id").eq("id", snapshotId).maybeSingle();
      if (!snap) return json({ error: "Snapshot not found" }, { status: 404 });
      if (snap.user_id !== userId) {
        const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userId);
        const isAdmin = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "super_admin");
        if (!isAdmin) return json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const missing = await findMissing(admin, snapshotId, force);
    if (!missing.length) return json({ ok: true, remaining: 0, generated: 0, done: true });

    const slice = missing.slice(0, BATCH);
    let generated = 0;
    let failed = 0;
    let halted: string | null = null;

    const queue = [...slice];
    const worker = async () => {
      while (queue.length && !halted) {
        const next = queue.shift()!;
        const r = await generateOne(snapshotId, next.document_type, force);
        if (r.ok) generated += 1;
        else if (r.status === 429 || r.status === 402) {
          // Rate limit / credits are terminal for this sweep — stop burning
          // attempts; the watchdog picks the venture back up later.
          halted = `Image gateway ${r.status}`;
          queue.length = 0;
        } else failed += 1;
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, slice.length) }, worker));

    const remaining = Math.max(0, missing.length - slice.length);
    const shouldContinue = remaining > 0 && !halted;

    if (shouldContinue) {
      // Re-queue the rest in a fresh worker (force is not carried forward: the
      // first pass already regenerated the forced slice).
      const nextRun = fetch(`${SUPABASE_URL}/functions/v1/venture-hero-sweep`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVICE_KEY}`,
          "x-internal-key": SERVICE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ snapshotId }),
      }).catch((e) => console.error("[venture-hero-sweep] re-queue failed", e));
      const edgeRuntime = (globalThis as any).EdgeRuntime;
      if (edgeRuntime?.waitUntil) edgeRuntime.waitUntil(nextRun);
      else await nextRun;
    }

    return json({
      ok: true,
      generated,
      failed,
      attempted: slice.length,
      remaining,
      done: !shouldContinue,
      halted,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
});

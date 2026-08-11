// Public operations runway for a shared venture.
//
// Runs signed-out: the caller proves access with the same share token (and
// optional password) used by venture-share, and all reads/writes go through the
// service role so the ops tables stay closed to anon.
//
//   POST /functions/v1/venture-ops
//     { token, password?, action: "list" | "set_status" | "set_owner" |
//       "set_due" | "set_proof" | "add_note", ... }

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { buildOpsCatalog } from "../_shared/ops-runway.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha256(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const STATUSES = new Set(["todo", "in_progress", "waiting_client", "blocked", "done"]);
const OWNERS = new Set(["client", "agency"]);

/** Create any catalog tasks this venture doesn't have yet, without touching progress. */
async function seedRunway(db: any, snapshotId: string) {
  const { data: existing } = await db
    .from("venture_ops_tasks").select("task_key").eq("snapshot_id", snapshotId);
  const have = new Set((existing ?? []).map((r: any) => r.task_key));
  const catalog = buildOpsCatalog();
  const missing = catalog
    .map((t, i) => ({ ...t, sort_order: i }))
    .filter((t) => !have.has(t.task_key))
    .map((t) => ({ ...t, snapshot_id: snapshotId }));
  if (missing.length) {
    await db.from("venture_ops_tasks").upsert(missing, { onConflict: "snapshot_id,task_key" });
  }
  await db.from("venture_ops_state")
    .upsert({ snapshot_id: snapshotId }, { onConflict: "snapshot_id", ignoreDuplicates: true });
}

async function loadRunway(db: any, snapshotId: string) {
  const [{ data: tasks }, { data: state }] = await Promise.all([
    db.from("venture_ops_tasks").select("*").eq("snapshot_id", snapshotId).order("sort_order"),
    db.from("venture_ops_state").select("*").eq("snapshot_id", snapshotId).maybeSingle(),
  ]);
  const ids = (tasks ?? []).map((t: any) => t.id);
  let notes: any[] = [];
  if (ids.length) {
    const { data } = await db.from("venture_ops_notes").select("*").in("task_id", ids).order("created_at");
    notes = data ?? [];
  }
  return { tasks: tasks ?? [], notes, state: state ?? null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const action = typeof body?.action === "string" ? body.action : "list";
    if (!token || token.length < 8 || token.length > 128) return json({ error: "Invalid link" }, 400);

    const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // Links carry either the readable slug (new) or the long token (legacy).
    let { data: share } = await db
      .from("venture_shares").select("*").ilike("slug", token).is("revoked_at", null).maybeSingle();
    if (!share) {
      ({ data: share } = await db.from("venture_shares").select("*").eq("token", token).maybeSingle());
    }
    if (!share || share.revoked_at) return json({ error: "This link is no longer available." }, 404);
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return json({ error: "This link has expired." }, 410);
    }
    if (share.password_hash) {
      if (!password) return json({ error: "Password required", code: "PASSWORD_REQUIRED" }, 401);
      if ((await sha256(password)) !== share.password_hash) return json({ error: "Incorrect password" }, 401);
    }
    const snapshotId: string = share.snapshot_id;

    if (action === "list") {
      await seedRunway(db, snapshotId);
      const payload = await loadRunway(db, snapshotId);
      return json({ ...payload, canEdit: payload.state?.client_can_edit !== false });
    }

    // Every mutation below needs a task that belongs to this share's venture.
    const taskId = typeof body?.taskId === "string" ? body.taskId : "";
    if (!taskId) return json({ error: "Missing task" }, 400);

    const { data: state } = await db
      .from("venture_ops_state").select("client_can_edit").eq("snapshot_id", snapshotId).maybeSingle();
    if (state && state.client_can_edit === false) {
      return json({ error: "This runway is read-only.", code: "READ_ONLY" }, 403);
    }

    const { data: task } = await db
      .from("venture_ops_tasks").select("id, snapshot_id").eq("id", taskId).maybeSingle();
    if (!task || task.snapshot_id !== snapshotId) return json({ error: "Task not found" }, 404);

    if (action === "set_status") {
      const status = String(body?.status ?? "");
      if (!STATUSES.has(status)) return json({ error: "Invalid status" }, 400);
      const { error } = await db.from("venture_ops_tasks").update({
        status,
        completed_at: status === "done" ? new Date().toISOString() : null,
      }).eq("id", taskId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "set_owner") {
      const ownerKind = String(body?.ownerKind ?? "");
      if (!OWNERS.has(ownerKind)) return json({ error: "Invalid owner" }, 400);
      const ownerName = typeof body?.ownerName === "string" ? body.ownerName.slice(0, 120) : null;
      const { error } = await db.from("venture_ops_tasks")
        .update({ owner_kind: ownerKind, owner_name: ownerName }).eq("id", taskId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "set_due") {
      const dueAt = body?.dueAt == null ? null : String(body.dueAt);
      if (dueAt && Number.isNaN(Date.parse(dueAt))) return json({ error: "Invalid date" }, 400);
      const { error } = await db.from("venture_ops_tasks").update({ due_at: dueAt }).eq("id", taskId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "set_proof") {
      const raw = typeof body?.proofUrl === "string" ? body.proofUrl.trim().slice(0, 2000) : "";
      if (raw && !/^https?:\/\//i.test(raw)) return json({ error: "Proof must be a link starting with http" }, 400);
      const { error } = await db.from("venture_ops_tasks")
        .update({ proof_url: raw || null }).eq("id", taskId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "add_note") {
      const text = typeof body?.body === "string" ? body.body.trim().slice(0, 4000) : "";
      if (!text) return json({ error: "Write something first." }, 400);
      const authorName = typeof body?.authorName === "string" ? body.authorName.slice(0, 120) : null;
      const { error } = await db.from("venture_ops_notes").insert({
        task_id: taskId, author_kind: "client", author_name: authorName, body: text,
      });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("venture-ops failed", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});

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
const DELIVERY_STATUSES = new Set(["not_started", "in_progress", "in_review", "delivered", "blocked"]);
const MODES = new Set(["self", "retained", "mixed"]);

/**
 * Work a first-time founder cannot do at a usable standard. Mirrors
 * src/lib/ops-investment.ts so the gate's promise and the ownership rewrite
 * agree on what "specialist" means.
 */
const SPECIALIST = [
  /entity|operating-agreement|registered-agent|incorporat/,
  /ein|tax|accountant|bookkeep/,
  /qbo|quickbooks|chart-of-accounts|reconcil/,
  /bank|stripe|payment|merchant|invoice/,
  /ghl|crm|a2p|pipeline|automation|workflow/,
  /funnel|lead-magnet|nurture|retarget|list-build|segment/,
  /site|website|landing|prd|domain|dns|hosting/,
  /brand|logo|collateral|guideline|style-system/,
  /campaign|ad-|ads|creative|content|social|calendar/,
  /contract|msa|terms|privacy|compliance|insurance|license/,
  /offer|price|pricing|proposal|script/,
];

const isSpecialist = (t: any) => {
  const slug = `${String(t.task_key ?? "").split(".").pop()} ${t.title ?? ""}`.toLowerCase();
  return SPECIALIST.some((re) => re.test(slug));
};

/**
 * Apply a delivery mode across the catalog:
 *   self     — everything sits with the founder
 *   retained — specialist work moves to the team, with a committed date
 *   mixed    — leave ownership as seeded
 */
async function applyDeliveryMode(db: any, snapshotId: string, mode: string, startedAt: string | null) {
  if (mode === "mixed") return;
  const { data: tasks } = await db
    .from("venture_ops_tasks").select("id, task_key, title, day, owner_kind").eq("snapshot_id", snapshotId);
  const start = startedAt ? new Date(startedAt) : new Date();

  for (const t of tasks ?? []) {
    if (mode === "self") {
      if (t.owner_kind !== "client") {
        await db.from("venture_ops_tasks")
          .update({ owner_kind: "client", assignee_name: null, committed_at: null }).eq("id", t.id);
      }
      continue;
    }
    // retained
    if (!isSpecialist(t)) continue;
    const due = new Date(start);
    due.setDate(due.getDate() + Math.max(0, (t.day ?? 1) - 1));
    await db.from("venture_ops_tasks")
      .update({ owner_kind: "agency", committed_at: due.toISOString() })
      .eq("id", t.id);
  }
}


/** Create any catalog tasks this venture doesn't have yet, without touching progress. */
async function seedRunway(db: any, snapshotId: string) {
  const { data: existing } = await db
    .from("venture_ops_tasks").select("task_key, sort_order, how, minutes, criticality").eq("snapshot_id", snapshotId);
  const rows = new Map<string, any>((existing ?? []).map((r: any) => [r.task_key, r]));
  const have = new Map<string, number>((existing ?? []).map((r: any) => [r.task_key, r.sort_order]));
  const catalog = buildOpsCatalog().map((t, i) => ({ ...t, sort_order: i }));
  const missing = catalog
    .filter((t) => !have.has(t.task_key))
    .map((t) => ({ ...t, snapshot_id: snapshotId }));
  if (missing.length) {
    await db.from("venture_ops_tasks").upsert(missing, { onConflict: "snapshot_id,task_key" });
  }
  // Guided-mode copy is catalog-owned: refresh it on every load so authoring
  // improvements reach existing runways. Never touches status, owner, or notes.
  const withGuides = catalog.filter((t) => {
    const row = rows.get(t.task_key);
    if (!row) return false;
    const sameHow = (row.how?.length ?? 0) === t.how.length;
    const sameMin = (row.minutes ?? null) === t.minutes;
    const sameCrit = (row.criticality ?? null) === t.criticality;
    return !(sameHow && sameMin && sameCrit);
  });
  for (const t of withGuides) {
    await db.from("venture_ops_tasks")
      .update({ how: t.how, needs: t.needs, minutes: t.minutes, criticality: t.criticality, unlocks: t.unlocks })
      .eq("snapshot_id", snapshotId).eq("task_key", t.task_key);
  }
  // When the catalog grows mid-flight, existing rows keep stale positions and the
  // day groups interleave. Re-align order only — never status, owner, or notes.
  const drifted = catalog.filter((t) => have.has(t.task_key) && have.get(t.task_key) !== t.sort_order);
  for (const t of drifted) {
    await db.from("venture_ops_tasks")
      .update({ sort_order: t.sort_order })
      .eq("snapshot_id", snapshotId).eq("task_key", t.task_key);
  }
  await db.from("venture_ops_state")
    .upsert({ snapshot_id: snapshotId }, { onConflict: "snapshot_id", ignoreDuplicates: true });
}


async function loadRunway(db: any, snapshotId: string, viewerKind: "client" | "agency") {
  const [{ data: tasks }, { data: state }, { data: rawUpdates }] = await Promise.all([
    db.from("venture_ops_tasks").select("*").eq("snapshot_id", snapshotId).order("sort_order"),
    db.from("venture_ops_state").select("*").eq("snapshot_id", snapshotId).maybeSingle(),
    db.from("venture_ops_updates").select("*").eq("snapshot_id", snapshotId).order("created_at"),
  ]);
  const ids = (tasks ?? []).map((t: any) => t.id);
  let notes: any[] = [];
  if (ids.length) {
    const { data } = await db.from("venture_ops_notes").select("*").in("task_id", ids).order("created_at");
    notes = data ?? [];
  }
  const updates = (rawUpdates ?? []).filter((u: any) => viewerKind === "agency" || u.visible_to_client);
  return { tasks: tasks ?? [], notes, updates, state: state ?? null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const action = typeof body?.action === "string" ? body.action : "list";
    const wantSnapshot = typeof body?.snapshotId === "string" ? body.snapshotId : "";

    const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    let snapshotId = "";
    /** Agency writes are attributed differently and bypass the client-edit flag. */
    let viewerKind: "client" | "agency" = "client";
    let clientCanEditFlag = true;

    if (wantSnapshot) {
      // Agency mode: the caller's JWT must own the venture or be an admin.
      const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
      if (!jwt) return json({ error: "Sign in required" }, 401);
      const { data: userRes } = await db.auth.getUser(jwt);
      const uid = userRes?.user?.id;
      if (!uid) return json({ error: "Sign in required" }, 401);
      const [{ data: snap }, { data: isAdmin }] = await Promise.all([
        db.from("venture_snapshots").select("id, user_id").eq("id", wantSnapshot).maybeSingle(),
        db.rpc("is_admin", { _user_id: uid }),
      ]);
      if (!snap) return json({ error: "Venture not found" }, 404);
      if (snap.user_id !== uid && !isAdmin) return json({ error: "Not allowed" }, 403);
      snapshotId = snap.id;
      viewerKind = "agency";
    } else {
      if (!token || token.length < 8 || token.length > 128) return json({ error: "Invalid link" }, 400);

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
      snapshotId = share.snapshot_id;
    }

    if (action === "list") {
      await seedRunway(db, snapshotId);
      const payload = await loadRunway(db, snapshotId);
      clientCanEditFlag = payload.state?.client_can_edit !== false;
      return json({
        ...payload,
        viewerKind,
        canEdit: viewerKind === "agency" ? true : clientCanEditFlag,
      });
    }

    if (action === "dismiss_intro") {
      await db.from("venture_ops_state")
        .upsert({ snapshot_id: snapshotId, intro_dismissed: true }, { onConflict: "snapshot_id" });
      return json({ ok: true });
    }

    if (action === "set_client_editing" && viewerKind === "agency") {
      const on = body?.enabled !== false;
      await db.from("venture_ops_state")
        .upsert({ snapshot_id: snapshotId, client_can_edit: on }, { onConflict: "snapshot_id" });
      return json({ ok: true });
    }

    // Every mutation below needs a task that belongs to this venture.
    const taskId = typeof body?.taskId === "string" ? body.taskId : "";
    if (!taskId) return json({ error: "Missing task" }, 400);

    if (viewerKind === "client") {
      const { data: state } = await db
        .from("venture_ops_state").select("client_can_edit").eq("snapshot_id", snapshotId).maybeSingle();
      if (state && state.client_can_edit === false) {
        return json({ error: "This runway is read-only.", code: "READ_ONLY" }, 403);
      }
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

    if (action === "snooze") {
      const days = Math.min(30, Math.max(1, Number(body?.days) || 3));
      const until = body?.until === null
        ? null
        : new Date(Date.now() + days * 86_400_000).toISOString();
      const { error } = await db.from("venture_ops_tasks")
        .update({ snoozed_until: until }).eq("id", taskId);
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
        task_id: taskId, author_kind: viewerKind, author_name: authorName, body: text,
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

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
    .from("venture_ops_tasks").select("task_key, sort_order, how, minutes, criticality, title, why, done_when").eq("snapshot_id", snapshotId);
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
    const sameCopy = row.title === t.title && row.why === t.why && row.done_when === t.done_when;
    return !(sameHow && sameMin && sameCrit && sameCopy);
  });
  for (const t of withGuides) {
    await db.from("venture_ops_tasks")
      .update({ how: t.how, needs: t.needs, minutes: t.minutes, criticality: t.criticality, unlocks: t.unlocks, title: t.title, why: t.why, done_when: t.done_when })
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


/** Tell Adam a founder wants a platform build. Best-effort — never gates the save. */
async function notifyPlatformRequest(db: any, snapshotId: string, row: Record<string, unknown>) {
  try {
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!lovableKey || !resendKey) return;
    const { data: snap } = await db
      .from("venture_snapshots").select("company_name").eq("id", snapshotId).maybeSingle();
    const venture = snap?.company_name || "Unknown venture";
    const esc = (v: unknown) =>
      String(v ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.6">
        <h2 style="margin:0 0 12px">Platform build request</h2>
        <p style="margin:0 0 16px">From the operating runway for <strong>${esc(venture)}</strong>.</p>
        <p><strong>What it does:</strong><br/>${esc(row.description)}</p>
        <p><strong>Who it's for:</strong> ${esc(row.audience)}</p>
        <p><strong>Date driving it:</strong> ${esc(row.deadline)}</p>
        <p><strong>Contact:</strong> ${esc(row.contact)}</p>
      </div>`;
    await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from: Deno.env.get("CONSULT_FROM") ?? "Startup Labs <notifications@3dayplan.com>",
        to: [Deno.env.get("CONSULT_TO") ?? "fastresults@gmail.com"],
        subject: `Platform build request — ${venture}`,
        html,
      }),
    });
  } catch (e) {
    console.error("platform request notify failed", e);
  }
}

async function loadRunway(db: any, snapshotId: string, viewerKind: "client" | "agency") {
  const [{ data: tasks }, { data: state }, { data: rawUpdates }, { data: platform }] = await Promise.all([
    db.from("venture_ops_tasks").select("*").eq("snapshot_id", snapshotId).order("sort_order"),
    db.from("venture_ops_state").select("*").eq("snapshot_id", snapshotId).maybeSingle(),
    db.from("venture_ops_updates").select("*").eq("snapshot_id", snapshotId).order("created_at"),
    db.from("venture_ops_platform_requests").select("*").eq("snapshot_id", snapshotId)
      .neq("status", "declined").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const ids = (tasks ?? []).map((t: any) => t.id);
  let notes: any[] = [];
  if (ids.length) {
    const { data } = await db.from("venture_ops_notes").select("*").in("task_id", ids).order("created_at");
    notes = data ?? [];
  }
  const updates = (rawUpdates ?? []).filter((u: any) => viewerKind === "agency" || u.visible_to_client);
  return { tasks: tasks ?? [], notes, updates, state: state ?? null, platformRequest: platform ?? null };
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
      const payload = await loadRunway(db, snapshotId, viewerKind);
      clientCanEditFlag = payload.state?.client_can_edit !== false;
      const { data: snapRow } = await db
        .from("venture_snapshots").select("company_name").eq("id", snapshotId).maybeSingle();
      return json({
        ...payload,
        ventureName: snapRow?.company_name ?? null,
        viewerKind,
        canEdit: viewerKind === "agency" ? true : clientCanEditFlag,
      });
    }

    // ------------------------------------------------- retainer engagement
    if (action === "request_engagement") {
      const name = typeof body?.name === "string" ? body.name.trim().slice(0, 100) : "";
      const email = typeof body?.email === "string" ? body.email.trim().slice(0, 255) : "";
      if (!name) return json({ error: "Add your name." }, 400);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Add a valid email." }, 400);
      const row = {
        snapshot_id: snapshotId,
        name,
        email,
        phone: typeof body?.phone === "string" ? body.phone.trim().slice(0, 32) || null : null,
        start_pref: typeof body?.startPref === "string" ? body.startPref.trim().slice(0, 120) || null : null,
        notes: typeof body?.notes === "string" ? body.notes.trim().slice(0, 2000) || null : null,
        status: "new",
      };
      const { error } = await db.from("venture_ops_engagements").insert(row);
      if (error) return json({ error: error.message }, 400);
      await db.from("venture_ops_updates").insert({
        snapshot_id: snapshotId,
        author_kind: viewerKind,
        author_name: name,
        body: "Kickoff call requested — Startup Labs to run the operating runway.",
        visible_to_client: true,
      });
      await notifyEngagementRequest(db, snapshotId, row);
      return json({ ok: true });
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

    // ------------------------------------------------------------ delivery
    if (action === "set_delivery_mode") {
      const mode = String(body?.mode ?? "");
      if (!MODES.has(mode)) return json({ error: "Pick how this gets delivered" }, 400);
      const setBy = typeof body?.setBy === "string" ? body.setBy.slice(0, 120) : viewerKind;
      const { data: state } = await db
        .from("venture_ops_state").select("runway_started_at").eq("snapshot_id", snapshotId).maybeSingle();
      await db.from("venture_ops_state").upsert({
        snapshot_id: snapshotId,
        delivery_mode: mode,
        delivery_mode_set_at: new Date().toISOString(),
        delivery_mode_set_by: setBy,
      }, { onConflict: "snapshot_id" });
      await applyDeliveryMode(db, snapshotId, mode, state?.runway_started_at ?? null);
      if (mode === "retained") {
        await db.from("venture_ops_updates").insert({
          snapshot_id: snapshotId,
          author_kind: "agency",
          author_name: "Startup Labs",
          body: "Engagement started. Every specialist step now has an owner and a committed date.",
        });
      }
      return json({ ok: true });
    }

    // ----------------------------------------------------- platform add-on
    if (action === "request_platform_build") {
      const description = typeof body?.description === "string" ? body.description.trim().slice(0, 2000) : "";
      if (description.length < 5) return json({ error: "Tell us what the platform does." }, 400);
      const row = {
        snapshot_id: snapshotId,
        description,
        audience: typeof body?.audience === "string" ? body.audience.trim().slice(0, 300) || null : null,
        deadline: typeof body?.deadline === "string" ? body.deadline.trim().slice(0, 120) || null : null,
        contact: typeof body?.contact === "string" ? body.contact.trim().slice(0, 200) || null : null,
        requested_by: viewerKind,
        status: "new",
      };
      const { data: saved, error } = await db
        .from("venture_ops_platform_requests").insert(row).select("*").maybeSingle();
      if (error) return json({ error: error.message }, 400);
      await db.from("venture_ops_updates").insert({
        snapshot_id: snapshotId,
        author_kind: viewerKind,
        body: "Platform build requested — Startup Labs will reach out to book the build call.",
        visible_to_client: true,
      });
      await notifyPlatformRequest(db, snapshotId, row);
      return json({ ok: true, platformRequest: saved ?? null });
    }

    if (action === "set_platform_request_status" && viewerKind === "agency") {
      const id = typeof body?.requestId === "string" ? body.requestId : "";
      const status = String(body?.status ?? "");
      if (!id) return json({ error: "Missing request" }, 400);
      if (!["new", "scoping", "quoted", "won", "declined"].includes(status)) {
        return json({ error: "Unknown status" }, 400);
      }
      const { error } = await db.from("venture_ops_platform_requests")
        .update({ status }).eq("id", id).eq("snapshot_id", snapshotId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "set_rate") {
      const cents = Math.max(1000, Math.min(100_000, Number(body?.rateCents) || 7500));
      await db.from("venture_ops_state")
        .upsert({ snapshot_id: snapshotId, blended_rate_cents: cents }, { onConflict: "snapshot_id" });
      return json({ ok: true });
    }

    if (action === "post_update") {
      const text = typeof body?.body === "string" ? body.body.trim().slice(0, 4000) : "";
      if (!text) return json({ error: "Write something first." }, 400);
      const forTask = typeof body?.taskId === "string" && body.taskId ? body.taskId : null;
      const { error } = await db.from("venture_ops_updates").insert({
        snapshot_id: snapshotId,
        task_id: forTask,
        author_kind: viewerKind,
        author_name: typeof body?.authorName === "string" ? body.authorName.slice(0, 120) : null,
        body: text,
        visible_to_client: viewerKind === "agency" ? body?.visibleToClient !== false : true,
      });
      if (error) return json({ error: error.message }, 400);
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

    // --------------------------------------------------- managed delivery
    if (action === "assign" && viewerKind === "agency") {
      const name = typeof body?.assigneeName === "string" ? body.assigneeName.trim().slice(0, 120) : "";
      const { error } = await db.from("venture_ops_tasks")
        .update({ assignee_name: name || null }).eq("id", taskId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "set_committed_date" && viewerKind === "agency") {
      const iso = typeof body?.committedAt === "string" ? body.committedAt : null;
      const { error } = await db.from("venture_ops_tasks")
        .update({ committed_at: iso }).eq("id", taskId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "set_delivery_status" && viewerKind === "agency") {
      const ds = String(body?.deliveryStatus ?? "");
      if (!DELIVERY_STATUSES.has(ds)) return json({ error: "Unknown delivery status" }, 400);
      const patch: Record<string, unknown> = { delivery_status: ds };
      if (ds === "delivered") {
        patch.delivered_at = new Date().toISOString();
        patch.client_review_state = "pending";
        patch.status = "done";
        patch.completed_at = new Date().toISOString();
      }
      const { error } = await db.from("venture_ops_tasks").update(patch).eq("id", taskId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "attach_work_product" && viewerKind === "agency") {
      const url = typeof body?.url === "string" ? body.url.trim() : "";
      if (url && !/^https?:\/\//i.test(url)) return json({ error: "Link must start with http" }, 400);
      const label = typeof body?.label === "string" ? body.label.trim().slice(0, 160) : "";
      const { error } = await db.from("venture_ops_tasks")
        .update({ work_product_url: url || null, work_product_label: label || null }).eq("id", taskId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "request_handoff") {
      const note = typeof body?.note === "string" ? body.note.trim().slice(0, 2000) : "";
      const { error } = await db.from("venture_ops_tasks")
        .update({ owner_kind: "agency", delivery_status: "not_started" }).eq("id", taskId);
      if (error) return json({ error: error.message }, 400);
      await db.from("venture_ops_updates").insert({
        snapshot_id: snapshotId, task_id: taskId, author_kind: viewerKind,
        body: note || "Founder asked Startup Labs to take this step.",
      });
      return json({ ok: true });
    }

    if (action === "review_work_product") {
      const review = String(body?.review ?? "");
      if (review !== "approved" && review !== "changes_requested") {
        return json({ error: "Unknown review" }, 400);
      }
      const patch: Record<string, unknown> = { client_review_state: review };
      if (review === "changes_requested") { patch.delivery_status = "in_progress"; patch.status = "in_progress"; }
      const { error } = await db.from("venture_ops_tasks").update(patch).eq("id", taskId);
      if (error) return json({ error: error.message }, 400);
      const note = typeof body?.note === "string" ? body.note.trim().slice(0, 2000) : "";
      await db.from("venture_ops_updates").insert({
        snapshot_id: snapshotId, task_id: taskId, author_kind: viewerKind,
        body: review === "approved" ? "Client approved this work." : `Changes requested: ${note || "see notes"}`,
      });
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("venture-ops failed", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});

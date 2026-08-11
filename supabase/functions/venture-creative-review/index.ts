// Creative sign-off workflow.
//
// Dual auth, same shape as venture-ops:
//   • Agency: Authorization JWT + { snapshotId }  — owns the venture or is admin.
//   • Founder/client: { token, password? } from the share link.
//
// States: draft → in_review → (approved | changes_requested) → ready_to_publish
//   agency: submit, resubmit, publish, unpublish
//   client: approve, request_changes (comment required)

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { syncCreativeReviews } from "../_shared/creative-registry.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "venture-assets";
const SIGNED_TTL = 60 * 60;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha256(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "list";
    const wantSnapshot = typeof body?.snapshotId === "string" ? body.snapshotId : "";
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    let snapshotId = "";
    let viewerKind: "client" | "agency" = "client";
    let actorName: string | null =
      typeof body?.actorName === "string" ? body.actorName.slice(0, 120) : null;

    if (wantSnapshot) {
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
      actorName = actorName ?? userRes?.user?.email ?? null;
    } else {
      if (!token || token.length < 8 || token.length > 128) return json({ error: "Invalid link" }, 400);
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
      const rows = await syncCreativeReviews(db, snapshotId);
      const ids = rows.map((r: any) => r.id);
      let events: any[] = [];
      if (ids.length) {
        const { data } = await db.from("venture_creative_review_events")
          .select("*").in("review_id", ids).order("created_at", { ascending: false });
        events = data ?? [];
      }
      const items = [];
      for (const r of rows) {
        let previewUrl: string | null = null;
        if (r.preview_path) {
          const { data } = await db.storage.from(BUCKET).createSignedUrl(r.preview_path, SIGNED_TTL);
          previewUrl = data?.signedUrl ?? null;
        }
        items.push({ ...r, previewUrl });
      }
      return json({ items, events, viewerKind });
    }

    const reviewId = typeof body?.reviewId === "string" ? body.reviewId : "";
    if (!reviewId) return json({ error: "Missing creative" }, 400);

    const { data: review } = await db
      .from("venture_creative_reviews").select("*").eq("id", reviewId).maybeSingle();
    if (!review || review.snapshot_id !== snapshotId) return json({ error: "Creative not found" }, 404);

    const comment = typeof body?.comment === "string" ? body.comment.trim().slice(0, 4000) : "";
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {};

    if (action === "submit") {
      if (viewerKind !== "agency") return json({ error: "Only the studio can submit work for review." }, 403);
      if (review.state === "ready_to_publish") return json({ error: "Already published." }, 400);
      Object.assign(patch, {
        state: "in_review", submitted_at: now, submitted_by: actorName,
        decided_at: null, decided_by: null, last_comment: comment || null,
      });
    } else if (action === "approve") {
      if (review.state !== "in_review") return json({ error: "Nothing is waiting on your review." }, 400);
      Object.assign(patch, {
        state: "approved", decided_at: now, decided_by: actorName, last_comment: comment || null,
      });
    } else if (action === "request_changes") {
      if (review.state !== "in_review") return json({ error: "Nothing is waiting on your review." }, 400);
      if (!comment) return json({ error: "Tell the studio what needs to change." }, 400);
      Object.assign(patch, {
        state: "changes_requested", decided_at: now, decided_by: actorName, last_comment: comment,
      });
    } else if (action === "publish") {
      if (viewerKind !== "agency") return json({ error: "Only the studio can publish." }, 403);
      if (review.state !== "approved") return json({ error: "Approve it first." }, 400);
      Object.assign(patch, { state: "ready_to_publish", published_at: now });
    } else if (action === "unpublish") {
      if (viewerKind !== "agency") return json({ error: "Only the studio can unpublish." }, 403);
      Object.assign(patch, { state: "approved", published_at: null });
    } else if (action === "reset") {
      if (viewerKind !== "agency") return json({ error: "Only the studio can reset." }, 403);
      Object.assign(patch, {
        state: "draft", submitted_at: null, submitted_by: null,
        decided_at: null, decided_by: null, published_at: null, last_comment: null,
      });
    } else {
      return json({ error: "Unknown action" }, 400);
    }

    const { error } = await db.from("venture_creative_reviews").update(patch).eq("id", reviewId);
    if (error) return json({ error: error.message }, 400);

    await db.from("venture_creative_review_events").insert({
      review_id: reviewId,
      from_state: review.state,
      to_state: patch.state,
      actor_kind: viewerKind,
      actor_name: actorName,
      comment: comment || null,
    });

    return json({ ok: true, state: patch.state });
  } catch (e) {
    console.error("venture-creative-review failed", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});

// Workflow deliverables — generate a 16:9 hero image with Nano Banana Pro in
// the SAME New Yorker editorial style as Founders Hub venture documents.
// Stored at {user_id}/workflow/{deliverable_key}/{version}.png in the
// venture-doc-images bucket (private, user-scoped).

import { createClient } from "npm:@supabase/supabase-js@2";
import { buildVisualPrompt, stripMarkdown } from "../_shared/hero-prompt.ts";
import { decodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const BUCKET = "venture-doc-images";

function nextPath(userId: string, deliverableKey: string, existingPath: string | null): string {
  let version = 1;
  if (existingPath) {
    const m = existingPath.match(/\/(\d+)\.png$/);
    if (m) version = parseInt(m[1], 10) + 1;
  }
  return `${userId}/workflow/${deliverableKey}/${version}.png`;
}

function contentToSnippet(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return stripMarkdown(content);
  const parts: string[] = [];
  if (content.title) parts.push(String(content.title));
  if (content.summary) parts.push(String(content.summary));
  if (Array.isArray(content.sections)) {
    for (const s of content.sections.slice(0, 4)) {
      if (s?.heading) parts.push(String(s.heading));
      if (s?.body_markdown) parts.push(String(s.body_markdown));
    }
  }
  return stripMarkdown(parts.join(" "));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const isServiceRole = token === SERVICE_KEY;

    let callerId: string | null = null;
    if (!isServiceRole) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
      const { data: userRes } = await userClient.auth.getUser();
      callerId = userRes?.user?.id ?? null;
      if (!callerId) {
        return new Response(JSON.stringify({ error: "Not signed in" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const body = await req.json().catch(() => ({}));
    const deliverableKey = body?.deliverableKey;
    const force = !!body?.force;
    const explicitUserId: string | null = body?.userId ?? null;
    if (!deliverableKey) {
      return new Response(JSON.stringify({ error: "deliverableKey required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    let ownerId = isServiceRole ? (explicitUserId ?? callerId) : callerId;
    // Admin impersonation: a signed-in admin may target another user's row.
    if (!isServiceRole && explicitUserId && explicitUserId !== callerId) {
      const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", callerId);
      const isAdmin = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "super_admin");
      if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      ownerId = explicitUserId;
    }
    if (!ownerId) {
      return new Response(JSON.stringify({ error: "userId required for service-role call" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }


    const { data: deliverable } = await admin
      .from("attendee_deliverables")
      .select("id, user_id, content_current, hero_image_path, hero_image_status, hero_image_started_at")
      .eq("user_id", ownerId)
      .eq("deliverable_key", deliverableKey)
      .maybeSingle();
    if (!deliverable) {
      return new Response(JSON.stringify({ error: "Deliverable not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (deliverable.hero_image_path && deliverable.hero_image_status === "ready" && !force) {
      return new Response(JSON.stringify({ ok: true, path: deliverable.hero_image_path, skipped: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Atomic claim: skip if another invocation is mid-flight (or stale > 3 min)
    const staleCutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    const { data: claim } = await admin
      .from("attendee_deliverables")
      .update({ hero_image_status: "generating", hero_image_started_at: new Date().toISOString(), hero_image_error: null })
      .eq("id", deliverable.id)
      .or(`hero_image_status.is.null,hero_image_status.eq.failed,hero_image_status.eq.ready,hero_image_started_at.lt.${staleCutoff}`)
      .select("id")
      .maybeSingle();
    if (!claim && !force) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "in_flight" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const previousPath = deliverable.hero_image_path;

    const { data: type } = await admin
      .from("deliverable_types")
      .select("label")
      .eq("key", deliverableKey)
      .maybeSingle();
    const docTitle = type?.label ?? deliverableKey;

    const { data: profile } = await admin
      .from("attendee_profiles")
      .select("startup_name, industry")
      .eq("user_id", ownerId)
      .maybeSingle();

    const snippet = contentToSnippet(deliverable.content_current).slice(0, 600);
    const prompt = buildVisualPrompt({
      docTitle,
      docType: deliverableKey,
      contentSnippet: snippet,
      companyName: profile?.startup_name ?? null,
      industry: profile?.industry ?? null,
    });

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      await admin.from("attendee_deliverables")
        .update({ hero_image_status: "failed", hero_image_error: `Gateway ${aiRes.status}: ${txt.slice(0, 200)}` })
        .eq("id", deliverable.id);
      return new Response(JSON.stringify({ error: `Image gateway ${aiRes.status}`, detail: txt.slice(0, 300) }), {
        status: aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const msg = aiJson?.choices?.[0]?.message;
    let b64: string | null = null;
    const images = msg?.images;
    if (Array.isArray(images) && images.length) {
      const url = images[0]?.image_url?.url ?? images[0]?.url;
      if (typeof url === "string") {
        const m = url.match(/^data:[^;]+;base64,(.+)$/);
        if (m) b64 = m[1];
      }
    }
    if (!b64 && Array.isArray(msg?.content)) {
      for (const block of msg.content) {
        const url = block?.image_url?.url;
        if (typeof url === "string") {
          const m = url.match(/^data:[^;]+;base64,(.+)$/);
          if (m) { b64 = m[1]; break; }
        }
      }
    }
    if (!b64) {
      await admin.from("attendee_deliverables")
        .update({ hero_image_status: "failed", hero_image_error: "No image returned by model" })
        .eq("id", deliverable.id);
      return new Response(JSON.stringify({ error: "No image returned by model" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const bytes = decodeBase64(b64);
    const path = nextPath(ownerId, deliverableKey, previousPath);

    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: "image/png",
      upsert: true,
    });
    if (upErr) {
      await admin.from("attendee_deliverables")
        .update({ hero_image_status: "failed", hero_image_error: `Upload: ${upErr.message}` })
        .eq("id", deliverable.id);
      return new Response(JSON.stringify({ error: `Upload failed: ${upErr.message}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await admin
      .from("attendee_deliverables")
      .update({ hero_image_path: path, hero_image_prompt: prompt, hero_image_status: "ready", hero_image_error: null })
      .eq("id", deliverable.id);

    if (previousPath && previousPath !== path) {
      await admin.storage.from(BUCKET).remove([previousPath]).catch(() => {});
    }

    return new Response(JSON.stringify({ ok: true, path }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

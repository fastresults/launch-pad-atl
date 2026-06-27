// Founders Hub — generate a 16:9 hero image for a venture document
// using google/gemini-3-pro-image (Nano Banana Pro). Images are stored
// at {user_id}/{snapshot_id}/{document_type}/{version}.png in the
// venture-doc-images bucket (private; user-scoped via storage RLS).

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const BUCKET = "venture-doc-images";

function stripMarkdown(md: string): string {
  return (md || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~\-]+/g, " ")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildVisualPrompt(opts: {
  docTitle: string;
  docType: string;
  contentSnippet: string;
  companyName?: string | null;
  industry?: string | null;
  brandTokens?: any;
}): string {
  const { docTitle, docType, contentSnippet, companyName, industry } = opts;

  return [
    `Create a 16:9 editorial illustration in the style of a New Yorker magazine cover or contents-page illustration, conceptually representing a business document titled "${docTitle}" (type: ${docType}).`,
    companyName ? `Company: ${companyName}.` : "",
    industry ? `Industry: ${industry}.` : "",
    `The image should illustrate the core ideas in this document summary using a witty, restrained business metaphor: ${contentSnippet}`,
    `Style: New Yorker magazine editorial illustration. Hand-drawn conceptual artwork with confident ink linework and flat, painterly gouache or watercolor shading. Limited muted corporate palette — cream paper background, soft navy, muted ochre, brick red, sage green. Recognizable real-world objects (briefcases, paper documents, hands, office plants, ladders, doors, paper boats, desks, coffee cups, chairs) arranged to illustrate the concept. Clean negative space, single clear focal point, slightly off-center composition. Sophisticated, understated, intelligent — looks like it belongs in a serious print magazine.`,
    `STRICT RULES: NO 3D render, NO photorealism, NO neon, NO glowing particles, NO holograms, NO robot arms, NO sci-fi imagery, NO purple/cyan glow effects, NO abstract energy fields, NO text, NO words, NO letters, NO numbers, NO logos, NO watermarks, NO UI mockups, NO data charts. 16:9 horizontal composition.`,
  ].filter(Boolean).join(" ");
}

function nextPath(userId: string, snapshotId: string, documentType: string, existingPath: string | null): string {
  // bump version if a path already exists
  let version = 1;
  if (existingPath) {
    const m = existingPath.match(/\/(\d+)\.png$/);
    if (m) version = parseInt(m[1], 10) + 1;
  }
  return `${userId}/${snapshotId}/${documentType}/${version}.png`;
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

    let userId: string | null = null;
    if (!isServiceRole) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
      const { data: userRes } = await userClient.auth.getUser();
      userId = userRes?.user?.id ?? null;
      if (!userId) {
        return new Response(JSON.stringify({ error: "Not signed in" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const { snapshotId, documentType, force, quality } = await req.json();
    if (!snapshotId || !documentType) {
      return new Response(JSON.stringify({ error: "snapshotId and documentType required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // Default to Nano Banana 2 (Flash) — ~3-5x faster than Pro with comparable
    // quality for editorial illustrations. Pass quality:"hq" to opt into Pro.
    const imageModel = quality === "hq" ? "google/gemini-3-pro-image" : "google/gemini-3.1-flash-image";

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: snap } = await admin
      .from("venture_snapshots")
      .select("id, user_id, company_name, industry, sub_industry, brand_tokens")
      .eq("id", snapshotId)
      .maybeSingle();
    if (!snap) {
      return new Response(JSON.stringify({ error: "Snapshot not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!isServiceRole && snap.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const ownerId = snap.user_id;

    const { data: doc } = await admin
      .from("venture_documents")
      .select("id, content, hero_image_path, hero_image_status, hero_image_started_at")
      .eq("snapshot_id", snapshotId)
      .eq("document_type", documentType)
      .maybeSingle();
    if (!doc) {
      return new Response(JSON.stringify({ error: "Document not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (doc.hero_image_path && doc.hero_image_status === "ready" && !force) {
      return new Response(JSON.stringify({ ok: true, path: doc.hero_image_path, skipped: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Atomic claim: only run if not already generating (or stale > 3 min).
    const staleCutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    const { data: claim } = await admin
      .from("venture_documents")
      .update({ hero_image_status: "generating", hero_image_started_at: new Date().toISOString(), hero_image_error: null })
      .eq("id", doc.id)
      .or(`hero_image_status.is.null,hero_image_status.eq.failed,hero_image_status.eq.ready,hero_image_started_at.lt.${staleCutoff}`)
      .select("id")
      .maybeSingle();
    if (!claim && !force) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "in_flight" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const previousPath = doc.hero_image_path;

    const { data: typeRow } = await admin
      .from("venture_document_types")
      .select("name")
      .eq("type", documentType)
      .maybeSingle();
    const docTitle = typeRow?.name ?? documentType;

    const snippet = stripMarkdown(doc.content ?? "").slice(0, 600);
    const prompt = buildVisualPrompt({
      docTitle,
      docType: documentType,
      contentSnippet: snippet,
      companyName: snap.company_name,
      industry: snap.industry,
      brandTokens: snap.brand_tokens,
    });

    // Call Lovable AI Gateway — image model via chat-completions image shape.
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: imageModel,
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      await admin.from("venture_documents")
        .update({ hero_image_status: "failed", hero_image_error: `Gateway ${aiRes.status}: ${txt.slice(0, 200)}` })
        .eq("id", doc.id);
      await admin.from("venture_generation_failures").insert({
        snapshot_id: snapshotId,
        document_type: documentType,
        error: `Image gateway ${aiRes.status}: ${txt.slice(0, 300)}`,
      });
      return new Response(JSON.stringify({ error: `Image gateway ${aiRes.status}`, detail: txt.slice(0, 300) }), {
        status: aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    // OpenRouter image responses surface images on message.images[].image_url.url as data URLs.
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
    // Fallback: some providers return content blocks
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
      await admin.from("venture_documents")
        .update({ hero_image_status: "failed", hero_image_error: "No image returned by model" })
        .eq("id", doc.id);
      await admin.from("venture_generation_failures").insert({
        snapshot_id: snapshotId,
        document_type: documentType,
        error: `Image gateway returned no image payload: ${JSON.stringify(aiJson).slice(0, 300)}`,
      });
      return new Response(JSON.stringify({ error: "No image returned by model" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = nextPath(ownerId, snapshotId, documentType, previousPath);

    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: "image/png",
      upsert: true,
    });
    if (upErr) {
      await admin.from("venture_documents")
        .update({ hero_image_status: "failed", hero_image_error: `Upload: ${upErr.message}` })
        .eq("id", doc.id);
      return new Response(JSON.stringify({ error: `Upload failed: ${upErr.message}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await admin
      .from("venture_documents")
      .update({ hero_image_path: path, hero_image_prompt: prompt, hero_image_status: "ready", hero_image_error: null })
      .eq("id", doc.id);

    // Best-effort: delete the previous version to avoid orphaned files
    if (previousPath && previousPath !== path) {
      await admin.storage.from(BUCKET).remove([previousPath]).catch(() => {});
    }

    return new Response(JSON.stringify({ ok: true, path }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// Founders Hub — generate a 16:9 hero image for a venture document
// using google/gemini-3-pro-image (Nano Banana Pro). Images are stored
// at {user_id}/{snapshot_id}/{document_type}/{version}.png in the
// venture-doc-images bucket (private; user-scoped via storage RLS).

import { createClient } from "npm:@supabase/supabase-js@2";
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

function json(body: Record<string, unknown>, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

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

async function signPath(admin: any, path: string | null, expiresIn = 3600): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data?.signedUrl ?? data?.signedURL ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token) {
      return json({ error: "Missing auth" }, { status: 401 });
    }
    const isServiceRole = token === SERVICE_KEY;

    let userId: string | null = null;
    if (!isServiceRole) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
      const { data: userRes } = await userClient.auth.getUser();
      userId = userRes?.user?.id ?? null;
      if (!userId) {
        return json({ error: "Not signed in" }, { status: 401 });
      }
    }

    const { snapshotId, documentType, force, quality } = await req.json();
    if (!snapshotId || !documentType) {
      return json({ error: "snapshotId and documentType required" }, { status: 400 });
    }
    // Header art is the first thing a founder sees on a deliverable, so it runs
    // on the Pro image model by default. Pass quality:"fast" to opt into Nano
    // Banana 2 (Flash) when speed matters more than fidelity.
    const imageModel = quality === "fast" ? "google/gemini-3.1-flash-image" : "google/gemini-3-pro-image";

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    let callerIsAdmin = isServiceRole;
    if (!isServiceRole && userId) {
      const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userId);
      callerIsAdmin = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "super_admin");
    }

    const { data: snap } = await admin
      .from("venture_snapshots")
      .select("id, user_id, company_name, industry, sub_industry, brand_tokens")
      .eq("id", snapshotId)
      .maybeSingle();
    if (!snap) {
      return json({ error: "Snapshot not found" }, { status: 404 });
    }
    if (!isServiceRole && snap.user_id !== userId && !callerIsAdmin) {
      return json({ error: "Forbidden" }, { status: 403 });
    }
    const ownerId = snap.user_id;

    const { data: doc } = await admin
      .from("venture_documents")
      .select("id, content, hero_image_path, hero_image_status, hero_image_started_at")
      .eq("snapshot_id", snapshotId)
      .eq("document_type", documentType)
      .maybeSingle();
    if (!doc) {
      return json({ error: "Document not found" }, { status: 404 });
    }
    if (doc.hero_image_path && !force && doc.hero_image_status !== "generating" && doc.hero_image_status !== "failed") {
      const signedUrl = await signPath(admin, doc.hero_image_path);
      return json({ ok: true, path: doc.hero_image_path, signedUrl, status: "ready", skipped: true, reason: "already_ready" });
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
    if (!claim) {
      const { data: current } = await admin
        .from("venture_documents")
        .select("hero_image_path, hero_image_status")
        .eq("id", doc.id)
        .maybeSingle();
      const currentPath = current?.hero_image_path ?? doc.hero_image_path ?? null;
      const currentStatus = current?.hero_image_status ?? doc.hero_image_status ?? "generating";
      const signedUrl = currentStatus === "ready" ? await signPath(admin, currentPath) : null;
      return json({
        ok: true,
        skipped: true,
        reason: currentStatus === "ready" ? "already_ready" : "in_flight",
        path: currentPath,
        signedUrl,
        status: currentStatus,
      });
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

    /** Reads width/height out of a PNG IHDR chunk (returns null for non-PNG). */
    const pngSize = (b: Uint8Array): { w: number; h: number } | null => {
      if (b.length < 24 || b[0] !== 0x89 || b[1] !== 0x50) return null;
      const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
      return { w: dv.getUint32(16), h: dv.getUint32(20) };
    };

    /**
     * Header art is only useful when it is a real, wide, non-blank picture.
     * Anything else gets one more attempt rather than being published.
     */
    const qc = (b: Uint8Array): string | null => {
      if (b.length < 15_000) return "image is too small / likely blank";
      const dim = pngSize(b);
      if (dim) {
        if (dim.w < 640) return `image too low-res (${dim.w}px wide)`;
        const ratio = dim.w / Math.max(1, dim.h);
        if (ratio < 1.3 || ratio > 2.4) return `wrong aspect ratio (${ratio.toFixed(2)}:1)`;
      }
      return null;
    };

    const extractB64 = (aiJson: any): string | null => {
      const msg = aiJson?.choices?.[0]?.message;
      const fromUrl = (url: unknown) => {
        if (typeof url !== "string") return null;
        const m = url.match(/^data:[^;]+;base64,(.+)$/);
        return m ? m[1] : null;
      };
      const images = msg?.images;
      if (Array.isArray(images)) {
        for (const im of images) {
          const b = fromUrl(im?.image_url?.url ?? im?.url);
          if (b) return b;
        }
      }
      if (Array.isArray(msg?.content)) {
        for (const block of msg.content) {
          const b = fromUrl(block?.image_url?.url);
          if (b) return b;
        }
      }
      return null;
    };

    const MAX_ATTEMPTS = 3;
    let bytes: Uint8Array | null = null;
    let lastError = "No image returned by model";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS && !bytes; attempt++) {
      const attemptPrompt =
        attempt === 1
          ? prompt
          : `${prompt}\n\nRETRY NOTE (previous attempt rejected: ${lastError}). Return a single full-bleed 16:9 landscape photographic/illustrative image at 1536x864 or larger. No blank canvas, no letterboxing, no text, no logos, no watermark.`;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: imageModel,
          messages: [{ role: "user", content: attemptPrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!aiRes.ok) {
        const txt = await aiRes.text();
        // Rate limit / credits are terminal for this run — surface them immediately.
        if (aiRes.status === 429 || aiRes.status === 402) {
          await admin.from("venture_documents")
            .update({ hero_image_status: "failed", hero_image_error: `Gateway ${aiRes.status}` })
            .eq("id", doc.id);
          return json({ error: `Image gateway ${aiRes.status}`, detail: txt.slice(0, 300) }, { status: aiRes.status });
        }
        lastError = `gateway ${aiRes.status}: ${txt.slice(0, 120)}`;
        continue;
      }

      const aiJson = await aiRes.json();
      const b64 = extractB64(aiJson);
      if (!b64) {
        lastError = "model returned no image payload";
        continue;
      }

      const candidate = decodeBase64(b64);
      const problem = qc(candidate);
      if (problem) {
        lastError = problem;
        console.warn(`[venture-document-image] QC reject (attempt ${attempt}) ${documentType}: ${problem}`);
        continue;
      }
      bytes = candidate;
    }

    if (!bytes) {
      await admin.from("venture_documents")
        .update({ hero_image_status: "failed", hero_image_error: lastError.slice(0, 200) })
        .eq("id", doc.id);
      await admin.from("venture_generation_failures").insert({
        snapshot_id: snapshotId,
        document_type: documentType,
        error: `Header art failed after ${MAX_ATTEMPTS} attempts: ${lastError}`.slice(0, 300),
      });
      return json({ error: "Header art failed quality checks", detail: lastError }, { status: 502 });
    }


    const path = nextPath(ownerId, snapshotId, documentType, previousPath);

    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: "image/png",
      upsert: true,
      cacheControl: "31536000",
    });
    if (upErr) {
      await admin.from("venture_documents")
        .update({ hero_image_status: "failed", hero_image_error: `Upload: ${upErr.message}` })
        .eq("id", doc.id);
      return json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });
    }

    await admin
      .from("venture_documents")
      .update({ hero_image_path: path, hero_image_prompt: prompt, hero_image_status: "ready", hero_image_error: null })
      .eq("id", doc.id);

    // Best-effort: delete the previous version to avoid orphaned files
    if (previousPath && previousPath !== path) {
      await admin.storage.from(BUCKET).remove([previousPath]).catch(() => {});
    }

    const signedUrl = await signPath(admin, path);
    return json({ ok: true, path, signedUrl, status: "ready" });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return json({ error: message }, { status: 500 });
  }
});

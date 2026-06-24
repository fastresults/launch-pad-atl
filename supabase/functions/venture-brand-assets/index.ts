// Founders Hub — brand asset generator.
// Generates logo / social profile / cover / launch-post images via Lovable AI
// image gateway, using the venture's visual_identity_brief + brand_tokens.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const KIND_PRESETS: Record<string, { size: string; sceneHint: string; defaultCount: number }> = {
  logo:          { size: "1024x1024", sceneHint: "minimalist vector logo, centered on a solid neutral background, crisp edges, no text unless brand specifies, high contrast", defaultCount: 4 },
  social_profile:{ size: "1024x1024", sceneHint: "social media profile avatar, square 1:1, centered subject, simple background", defaultCount: 1 },
  social_cover:  { size: "1536x1024", sceneHint: "social media cover banner, wide composition, leave space for an overlaid headline on the right third", defaultCount: 1 },
  launch_post:   { size: "1024x1024", sceneHint: "launch announcement social post, modern editorial layout, bold composition", defaultCount: 1 },
};

function buildPrompt(kind: string, snap: any, tokens: any, extra?: string) {
  const preset = KIND_PRESETS[kind];
  const palette = tokens?.colors
    ? `Color palette: primary ${tokens.colors.primary ?? "#000"}, secondary ${tokens.colors.secondary ?? ""}, accent ${tokens.colors.accent ?? ""}.`
    : "";
  const mood = Array.isArray(tokens?.mood) ? `Mood: ${tokens.mood.join(", ")}.` : "";
  const fonts = tokens?.fonts ? `Typography reference: ${tokens.fonts.heading ?? ""} / ${tokens.fonts.body ?? ""}.` : "";
  const industry = snap.industry ? `Industry: ${snap.industry}.` : "";
  const company = snap.company_name ? `Brand: ${snap.company_name}.` : "";
  return [
    preset.sceneHint,
    company,
    industry,
    palette,
    mood,
    fonts,
    extra ?? "",
    "Avoid: stock photo clichés, watermarks, generic AI flourishes.",
  ].filter(Boolean).join(" ");
}

async function generateOne(prompt: string, size: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
      size,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Image gateway ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image data returned");
  return b64; // base64 PNG
}

async function uploadAsset(supabase: any, snapshotId: string, userId: string, kind: string, b64: string, prompt: string) {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const path = `${userId}/brand/${snapshotId}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.png`;
  const { error: upErr } = await supabase.storage.from("user-media").upload(path, bytes, {
    contentType: "image/png",
    upsert: false,
  });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
  const { data: signed } = await supabase.storage.from("user-media").createSignedUrl(path, 60 * 60 * 24 * 7);
  // Best-effort media_assets row (table may have different columns; ignore failure)
  try {
    await supabase.from("media_assets").insert({
      user_id: userId,
      storage_path: path,
      bucket: "user-media",
      kind: "image",
      mime_type: "image/png",
      tags: ["brand_kit", `snapshot:${snapshotId}`, kind],
      title: `${kind} — ${new Date().toLocaleDateString()}`,
      description: prompt.slice(0, 240),
    });
  } catch { /* table shape mismatch is non-fatal */ }
  return { path, url: signed?.signedUrl };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    const body = await req.json();
    const { snapshotId, kind = "logo", count, extra } = body ?? {};
    if (!snapshotId) throw new Error("snapshotId required");
    const preset = KIND_PRESETS[kind];
    if (!preset) throw new Error(`Unknown kind: ${kind}`);

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const userId = userRes?.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: snap } = await supabase.from("venture_snapshots").select("*").eq("id", snapshotId).maybeSingle();
    if (!snap) return new Response(JSON.stringify({ error: "Snapshot not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (snap.user_id !== userId) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const tokens = snap.brand_tokens ?? null;
    const prompt = buildPrompt(kind, snap, tokens, extra);
    const n = Math.max(1, Math.min(4, count ?? preset.defaultCount));

    // Concurrency 2 — image gen is heavy.
    const results: any[] = [];
    let i = 0;
    async function worker() {
      while (i < n) {
        const myIdx = i++;
        try {
          const b64 = await generateOne(prompt, preset.size);
          const up = await uploadAsset(supabase, snapshotId, userId, kind, b64, prompt);
          results[myIdx] = { ok: true, ...up };
        } catch (e) {
          results[myIdx] = { ok: false, error: e instanceof Error ? e.message : String(e) };
        }
      }
    }
    await Promise.all([worker(), worker()]);

    return new Response(JSON.stringify({ ok: true, kind, prompt, assets: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

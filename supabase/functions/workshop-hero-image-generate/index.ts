import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { scenePrompt } from "../_shared/hero-scene-prompt.ts";

/** Ten years — the bucket is private, so the public hero reads a signed link. */
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;

const DEFAULT_MODEL = "google/gemini-3-pro-image";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!apiKey) return json({ error: "Missing LOVABLE_API_KEY" }, 500);

    // ---- auth: admins only -------------------------------------------------
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const supaUser = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userRes } = await supaUser.auth.getUser();
    const userId = userRes?.user?.id;
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdminRes, error: adminErr } = await admin.rpc("is_admin", { _user_id: userId });
    if (adminErr || !isAdminRes) return json({ error: "Admins only" }, 403);

    // ---- input -------------------------------------------------------------
    const body = await req.json().catch(() => ({}));
    const workshopSlug: string = body.workshopSlug;
    const painId: string = body.painId;
    const subject: string = (body.subject ?? "").trim();
    const screens: boolean = Boolean(body.screens);
    const model: string = body.model || DEFAULT_MODEL;
    if (!workshopSlug || !painId || !subject) {
      return json({ error: "Missing workshopSlug/painId/subject" }, 400);
    }

    // The prompt is composed server-side from the same recipe the shipped set
    // used, so an operator only ever edits the subject line.
    const prompt = scenePrompt(subject, { screens });

    // ---- generate ----------------------------------------------------------
    const upstreamBody = model.startsWith("google/")
      ? { model, messages: [{ role: "user", content: prompt }], modalities: ["image", "text"] }
      : { model, prompt, size: "1536x1024", quality: "high", n: 1 };

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(upstreamBody),
    });
    if (!upstream.ok) {
      const text = await upstream.text();
      const status = upstream.status;
      const message =
        status === 429
          ? "Rate limited by the image model. Wait a moment and try again."
          : status === 402
            ? "AI credits exhausted. Add credits in workspace settings."
            : `Image model error ${status}: ${text.slice(0, 400)}`;
      return json({ error: message }, status);
    }
    const payload = await upstream.json();
    const b64: string | undefined = payload?.data?.[0]?.b64_json;
    if (!b64) return json({ error: "No image returned by the model" }, 502);

    // ---- store -------------------------------------------------------------
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = `${workshopSlug}/${painId}/${Date.now()}.png`;
    const { error: upErr } = await admin.storage
      .from("workshop-hero-images")
      .upload(path, bytes, { contentType: "image/png", upsert: true, cacheControl: "31536000" });
    if (upErr) return json({ error: `Upload failed: ${upErr.message}` }, 500);

    const { data: signed, error: signErr } = await admin.storage
      .from("workshop-hero-images")
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (signErr) return json({ error: `Signing failed: ${signErr.message}` }, 500);

    const { data: row, error: insErr } = await admin
      .from("workshop_hero_images")
      .insert({
        workshop_slug: workshopSlug,
        pain_id: painId,
        storage_path: path,
        image_url: signed.signedUrl,
        prompt,
        subject,
        screens,
        model,
        source: "generated",
        status: "draft",
        created_by: userId,
      })
      .select()
      .single();
    if (insErr) return json({ error: `Save failed: ${insErr.message}` }, 500);

    return json({ image: row });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

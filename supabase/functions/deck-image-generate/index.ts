import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { decodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth + admin check
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const supaUser = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userRes } = await supaUser.auth.getUser();
    const userId = userRes?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdminRes, error: adminErr } = await admin.rpc("is_admin", { _user_id: userId });
    if (adminErr || !isAdminRes) {
      return new Response(JSON.stringify({ error: "Admins only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const prompt: string = body.prompt;
    const deckSlug: string = body.deckSlug;
    const slideId: string = body.slideId;
    const field: string = body.field;
    const model: string = body.model || "google/gemini-3.1-flash-image";
    if (!prompt || !deckSlug || !slideId || !field) {
      return new Response(JSON.stringify({ error: "Missing prompt/deckSlug/slideId/field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build per-model request body
    let upstreamBody: Record<string, unknown>;
    if (model.startsWith("google/")) {
      upstreamBody = {
        model,
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      };
    } else {
      upstreamBody = {
        model,
        prompt,
        size: "1024x1024",
        quality: "low",
        n: 1,
      };
    }

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(upstreamBody),
    });
    if (!upstream.ok) {
      const text = await upstream.text();
      return new Response(
        JSON.stringify({ error: `AI Gateway error: ${upstream.status} ${text.slice(0, 500)}` }),
        { status: upstream.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const payload = await upstream.json();
    const b64: string | undefined = payload?.data?.[0]?.b64_json;
    if (!b64) {
      return new Response(JSON.stringify({ error: "No image returned by model" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bytes = decodeBase64(b64);
    const path = `${deckSlug}/${slideId}/${field}-${Date.now()}.png`;
    const { error: upErr } = await admin.storage
      .from("deck-images")
      .upload(path, bytes, { contentType: "image/png", upsert: true, cacheControl: "31536000" });
    if (upErr) {
      return new Response(JSON.stringify({ error: `Upload failed: ${upErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: signed, error: signErr } = await admin.storage
      .from("deck-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signErr) {
      return new Response(JSON.stringify({ error: `Signing failed: ${signErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: signed.signedUrl, path }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

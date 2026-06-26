import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
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
    const { data: isAdminRes } = await admin.rpc("is_admin", { _user_id: userId });
    if (!isAdminRes) {
      return new Response(JSON.stringify({ error: "Admins only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const currentText: string = body.currentText ?? "";
    const tone: string = body.tone ?? "Sharper";
    const instruction: string = body.instruction ?? "";

    const system = [
      "You rewrite copy for facilitator-led startup workshop slides.",
      "Output ONLY a JSON array of 3 strings. No prose, no markdown, no keys.",
      "Each variant must preserve meaning. Keep it punchy and projector-readable.",
    ].join(" ");

    const userPrompt = [
      `Current text:\n"""${currentText}"""`,
      `Tone preset: ${tone}`,
      instruction ? `Additional instruction: ${instruction}` : "",
      "Return: [\"variant1\", \"variant2\", \"variant3\"]",
    ]
      .filter(Boolean)
      .join("\n\n");

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!upstream.ok) {
      const text = await upstream.text();
      return new Response(
        JSON.stringify({ error: `AI Gateway error: ${upstream.status} ${text.slice(0, 500)}` }),
        { status: upstream.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const payload = await upstream.json();
    const content: string = payload?.choices?.[0]?.message?.content ?? "[]";
    let variants: string[] = [];
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) variants = parsed.filter((v) => typeof v === "string");
      else if (Array.isArray(parsed?.variants))
        variants = parsed.variants.filter((v: unknown) => typeof v === "string");
    } catch {
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          const arr = JSON.parse(match[0]);
          if (Array.isArray(arr)) variants = arr.filter((v) => typeof v === "string");
        } catch {
          /* ignore */
        }
      }
    }

    return new Response(JSON.stringify({ variants: variants.slice(0, 3) }), {
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

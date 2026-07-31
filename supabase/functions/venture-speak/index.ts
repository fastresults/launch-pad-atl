// Proxies text to Lovable AI Gateway text-to-speech and returns MP3 bytes.
// Buffered (non-streaming) so the client can play it with a simple <audio>
// element via supabase.functions.invoke.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

// Cap the input we synth per request. The concierge answers are short; keep
// generous headroom but hard-limit to avoid runaway TTS bills.
const MAX_CHARS = 3000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const raw = typeof body?.text === "string" ? body.text : "";
    const voice = typeof body?.voice === "string" && body.voice ? body.voice : "alloy";
    const text = raw.trim().slice(0, MAX_CHARS);

    if (!text) {
      return json({ error: "Missing text" }, 400);
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input: text,
        voice,
        response_format: "mp3",
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return json({ error: `TTS failed (${res.status})`, detail: txt.slice(0, 300) }, res.status);
    }

    const audio = await res.arrayBuffer();
    return new Response(audio, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return json({ error: message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Proxies an audio blob to Lovable AI Gateway speech-to-text and returns the
// final transcript as JSON. Buffers the upstream SSE so we can use
// supabase.functions.invoke from the client (which is multipart-friendly).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const inForm = await req.formData();
    const file = inForm.get("file");
    if (!(file instanceof File) || file.size < 1024) {
      return new Response(
        JSON.stringify({ error: "Recording is empty or too short — please try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (file.size > 24 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Recording is too large (max 24 MB)." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const mime = (file.type || "audio/webm").split(";")[0];
    const extMap: Record<string, string> = {
      "audio/webm": "webm",
      "audio/mp4": "mp4",
      "audio/mpeg": "mp3",
      "audio/mp3": "mp3",
      "audio/wav": "wav",
      "audio/x-wav": "wav",
      "audio/ogg": "ogg",
      "audio/m4a": "m4a",
    };
    const ext = extMap[mime] ?? "webm";

    const upstream = new FormData();
    upstream.append("model", "openai/gpt-4o-mini-transcribe");
    upstream.append("file", file, `recording.${ext}`);
    // Buffered JSON response — no streaming.

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: upstream,
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return new Response(
        JSON.stringify({ error: `Transcription failed (${res.status}): ${txt.slice(0, 200)}` }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const json = await res.json();
    const text: string = json?.text ?? "";
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

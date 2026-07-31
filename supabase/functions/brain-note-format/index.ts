// Turns a chat answer (or arbitrary text) into a saved-note shape:
// { title: <=7 words summarizing the note, bullets: string[] key points }.
// Client stores as "**Title**\n\n- b1\n- b2..." so the Notes list shows a
// scannable title + bullet list instead of a raw paragraph.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function clean(s: unknown): string {
  return typeof s === "string" ? s.trim() : "";
}

function trimTitle(t: string): string {
  const words = t.replace(/[#*_`>\-]/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  return words.slice(0, 7).join(" ");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const content = clean(body?.content).slice(0, 8000);
    const question = clean(body?.question).slice(0, 500);
    if (!content) {
      return new Response(JSON.stringify({ error: "Missing content" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = `You compress a founder's saved answer into a scannable note.

Rules:
- "title": a concise, specific summary of the note, MAX 7 words. Title Case. No trailing punctuation. No quotes. No emojis.
- "bullets": 3–6 short bullets (each ≤ 18 words) capturing the concrete points, in the original order. No numbering, no leading dash — the caller adds it. Preserve names, numbers, and specifics. No fluff, no restating the question.
- Output ONLY valid JSON: {"title": "...", "bullets": ["...", "..."]}.`;

    const user = `${question ? `Question that prompted the answer:\n${question}\n\n` : ""}Answer to summarize into a note:\n\n${content}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text().catch(() => "");
      return new Response(JSON.stringify({ error: `Gateway ${aiRes.status}: ${txt.slice(0, 200)}` }), {
        status: aiRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiRes.json();
    const raw = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { title?: string; bullets?: string[] } = {};
    try { parsed = JSON.parse(raw); } catch { /* ignore */ }

    const title = trimTitle(clean(parsed.title) || "Saved Note");
    const bullets = Array.isArray(parsed.bullets)
      ? parsed.bullets.map((b) => clean(b)).filter(Boolean).slice(0, 6)
      : [];

    return new Response(JSON.stringify({ title, bullets }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

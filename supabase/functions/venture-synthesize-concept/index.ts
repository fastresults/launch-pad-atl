// Synthesizes a clean Business concept paragraph from text extracted client-side
// out of one or more founder-uploaded documents (PDF, TXT, MD). Pure synthesis —
// no DB writes.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const PER_FILE_CAP = 20_000;
const TOTAL_CAP = 60_000;

const SYSTEM_PROMPT = `You read founder-uploaded source documents (pitch decks, one-pagers, brand briefs, notes) and write a clean Business concept paragraph.

Rules:
- 2 to 4 sentences. No headings, no bullets, no preamble like "Here is".
- First-person plural ("We…").
- Cover: what we're building, who it's for, and why now (or what's broken today).
- Be specific and grounded in the source material. Never invent metrics, dates, or names that aren't in the sources.
- Plain, confident voice. No buzzwords ("synergy", "revolutionary", "cutting-edge").
- Output only the paragraph, nothing else.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const sources: Array<{ filename?: string; text?: string }> = Array.isArray(body?.sources) ? body.sources : [];
    if (!sources.length) {
      return new Response(JSON.stringify({ error: "No sources provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let used = 0;
    const parts: string[] = [];
    for (const s of sources) {
      const text = (s?.text ?? "").trim();
      if (!text) continue;
      const name = (s?.filename ?? "untitled").slice(0, 200);
      const remaining = TOTAL_CAP - used;
      if (remaining <= 0) break;
      const slice = text.slice(0, Math.min(PER_FILE_CAP, remaining));
      used += slice.length;
      parts.push(`## ${name}\n${slice}`);
    }

    if (!parts.length) {
      return new Response(JSON.stringify({ error: "Sources were empty after extraction" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Source documents:\n\n${parts.join("\n\n---\n\n")}\n\nWrite the Business concept paragraph now.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      const status = aiRes.status === 402 || aiRes.status === 429 ? aiRes.status : 502;
      return new Response(JSON.stringify({ error: `Gateway ${aiRes.status}: ${txt.slice(0, 200)}` }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const concept = (aiJson?.choices?.[0]?.message?.content ?? "").trim();
    if (!concept) {
      return new Response(JSON.stringify({ error: "Empty response from model" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ concept }), {
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

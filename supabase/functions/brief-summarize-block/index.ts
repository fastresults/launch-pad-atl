// Reflect the founder's own brief answers back to them as a short, warm recap
// plus 3 quick bullets. Used by the wizard checkpoint screens.
//
// Input: { title: string, kind: "qa"|"founder"|"market", answers: Array<{label,value}> }
// Output: { summary: string, bullets: string[] }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

type Answer = { label: string; value: string };

function clean(s: unknown): string {
  return typeof s === "string" ? s.trim() : "";
}

function answersBlock(answers: Answer[]): string {
  return answers
    .filter((a) => clean(a.value).length > 0)
    .map((a) => `Q: ${a.label}\nA: ${clean(a.value)}`)
    .join("\n\n");
}

function gatewayMessage(status: number, detail: string): string {
  const n = detail.toLowerCase();
  if (status === 429) return "We're being rate-limited. Try again in a moment.";
  if (status === 402 || n.includes("credit")) return "Workspace AI credits are exhausted.";
  if (status === 401 || status === 403) return "AI Gateway rejected the request.";
  return "Couldn't generate a recap right now.";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const title = clean(body?.title) || "Your answers";
    const kind = body?.kind === "founder" || body?.kind === "market" ? body.kind : "qa";
    const answers = Array.isArray(body?.answers) ? (body.answers as Answer[]) : [];
    const filled = answers.filter((a) => clean(a?.value).length > 0);

    if (filled.length === 0) {
      return new Response(
        JSON.stringify({ summary: "We don't have enough yet to play back. Add a few answers and we'll recap.", bullets: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const system = `You are a warm, sharp startup coach reflecting a founder's own words back to them at a checkpoint in their startup brief. Your job is reassurance + clarity, not new advice.

Rules:
- Write in second person ("you", "your").
- 2–3 sentence summary that synthesizes what they told you. Use their concrete words/details — no generic startup-speak.
- Then exactly 3 short bullets, each ≤14 words, in this order:
  1. "What's clear" — the strongest signal in their answers.
  2. "What to watch" — the one tension/gap worth keeping in view (gentle, not scolding).
  3. "Where you're headed" — the next step or direction implied by what they wrote.
- No invented facts. Only reflect what's in the answers below.
- No headings, no markdown, no preamble. Output ONLY valid JSON.`;

    const user = `Checkpoint: ${title} (block kind: ${kind})\n\nFounder's answers:\n\n${answersBlock(filled)}\n\nReturn JSON:\n{"summary": "...", "bullets": ["...", "...", "..."]}`;

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
      const txt = await aiRes.text();
      return new Response(
        JSON.stringify({ error: gatewayMessage(aiRes.status, txt) }),
        { status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const json = await aiRes.json();
    const raw = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { summary?: string; bullets?: string[] } = {};
    try { parsed = JSON.parse(raw); } catch { /* fall through */ }

    const summary = clean(parsed.summary);
    const bullets = Array.isArray(parsed.bullets)
      ? parsed.bullets.map((b) => clean(b)).filter(Boolean).slice(0, 3)
      : [];

    return new Response(
      JSON.stringify({ summary, bullets }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

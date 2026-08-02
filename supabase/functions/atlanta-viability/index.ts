// Public "Atlanta viability snapshot" routine for the homepage hero.
// Takes a founder's one-line startup idea and returns a short, grounded profile
// of why that startup can work in metro Atlanta. No auth, no PII persisted.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { aiFetch } from "../_shared/ai-fetch.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SYSTEM = `You are a plainspoken startup analyst for Startup Labs, an Atlanta done-with-you startup workshop. A visitor types the startup they want to start. You write a short, honest, confidence-building profile of that startup in metro Atlanta.

RULES
- Ground everything in durable, general characteristics of metro Atlanta: population growth, suburban sprawl and drive times, film/logistics/healthcare/tech employment, dense small-business and franchise activity, large commuter base, wide income spread across ITP/OTP counties (Fulton, DeKalb, Gwinnett, Cobb, Cherokee, Forsyth, Clayton, Henry).
- NEVER invent citations, studies, sources, or precise statistics. Express numbers as ranges or directional signals ("typically $X–$Y", "most start solo and add a second van"). Never state a number as if sourced.
- Never promise income, guarantee outcomes, or give legal, tax, medical, or financial advice. Point permit/licensing items to "confirm with the county" instead of asserting rules.
- Say "startup", never "business". Say "assets", never "documents". Never call the offer a plan, blueprint, framework, playbook, or roadmap.
- Tone: founder-to-founder, warm, concrete, no hype, no emojis, no jargon.
- If the input is not a plausible startup idea (gibberish, a joke, off-topic, or hostile), return {"ok": false, "message": "<one friendly sentence asking them to describe the startup they want to start>"}.

OUTPUT
Return ONLY valid JSON, no markdown fences:
{
  "ok": true,
  "idea_label": string,        // 2-5 words, title case, e.g. "Mobile Pet Grooming"
  "verdict": string,           // one sentence, e.g. "Mobile pet grooming works in Atlanta — here's why."
  "why_atlanta": string[],     // 2-3 short paragraphs, each 2-3 sentences, Atlanta-specific
  "signals": [                 // exactly 4
    { "label": string,         // e.g. "Market signal", "Who buys", "Starting price", "First 90 days"
      "value": string,         // short, punchy, <= 60 chars
      "note": string }         // one sentence of plain context
  ],
  "first_moves": string[],     // 3-5 concrete first actions
  "watch_outs": string[]       // 2-3 honest risks
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) return json({ error: "Missing LOVABLE_API_KEY" }, 500);

    const body = await req.json().catch(() => ({}));
    const idea = typeof body?.idea === "string" ? body.idea.trim().slice(0, 300) : "";
    if (idea.length < 3) return json({ error: "Tell us the startup you want to start." }, 400);

    const aiRes = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "none",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `The visitor typed: "${idea}"` },
        ],
      }),
    }, { timeoutMs: 60_000 });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      const message = aiRes.status === 429
        ? "We're getting a lot of ideas right now — try again in a moment."
        : aiRes.status === 402
          ? "Our AI credits ran out. Reach out and we'll walk you through it."
          : "We couldn't read the market just now. Try again in a moment.";
      console.error("atlanta-viability gateway error", aiRes.status, txt.slice(0, 300));
      return json({ error: message }, aiRes.status === 429 ? 429 : 502);
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = JSON.parse(String(content).replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
    }

    return json(parsed);
  } catch (e: any) {
    console.error("atlanta-viability failed", e);
    return json({ error: "Something went wrong. Try again in a moment." }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

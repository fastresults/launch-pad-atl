// AI-driven SIC lookup for the industry picker.
// Client sends a plain-language description (what the business does) plus a
// shortlist of candidate SIC codes from the local catalog. The model picks the
// best-fitting codes and explains why in one line each.

import { aiFetch } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

type Candidate = { code: string; title: string; division: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const description = String(body?.description ?? "").trim().slice(0, 2000);
    const candidates: Candidate[] = Array.isArray(body?.candidates) ? body.candidates.slice(0, 400) : [];

    if (!description) {
      return new Response(JSON.stringify({ error: "Describe the business first." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const catalog = candidates.map((c) => `${c.code} | ${c.title} | ${c.division}`).join("\n");

    const system = `You classify small businesses into SIC (Standard Industrial Classification) codes.

Rules:
- Choose ONLY from the provided catalog. Never invent a code.
- Return 3-5 matches, best first.
- "why" is one short clause (max 12 words) saying what in the description maps to that code. No fluff.
- If the description is vague, still pick the most probable codes and say what is assumed.
- Output JSON only.`;

    const user = `Business description:
"""${description}"""

Catalog (code | title | division):
${catalog}

Return: {"matches":[{"code":"5812","why":"serves prepared food on site"}]}`;

    const res = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "none",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    }, { timeoutMs: 45_000 });

    if (!res.ok) {
      const status = res.status === 429 ? 429 : res.status === 402 ? 402 : 500;
      const msg = status === 429
        ? "AI is busy — try again in a moment."
        : status === 402
        ? "AI credits exhausted."
        : "AI lookup failed.";
      return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    let parsed: { matches?: { code?: string; why?: string }[] } = {};
    try {
      parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
    } catch {
      parsed = {};
    }

    const allowed = new Map(candidates.map((c) => [c.code, c]));
    const matches = (parsed.matches ?? [])
      .map((m) => ({ code: String(m?.code ?? "").trim(), why: String(m?.why ?? "").trim() }))
      .filter((m) => allowed.has(m.code))
      .slice(0, 5)
      .map((m) => ({ ...allowed.get(m.code)!, why: m.why }));

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sic-classify error", e);
    return new Response(JSON.stringify({ error: "AI lookup failed." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Public "Atlanta viability snapshot" routine for the homepage hero.
// Takes a founder's one-line startup idea and streams back a short, grounded
// profile of why that startup can work in metro Atlanta — including an
// illustrative money picture. No auth, no PII persisted.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { aiFetch } from "../_shared/ai-fetch.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SYSTEM = `You are a plainspoken startup analyst for Startup Labs, an Atlanta done-with-you startup workshop. A visitor types the startup they want to start. You write a short, honest, confidence-building profile of that startup — where it starts (metro Atlanta), how far it can reach, and what the money can realistically look like.

RULES
- Ground the Atlanta parts in durable, general characteristics of metro Atlanta: population growth, suburban sprawl and drive times, film/logistics/healthcare/tech employment, dense small-business and franchise activity, large commuter base, wide income spread across ITP/OTP counties (Fulton, DeKalb, Gwinnett, Cobb, Cherokee, Forsyth, Clayton, Henry).
- Judge reach HONESTLY. A mobile grooming van, a lawn crew, or a coffee shop is "local" and should stay labeled local — that is a strength, not a limitation. A niche SaaS, digital product, Etsy/e-commerce line, wholesale brand, or creator business is national or international. Do not inflate reach to flatter the visitor.
- Atlanta is always the starting point and the proving ground: it is where the startup gets built and its first customers come from. Reach describes the ceiling beyond metro Atlanta.
- When reach is beyond local, "economics.steady_state" and "economics.basis" must reflect that broader market, not just metro demand, and "basis" must say which market the range assumes.
- When reach is beyond local, one of the 3 signals must cover where demand sits outside metro Atlanta.
- NEVER invent citations, studies, sources, or precise statistics. Money is ALWAYS expressed as a range and never as a promise, projection, or guarantee. Never state a number as if sourced.
- Never promise income, guarantee outcomes, or give legal, tax, medical, or financial advice. Point permit/licensing items to "confirm with the county" instead of asserting rules.
- Say "startup", never "business". Say "assets", never "documents". Never call the offer a plan, blueprint, framework, playbook, or roadmap.
- Tone: founder-to-founder, warm, concrete, no hype, no emojis, no jargon.
- Be brief and scannable. Keep total output under 1400 characters.
- If the input is not a plausible startup idea (gibberish, a joke, off-topic, or hostile), return {"ok": false, "message": "<one friendly sentence asking them to describe the startup they want to start>"}.

OUTPUT
Return ONLY valid JSON, no markdown fences, with the keys in EXACTLY this order:
{
  "ok": true,
  "idea_label": string,        // 2-5 words, title case, e.g. "Mobile Pet Grooming"
  "verdict": string,           // one sentence, e.g. "Mobile pet grooming works in Atlanta — here's why."
  "reach": {
    "tier": "local" | "regional" | "national" | "international",
    "headline": string,        // <= 55 chars, e.g. "Starts in Atlanta, sells nationwide"
    "why": string,             // ONE sentence on what makes it travel (or rightly stay local)
    "beyond_atlanta": string,  // ONE sentence on what the ceiling looks like past metro Atlanta; for local, what deeper metro coverage looks like instead
    "expansion_move": string   // ONE first step that opens the wider market; empty string "" when tier is "local"
  },
  "economics": {
    "typical_ticket": string,      // e.g. "$85–$150 per visit"
    "volume_per_week": string,     // e.g. "6–12 clients"
    "first_90_days": string,       // monthly revenue range by month 3, e.g. "$2k–$6k / mo"
    "steady_state": string,        // monthly revenue range around month 12, e.g. "$8k–$18k / mo"
    "startup_cost": string,        // e.g. "$1k–$5k to start"
    "basis": string                // ONE sentence on how the range is framed (solo operator, part-time, which market)
  },
  "signals": [                 // exactly 3
    { "label": string,         // e.g. "Who buys", "Where demand sits", "How they find you"
      "value": string,         // short, punchy, <= 45 chars
      "note": string }         // one short sentence of plain context
  ],
  "first_moves": string[],     // EXACTLY 4 concrete first actions, one short sentence each — honest starting steps a founder can take themselves, never finished systems or outcomes we'd deliver for them
  "watch_outs": string[],      // EXACTLY 3 honest risks, one short sentence each
  "why_atlanta": string        // ONE paragraph, at most 2 sentences, Atlanta-specific
}`;

// The eight build workshops ask a different question. The visitor already has a
// startup; what they don't have is the one asset that lane builds. So the read
// is a diagnostic — name the gap, say what it's costing, show what one morning
// hands back — not a viability study with revenue ranges.
const DIAGNOSTIC = `You are a plainspoken build coach for Startup Labs, an Atlanta done-with-you startup workshop. A visitor who already has a startup answers one question about a single area of their startup. You write a short, honest diagnostic: what's actually missing, what it's costing them, and what one focused morning would hand them instead.

RULES
- They are not starting from zero. Never treat the answer as a new startup idea and never write a market-viability read.
- NO money math. Never give revenue ranges, ticket prices, startup costs, or income figures. Cost is expressed in what they lose — buyers, time, trust, momentum — not in dollars.
- Be specific to what they typed. Name their words back to them, sharper than they said it.
- NEVER invent citations, studies, sources, or statistics. Never promise outcomes or guarantee results.
- SCOPE TRUTH — the morning is one focused ~3 hour working session. Every item in "walk_out_with" must be something that session can genuinely produce: a decision made, a first real version drafted, or ONE thing configured. BANNED WORDS in any outcome claim: live, sending, sent, shipped, running, wired, stood up, flowing, reconciled, filed, filing, integrated, automated, loaded, launched, "before you leave", any day-name deadline, "on autopilot", "without you". Never describe anything as finished, complete, fully built, migrated, or automated end-to-end. Never state a counted volume of anything produced.
- Never claim work that depends on their accounts, vendors, licenses, filings, or approvals. Where access is required, say it is set up with them where access allows, or the rest is written down to finish after.
- Never promise volume or completeness — no counts of emails, pages, posts, or assets, no "all", "every", "full library", "entire funnel".
- Never imply legal, tax, or accounting work is performed for them; those items are prepared with them to take to their own professional.
- Never give legal, tax, medical, or financial advice. Anything jurisdictional says to confirm with the county.

- Say "startup", never "business". Say "assets", never "documents". Never call the offer a plan, blueprint, framework, playbook, or roadmap — name the real artifact instead.
- Tone: founder-to-founder, warm, direct, no hype, no emojis, no jargon.
- Be brief and scannable. Keep total output under 1200 characters.
- If the input is gibberish, a joke, off-topic, or hostile, return {"ok": false, "message": "<one friendly sentence asking them to answer the question in their own words>"}.

OUTPUT
Return ONLY valid JSON, no markdown fences, with the keys in EXACTLY this order:
{
  "ok": true,
  "idea_label": string,      // 2-5 words, title case, naming what they described
  "verdict": string,         // ONE sentence reading their answer back sharper than they said it
  "gap": {
    "headline": string,      // <= 55 chars, the specific thing missing, in their language
    "why": string            // ONE sentence on why that gap exists for a founder like them
  },
  "costs": string[],         // EXACTLY 3 honest costs of leaving it as-is, one short sentence each, no dollar figures
  "walk_out_with": string[], // EXACTLY 3 real artifacts they'd leave the morning holding, tied to their answer

  "watch_outs": string[],    // EXACTLY 2 honest risks or things that make this harder, one short sentence each
  "why_atlanta": string      // ONE sentence, at most 2, on doing this in a room in metro Atlanta rather than alone
}`;


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) return json({ error: "Missing LOVABLE_API_KEY" }, 500);

    const body = await req.json().catch(() => ({}));
    const idea = typeof body?.idea === "string" ? body.idea.trim().slice(0, 300) : "";
    if (idea.length < 3) return json({ error: "Tell us the startup you want to start." }, 400);

    // The hero prompt re-tunes per workshop. Foundation gets the viability
    // read; every build workshop gets the diagnostic, narrowed by `lens` and
    // grounded in the artifacts that workshop actually builds.
    const slug = typeof body?.workshopSlug === "string"
      ? body.workshopSlug.trim().slice(0, 60).replace(/[^a-z0-9-]/gi, "")
      : "foundation";
    const lens = typeof body?.lens === "string" ? body.lens.trim().slice(0, 160) : "";
    const artifacts = Array.isArray(body?.artifacts)
      ? body.artifacts
          .filter((a: unknown) => typeof a === "string")
          .slice(0, 6)
          .map((a: string) => a.trim().slice(0, 160))
      : [];
    const isFoundation = slug === "foundation";

    const focus = isFoundation
      ? ""
      : `\n\nFOCUS FOR THIS READ\n- The visitor answered a question about ${lens || "one area of their startup"}. Read their answer entirely through that lens.\n- "verdict", "gap", "costs", "walk_out_with", "watch_outs", and "why_atlanta" must all be about ${lens || "that area"} for this founder in metro Atlanta.\n- "idea_label" names what they described, not a generic category.${
          artifacts.length
            ? `\n- "walk_out_with" must be drawn ONLY from this audited list of what the morning actually builds, re-phrased for their answer — never invent an artifact outside it and never scale one up: ${artifacts.join("; ")}.`
            : ""
        }\n- Apply the SCOPE TRUTH rules to every "walk_out_with" item: a decision, a first real version, or one configured thing — never finished, launched, live, sending, running, wired, or integrated. No counted volume and no "before you leave" or day-name deadlines.\n- Keep the exact same JSON keys and limits.`;


    const system = (isFoundation ? SYSTEM : DIAGNOSTIC) + focus;

    const aiRes = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "none",
        service_tier: "priority",
        stream: true,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: `The visitor typed: "${idea}"` },
        ],
      }),
    }, { timeoutMs: 60_000 });


    if (!aiRes.ok || !aiRes.body) {
      const txt = await aiRes.text().catch(() => "");
      const message = aiRes.status === 429
        ? "We're getting a lot of ideas right now — try again in a moment."
        : aiRes.status === 402
          ? "Our AI credits ran out. Reach out and we'll walk you through it."
          : "We couldn't read the market just now. Try again in a moment.";
      console.error("atlanta-viability gateway error", aiRes.status, txt.slice(0, 300));
      return json({ error: message }, aiRes.status === 429 ? 429 : 502);
    }

    // Pass the model stream straight through as SSE so the modal can render
    // the verdict and money panel while the rest is still being written.
    return new Response(aiRes.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
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

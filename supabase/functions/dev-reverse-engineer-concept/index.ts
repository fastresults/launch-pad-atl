// Dev-only helper: scrape a real startup homepage and reverse-engineer
// company name + concept + differentiation for the /dashboard/hub/new test button.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ALLOWED_URLS = new Set([
  "https://linear.app",
  "https://vercel.com",
  "https://resend.com",
  "https://cal.com",
  "https://posthog.com",
  "https://retool.com",
  "https://supabase.com",
  "https://cursor.com",
  "https://www.perplexity.ai",
  "https://granola.ai",
  "https://attio.com",
  "https://www.beehiiv.com",
  "https://mercury.com",
  "https://ramp.com",
  "https://www.notion.com",
]);

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!firecrawlKey) return json(400, { error: "Firecrawl connector not linked" });
  if (!lovableKey) return json(500, { error: "LOVABLE_API_KEY missing" });

  let url: string;
  try {
    const body = await req.json();
    url = String(body?.url ?? "");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }
  if (!ALLOWED_URLS.has(url)) return json(400, { error: "URL not on allowlist" });

  // 1. Scrape via Firecrawl v2
  let markdown = "";
  try {
    const fc = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });
    const fcJson = await fc.json();
    if (!fc.ok) {
      return json(fc.status, { error: `Firecrawl: ${fcJson?.error ?? fc.statusText}` });
    }
    markdown = (fcJson?.data?.markdown ?? fcJson?.markdown ?? "").toString().slice(0, 12000);
    if (!markdown.trim()) return json(502, { error: "Firecrawl returned no markdown" });
  } catch (e) {
    return json(502, { error: `Firecrawl fetch failed: ${e instanceof Error ? e.message : String(e)}` });
  }

  // 2. Reverse-engineer via Lovable AI
  const system = `You reverse-engineer a startup's business concept from scraped homepage markdown.
Return ONLY a JSON object with this exact shape, no prose, no code fences:
{
  "company": "<the actual brand/product name on the page>",
  "concept": "<3-5 sentence first-person plural ('we're building / we help...') Business concept paragraph: what they do, who it's for, why it matters. Grounded ONLY in the scraped content. No marketing fluff.>",
  "diff": "<1-2 sentence first-person plural differentiation blurb explaining what makes them different from the obvious competitors in their space>"
}`;

  let aiText = "";
  try {
    const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": lovableKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: `URL: ${url}\n\nMARKDOWN:\n${markdown}` },
        ],
      }),
    });
    const aiJson = await ai.json();
    if (!ai.ok) {
      return json(ai.status, { error: `AI: ${aiJson?.error?.message ?? ai.statusText}` });
    }
    aiText = aiJson?.choices?.[0]?.message?.content ?? "";
  } catch (e) {
    return json(502, { error: `AI call failed: ${e instanceof Error ? e.message : String(e)}` });
  }

  let parsed: { company?: string; concept?: string; diff?: string };
  try {
    parsed = JSON.parse(aiText);
  } catch {
    return json(502, { error: "AI returned non-JSON", raw: aiText.slice(0, 500) });
  }

  if (!parsed.company || !parsed.concept) {
    return json(502, { error: "AI response missing fields", raw: parsed });
  }

  return json(200, {
    company: parsed.company,
    url,
    concept: parsed.concept,
    diff: parsed.diff ?? "",
  });
});

// Dev-only helper: scrape a real startup homepage and reverse-engineer
// company name + concept + differentiation for the /dashboard/hub/new test button.
// The track (when supplied) shapes the voice of the generated concept blurb so a
// Lifestyle test doesn't read like a SaaS pitch and vice versa.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Mirrors TRACK_SEEDS in src/lib/tracks.ts. Keep in sync.
const ALLOWED_URLS = new Set<string>([
  // lifestyle
  "https://bluebottlecoffee.com",
  "https://www.equinox.com",
  "https://www.drybar.com",
  "https://www.soulcycle.com",
  // small_business
  "https://www.acehardware.com",
  "https://www.servpro.com",
  "https://www.hrblock.com",
  "https://www.midas.com",
  // scalable_tech
  "https://linear.app",
  "https://vercel.com",
  "https://resend.com",
  "https://cal.com",
  "https://posthog.com",
  "https://supabase.com",
  "https://cursor.com",
  "https://www.notion.com",
  "https://attio.com",
  // marketplace
  "https://www.etsy.com",
  "https://www.airbnb.com",
  "https://www.upwork.com",
  "https://www.faire.com",
  // deep_tech
  "https://boomsupersonic.com",
  "https://www.ginkgobioworks.com",
  "https://www.anthropic.com",
  "https://cfs.energy",
  // social_impact
  "https://www.warbyparker.com",
  "https://www.toms.com",
  "https://www.kiva.org",
  "https://www.charitywater.org",
  // corporate
  "https://www.palantir.com",
  "https://www.anduril.com",
  "https://www.boozallen.com",
  "https://www.govtech.com",
]);

const TRACK_LENS: Record<string, string> = {
  lifestyle:
    "Voice: sole-founder lifestyle / main-street business. Plain English, no VC jargon, no TAM talk. Speak about real customers, local roots, and the founder's craft.",
  small_business:
    "Voice: established small-business owner. Talk margin, repeat customers, regional reach, operational discipline. No venture framing.",
  scalable_tech:
    "Voice: venture-track SaaS founder. ICP precision, defensibility, retention/expansion, growth motion. SaaS metrics where natural.",
  marketplace:
    "Voice: marketplace founder. Speak to both sides (supply and demand), liquidity, trust, network effects.",
  deep_tech:
    "Voice: deep-tech / frontier founder. Acknowledge technical risk, milestones, regulatory pathway, long horizons. Reference IP and non-dilutive funding where natural.",
  social_impact:
    "Voice: impact-venture founder. Mission and revenue as co-equal. Use theory-of-change language and measurable impact alongside business outcomes.",
  corporate:
    "Voice: corporate / institutional founder. Formal, board-ready tone. Speak to enterprise procurement, compliance, pilot-to-production motions.",
};

const VALID_TRACKS = new Set(Object.keys(TRACK_LENS));

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
  let track: string | null = null;
  try {
    const body = await req.json();
    url = String(body?.url ?? "");
    const rawTrack = body?.track ? String(body.track) : "";
    if (rawTrack && VALID_TRACKS.has(rawTrack)) track = rawTrack;
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
  const trackLens = track ? TRACK_LENS[track] : null;
  const system = `You reverse-engineer a startup's business concept from scraped homepage markdown.
${trackLens ? trackLens + "\n" : ""}Return ONLY a JSON object with this exact shape, no prose, no code fences:
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
    track,
  });
});

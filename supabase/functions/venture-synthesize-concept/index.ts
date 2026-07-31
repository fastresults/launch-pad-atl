// Synthesizes a clean Business concept paragraph AND structured form fields
// from text extracted client-side out of one or more founder-uploaded documents
// (PDF, TXT, MD). Pure synthesis — no DB writes.

import { requireUser } from "../_shared/auth.ts";
import { aiFetch } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const PER_FILE_CAP = 30_000;
const TOTAL_CAP = 90_000;

// Track keys mirror src/lib/tracks.ts
const TRACK_KEYS = [
  "lifestyle",
  "ecommerce_dtc",
  "scalable_tech",
  "marketplace",
  "deep_tech",
  "social_impact",
  "corporate",
] as const;

const TRACK_HINT = `Track keys:
- lifestyle: Main Street / single-location food, retail, services (cafés, restaurants, boutiques, salons)
- ecommerce_dtc: direct-to-consumer brand selling a physical product online (Shopify / Amazon / marketplaces) — apparel, beauty, food/beverage, home goods
- scalable_tech: VC-style software / SaaS / consumer app with national+ ambition
- marketplace: two-sided / multi-vendor platforms connecting buyers and sellers
- deep_tech: hardware, biotech, energy, robotics, science-heavy
- social_impact: nonprofit, mission-driven, civic, education
- corporate: internal venture inside an existing larger company`;

const SYSTEM_PROMPT = `You read founder-uploaded source documents (business plans, pitch decks, one-pagers, brand briefs, notes) and produce a STRUCTURED JSON object that pre-fills a venture intake form.

Output a single JSON object — no prose, no markdown, no code fences. Schema:

{
  "concept": string,                         // REQUIRED. 2–4 sentences. First-person plural ("We…"). What we're building, who it's for, why now. Plain confident voice. No buzzwords. Grounded in the sources.
  "company_name": string | null,
  "differentiation_statement": string | null, // 1–2 sentences on what makes this different / the edge.
  "founder_name": string | null,
  "founder_email": string | null,            // ONLY if literally present in the source. Never invent.
  "founder_phone": string | null,            // ONLY if literally present.
  "website_url": string | null,
  "city": string | null,
  "region": string | null,                   // US state, province, or region (full name, e.g. "Oklahoma")
  "country": string | null,                  // e.g. "United States"
  "market_scope": "local" | "regional" | "national" | "international" | null,
  "industry": string | null,                 // MUST be an exact value from the provided INDUSTRY_VALUES list, or null.
  "sub_industry": string | null,             // Free text refinement (e.g. "specialty coffee", "wood-fired pizza")
  "track": "lifestyle" | "ecommerce_dtc" | "scalable_tech" | "marketplace" | "deep_tech" | "social_impact" | "corporate" | null
}

Rules:
- Only populate a field when the document clearly supports it. Use null for anything uncertain.
- Never fabricate emails, phones, URLs, names, or metrics.
- "industry" MUST come from INDUSTRY_VALUES verbatim, or be null if nothing fits.
- Infer "track" from cues (single-location food/retail/service → lifestyle; DTC product brand sold online → ecommerce_dtc; venture-scale SaaS/app → scalable_tech; two-sided platform → marketplace; hardware/biotech → deep_tech; nonprofit/mission → social_impact; internal corporate venture → corporate).
- Default country to "United States" only if a US state, ZIP, or city is named.
- Concept paragraph: 2–4 sentences, no headings, no "Here is", no buzzwords ("synergy", "revolutionary", "cutting-edge").

PATTERN REFERENCES:
- If a "PATTERN REFERENCES" section is provided, treat those pages as INSPIRATION ONLY. They describe a startup the founder wants to *learn the shape of* — not their own startup.
- NEVER populate company_name, founder_name, founder_email, founder_phone, website_url, city, region, or country from a pattern reference. If those fields would only come from a pattern reference, leave them null.
- DO use pattern references to inform industry, sub_industry, market_scope, track, differentiation_statement, and the *style/model* of the concept paragraph.
- The concept paragraph, when a pattern reference is present, must be written as the FOUNDER'S OWN new startup (use "we" and a placeholder like "our shop" or "our platform" if no name is known) — not as a description of the reference brand. Do not name the reference brand in the concept.

- Return ONLY the JSON object.`;


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireUser(req, corsHeaders);
  if (auth.error) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const sources: Array<{ filename?: string; text?: string }> = Array.isArray(body?.sources) ? body.sources : [];
    const urls: Array<{ url?: string; title?: string | null; text?: string }> = Array.isArray(body?.urls) ? body.urls : [];
    const patternUrls: Array<{ url?: string; title?: string | null; text?: string }> = Array.isArray(body?.patternUrls) ? body.patternUrls : [];
    const conceptDraft: string = typeof body?.conceptDraft === "string" ? body.conceptDraft.trim() : "";
    const industryValues: string[] = Array.isArray(body?.industryValues) ? body.industryValues : [];

    if (!sources.length && !urls.length && !patternUrls.length && conceptDraft.length < 20) {
      return new Response(JSON.stringify({ error: "Provide at least one source (file, URL, or ≥20 char concept draft)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let used = 0;
    const fileParts: string[] = [];
    const urlParts: string[] = [];
    const patternParts: string[] = [];
    // Pattern refs are usually longer marketing pages — cap them tightest so
    // they don't crowd out the founder's own sources.
    const PATTERN_PER_CAP = Math.min(PER_FILE_CAP, 15_000);
    for (const p of patternUrls) {
      const text = (p?.text ?? "").trim();
      if (!text) continue;
      const label = (p?.title || p?.url || "pattern reference").toString().slice(0, 200);
      const remaining = TOTAL_CAP - used;
      if (remaining <= 0) break;
      const slice = text.slice(0, Math.min(PATTERN_PER_CAP, remaining));
      used += slice.length;
      patternParts.push(`### ${label}\n${p?.url ? `(${p.url})\n` : ""}${slice}`);
    }
    // URLs next — they're noisier so cap them tighter when total cap is hit
    for (const u of urls) {
      const text = (u?.text ?? "").trim();
      if (!text) continue;
      const label = (u?.title || u?.url || "web source").toString().slice(0, 200);
      const remaining = TOTAL_CAP - used;
      if (remaining <= 0) break;
      const slice = text.slice(0, Math.min(PER_FILE_CAP, remaining));
      used += slice.length;
      urlParts.push(`### ${label}\n${u?.url ? `(${u.url})\n` : ""}${slice}`);
    }
    for (const s of sources) {
      const text = (s?.text ?? "").trim();
      if (!text) continue;
      const name = (s?.filename ?? "untitled").slice(0, 200);
      const remaining = TOTAL_CAP - used;
      if (remaining <= 0) break;
      const slice = text.slice(0, Math.min(PER_FILE_CAP, remaining));
      used += slice.length;
      fileParts.push(`### ${name}\n${slice}`);
    }

    if (!fileParts.length && !urlParts.length && !patternParts.length && conceptDraft.length < 20) {
      return new Response(JSON.stringify({ error: "Sources were empty after extraction" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const industryBlock = industryValues.length
      ? `INDUSTRY_VALUES (use one of these verbatim for "industry", or null):\n${industryValues.join("\n")}`
      : `INDUSTRY_VALUES: (none supplied — set "industry" to null)`;

    const sections: string[] = [];
    if (patternParts.length) {
      sections.push(
        `PATTERN REFERENCES (INSPIRATION ONLY — use for shape/model/positioning; DO NOT copy identity fields like company name, founder name/contact, website, or location from these):\n\n${patternParts.join("\n\n---\n\n")}`,
      );
    }
    if (urlParts.length) sections.push(`WEB SOURCES (scraped pages — founder's own):\n\n${urlParts.join("\n\n---\n\n")}`);
    if (fileParts.length) sections.push(`UPLOADED DOCUMENTS (founder's own):\n\n${fileParts.join("\n\n---\n\n")}`);
    if (conceptDraft) sections.push(`FOUNDER'S OWN DRAFT (verbatim, treat as primary intent):\n\n${conceptDraft}`);


    const userPrompt = `${industryBlock}

${TRACK_HINT}

${sections.join("\n\n===\n\n")}

Return the JSON object now.`;

    const aiRes = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        response_format: { type: "json_object" },
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
    const raw = (aiJson?.choices?.[0]?.message?.content ?? "").trim();
    if (!raw) {
      return new Response(JSON.stringify({ error: "Empty response from model" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tolerate accidental code fences
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: treat the whole response as the concept paragraph
      return new Response(JSON.stringify({ concept: cleaned }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const str = (v: unknown): string | null => {
      if (typeof v !== "string") return null;
      const t = v.trim();
      return t.length ? t : null;
    };

    const concept = str(parsed.concept) ?? "";
    if (!concept) {
      return new Response(JSON.stringify({ error: "Model returned no concept" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedScopes = new Set(["local", "regional", "national", "international"]);
    const scope = str(parsed.market_scope);
    const allowedTracks = new Set<string>(TRACK_KEYS as unknown as string[]);
    const track = str(parsed.track);
    const industry = str(parsed.industry);
    const industryOk = industry && (industryValues.length === 0 || industryValues.includes(industry));

    const out = {
      concept,
      company_name: str(parsed.company_name),
      differentiation_statement: str(parsed.differentiation_statement),
      founder_name: str(parsed.founder_name),
      founder_email: str(parsed.founder_email),
      founder_phone: str(parsed.founder_phone),
      website_url: str(parsed.website_url),
      city: str(parsed.city),
      region: str(parsed.region),
      country: str(parsed.country),
      market_scope: scope && allowedScopes.has(scope) ? scope : null,
      industry: industryOk ? industry : null,
      sub_industry: str(parsed.sub_industry),
      track: track && allowedTracks.has(track) ? track : null,
    };

    return new Response(JSON.stringify(out), {
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

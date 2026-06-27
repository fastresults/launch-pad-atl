// Founders Hub — Deep research pass before document generation.
// Pipeline: scrape own site → discover competitors → scrape competitors
// → industry/market research (Perplexity) → customer voice (Firecrawl /search on Reddit/HN)
// → pricing benchmarks → AI synthesis into structured research_brief.
//
// Artifacts persist in venture_snapshots.research_artifacts so retries can skip
// completed steps. The synthesized research_brief and extracted_data are written
// at the end. Citations are preserved end-to-end.

import { createClient } from "npm:@supabase/supabase-js@2";
import { jsonResponse, requireSnapshotOwner, requireUser } from "../_shared/auth.ts";
import { aiFetch } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";

// ============ Step utilities ============

type Artifact = {
  step: string;
  source_url?: string;
  fetched_at: string;
  content: string;
  metadata?: Record<string, unknown>;
};

async function updateProgress(
  supabase: any,
  id: string,
  stage: string,
  progress: number,
  message: string,
) {
  await supabase
    .from("venture_snapshots")
    .update({
      enrichment_progress: {
        stage,
        progress,
        message,
        updatedAt: new Date().toISOString(),
      },
    })
    .eq("id", id);
}

async function appendArtifacts(supabase: any, id: string, artifacts: Artifact[]) {
  const { data } = await supabase
    .from("venture_snapshots")
    .select("research_artifacts")
    .eq("id", id)
    .maybeSingle();
  const existing = Array.isArray(data?.research_artifacts) ? data.research_artifacts : [];
  await supabase
    .from("venture_snapshots")
    .update({ research_artifacts: [...existing, ...artifacts] })
    .eq("id", id);
}

// ============ Firecrawl helpers ============

async function fcScrape(url: string): Promise<{ markdown: string; title?: string } | null> {
  if (!FIRECRAWL_API_KEY) return null;
  try {
    const res = await fetch(`${FIRECRAWL_V2}/scrape`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) {
      console.error(`firecrawl scrape ${url} -> ${res.status}`);
      return null;
    }
    const json = await res.json();
    const md = json?.data?.markdown ?? json?.markdown ?? "";
    const title = json?.data?.metadata?.title ?? json?.metadata?.title;
    if (!md) return null;
    return { markdown: md.slice(0, 12_000), title };
  } catch (e) {
    console.error("fcScrape error", url, e);
    return null;
  }
}

async function fcSearch(query: string, opts?: { limit?: number; tbs?: string }): Promise<
  { url: string; title?: string; description?: string }[]
> {
  if (!FIRECRAWL_API_KEY) return [];
  try {
    const res = await fetch(`${FIRECRAWL_V2}/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit: opts?.limit ?? 8,
        tbs: opts?.tbs,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      console.error(`firecrawl search "${query}" -> ${res.status}`);
      return [];
    }
    const json = await res.json();
    const results = json?.data?.web ?? json?.web ?? json?.data ?? [];
    return (Array.isArray(results) ? results : []).map((r: any) => ({
      url: r.url,
      title: r.title,
      description: r.description ?? r.snippet,
    })).filter((r: any) => r.url);
  } catch (e) {
    console.error("fcSearch error", query, e);
    return [];
  }
}

// ============ Perplexity helper ============

async function pplxResearch(prompt: string): Promise<{ content: string; citations: string[] } | null> {
  if (!PERPLEXITY_API_KEY) return null;
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: "You are a precise market analyst. Cite sources for every claim." },
          { role: "user", content: prompt },
        ],
        search_recency_filter: "year",
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      console.error(`perplexity -> ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    const json = await res.json();
    return {
      content: json?.choices?.[0]?.message?.content ?? "",
      citations: Array.isArray(json?.citations) ? json.citations : [],
    };
  } catch (e) {
    console.error("pplx error", e);
    return null;
  }
}

// ============ Synthesis ============

const SYNTH_SYSTEM = `You are an AI venture-intelligence analyst.
You will receive a founder's concept plus a research corpus (own site, competitor pages, market analysis, customer voice, pricing).
Your job is to synthesize a structured research_brief AND a 4-section extracted_data object.

CRITICAL RULES:
1. Prefer verbatim facts from the founder's own uploaded documents/URLs over inference from research.
2. Build a founder-ready brief: use sourced facts first, then make clearly reasonable strategic inferences from the venture concept when sources are thin.
3. NEVER emit placeholder strings like "[needs founder input]", "TBD", "various", or "unknown".
4. If a field cannot be supported or reasonably inferred, return an empty string "". Do not explain missing data inside the field.
5. Cite source URLs in brackets like [https://example.com] right after every claim that came from an external source (skip citations for founder-uploaded documents).
5. Return ONLY valid JSON matching the schema below — no markdown, no commentary.


Schema:
{
  "research_brief": {
    "company": { "summary": "", "positioning": "" },
    "competitors": [{ "name": "", "url": "", "positioning": "", "pricing": "", "strengths": "", "weaknesses": "" }],
    "market": { "size": "", "trends": "", "regulation": "", "tailwinds": "", "headwinds": "" },
    "customer_voice": [{ "quote": "", "source_url": "", "theme": "" }],
    "pricing_benchmarks": [{ "competitor": "", "tier": "", "price": "", "url": "" }],
    "gaps": ["..."],
    "confidence": { "company": 0, "competitors": 0, "market": 0, "customer_voice": 0, "pricing": 0, "overall": 0 }
  },
  "extracted_data": {
    "foundation": { "company_name": "", "founder_name": "", "location": "", "industry": "", "concept": "", "problem": "" },
    "market":     { "target_customers": "", "value_proposition": "", "differentiators": "", "market_size": "" },
    "operations": { "revenue_model": "", "pricing": "", "key_processes": "", "team": "" },
    "vision":     { "short_term_goals": "", "long_term_goals": "", "mission": "", "vision": "" }
  }
}`;

function sanitizeModelOutput(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/\[(?:needs founder input|not provided|unknown|tbd|todo|n\/a)\]/i.test(trimmed)) return "";
    if (/^(?:needs founder input|not provided|unknown|tbd|todo|n\/a|various)$/i.test(trimmed)) return "";
    return trimmed.replace(/\s*\[(?:needs founder input|not provided|unknown|tbd|todo|n\/a)\]\s*/gi, "").trim();
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeModelOutput(item))
      .filter((item) => !(typeof item === "string" && item.length === 0));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = sanitizeModelOutput(nested);
    }
    return out;
  }
  return value;
}

async function synthesize(corpus: string): Promise<any> {
  const res = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYNTH_SYSTEM },
        { role: "user", content: corpus },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    throw new Error(`Gateway ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content);
  } catch {
    // one retry with explicit "fix the JSON" prompt
    const fix = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Return only valid JSON. Fix the following so it parses." },
          { role: "user", content },
        ],
        response_format: { type: "json_object" },
      }),
    });
    const fjson = await fix.json();
    return JSON.parse(fjson?.choices?.[0]?.message?.content ?? "{}");
  }
}

// ============ Main pipeline ============

async function runResearch(supabase: any, snapshotId: string) {
  const { data: snap, error } = await supabase
    .from("venture_snapshots")
    .select("*")
    .eq("id", snapshotId)
    .maybeSingle();
  if (error || !snap) throw new Error(error?.message ?? "Snapshot not found");

  // reset artifacts on fresh run
  await supabase.from("venture_snapshots").update({ research_artifacts: [] }).eq("id", snapshotId);

  const concept = snap.business_concept ?? "";
  const companyName = snap.company_name ?? "";
  const ownUrl = snap.website_url ?? null;
  const industry = (snap.industry ?? "").trim();
  // Strip the "Group › Subgroup" prefix for cleaner search terms
  const industryShort = industry.split("›").pop()?.trim() ?? industry;
  const city = (snap.city ?? "").trim();
  const region = (snap.region ?? "").trim();
  const country = (snap.country ?? "").trim();
  const scope = (snap.market_scope ?? "national") as
    "local" | "regional" | "national" | "international";
  const geo = [city, region].filter(Boolean).join(", ");
  const keyword = (companyName || industryShort || concept.split(/[.\n]/)[0] || "").slice(0, 80);

  // ---------- Step 1: Own/competitor seed scrape ----------
  await updateProgress(supabase, snapshotId, "scraping", 10, "Scraping the seed website");
  const ownArtifacts: Artifact[] = [];
  if (ownUrl) {
    const r = await fcScrape(ownUrl);
    if (r) {
      ownArtifacts.push({
        step: "own_site",
        source_url: ownUrl,
        fetched_at: new Date().toISOString(),
        content: r.markdown,
        metadata: { title: r.title },
      });
    }
  }
  if (ownArtifacts.length) await appendArtifacts(supabase, snapshotId, ownArtifacts);

  // ---------- Step 2: Discover competitors (geo + industry aware) ----------
  await updateProgress(supabase, snapshotId, "competitors", 25, "Discovering competitors");
  const compQueries: string[] = [];
  if (scope === "local" && geo && industryShort) {
    compQueries.push(
      `best ${industryShort} in ${geo}`,
      `top ${industryShort} ${city}`,
      `${industryShort} ${geo} reviews`,
    );
  } else if (scope === "regional" && industryShort) {
    compQueries.push(
      `top ${industryShort} companies in ${region || country}`,
      `${industryShort} businesses ${region || country}`,
    );
  } else if (industryShort) {
    compQueries.push(
      `top ${industryShort} companies ${country || ""}`.trim(),
      `${industryShort} market leaders`,
      `${keyword} alternatives`,
    );
  } else {
    compQueries.push(`${keyword} alternatives`, `${keyword} competitors comparison`);
  }

  const compCandidates = new Map<string, { url: string; title?: string; description?: string }>();
  for (const q of compQueries) {
    const hits = await fcSearch(q, { limit: 6 });
    for (const h of hits) {
      const host = (() => { try { return new URL(h.url).hostname.replace(/^www\./, ""); } catch { return null; } })();
      if (!host) continue;
      if (ownUrl && host && ownUrl.includes(host)) continue;
      // For local searches, allow Yelp/Google Maps style aggregators because they list real local businesses;
      // for non-local, skip them.
      const aggregator = /^(g2|capterra|getapp|trustpilot|producthunt|medium|youtube|linkedin|wikipedia)\./i.test(host);
      const localAggregator = /^(yelp|tripadvisor|opentable|nextdoor|yellowpages)\./i.test(host);
      if (aggregator) continue;
      if (scope !== "local" && localAggregator) continue;
      if (!compCandidates.has(host)) compCandidates.set(host, h);
      if (compCandidates.size >= 5) break;
    }
    if (compCandidates.size >= 5) break;
  }
  await appendArtifacts(supabase, snapshotId, [{
    step: "competitor_discovery",
    fetched_at: new Date().toISOString(),
    content: JSON.stringify(Array.from(compCandidates.values()), null, 2),
    metadata: { queries: compQueries, scope, geo, industry: industryShort },
  }]);

  // ---------- Step 3: Scrape competitor homepages ----------
  await updateProgress(supabase, snapshotId, "competitors", 40, "Scraping competitor pages");
  const compArtifacts: Artifact[] = [];
  for (const cand of Array.from(compCandidates.values()).slice(0, 5)) {
    const r = await fcScrape(cand.url);
    if (r) {
      compArtifacts.push({
        step: "competitor",
        source_url: cand.url,
        fetched_at: new Date().toISOString(),
        content: r.markdown,
        metadata: { title: r.title ?? cand.title, description: cand.description },
      });
    }
  }
  if (compArtifacts.length) await appendArtifacts(supabase, snapshotId, compArtifacts);

  // ---------- Step 4: Industry/market via Perplexity (geo + scope anchored) ----------
  await updateProgress(supabase, snapshotId, "market", 60, "Analyzing the market with Perplexity");
  const scopeClause = scope === "local"
    ? `the local ${geo || city || country} market`
    : scope === "regional"
    ? `the regional ${region || country} market`
    : scope === "international"
    ? `the international market across multiple countries`
    : `the ${country || "national"} market`;
  const TRACK_LENS: Record<string, string> = {
    lifestyle: "Lens: Main Street Startup (first-time founder opening a real small business). Emphasize HYPERLOCAL signal: foot-traffic patterns, neighborhood demographics within 1–3 miles, named direct competitors within 5–10 miles (not category leaders), local search demand, typical local pricing benchmarks, permits/licensing/zoning realities, supplier and landlord options, opening-week cash needs. Skip TAM/SAM/SOM, venture-readiness, and category-level competitive landscape.",
    ecommerce_dtc: "Lens: E-commerce / DTC Brand (first-time founder launching a physical product online) — emphasize hero-SKU selection, COGS / contribution margin, MOQ and supplier sourcing, paid-social creative economics (Meta + TikTok CAC), email/SMS as owned channel, repeat-purchase rate and LTV, 3PL vs self-ship. Skip TAM/SAM/SOM and venture-readiness; talk concrete unit economics and named competitor brands in the category.",
    scalable_tech: "Lens: scalable tech / SaaS — emphasize ICP, defensibility, retention/expansion, unit economics at scale, venture-readiness.",
    marketplace: "Lens: marketplace / platform — analyze both sides (supply and demand), liquidity, cold-start, take-rate, network effects.",
    deep_tech: "Lens: deep tech / frontier — emphasize technical risk, regulatory pathway, IP, capital intensity, long time-to-revenue, non-dilutive funding.",
    social_impact: "Lens: social enterprise / impact — hold mission and revenue as co-equal; include impact metrics and impact-aligned capital.",
    corporate: "Lens: corporate / institutional — emphasize enterprise procurement, compliance, parent-org alignment, pilot-to-production motions.",
  };
  const trackLens = snap.track ? TRACK_LENS[snap.track] : null;
  const marketPrompt = `Analyze ${scopeClause} for ${industryShort || "this venture"}${companyName ? ` (relevant to ${companyName})` : ""}.
${trackLens ? trackLens + "\n" : ""}Cover concretely:
1. Market size and growth (with numbers when available, scoped to ${scopeClause}).
2. Major trends in the last 12 months.
3. Regulatory / licensing / compliance considerations for ${country || "the relevant jurisdiction"}${scope === "local" ? ` and ${region || city}` : ""}.
4. Tailwinds and headwinds.
5. Customer segments and typical pricing.

Cite sources for every numeric claim.

Venture context:
- Concept: ${concept}
- Industry: ${industry}${snap.sub_industry ? ` (niche: ${snap.sub_industry})` : ""}
- Location: ${geo || country || "unspecified"}
- Market scope: ${scope}${snap.track ? `\n- Track: ${snap.track}` : ""}`;
  const market = await pplxResearch(marketPrompt);
  if (market) {
    await appendArtifacts(supabase, snapshotId, [{
      step: "market_research",
      fetched_at: new Date().toISOString(),
      content: market.content,
      metadata: { citations: market.citations, source: "perplexity:sonar-pro", scope, geo },
    }]);
  }

  // ---------- Step 5: Customer voice (Reddit/HN, geo when local) ----------
  await updateProgress(supabase, snapshotId, "voice", 75, "Gathering customer voice");
  const voiceTerm = industryShort || keyword;
  const voiceQueries: string[] = scope === "local" && geo
    ? [
        `${voiceTerm} ${geo} site:reddit.com`,
        `best ${voiceTerm} ${city} site:reddit.com`,
      ]
    : [
        `${voiceTerm} site:reddit.com problem OR complaint OR alternative`,
        `${voiceTerm} site:news.ycombinator.com`,
      ];
  const voiceHits: { url: string; title?: string; description?: string }[] = [];
  for (const q of voiceQueries) {
    const hits = await fcSearch(q, { limit: 5, tbs: "qdr:y" });
    voiceHits.push(...hits);
    if (voiceHits.length >= 8) break;
  }
  if (voiceHits.length) {
    await appendArtifacts(supabase, snapshotId, [{
      step: "customer_voice",
      fetched_at: new Date().toISOString(),
      content: voiceHits.slice(0, 10).map((h) => `- [${h.title ?? h.url}](${h.url})\n  ${h.description ?? ""}`).join("\n\n"),
    }]);
  }


  // ---------- Step 6: Synthesis ----------
  await updateProgress(supabase, snapshotId, "synthesis", 88, "Synthesizing research brief");

  // Load all artifacts back to build corpus
  const { data: fresh } = await supabase
    .from("venture_snapshots")
    .select("research_artifacts")
    .eq("id", snapshotId)
    .maybeSingle();
  const artifacts: Artifact[] = fresh?.research_artifacts ?? [];

  // Founder's own uploaded source materials (highest priority signal).
  const sm = snap.source_materials ?? null;
  const PER_SOURCE_CAP = 12_000;
  const cap = (s: unknown) => (typeof s === "string" ? s.slice(0, PER_SOURCE_CAP) : "");
  const docBlocks: string[] = Array.isArray(sm?.documents)
    ? sm.documents.map((d: any, i: number) => `### Document ${i + 1}: ${d.filename ?? "document"}\n${cap(d.text)}`)
    : [];
  const urlBlocks: string[] = Array.isArray(sm?.urls)
    ? sm.urls.map((u: any, i: number) => `### URL ${i + 1}: ${u.url ?? ""}${u.title ? ` (${u.title})` : ""}\n${cap(u.text)}`)
    : [];

  const corpus = [
    `# Founder input`,
    `Founder: ${snap.founder_name || "[not provided]"}${snap.founder_email ? ` <${snap.founder_email}>` : ""}`,
    `Company name: ${companyName || "[not provided]"}`,
    `Website: ${ownUrl ?? "[not provided]"}`,
    `Industry: ${industry || "[not provided]"}${snap.sub_industry ? ` (niche: ${snap.sub_industry})` : ""}`,
    `Location: ${geo || "[not provided]"}${country ? `, ${country}` : ""}`,
    `Market scope: ${scope}`,
    `Concept: ${concept}`,
    snap.differentiation_statement ? `Differentiation: ${snap.differentiation_statement}` : "",
    docBlocks.length ? `\n# Founder-uploaded documents (authoritative — prefer over research)\n${docBlocks.join("\n\n")}` : "",
    urlBlocks.length ? `\n# Founder-supplied URLs (authoritative — prefer over research)\n${urlBlocks.join("\n\n")}` : "",
    ``,
    `# Research corpus`,
    ...artifacts.map((a) => `## ${a.step}${a.source_url ? ` — ${a.source_url}` : ""}\n${a.content}`),
  ].filter(Boolean).join("\n\n");


  // hard cap corpus to ~120k chars to stay within model limits
  const cappedCorpus = corpus.length > 120_000 ? corpus.slice(0, 120_000) + "\n\n[truncated]" : corpus;

  const result = await synthesize(cappedCorpus);
  const research_brief = sanitizeModelOutput(result?.research_brief ?? {});
  const extracted_data = sanitizeModelOutput(result?.extracted_data ?? {});

  await updateProgress(supabase, snapshotId, "validation", 96, "Finalizing");

  await supabase
    .from("venture_snapshots")
    .update({
      scraped_content: ownArtifacts[0]?.content ?? null,
      research_brief,
      extracted_data,
      status: "review",
      enrichment_progress: {
        stage: "complete",
        progress: 100,
        message: "Ready for review",
        updatedAt: new Date().toISOString(),
      },
    })
    .eq("id", snapshotId);

  // F15: research_brief just changed — flag the brain dirty so anything
  // downstream that reads the cached brain re-derives from fresh research.
  try {
    const { computeSnapshotBrain, markSnapshotBrainDirty } = await import("../_shared/snapshot-brain.ts");
    await markSnapshotBrainDirty(supabase, snapshotId);
    await computeSnapshotBrain(supabase, snapshotId);
  } catch (e) {
    console.warn("snapshot brain compute failed (will retry lazily)", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let snapshotId: string | undefined;
  try {
    const body = await req.json();
    snapshotId = body.snapshotId;
    if (!snapshotId) {
      return jsonResponse({ error: "snapshotId required" }, 400, corsHeaders);
    }

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY missing — connect Firecrawl in Connectors");
    if (!PERPLEXITY_API_KEY) console.warn("PERPLEXITY_API_KEY missing — market step will be skipped");

    const auth = await requireUser(req, corsHeaders);
    if (auth.error) return auth.error;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const own = await requireSnapshotOwner(supabase, snapshotId!, auth.userId!, corsHeaders);
    if (own.error) return own.error;

    // Run in background so HTTP returns immediately
    const work = runResearch(supabase, snapshotId!).catch(async (e) => {
      console.error("deep research failed", e);
      const message = e instanceof Error ? e.message : String(e);
      await supabase
        .from("venture_snapshots")
        .update({
          enrichment_progress: {
            stage: "error",
            progress: 0,
            message,
            updatedAt: new Date().toISOString(),
          },
        })
        .eq("id", snapshotId!);
    });

    // @ts-ignore EdgeRuntime is provided by Supabase
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(work);
    }

    return new Response(JSON.stringify({ ok: true }), {
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

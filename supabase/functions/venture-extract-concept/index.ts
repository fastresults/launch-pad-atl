// Founders Hub — enrich a venture snapshot into structured extracted_data.
// Reads concept + URL, optionally scrapes the URL (best-effort), then asks the
// Lovable AI Gateway for a structured 4-section ExtractedData object.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const SYSTEM_PROMPT = `You are an AI venture-intelligence analyst.
Given a founder's concept (and possibly a scraped web page and the founder's own uploaded source documents / URLs), produce a complete, realistic ExtractedData object.

CRITICAL RULES:
- When source material is provided, prefer extracting verbatim facts (pricing, team, processes, goals) from it over inference.
- Only infer when sources are silent on a field, and only infer plausibly from the concept.
- NEVER emit placeholder strings like "[needs founder input]", "TBD", "various", or "unknown". If a field is truly unknown, leave it as an empty string "".
- Be specific and concise.

Return ONLY valid JSON matching this exact shape (no markdown, no commentary):
{
  "foundation": { "company_name": "", "founder_name": "", "location": "", "industry": "", "concept": "", "problem": "" },
  "market":     { "target_customers": "", "value_proposition": "", "differentiators": "", "market_size": "" },
  "operations": { "revenue_model": "", "pricing": "", "key_processes": "", "team": "" },
  "vision":     { "short_term_goals": "", "long_term_goals": "", "mission": "", "vision": "" }
}`;


async function updateProgress(supabase: any, id: string, stage: string, progress: number, message: string) {
  await supabase
    .from("venture_snapshots")
    .update({
      enrichment_progress: { stage, progress, message, updatedAt: new Date().toISOString() },
    })
    .eq("id", id);
}

async function tryScrape(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 FoundersHubBot" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    // crude text extraction
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
  } catch (_e) {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { snapshotId } = await req.json();
    if (!snapshotId) return new Response(JSON.stringify({ error: "snapshotId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: snap, error: loadErr } = await supabase
      .from("venture_snapshots")
      .select("*")
      .eq("id", snapshotId)
      .maybeSingle();
    if (loadErr || !snap) throw new Error(loadErr?.message ?? "Snapshot not found");

    await updateProgress(supabase, snapshotId, "scraping", 15, "Pulling source material");
    let scraped: string | null = null;
    if (snap.website_url) scraped = await tryScrape(snap.website_url);

    await updateProgress(supabase, snapshotId, "research", 40, "Analyzing the concept");

    const userPrompt = [
      `Business concept:\n${snap.business_concept ?? ""}`,
      snap.company_name ? `Stated company name: ${snap.company_name}` : "",
      snap.website_url ? `Reference URL: ${snap.website_url}` : "",
      snap.differentiation_statement ? `Differentiation: ${snap.differentiation_statement}` : "",
      scraped ? `Scraped content:\n${scraped}` : "",
    ].filter(Boolean).join("\n\n");

    await updateProgress(supabase, snapshotId, "extraction", 65, "Generating structured brief");

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
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      throw new Error(`Gateway ${aiRes.status}: ${txt.slice(0, 200)}`);
    }

    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content ?? "{}";
    let extracted: any = {};
    try { extracted = JSON.parse(content); } catch { extracted = {}; }

    await updateProgress(supabase, snapshotId, "validation", 90, "Finalizing");

    await supabase
      .from("venture_snapshots")
      .update({
        scraped_content: scraped,
        extracted_data: extracted,
        status: "review",
        enrichment_progress: { stage: "complete", progress: 100, message: "Ready for review", updatedAt: new Date().toISOString() },
      })
      .eq("id", snapshotId);

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    try {
      const { snapshotId } = await req.clone().json().catch(() => ({}));
      if (snapshotId) {
        const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
        await supabase
          .from("venture_snapshots")
          .update({
            enrichment_progress: { stage: "error", progress: 0, message, updatedAt: new Date().toISOString() },
          })
          .eq("id", snapshotId);
      }
    } catch (_) {}
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

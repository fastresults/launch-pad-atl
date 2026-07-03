// On-demand McKinsey-grade deep assessment for a Workflow (attendee_deliverables) row.
// Mirrors `venture-generate-assessment` and now reuses the same shared
// venture-context + snapshot brain when the user has a primary snapshot, so
// the Workflow assessment quality matches the Hub assessment quality.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { compactPreamble, loadVentureContext } from "../_shared/venture-context.ts";
import { ensureSnapshotBrain } from "../_shared/snapshot-brain.ts";
import { MODELS } from "../_shared/models.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const SYSTEM_PROMPT = `You are a senior McKinsey partner producing a rigorous deep assessment of a single startup deliverable.

Produce a markdown report with these sections (use exactly these headings):
## Deep Dive

### Strategic Read
### Evidence & Assumptions Pressure-Test
### Hidden Risks & Failure Modes
### Counterfactuals & Alternatives
### 30 / 60 / 90 Day Actions
### Verdict & Quality Score

Rules:
- Be specific, numeric, and operational. Name channels, segments, dollar ranges.
- Surface uncomfortable truths. Pressure-test the deliverable's claims using the founder's brief and the other deliverables for cross-context.
- No filler, no citations, no footnotes, no apologies.
- End the report with a single line: QUALITY_SCORE: <0-100> (your honest score for the deliverable being assessed).`;

function smartExcerpt(text: string, max: number) {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n…[truncated]";
}

function stripCitations(s: string) {
  return s.replace(/\[\d+\]/g, "").replace(/\(\s*source:[^)]*\)/gi, "").trim();
}

function contentToMarkdown(c: any): string {
  if (!c) return "";
  const parts: string[] = [];
  if (c.title) parts.push(`# ${c.title}`);
  if (c.summary) parts.push(c.summary);
  for (const s of c.sections ?? []) {
    parts.push(`## ${s.heading}\n${s.body_markdown ?? ""}`);
  }
  if (c.action_items?.length) parts.push(`## Action items\n${c.action_items.map((a: string) => `- ${a}`).join("\n")}`);
  return parts.join("\n\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: ures } = await userClient.auth.getUser();
    const userId = ures?.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: "Not signed in" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { key, feedback, tags } = await req.json().catch(() => ({}));
    if (!key || typeof key !== "string") {
      return new Response(JSON.stringify({ error: "key required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const [{ data: deliv }, { data: type }, { data: all }, { data: brief }, { data: founder }, { data: market }, { data: primarySnap }] = await Promise.all([
      admin.from("attendee_deliverables").select("*").eq("user_id", userId).eq("deliverable_key", key).maybeSingle(),
      admin.from("deliverable_types").select("*").eq("key", key).maybeSingle(),
      admin.from("attendee_deliverables").select("deliverable_key, content_current").eq("user_id", userId),
      admin.from("attendee_business_brief").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("attendee_founder_profile").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("attendee_market_profile").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("venture_snapshots").select("id").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (!deliv || !deliv.content_current) {
      return new Response(JSON.stringify({ error: "Deliverable must be generated before running a deep assessment" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await admin
      .from("attendee_deliverables")
      .update({ deep_assessment_status: "generating" })
      .eq("user_id", userId)
      .eq("deliverable_key", key);

    // Prefer shared venture context + snapshot brain when the user has a
    // venture snapshot — gives Hub-grade rigor on the Workflow assessment.
    let preambleBlock = "";
    if (primarySnap?.id) {
      try {
        const ctx = await loadVentureContext(admin, primarySnap.id);
        if (!ctx.brain) ctx.brain = await ensureSnapshotBrain(admin, primarySnap.id);
        const brainBlock = ctx.brain
          ? `\n\n## Snapshot brain (authoritative compressed venture summary)\n\`\`\`json\n${JSON.stringify(ctx.brain, null, 2)}\n\`\`\``
          : "";
        preambleBlock = `${compactPreamble(ctx)}${brainBlock}`;
      } catch (e) {
        console.warn("venture context unavailable, falling back to raw brief", e);
      }
    }

    const otherBlocks: string[] = [];
    for (const row of all ?? []) {
      if (row.deliverable_key === key) continue;
      const c = row.content_current as any;
      if (!c || !c.title) continue;
      otherBlocks.push(`### ${row.deliverable_key}\n${smartExcerpt(contentToMarkdown(c), 1200)}`);
    }

    const targetMd = contentToMarkdown(deliv.content_current);
    const guidance = (feedback && String(feedback).trim()) || (Array.isArray(tags) && tags.length)
      ? `\n\n## Founder guidance for THIS deep assessment (highest priority — focus the analysis here)\n${
          Array.isArray(tags) && tags.length ? `Tags: ${tags.join(", ")}\n\n` : ""
        }${String(feedback ?? "").trim()}`
      : "";

    const userPrompt = [
      `Deliverable under review: ${type?.label ?? key}`,
      type?.description ? `Purpose: ${type.description}` : "",
      "",
      preambleBlock
        ? preambleBlock
        : `## Founder's Startup Brief\n${JSON.stringify(brief ?? {}, null, 2)}${founder ? `\n\n## Founder profile\n${JSON.stringify(founder, null, 2)}` : ""}${market ? `\n\n## Market profile\n${JSON.stringify(market, null, 2)}` : ""}`,
      otherBlocks.length ? `\n## Other completed deliverables for this founder (outline only)\n${otherBlocks.join("\n\n---\n\n")}` : "",
      `\n## The deliverable to assess (founder is reading this now)\n${targetMd}`,
      guidance,
    ].filter(Boolean).join("\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODELS.pro,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      await admin
        .from("attendee_deliverables")
        .update({ deep_assessment_status: "failed" })
        .eq("user_id", userId)
        .eq("deliverable_key", key);
      return new Response(JSON.stringify({ error: `Gateway ${aiRes.status}: ${txt.slice(0, 240)}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiJson = await aiRes.json();
    let raw = aiJson.choices?.[0]?.message?.content ?? "";

    let quality = 75;
    const qm = raw.match(/QUALITY_SCORE:\s*(\d{1,3})/i);
    if (qm) {
      quality = Math.max(0, Math.min(100, parseInt(qm[1], 10)));
      raw = raw.replace(/QUALITY_SCORE:\s*\d{1,3}\s*$/i, "").trim();
    }
    raw = stripCitations(raw);
    if (!/^##\s*McKinsey/im.test(raw)) raw = `## McKinsey-Grade Assessment\n\n${raw}`;

    await admin
      .from("attendee_deliverables")
      .update({
        deep_assessment: raw,
        deep_assessment_quality_score: quality,
        deep_assessment_status: "complete",
        deep_assessment_generated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("deliverable_key", key);

    return new Response(JSON.stringify({ ok: true, quality, assessment: raw }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// Brand Wizard AI helper: generates palette options, typography pairings,
// and the final long-form Brand Style Guide markdown. Lives separately from
// venture-generate-document so it can run cheaply and frequently.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

async function callAI(messages: any[], opts: { json?: boolean; model?: string } = {}) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Lovable-API-Key": LOVABLE_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-2.5-flash",
      messages,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI gateway ${res.status}: ${txt.slice(0, 300)}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

function snapshotBrief(snap: any, kit: any) {
  return [
    `Company: ${snap.company_name || "—"}`,
    `Industry: ${snap.industry || "—"}`,
    `Track: ${snap.track || "—"}`,
    `Concept: ${snap.concept_summary || "—"}`,
    `Value prop: ${snap.value_proposition || "—"}`,
    `Audience: ${snap.target_audience || "—"}`,
    kit?.dna ? `Personality: ${JSON.stringify(kit.dna.personality || {})}` : "",
    kit?.dna?.mood?.length ? `Mood: ${kit.dna.mood.join(", ")}` : "",
    kit?.dna?.admired?.length ? `Brands admired: ${kit.dna.admired.join(", ")}` : "",
  ].filter(Boolean).join("\n");
}

async function generatePalettes(snap: any, kit: any) {
  const sys = `You are a senior brand designer. Propose four DISTINCT brand palette directions for the venture below. Each palette gets a name, a one-sentence rationale, and six roles (bg, fg, muted, accent, primary, secondary) as #RRGGBB hex. Ensure WCAG AA contrast between fg/bg. Return JSON only.`;
  const user = `${snapshotBrief(snap, kit)}

Return JSON: { "options": [ { "name": string, "rationale": string, "mood": [string,string,string], "colors": { "bg": "#hex", "fg": "#hex", "muted": "#hex", "accent": "#hex", "primary": "#hex", "secondary": "#hex" } } ] } — exactly 4 options, visually distinct from each other.`;
  const raw = await callAI([{ role: "system", content: sys }, { role: "user", content: user }], { json: true });
  return JSON.parse(raw);
}

async function generateTypography(snap: any, kit: any) {
  const sys = `You are a typography director. Propose four DISTINCT Google Font pairings (heading + body) tailored to the brand below. Return JSON only.`;
  const user = `${snapshotBrief(snap, kit)}

Return JSON: { "options": [ { "name": string, "rationale": string, "heading": { "family": "Google Font name", "weight": 600|700|800 }, "body": { "family": "Google Font name", "weight": 400|500 } } ] } — exactly 4 pairings, visually distinct from each other. Use only fonts available on Google Fonts.`;
  const raw = await callAI([{ role: "system", content: sys }, { role: "user", content: user }], { json: true });
  return JSON.parse(raw);
}

async function generateGuide(snap: any, kit: any) {
  const sys = `You are the head of brand at a top agency writing a complete Brand Style Guide for a founder. The guide must be polished, ownable, ready to hand to designers and marketing. Use the EXACT palette, typography, mood, and voice settings provided. Output Markdown only — no JSON, no code fences except where syntax matters.`;
  const palette = kit.palette ? JSON.stringify(kit.palette, null, 2) : "(none chosen)";
  const typography = kit.typography ? JSON.stringify(kit.typography, null, 2) : "(none chosen)";
  const voice = kit.voice ? JSON.stringify(kit.voice, null, 2) : "(none provided)";
  const user = `BRAND BRIEF:
${snapshotBrief(snap, kit)}

LOCKED PALETTE:
${palette}

LOCKED TYPOGRAPHY:
${typography}

LOCKED VOICE:
${voice}

Produce a thorough Brand Style Guide in Markdown with these sections:
# {Company} — Brand Style Guide
## 1. Brand at a Glance (purpose, promise, positioning statement)
## 2. Personality & Voice (5-trait spectrum, do/don't, 3 before/after copy rewrites)
## 3. Color System (table: role | hex | RGB | usage | AA pair)
## 4. Typography (hierarchy table: H1/H2/H3/body/caption with size/weight/line-height; web + print fallback)
## 5. Logo Usage (clear-space, min size, do/don'ts, lockups)
## 6. Imagery & Moodboard (style direction, 3 image prompts for photography, 2 for illustration)
## 7. Iconography (style, stroke width, corner radius)
## 8. Motion (easing, duration, hover/scroll patterns)
## 9. Application Examples (website hero, social post, email signature, business card copy)
## 10. Voice Cheat-Sheet
## 11. File Naming & Governance

Target 1,400–1,900 words. Be specific, name the chosen fonts and hex values throughout.`;
  return await callAI([{ role: "system", content: sys }, { role: "user", content: user }], { model: "google/gemini-2.5-pro" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    const { action, snapshotId } = await req.json();
    if (!action || !snapshotId) throw new Error("action and snapshotId required");

    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const userId = userRes?.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: snap } = await supabase.from("venture_snapshots").select("*").eq("id", snapshotId).maybeSingle();
    if (!snap || snap.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: kit } = await supabase.from("venture_brand_kits").select("*").eq("snapshot_id", snapshotId).maybeSingle();

    if (action === "palettes") {
      const out = await generatePalettes(snap, kit);
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "typography") {
      const out = await generateTypography(snap, kit);
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "styleguide") {
      const md = await generateGuide(snap, kit);
      await supabase.from("venture_brand_kits").update({ guide_markdown: md, status: "locked", locked_at: new Date().toISOString() }).eq("snapshot_id", snapshotId);
      // Also push brand_tokens into the snapshot so downstream deliverables use them.
      if (kit?.palette?.colors && kit?.typography) {
        const brand_tokens = {
          colors: kit.palette.colors,
          fonts: { heading: kit.typography.heading?.family, body: kit.typography.body?.family },
          mood: kit.dna?.mood ?? [],
          radius: "md",
        };
        await supabase.from("venture_snapshots").update({ brand_tokens }).eq("id", snapshotId);
      }
      return new Response(JSON.stringify({ ok: true, markdown: md }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    throw new Error(`Unknown action: ${action}`);
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

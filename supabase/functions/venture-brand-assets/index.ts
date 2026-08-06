// Founders Hub — brand asset generator.
// Generates logo / moodboard / social images via the Lovable AI image gateway,
// grounded in the FULL venture context (snapshot + brief + sources + brain)
// and the wizard's locked palette/typography/personality.
//
// LOGOS use a two-stage Creative Director → Designer pipeline:
//   Stage 1: a chat model (multimodal with reference logos) produces a
//            structured logo design brief with 4 distinct directions.
//   Stage 2: each direction is rendered as its own image with a long,
//            art-directed prompt.

import { createClient } from "npm:@supabase/supabase-js@2";
import { loadVentureContext } from "../_shared/venture-context.ts";
import { resolveOwner } from "../_shared/impersonation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const KIND_PRESETS: Record<string, { size: string; sceneHint: string; defaultCount: number }> = {
  logo:          { size: "1024x1024", sceneHint: "", defaultCount: 4 },
  moodboard:     { size: "1024x1024", sceneHint: "editorial brand moodboard tile, evocative, tactile, art-directed, magazine quality", defaultCount: 4 },
  social_profile:{ size: "1024x1024", sceneHint: "social media profile avatar, square 1:1, centered subject, simple background", defaultCount: 1 },
  social_cover:  { size: "1536x1024", sceneHint: "social media cover banner, wide composition, leave space for an overlaid headline on the right third", defaultCount: 1 },
  launch_post:   { size: "1024x1024", sceneHint: "launch announcement social post, modern editorial layout, bold composition", defaultCount: 1 },
};

const MOODBOARD_ANGLES = [
  "Tile 1 — Texture & material: extreme close-up of a tactile surface that embodies the brand mood (paper grain, brushed metal, soft fabric, etc). No text.",
  "Tile 2 — Hero environment: a wide cinematic scene of a person or place that represents the customer's world. Natural light, editorial photography.",
  "Tile 3 — Object still life: an art-directed still life of 2–3 props that evoke the brand's category and personality. Studio lighting, clean composition.",
  "Tile 4 — Color & motion: an abstract painterly composition built from the brand's primary, secondary and accent colors. Smooth gradients, organic shapes.",
];

/* ----------------------- LOGO CREATIVE DIRECTOR ----------------------- */

type LogoDirection = {
  direction_name: string;
  logo_type: string; // wordmark | lettermark | monogram | pictorial mark | abstract mark | emblem | combination mark
  symbol_concept: string;
  construction_notes: string;
  typography_treatment: string;
  negative_space_play: string;
  color_application: string;
  reference_learning: string;
  avoid_list: string;
};

async function callChatAI(messages: any[], opts: { json?: boolean; model?: string } = {}) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-2.5-pro",
      messages,
      max_tokens: 8000,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),

  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI chat ${res.status}: ${txt.slice(0, 300)}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

async function generateLogoBrief(ctx: any, tokens: any, count: number, referenceImages?: string[]): Promise<LogoDirection[]> {
  const snap = ctx.snap;
  const brain = ctx.brain ?? {};
  const colors = tokens?.colors ?? {};
  const fonts = tokens?.fonts ?? {};
  const mood = Array.isArray(tokens?.mood) ? tokens.mood.join(", ") : "";

  const system = `You are a senior brand identity designer with 20 years at award-winning agencies (Pentagram, COLLINS, Mucca). You think in design systems before pixels. Your job: produce ${count} DISTINCT logo design directions for the venture below. Each must use a different logo TYPE and a different symbol idea — no near-duplicates. Ground every direction in the venture's actual differentiation and customer, not generic startup tropes.`;

  const ventureBlock = [
    snap.company_name ? `Brand: ${snap.company_name}` : "",
    snap.industry ? `Industry: ${snap.industry}` : "",
    snap.concept_summary ? `Concept: ${String(snap.concept_summary).slice(0, 600)}` : "",
    snap.value_proposition ? `Value prop: ${String(snap.value_proposition).slice(0, 400)}` : "",
    snap.target_audience ? `Customer: ${String(snap.target_audience).slice(0, 300)}` : "",
    snap.differentiation_statement ? `Differentiation: ${String(snap.differentiation_statement).slice(0, 300)}` : "",
    brain.problem ? `Problem: ${String(brain.problem).slice(0, 300)}` : "",
  ].filter(Boolean).join("\n");

  const tokensBlock = [
    colors.primary ? `Primary color: ${colors.primary}` : "",
    colors.secondary ? `Secondary: ${colors.secondary}` : "",
    colors.accent ? `Accent: ${colors.accent}` : "",
    fonts.heading ? `Heading font: ${fonts.heading}` : "",
    fonts.body ? `Body font: ${fonts.body}` : "",
    mood ? `Mood/personality: ${mood}` : "",
  ].filter(Boolean).join("\n");

  const refsLine = referenceImages?.length
    ? `\nThe user attached ${referenceImages.length} reference logo(s) they admire. STUDY them for: composition, proportion, stroke weight, abstraction level, wordmark style, counterforms. NEVER copy. In each direction's reference_learning, write one sentence describing what principle (not look) to borrow.`
    : `\nNo reference logos provided. Drive directions purely from the venture's positioning.`;

  const instruction = `Return STRICT JSON:
{"directions":[{"direction_name":"…","logo_type":"wordmark|lettermark|monogram|pictorial mark|abstract mark|emblem|combination mark","symbol_concept":"max 2 sentences — the metaphor/idea grounded in differentiation","construction_notes":"geometry base (grid/circle), stroke weight, corner treatment, counterforms, optical balance — 1-2 sentences","typography_treatment":"if wordmark/combination: case, tracking, weight, custom ligatures, pairing with heading font; else 'n/a'","negative_space_play":"explicit hidden-shape opportunity or 'none'","color_application":"which palette token leads, mono/duotone strategy","reference_learning":"${referenceImages?.length ? "one principle to borrow from refs (not a copy instruction)" : "n/a"}","avoid_list":"direction-specific anti-patterns (e.g. no globe, no swoosh, no leaf)"}]}

Hard rules:
- Exactly ${count} directions.
- Each must use a DIFFERENT logo_type.
- Concepts must be specific to THIS venture — reject anything that would work for a generic startup.
- Forbidden across all: gradients-as-crutch, globe, swoosh, generic leaf/checkmark, lens flare, 3D shading, "tech" hex/circuit clichés (unless venture is explicitly hardware).`;

  const userContent: any[] = [{ type: "text", text: `VENTURE\n${ventureBlock}\n\nBRAND TOKENS\n${tokensBlock}${refsLine}\n\n${instruction}` }];
  if (referenceImages?.length) {
    for (const url of referenceImages.slice(0, 3)) {
      userContent.push({ type: "image_url", image_url: { url } });
    }
  }

  // Tolerant parse: the model sometimes returns fenced JSON, a bare array, or a
  // response truncated mid-object. Salvage whatever complete directions exist.
  const parseDirections = (raw: string): LogoDirection[] => {
    const text = String(raw ?? "").replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    if (!text) return [];
    const tryJson = (s: string) => { try { return JSON.parse(s); } catch { return null; } };
    let parsed: any = tryJson(text);
    if (!parsed) {
      const obj = text.match(/\{[\s\S]*\}/);
      parsed = obj ? tryJson(obj[0]) : null;
    }
    if (!parsed) {
      const arr = text.match(/\[[\s\S]*\]/);
      parsed = arr ? tryJson(arr[0]) : null;
    }
    let list: any[] = Array.isArray(parsed) ? parsed : (parsed?.directions ?? []);
    if (!Array.isArray(list) || !list.length) {
      // Last resort: pull individual complete `{...}` blocks out of a truncated body.
      list = [...text.matchAll(/\{[^{}]*"direction_name"[^{}]*\}/g)]
        .map((m) => tryJson(m[0]))
        .filter(Boolean) as any[];
    }
    return (Array.isArray(list) ? list : []).filter((d: any) => d && d.direction_name);
  };

  const messages = [{ role: "system", content: system }, { role: "user", content: userContent }];
  let directions: LogoDirection[] = [];
  // Retry across models: 2.5-pro's thinking budget occasionally eats the whole
  // response and returns empty content. Flash is a reliable JSON fallback.
  for (const model of ["google/gemini-2.5-pro", "google/gemini-2.5-flash"]) {
    try {
      directions = parseDirections(await callChatAI(messages, { json: true, model }));
    } catch (e) {
      console.warn("creative director call failed", model, e);
    }
    if (directions.length) break;
    console.warn(`creative director returned no usable directions from ${model}`);
  }
  if (!directions.length) throw new Error("Creative Director returned no directions");
  return directions.slice(0, count);
}


function buildLogoImagePrompt(d: LogoDirection, ctx: any, tokens: any): string {
  const snap = ctx.snap ?? {};
  const colors = tokens?.colors ?? {};
  const fonts = tokens?.fonts ?? {};
  return [
    `LOGO DESIGN BRIEF — ${d.direction_name} (${d.logo_type}).`,
    snap.company_name ? `Brand: ${snap.company_name}.` : "",
    snap.industry ? `Category: ${snap.industry}.` : "",
    snap.target_audience ? `Audience: ${String(snap.target_audience).slice(0, 160)}.` : "",
    `Idea: ${d.symbol_concept}`,
    `Construction: ${d.construction_notes} Built on a clean geometric grid, optically balanced, vector-precise edges.`,
    d.typography_treatment && d.typography_treatment.toLowerCase() !== "n/a"
      ? `Typography: ${d.typography_treatment} Pair sympathetically with ${fonts.heading ?? "the heading typeface"}.`
      : "",
    d.negative_space_play && d.negative_space_play.toLowerCase() !== "none"
      ? `Negative space: ${d.negative_space_play}.`
      : "",
    `Color: ${d.color_application} from palette ${[colors.primary, colors.secondary, colors.accent].filter(Boolean).join(", ")}.`,
    d.reference_learning && d.reference_learning.toLowerCase() !== "n/a"
      ? `Reference principle (do NOT copy): ${d.reference_learning}`
      : "",
    "Output: single centered logo on pure white #FFFFFF background, no mockup, no shadow, no 3D, no photo texture, no watermark, no UI chrome, no tagline. Print-ready, scalable, monochrome-safe silhouette. High-resolution, crisp anti-aliased edges.",
    `Avoid: ${d.avoid_list}. Plus: stock clichés, gradient-as-crutch, swooshes, generic AI flourishes, lens flares, drop shadows, faux 3D, bevels.`,
  ].filter(Boolean).join(" ");
}

/* ----------------------- IMAGE GENERATION ----------------------- */

async function generateOne(prompt: string, size: string, referenceImages?: string[], model = "google/gemini-3.1-flash-image"): Promise<string> {
  const content: any[] = [{ type: "text", text: prompt }];
  if (referenceImages?.length) {
    for (const url of referenceImages.slice(0, 3)) {
      content.push({ type: "image_url", image_url: { url } });
    }
  }
  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: referenceImages?.length ? content : prompt }],
      modalities: ["image", "text"],
      size,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Image gateway ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image data returned");
  return b64;
}

function buildPromptGeneric(kind: string, ctx: any, tokens: any, extra?: string, angle?: string) {
  const snap = ctx.snap;
  const brain = ctx.brain;
  const preset = KIND_PRESETS[kind];
  const palette = tokens?.colors
    ? `Color palette: primary ${tokens.colors.primary ?? "#000"}, secondary ${tokens.colors.secondary ?? ""}, accent ${tokens.colors.accent ?? ""}.`
    : "";
  const mood = Array.isArray(tokens?.mood) ? `Mood: ${tokens.mood.join(", ")}.` : "";
  const fonts = tokens?.fonts ? `Typography reference: ${tokens.fonts.heading ?? ""} / ${tokens.fonts.body ?? ""}.` : "";
  const industry = snap.industry ? `Industry: ${snap.industry}.` : "";
  const company = snap.company_name ? `Brand: ${snap.company_name}.` : "";
  const concept = snap.concept_summary ? `Concept: ${String(snap.concept_summary).slice(0, 220)}.` : "";
  const audience = snap.target_audience ? `Customer: ${String(snap.target_audience).slice(0, 180)}.` : "";
  const diff = snap.differentiation_statement ? `Differentiation: ${String(snap.differentiation_statement).slice(0, 180)}.` : "";
  const problem = brain?.problem ? `Problem solved: ${String(brain.problem).slice(0, 180)}.` : "";
  return [
    preset.sceneHint, angle ?? "", company, industry, concept, audience, diff, problem,
    palette, mood, fonts, extra ?? "",
    "Avoid: stock photo clichés, watermarks, generic AI flourishes.",
  ].filter(Boolean).join(" ");
}

async function uploadAsset(supabase: any, snapshotId: string, userId: string, kind: string, b64: string, prompt: string) {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const path = `${userId}/brand/${snapshotId}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.png`;
  const { error: upErr } = await supabase.storage.from("user-media").upload(path, bytes, {
    contentType: "image/png",
    upsert: false,
  });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
  const { data: signed } = await supabase.storage.from("user-media").createSignedUrl(path, 60 * 60 * 24 * 7);
  try {
    await supabase.from("media_assets").insert({
      user_id: userId,
      storage_path: path,
      bucket: "user-media",
      kind: "image",
      mime_type: "image/png",
      tags: ["brand_kit", `snapshot:${snapshotId}`, kind],
      title: `${kind} — ${new Date().toLocaleDateString()}`,
      description: prompt.slice(0, 240),
    });
  } catch { /* table shape mismatch is non-fatal */ }
  return { path, url: signed?.signedUrl };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    const body = await req.json();
    const { snapshotId, kind = "logo", count, extra, referenceImages, regenerateDirection } = body ?? {};
    if (!snapshotId) throw new Error("snapshotId required");
    const preset = KIND_PRESETS[kind];
    if (!preset) throw new Error(`Unknown kind: ${kind}`);

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    let userId = userRes?.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Impersonation: an admin may act on a member's behalf (validated server-side).
    const actorId = userId;
    const _own = await resolveOwner(req, actorId, userClient, corsHeaders);
    if (_own.error) return _own.error;
    userId = _own.userId;

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const ctx = await loadVentureContext(supabase, snapshotId);
    const snap = ctx.snap;
    if (!snap) return new Response(JSON.stringify({ error: "Snapshot not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (snap.user_id !== userId) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: kit } = await supabase.from("venture_brand_kits").select("palette, typography, dna, logos, moodboard").eq("snapshot_id", snapshotId).maybeSingle();
    const tokens = {
      colors: kit?.palette?.colors ?? snap.brand_tokens?.colors,
      fonts: kit?.typography ? { heading: kit.typography.heading?.family, body: kit.typography.body?.family } : snap.brand_tokens?.fonts,
      mood: kit?.dna?.mood ?? kit?.dna?.personality ?? snap.brand_tokens?.mood,
    };

    const n = Math.max(1, Math.min(4, count ?? preset.defaultCount));
    const results: any[] = [];

    if (kind === "logo") {
      // Stage 1 — Creative Director brief (skip if regenerating a single direction)
      const directions: LogoDirection[] = regenerateDirection
        ? [regenerateDirection as LogoDirection]
        : await generateLogoBrief(ctx, tokens, n, referenceImages);

      // Stage 2 — render one image per direction
      for (let idx = 0; idx < directions.length; idx++) {
        const d = directions[idx];
        const prompt = buildLogoImagePrompt(d, ctx, tokens);
        try {
          const b64 = await generateOne(prompt, preset.size, referenceImages, "google/gemini-3-pro-image");
          const up = await uploadAsset(supabase, snapshotId, userId, "logo", b64, prompt);
          results[idx] = {
            ok: true,
            prompt,
            ...up,
            direction_name: d.direction_name,
            logo_type: d.logo_type,
            symbol_concept: d.symbol_concept,
            direction: d,
            created_at: new Date().toISOString(),
          };
        } catch (e) {
          results[idx] = { ok: false, error: e instanceof Error ? e.message : String(e), direction_name: d.direction_name };
        }
      }
    } else {
      // Generic kinds: moodboard / social
      let i = 0;
      async function worker() {
        while (i < n) {
          const myIdx = i++;
          const angle = kind === "moodboard" ? MOODBOARD_ANGLES[myIdx % MOODBOARD_ANGLES.length] : undefined;
          const prompt = buildPromptGeneric(kind, ctx, tokens, extra, angle);
          try {
            const b64 = await generateOne(prompt, preset.size);
            const up = await uploadAsset(supabase, snapshotId, userId, kind, b64, prompt);
            results[myIdx] = { ok: true, prompt, ...up };
          } catch (e) {
            results[myIdx] = { ok: false, error: e instanceof Error ? e.message : String(e) };
          }
        }
      }
      await Promise.all([worker(), worker()]);
    }

    // Persist into the brand kit so the live preview & guide pick them up.
    try {
      const fresh = results.filter((r) => r?.ok).map((r) => {
        if (kind === "logo") {
          return {
            url: r.url, path: r.path,
            direction_name: r.direction_name, logo_type: r.logo_type,
            symbol_concept: r.symbol_concept, prompt: r.prompt,
            created_at: r.created_at,
          };
        }
        return { url: r.url, path: r.path };
      });
      if (fresh.length) {
        const column = kind === "moodboard" ? "moodboard" : kind === "logo" ? "logos" : null;
        if (column && kit) {
          const existing = Array.isArray((kit as any)[column]) ? (kit as any)[column] : [];
          const next = [...fresh, ...existing].slice(0, 8);
          await supabase.from("venture_brand_kits").update({ [column]: next }).eq("snapshot_id", snapshotId);
        }
      }
    } catch { /* non-fatal */ }

    return new Response(JSON.stringify({ ok: true, kind, assets: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

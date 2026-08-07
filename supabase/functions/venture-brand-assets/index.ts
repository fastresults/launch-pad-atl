// Founders Hub — brand asset generator.
// Generates logo / moodboard / social images via the Lovable AI image gateway,
// grounded in the FULL venture context (snapshot + brief + sources + brain)
// and the wizard's locked palette/typography/personality.
//
// LOGO STUDIO pipeline (rebuilt — references first, vector last):
//   0 inspiration gate  three reference logos are REQUIRED to start a run.
//   1 reference read    vision pass over the references -> craft spec
//                       (structure only, never subject matter).
//   2 business read     the founder's finished copy -> business profile
//                       (category, customer, symbol vocabulary, cliché ban).
//   3 concepting        eight ideas, cut to four, each obeying 1 + 2.
//   4 render            reference-conditioned image render of each concept.
//   5 jury              vision critique vs. the craft spec; one corrective
//                       re-render, then the mark is published as-is.
//   6 vectorize         runs ONLY on the mark the founder approves, tracing
//                       that exact image — nothing is auto-redrawn.

import { createClient } from "npm:@supabase/supabase-js@2";
import { loadVentureContext } from "../_shared/venture-context.ts";
import { resolveOwner } from "../_shared/impersonation.ts";
import {
  applyConstruction,
  lintVectorSpec,
  renderLogoSvg,
  type Construction,
  type VectorSpec,
} from "../_shared/logo-geometry.ts";
import { fontStackFor, outlineWordmark } from "../_shared/logo-type.ts";
import {
  HiggsfieldError,
  checkHiggsfieldAuth,
  fetchRenderBytes,
  higgsfieldConfigured,
  isCreditExhaustion,
  probeHiggsfield,
  renderLogoConcept,
} from "../_shared/higgsfield.ts";
import {
  buildLogoRenderPrompt,
  logoNegativePrompt,
  seedForConcept,
} from "../_shared/logo-render-prompt.ts";
import {
  REFERENCE_READ_INSTRUCTION,
  REFERENCE_READ_SYSTEM,
  craftSpecBlock,
  parseCraftSpec,
  type CraftSpec,
} from "../_shared/logo-reference-read.ts";
import {
  BUSINESS_READ_SYSTEM,
  businessProfileBlock,
  businessReadPrompt,
  parseBusinessProfile,
  type BusinessProfile,
} from "../_shared/logo-business-read.ts";
import {
  JURY_SYSTEM,
  juryInstruction,
  parseJuryVerdict,
} from "../_shared/logo-jury.ts";


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

// An agency process, not a single prompt:
//   1. Strategy    — read the venture's real assets, write a one-page brief.
//   2. Concepts    — generate 10 candidates, self-score, return the best 4.
//   3. Execution   — render each as a flat vector MARK (not a picture).
//   4. Critique    — look at what actually came back; retry the failures once.

type LogoDirection = {
  direction_name: string;
  logo_type: string; // wordmark | lettermark | monogram | pictorial mark | abstract mark | emblem | combination mark
  human_link?: string;      // how this mark traces back to the human moment
  one_line_idea?: string;   // the single shape idea, one sentence
  geometric_operation?: string; // the one construction move that creates the mark
  craft_move?: string;      // counterform | continuous stroke | tangent | ligature | negative space
  moodboard_link?: string;  // which moodboard tile's form language it inherits
  why_memorable?: string;   // the rationale a founder can judge

  symbol_concept: string;
  construction_notes: string;
  typography_treatment: string;
  negative_space_play: string;
  color_application: string;
  reference_learning: string;
  avoid_list: string;
  scores?: Record<string, number>;
};

type BrandStrategy = {
  // The human truth comes first: identity work that starts at geometry
  // produces geometry. Identity work that starts at a person produces a mark.
  human_truth?: string;      // who this is for, in their own terms
  human_moment?: string;     // the moment the business exists to fix
  first_feeling?: string;    // what a customer should feel in two seconds
  physical_anchor?: string;  // the one object, gesture or space that moment lives in
  core_idea: string;
  attributes: string[];
  metaphor_territory: string;
  not_list: string[];
};


// Chat models used for the thinking passes, in fallback order. Judgment work
// (strategy, concepting, drawing) runs on the frontier tier; flash stays last
// so a provider hiccup degrades quality instead of losing the run.
const THINK_MODELS = ["openai/gpt-5.5", "google/gemini-3.1-pro-preview", "google/gemini-3.6-flash"];
// Vector JSON and vision review need deterministic, bounded latency. Starting
// these atomic stages with the long-reasoning strategy model consumed the full
// function budget before fallback could run.
const VECTOR_MODELS = ["google/gemini-3.6-flash", "google/gemini-3.1-pro-preview"];
const REVIEW_MODEL = "google/gemini-3.6-flash";

// Documents that actually carry brand signal, in priority order.
const STRATEGY_DOC_TYPES = [
  "positioning_statement",
  "brand_voice_guide",
  "naming_and_domain",
  "value_proposition",
  "icp_profile",
  "messaging_matrix",
  "elevator_pitch",
  "offer_and_pricing",
];

/** fetch with a hard deadline — a hung upstream must never eat the request window. */
async function fetchWithTimeout(url: string, init: RequestInit, ms: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function callChatAI(messages: any[], opts: { json?: boolean; model?: string; timeoutMs?: number } = {}) {
  const model = opts.model ?? THINK_MODELS[0];
  const isOpenAI = model.startsWith("openai/");
  const res = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      // GPT-5 family rejects max_tokens and any non-default temperature.
      ...(isOpenAI ? { max_completion_tokens: 8000 } : { max_tokens: 8000 }),
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  }, opts.timeoutMs ?? 60_000);

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI chat ${res.status}: ${txt.slice(0, 300)}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}


// Tolerant parse: models return fenced JSON, a bare array, or a body truncated
// mid-object. Salvage whatever is complete rather than failing the whole run.
function parseJsonLoose(raw: string): any {
  const text = String(raw ?? "").replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  if (!text) return null;
  const tryJson = (s: string) => { try { return JSON.parse(s); } catch { return null; } };
  return tryJson(text)
    ?? tryJson(text.match(/\{[\s\S]*\}/)?.[0] ?? "")
    ?? tryJson(text.match(/\[[\s\S]*\]/)?.[0] ?? "")
    ?? null;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const value = error as Record<string, unknown>;
    const parts = [value.message, value.details, value.hint, value.code]
      .filter((item) => typeof item === "string" && item.trim())
      .map(String);
    if (parts.length) return parts.join(" — ");
    try { return JSON.stringify(error); } catch { /* fall through */ }
  }
  return "Unknown logo generation error";
}

async function callChatJson(messages: any[]): Promise<any> {
  for (const model of THINK_MODELS) {
    try {
      const parsed = parseJsonLoose(await callChatAI(messages, { json: true, model }));
      if (parsed) return parsed;
      console.warn(`no usable JSON from ${model}`);
    } catch (e) {
      console.warn("chat json call failed", model, e);
    }
  }
  return null;
}

async function callChatJsonOnce(messages: any[]): Promise<any> {
  let lastError: unknown = null;
  for (const model of THINK_MODELS) {
    try {
      const parsed = parseJsonLoose(await callChatAI(messages, { json: true, model }));
      if (parsed) return parsed;
      lastError = new Error(`AI returned malformed structured output (${model})`);
    } catch (e) {
      lastError = e;
      console.warn("structured call failed", model, e instanceof Error ? e.message : e);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("AI returned malformed structured output");
}

async function uploadVectorAsset(supabase: any, snapshotId: string, userId: string, directionId: string, svg: string, variant = "mark") {
  const path = `${userId}/brand/${snapshotId}/logo-${directionId}-${variant}.svg`;
  const bytes = new TextEncoder().encode(svg);
  const { error } = await supabase.storage.from("user-media").upload(path, bytes, { contentType: "image/svg+xml", upsert: true });
  if (error) throw new Error(`Vector upload failed: ${error.message}`);
  const { data: signed } = await supabase.storage.from("user-media").createSignedUrl(path, 60 * 60 * 24 * 7);
  return { path, url: signed?.signedUrl };
}

function classifyError(error: unknown): string {
  const message = errorMessage(error);
  if (/429|rate/i.test(message)) return "rate_limit";
  if (/402|credit/i.test(message)) return "credits";
  if (/abort|timeout/i.test(message)) return "provider_timeout";
  if (/structured|json|vector/i.test(message)) return "invalid_output";
  if (/upload|storage/i.test(message)) return "storage";
  return "provider_error";
}

function normalizeVectorNode(value: any): any | null {
  if (!value || typeof value !== "object") return null;
  const rawKind = String(value.kind ?? value.type ?? value.shape ?? "").toLowerCase();
  const aliases: Record<string, string> = {
    rectangle: "rect", rounded_rectangle: "rect", roundedrect: "rect",
    circular: "circle", oval: "ellipse", polygon: "path", bezier: "path",
    g: "group",
  };
  const kind = aliases[rawKind] ?? rawKind;
  if (!["rect", "circle", "ellipse", "line", "path", "group"].includes(kind)) return null;
  const node = { ...value, kind };
  if (kind === "ellipse") {
    node.rxr = node.rxr ?? node.rx;
    node.ryr = node.ryr ?? node.ry;
  }
  if (kind === "path") node.d = node.d ?? node.path ?? node.pathData;
  if (kind === "group") {
    const children = node.children ?? node.elements ?? node.primitives ?? node.nodes ?? [];
    node.children = Array.isArray(children) ? children.map(normalizeVectorNode).filter(Boolean) : [];
    if (!node.children.length) return null;
  }
  return node;
}

/** Accept common structured-output wrappers/aliases without weakening SVG safety. */
function normalizeVectorResponse(parsed: any): { root: any; primitives: any[] } | null {
  const candidates = [
    parsed,
    parsed?.vector_spec,
    parsed?.vectorSpec,
    parsed?.spec,
    parsed?.logo,
    parsed?.result,
    parsed?.output,
    parsed?.data,
  ];
  for (const root of candidates) {
    if (!root || typeof root !== "object") continue;
    const raw = root.primitives ?? root.elements ?? root.shapes ?? root.nodes ?? root.paths;
    if (!Array.isArray(raw)) continue;
    const primitives = raw.map(normalizeVectorNode).filter(Boolean);
    if (primitives.length) return { root, primitives };
  }
  return null;
}

async function requestVectorResponse(messages: any[]): Promise<{ root: any; primitives: any[] }> {
  const failures: string[] = [];
  for (const model of VECTOR_MODELS) {
    // A full vector spec is a long structured generation; 60s clipped it mid-
    // stream, so each model gets a real window plus one retry on a timeout.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const raw = await callChatAI(messages, { json: true, model, timeoutMs: 150_000 });
        const parsed = parseJsonLoose(raw);
        const normalized = normalizeVectorResponse(parsed);
        if (normalized) return normalized;
        failures.push(`${model}: structured response contained no supported vector elements`);
        console.warn("invalid vector response", model, String(raw).slice(0, 240));
        break;
      } catch (error) {
        const msg = errorMessage(error);
        console.warn("vector call failed", model, `attempt ${attempt + 1}`, msg);
        const retryable = /abort|timeout|429|502|503|504/i.test(msg);
        if (retryable && attempt === 0) continue;
        failures.push(`${model}: ${msg}`);
        break;
      }
    }
  }

  throw new Error(`Logo designer returned no drawable vector after provider fallbacks. ${failures.join(" | ").slice(0, 700)}`);
}

/** Pull the venture's finished brand documents so strategy is grounded in real work. */
async function loadBrandDocs(supabase: any, snapshotId: string): Promise<string> {
  const { data: docs } = await supabase
    .from("venture_documents")
    .select("document_type, content")
    .eq("snapshot_id", snapshotId)
    .eq("status", "complete");
  const byType = new Map<string, string>();
  for (const d of docs ?? []) {
    if (typeof d?.content === "string" && d.content.trim()) byType.set(d.document_type, d.content);
  }
  const picked: string[] = [];
  for (const t of STRATEGY_DOC_TYPES) {
    const c = byType.get(t);
    if (c) picked.push(`### ${t}\n${c.slice(0, 2500)}`);
  }
  return picked.join("\n\n");
}

/**
 * Fresh signed URLs for the venture's live moodboard tiles. Stored signed URLs
 * expire after a week, so re-sign from the storage path before handing them to
 * a vision model.
 */
async function moodboardImageUrls(supabase: any, kit: any): Promise<string[]> {
  const tiles = Array.isArray(kit?.moodboard) ? kit.moodboard : [];
  const urls: string[] = [];
  for (const tile of tiles.slice(0, 4)) {
    const path = typeof tile?.path === "string" ? tile.path : "";
    if (path) {
      try {
        const { data } = await supabase.storage.from("user-media").createSignedUrl(path, 60 * 30);
        if (data?.signedUrl) { urls.push(data.signedUrl); continue; }
      } catch { /* fall back to the stored URL */ }
    }
    if (typeof tile?.url === "string" && tile.url.startsWith("http")) urls.push(tile.url);
  }
  return urls;
}

function ventureBlockOf(ctx: any): string {

  const snap = ctx.snap ?? {};
  const brain = ctx.brain ?? {};
  return [
    snap.company_name ? `Brand name: ${snap.company_name}` : "",
    snap.industry ? `Industry: ${snap.industry}${snap.sub_industry ? ` / ${snap.sub_industry}` : ""}` : "",
    [snap.city, snap.region].filter(Boolean).length ? `Location: ${[snap.city, snap.region].filter(Boolean).join(", ")}` : "",
    snap.concept_summary ? `Concept: ${String(snap.concept_summary).slice(0, 900)}` : "",
    snap.value_proposition ? `Value prop: ${String(snap.value_proposition).slice(0, 500)}` : "",
    snap.target_audience ? `Customer: ${String(snap.target_audience).slice(0, 400)}` : "",
    snap.differentiation_statement ? `Differentiation: ${String(snap.differentiation_statement).slice(0, 400)}` : "",
    brain.problem ? `Problem solved: ${String(brain.problem).slice(0, 400)}` : "",
  ].filter(Boolean).join("\n");
}

function tokensBlockOf(tokens: any): string {
  const colors = tokens?.colors ?? {};
  const fonts = tokens?.fonts ?? {};
  const mood = Array.isArray(tokens?.mood) ? tokens.mood.join(", ") : "";
  return [
    colors.primary ? `Primary color: ${colors.primary}` : "",
    colors.secondary ? `Secondary: ${colors.secondary}` : "",
    colors.accent ? `Accent: ${colors.accent}` : "",
    fonts.heading ? `Heading font: ${fonts.heading}` : "",
    fonts.body ? `Body font: ${fonts.body}` : "",
    mood ? `Mood/personality: ${mood}` : "",
  ].filter(Boolean).join("\n");
}

/** Stage 1 — the human truth first, then the one-page brief every concept serves. */
export async function buildBrandStrategy(ctx: any, tokens: any, docsBlock: string): Promise<BrandStrategy | null> {
  const system = `You are the strategy director at a brand identity studio. Before you write a single design word you write down the human being at the centre of the business: who they are, the moment in their life this business exists for, and how they should feel. Only then do you write the brief. You are ruthless about specificity: a brief that could describe any company in this category is a failed brief, and an abstract "empowerment / innovation / trust" brief is a failed brief.`;
  const user = `Read the venture below. First find the humanity in it, then write its identity brief.

VENTURE
${ventureBlockOf(ctx)}

BRAND TOKENS
${tokensBlockOf(tokens)}

${docsBlock ? `FINISHED BRAND ASSETS (the founder's own words — treat as authoritative)\n${docsBlock}` : ""}

Return STRICT JSON:
{"human_truth":"one sentence naming the actual person this serves, in concrete human terms — not a demographic","human_moment":"the specific moment in that person's day or life this business exists to fix","first_feeling":"what that person should feel in the first two seconds of seeing this brand — one plain phrase","physical_anchor":"the ONE real object, gesture, tool or space that moment physically lives in — something you could photograph","core_idea":"one sentence — the single idea the mark must carry","attributes":["three adjectives, no synonyms of each other"],"metaphor_territory":"the ONE visual territory worth mining, drawn from the physical anchor, and why","not_list":["4-6 things this brand must never look like — name the category clichés specifically"]}`;

  const parsed = await callChatJsonOnce([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
  if (!parsed?.core_idea) return null;
  return {
    human_truth: parsed.human_truth ? String(parsed.human_truth) : undefined,
    human_moment: parsed.human_moment ? String(parsed.human_moment) : undefined,
    first_feeling: parsed.first_feeling ? String(parsed.first_feeling) : undefined,
    physical_anchor: parsed.physical_anchor ? String(parsed.physical_anchor) : undefined,
    core_idea: String(parsed.core_idea),
    attributes: Array.isArray(parsed.attributes) ? parsed.attributes.map(String) : [],
    metaphor_territory: String(parsed.metaphor_territory ?? ""),
    not_list: Array.isArray(parsed.not_list) ? parsed.not_list.map(String) : [],
  };
}


function strategyBlockOf(strategy: BrandStrategy | null): string {
  if (!strategy) return "";
  return [
    "HUMAN TRUTH (start here — the mark exists to make this person feel something)",
    strategy.human_truth ? `Who: ${strategy.human_truth}` : "",
    strategy.human_moment ? `The moment: ${strategy.human_moment}` : "",
    strategy.first_feeling ? `First feeling: ${strategy.first_feeling}` : "",
    strategy.physical_anchor ? `Physical anchor: ${strategy.physical_anchor}` : "",
    "",
    "STRATEGY BRIEF (every concept must serve this)",
    `Core idea: ${strategy.core_idea}`,
    `Attributes: ${strategy.attributes.join(", ")}`,
    `Metaphor territory: ${strategy.metaphor_territory}`,
    `Must never look like: ${strategy.not_list.join("; ")}`,
  ].filter(Boolean).join("\n");
}

/** The universal amateur tells. Named explicitly because models default to them. */
const BANNED_FORMS = `- A cluster of rounded squares, a plus/cross of blocks, or any "app-icon grid" arrangement.
- A letter sitting inside a box, circle or shield with nothing else happening.
- Dots joined by lines (node/network/constellation clip-art).
- Globes, swooshes, generic leaves, checkmarks, handshakes, lightbulbs, puzzle pieces, upward arrows, speech bubbles, location pins.
- Gradient-as-idea, bevels, drop shadows, lens flare, faux 3D.
- Circuit boards, hexagons or "AI orbs" unless the venture is literally hardware.
- Anything that would still work, unchanged, for a different company in this category.`;

/** Stage 2 — generate wide, then cut. Only the strongest concepts survive. */
async function generateLogoConcepts(
  ctx: any,
  tokens: any,
  count: number,
  strategy: BrandStrategy | null,
  docsBlock: string,
  referenceImages?: string[],
  moodboardImages?: string[],
): Promise<LogoDirection[]> {
  const system = `You are a brand identity designer whose work gets posted to Dribbble's award feed and wins there. Pentagram, COLLINS, Chermayeff & Geismar lineage. You design MARKS with a point of view: one idea, drawn with real craft — a continuous contour, a true counterform, a ligature, a shared tangent — never a pile of primitive shapes. You start from the human being in the brief, not from geometry. You generate widely, then kill almost all of your own work.`;

  const strategyBlock = strategyBlockOf(strategy);

  const refsLine = referenceImages?.length
    ? `\nThe founder attached ${referenceImages.length} reference logo(s) they admire. Study them ONLY for structural principles — proportion, stroke weight, level of abstraction, counterform, wordmark tracking. Never restyle or echo their subject matter. State the borrowed principle in reference_learning.`
    : `\nNo logo references provided. Drive every concept from the human truth and the brief.`;

  const moodLine = moodboardImages?.length
    ? `\nThe brand's LIVE MOODBOARD is attached as ${moodboardImages.length} image(s). This is the visual world the brand already lives in. Read its form language — is it soft or hard, organic or engineered, warm or cool, dense or airy — and build marks that belong in it. Name the tile each direction inherits from in moodboard_link.`
    : `\nNo moodboard available; infer the visual world from the palette and personality tokens.`;

  const instruction = `PROCESS — follow it exactly:
1. Silently write the human moment in your own words, and picture the physical anchor.
2. Silently generate 12 candidate marks across different logo types, each one a different way of drawing that moment.
3. Score each 1-5 on: distinctiveness, craft (is there a real drawing move, or is it assembled from primitives?), relevance to the human truth, scalability at 16px, memorability.
4. Kill every candidate that is merely tidy. The bar is: would a working identity designer publish this and be proud of it?
5. Return ONLY the ${count} strongest survivors, each a DIFFERENT logo_type and a genuinely different form family.

Return STRICT JSON:
{"directions":[{"direction_name":"short evocative name","logo_type":"wordmark|lettermark|monogram|pictorial mark|abstract mark|emblem|combination mark","human_link":"one sentence tracing this mark back to the human moment","one_line_idea":"the shape, in ONE sentence a designer could draw from","geometric_operation":"the SINGLE drawing move that creates the mark, e.g. 'one continuous stroke folded back on itself' or 'a circle cut by two mirrored arcs'","craft_move":"the deliberate craft decision: counterform | continuous stroke | shared tangent | ligature | negative-space read","moodboard_link":"which moodboard tile's form language this inherits, or 'n/a'","why_memorable":"one sentence on why it sticks","symbol_concept":"max 2 sentences — the metaphor grounded in the human truth","construction_notes":"proportion system, stroke-to-height ratio, curve quality, terminals, counterforms, optical balance","typography_treatment":"for wordmark/lettermark/combination: case, tracking, weight, ligature; else 'n/a'","negative_space_play":"the hidden shape, or 'none'","color_application":"which palette token leads; flat 1-2 colour strategy","reference_learning":"${referenceImages?.length ? "the structural principle borrowed" : "n/a"}","avoid_list":"direction-specific anti-patterns","scores":{"distinctiveness":5,"craft":5,"relevance":5,"scalability":5,"memorability":5}}]}

Hard rules:
- Exactly ${count} directions, each a different logo_type and a different form family. Four variations of one shape is a failed submission.
- Every mark must be drawable as flat vector art in 1-2 flat colours. No scenes, no illustrations, no rendered detail, no depth.
- Every mark must have ONE named craft move. "Three shapes arranged neatly" is not a craft move.
- Curves, arcs and continuous contours are the default vocabulary. Rectilinear construction is allowed only when the human truth genuinely demands it, and never for more than one of the ${count} directions.
- Reject anything on the venture's own "must never look like" list; it outranks your instincts.
- Never propose any of these:
${BANNED_FORMS}`;

  const userContent: any[] = [{
    type: "text",
    text: `VENTURE\n${ventureBlockOf(ctx)}\n\nBRAND TOKENS (the live palette and type this mark will live in)\n${tokensBlockOf(tokens)}\n\n${strategyBlock}\n\n${docsBlock ? `FOUNDER'S OWN BRAND ASSETS\n${docsBlock.slice(0, 6000)}\n\n` : ""}${moodLine}\n${refsLine}\n\n${instruction}`,
  }];
  for (const url of (moodboardImages ?? []).slice(0, 4)) {
    userContent.push({ type: "image_url", image_url: { url } });
  }
  if (referenceImages?.length) {
    for (const url of referenceImages.slice(0, 3)) {
      userContent.push({ type: "image_url", image_url: { url } });
    }
  }

  const parsed = await callChatJsonOnce([
    { role: "system", content: system },
    { role: "user", content: userContent },
  ]);
  const list: any[] = Array.isArray(parsed) ? parsed : (parsed?.directions ?? []);
  const directions = (Array.isArray(list) ? list : []).filter((d: any) => d && d.direction_name);
  if (!directions.length) throw new Error("Creative Director returned no directions");
  return directions.slice(0, count) as LogoDirection[];
}

/**
 * The dossier is the single source of context every pass reads: the human
 * truth, the brief, the venture, the live tokens and the founder's own assets.
 */
function buildDossier(ctx: any, tokens: any, strategy: BrandStrategy | null, docsBlock: string): string {
  return [
    "VENTURE", ventureBlockOf(ctx),
    "", "BRAND TOKENS", tokensBlockOf(tokens),
    strategy ? `\n${strategyBlockOf(strategy)}` : "",
    docsBlock ? `\nFOUNDER'S OWN BRAND ASSETS (authoritative)\n${docsBlock.slice(0, 6000)}` : "",
  ].filter(Boolean).join("\n");
}


const DRAW_SYSTEM = `You are a mark-maker in the tradition of Chermayeff & Geismar, Paul Rand and Michael Bierut, and you draw in raw SVG path data the way other designers draw with a pen. You do not assemble logos out of primitive blocks — you draw one considered contour with clean curve continuity, one stroke weight, intentional terminals and a counterform worth looking at. Every mark is a single idea that holds as a solid black silhouette at 16 pixels, and is good enough to be published in a design annual. Return valid JSON only. Never use gradients, filters, masks, images, scripts or external URLs.`;

function drawInstruction(
  d: LogoDirection,
  dossier: string,
  companyName: string,
  wantsType: boolean,
  fixNotes: string[],
  hasRender = false,
): string {
  return `${hasRender
    ? `Reproduce the approved mark in the attached image as a finished 1000×1000 vector. The image is the design decision — it has already been approved. Your job is faithful reconstruction in clean paths, NOT reinterpretation.

HOW TO TRACE IT
- Match the silhouette, proportion, counterforms, and stroke rhythm of the attached image as closely as the primitive vocabulary allows.
- Where the raster is soft or imprecise, resolve it into the cleanest confident curve — tighten the drawing, never redesign it.
- Ignore any anti-aliasing artefacts, background texture, or stray marks in the image.
- If the image contains lettering, do NOT trace it; reproduce the symbol only.
- Keep the same visual weight and optical balance. Do not add elements the image does not have, and do not remove any it does.

The written direction below is context for what the mark means — the image outranks it wherever they disagree.`
    : `Draw the approved direction below as a finished 1000×1000 vector mark. You are drawing, not assembling — the result has to look like a designer's hand made it.`}


${dossier}

APPROVED DIRECTION
${JSON.stringify(d)}

HOW TO DRAW IT
- Lead with path geometry. A single well-drawn contour beats six stacked primitives. Target 1–5 elements; 12 is a hard ceiling.
- Path commands available: M L H V C S Q T A Z. Build curves with C/S/Q and true circles with A. Curves are the default vocabulary.
- Use fillRule "evenodd" on a path to cut a counterform out of a solid shape — that is how negative-space ideas are made.
- Use group + transform (translate / rotate / scale) for mirrored or rotationally repeated construction instead of hand-placing duplicates.
- Circle, ellipse, rect and line exist for the rare case where the pure form IS the idea. If your mark is mostly rects, you have failed this brief.
- Coordinates are free — they are NOT snapped to a grid. Place points where the drawing needs them, including off-round values for optical correction.
- Every stroked element uses the identical stroke_weight. Never mix thick and thin.
- Build the symbol anywhere in 0..1000; it is optically re-centred and scaled afterwards, so proportion matters, absolute position does not.
- Colour: fill/stroke from primary | secondary | accent | white | none. Two inks maximum plus white. Flat only, no gradients.

CRAFT CONTRACT — declare it, then obey it
- stroke_weight: the ONE weight for every stroked element
- radii: the small family of corner radii allowed (keep it to one or two values)
- symmetry: the axis or rotation the construction is built on ("vertical mirror", "90° rotation", "none")
- The direction's craft move (${d.craft_move ?? d.geometric_operation ?? "the single drawing move"}) must be visibly present in the geometry.

OPTICAL DISCIPLINE
- Curves and points overshoot flat edges slightly; circles read smaller than squares of the same measure — compensate.
- Curve continuity matters: tangents must meet cleanly, terminals must be intentional.
- Counterforms (the holes) must be as considered as the positive shapes.
- The silhouette must read as ONE idea at 16px. If two ideas compete, cut one.

NEVER DRAW
${BANNED_FORMS}

${wantsType ? `WORDMARK: include wordmark with text exactly "${companyName}", a case, weight 300–800, and tracking in 1/1000 em (−40 to 120). It is set in the brand's real typeface and outlined at render time, so specify treatment, not a font name.` : "WORDMARK: omit it entirely — this is a symbol-only direction."}

${fixNotes.length ? `THE PREVIOUS ATTEMPT WAS REJECTED. Fix exactly these, changing nothing else that already worked:\n- ${fixNotes.join("\n- ")}` : ""}

Return STRICT JSON (the path below is only a shape hint — draw your own):
{"construction":{"module":10,"stroke_weight":88,"radii":[0],"symmetry":"vertical mirror"},"primitives":[{"kind":"path","d":"M 500 140 C 700 140 860 300 860 500 C 860 700 700 860 500 860 C 380 860 300 780 300 660 C 300 540 400 470 520 470","fill":"none","stroke":"primary","strokeWidth":88}]${wantsType ? `,"wordmark":{"text":"${companyName}","case":"upper","weight":600,"tracking":40}` : ""},"rationale":"one sentence naming the single drawing move that creates the mark","quality_scores":{"relevance":5,"distinctiveness":5,"craft":5,"scalability":5,"balance":5}}
Scores are 1-5 and must be honest.`;

}

/**
 * Stage 3 — draw the mark, then discipline it. The model gets one corrective
 * pass driven by the deterministic lint, so geometry errors never ship.
 */
async function developVectorSpec(
  d: LogoDirection,
  strategy: BrandStrategy | null,
  ctx: any,
  tokens: any,
  dossier: string,
  reviewNote?: string,
  renderUrl?: string | null,
): Promise<{ spec: VectorSpec; lint: ReturnType<typeof lintVectorSpec> }> {
  const companyName = String(ctx?.snap?.company_name ?? "").trim();
  const wantsType = /wordmark|lettermark|monogram|combination|emblem/i.test(d.logo_type ?? "");
  const fixNotes = reviewNote ? [reviewNote] : [];
  let best: { spec: VectorSpec; lint: ReturnType<typeof lintVectorSpec> } | null = null;
  const hasRender = typeof renderUrl === "string" && renderUrl.length > 0;

  for (let pass = 0; pass < 2; pass++) {
    const instruction = drawInstruction(d, dossier, companyName, wantsType, fixNotes, hasRender);
    const userContent = hasRender
      ? [
          { type: "text", text: instruction },
          { type: "image_url", image_url: { url: renderUrl } },
        ]
      : instruction;
    const normalized = await requestVectorResponse([
      { role: "system", content: DRAW_SYSTEM },
      { role: "user", content: userContent },
    ]);
    const parsed = normalized.root;
    const primitives = normalized.primitives;

    const construction: Construction = {
      module: Number(parsed?.construction?.module) || 25,
      stroke_weight: Number(parsed?.construction?.stroke_weight) || 80,
      radii: Array.isArray(parsed?.construction?.radii) ? parsed.construction.radii.map(Number) : undefined,
      symmetry: String(parsed?.construction?.symmetry ?? ""),
    };
    const spec: VectorSpec = {
      construction,
      primitives: applyConstruction(primitives, construction),
      wordmark: wantsType ? { ...(parsed.wordmark ?? {}), text: companyName } : undefined,
      rationale: String(parsed.rationale ?? ""),
      quality_scores: parsed.quality_scores ?? {},
    };
    const lint = lintVectorSpec(spec);
    if (!best || lint.score > best.lint.score) best = { spec, lint };
    if (lint.pass) return best;
    fixNotes.splice(0, fixNotes.length, ...lint.findings);
  }
  return best!;
}

/** Stage 4 — the jury. Look at the mark that actually rendered and judge it honestly. */
async function critiqueMark(
  b64: string,
  d: LogoDirection,
  strategy: BrandStrategy | null,
): Promise<{ pass: boolean; note: string }> {
  const system = `You are judging a logo submission for an award feed of professional identity work. You have seen ten thousand generated marks and you can spot one instantly. You are not being kind. Most submissions fail. You only pass work a practising identity designer would put their name on in public.`;
  const text = `Judge this rendered mark.

Idea it claims: ${d.one_line_idea ?? d.symbol_concept}
Craft move it claims: ${d.craft_move ?? d.geometric_operation ?? "unstated"}
Logo type: ${d.logo_type}
${strategy?.human_truth ? `Human truth it serves: ${strategy.human_truth}` : ""}
${strategy?.core_idea ? `Must communicate: ${strategy.core_idea}` : ""}

Fail it if ANY of these are true:
- It reads as auto-generated: primitive shapes arranged neatly, with no drawing in it.
- It is a cluster of rounded squares, a block plus/cross, dots-and-lines, or a letter parked in a box.
- The claimed craft move is not actually visible in the artwork.
- The shape is illegible, broken, accidental, unbalanced, or floats apart.
- Curves are lumpy, tangents don't meet, or terminals look arbitrary.
- It carries more than one competing idea, or turns to mush at 16px.
- It has nothing to do with the human truth or the idea it claims.
- It would work unchanged for any other company.

Return STRICT JSON: {"pass":true|false,"note":"if failing, ONE imperative sentence naming the exact drawing change to make"}`;


  let parsed: any = null;
  try {
    parsed = parseJsonLoose(await callChatAI([
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "text", text },
          { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ], { json: true, model: REVIEW_MODEL }));
  } catch (error) {
    console.warn("vision review unavailable", errorMessage(error));
  }
  // A failed/unavailable critique must never block delivery.
  if (!parsed || typeof parsed.pass !== "boolean") return { pass: true, note: "" };
  return { pass: parsed.pass, note: String(parsed.note ?? "") };
}

/** Build the full lockup family from one approved construction. */
async function buildLogoVariants(spec: VectorSpec, tokens: any, companyName: string) {
  const heading = tokens?.fonts?.heading;
  const outlined = spec.wordmark?.text
    ? await outlineWordmark(spec.wordmark.text, {
        family: heading,
        weight: spec.wordmark.weight,
        tracking: spec.wordmark.tracking,
        case: spec.wordmark.case,
      })
    : null;
  const base = { wordmarkPath: outlined, fontStack: fontStackFor(heading) };
  return {
    mark: renderLogoSvg(spec, tokens, companyName, { ...base, layout: "mark" }),
    horizontal: spec.wordmark?.text ? renderLogoSvg(spec, tokens, companyName, { ...base, layout: "horizontal" }) : null,
    stacked: spec.wordmark?.text ? renderLogoSvg(spec, tokens, companyName, { ...base, layout: "stacked" }) : null,
    mono: renderLogoSvg(spec, tokens, companyName, { ...base, layout: "mark", mono: "#111111" }),
    knockout: renderLogoSvg(spec, tokens, companyName, { ...base, layout: "mark", knockout: true }),
    wordmark_family: outlined?.family ?? null,
  };
}


/* ----------------------- IMAGE GENERATION ----------------------- */

async function generateOne(prompt: string, size: string, referenceImages?: string[], model = "google/gemini-3.1-flash-image"): Promise<string> {
  const content: any[] = [{ type: "text", text: prompt }];
  if (referenceImages?.length) {
    for (const url of referenceImages.slice(0, 3)) {
      content.push({ type: "image_url", image_url: { url } });
    }
  }
  const res = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: referenceImages?.length ? content : prompt }],
      modalities: ["image", "text"],
      size,
    }),
  }, 70_000);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Image gateway ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image data returned");
  return b64;
}

/** Pro model first; a provider hiccup degrades quality instead of losing the logo. */
async function renderMark(prompt: string, size: string, referenceImages?: string[]): Promise<string> {
  try {
    return await generateOne(prompt, size, referenceImages, "google/gemini-3-pro-image");
  } catch (e) {
    console.warn("pro image model failed, falling back to flash-image", e);
    return await generateOne(prompt, size, referenceImages, "google/gemini-3.1-flash-image");
  }
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
    const { snapshotId, kind = "logo", count, extra, referenceImages, regenerateDirection, direction, reviewNote, runId, directionId } = body ?? {};
    if (!snapshotId) throw new Error("snapshotId required");
    // Durable logo stages share the logo preset.
    const logoKinds = ["logo_create_run", "logo_develop_brief", "logo_develop_directions", "logo_render_concept", "logo_render_status", "logo_draw_vector", "logo_retry_direction", "logo_get_run", "logo_cancel_run", "logo_force_reset", "logo_remove_direction"];
    const preset = KIND_PRESETS[kind] ?? (logoKinds.includes(kind) ? KIND_PRESETS.logo : undefined);
    if (!preset) throw new Error(`Unknown kind: ${kind}`);


    const internal = req.headers.get("x-internal-key") === SERVICE_KEY;
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = internal ? { data: { user: null } } : await userClient.auth.getUser();
    let userId = userRes?.user?.id ?? "";
    if (!internal && !userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Impersonation: an admin may act on a member's behalf (validated server-side).
    if (!internal) {
      const actorId = userId;
      const _own = await resolveOwner(req, actorId, userClient, corsHeaders);
      if (_own.error) return _own.error;
      userId = _own.userId;
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const ctx = await loadVentureContext(supabase, snapshotId);
    const snap = ctx.snap;
    if (!snap) return new Response(JSON.stringify({ error: "Snapshot not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (internal) userId = snap.user_id;
    if (snap.user_id !== userId) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: kit } = await supabase.from("venture_brand_kits").select("palette, typography, dna, logos, moodboard").eq("snapshot_id", snapshotId).maybeSingle();
    const tokens = {
      colors: kit?.palette?.colors ?? snap.brand_tokens?.colors,
      fonts: kit?.typography ? { heading: kit.typography.heading?.family, body: kit.typography.body?.family } : snap.brand_tokens?.fonts,
      mood: kit?.dna?.mood ?? kit?.dna?.personality ?? snap.brand_tokens?.mood,
    };

    const n = Math.max(1, Math.min(4, count ?? preset.defaultCount));
    const results: any[] = [];

    const getRun = async (id?: string) => {
      let query = supabase.from("brand_logo_runs").select("*").eq("snapshot_id", snapshotId);
      query = id ? query.eq("id", id) : query.order("created_at", { ascending: false }).limit(1);
      const { data: rows, error } = await query;
      if (error) throw error;
      const run = Array.isArray(rows) ? rows[0] : rows;
      if (!run) return { run: null, directions: [] };
      const { data: directions, error: directionError } = await supabase.from("brand_logo_directions").select("*").eq("run_id", run.id).order("slot");
      if (directionError) throw directionError;
      return { run, directions: directions ?? [] };
    };

    if (kind === "logo_get_run") {
      return new Response(JSON.stringify({ ok: true, ...(await getRun(runId)) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Render-provider health for the wizard banner. The free path only proves
    // the credentials work — the platform has no balance endpoint — so credit
    // state is reported from the most recent real render attempt on this
    // snapshot. `probe: true` submits a throwaway render and SPENDS a credit,
    // so it is only ever triggered by an explicit click.
    if (kind === "logo_render_status") {
      const auth = await checkHiggsfieldAuth();
      const { data: recent } = await supabase.from("brand_logo_directions")
        .select("render_status, render_error, render_path, updated_at, direction_name")
        .eq("snapshot_id", snapshotId)
        .not("render_status", "is", null)
        .order("updated_at", { ascending: false })
        .limit(12);

      const rows = recent ?? [];
      const lastFailure = rows.find((r: any) => r.render_status === "unavailable" || r.render_status === "failed");
      const lastSuccess = rows.find((r: any) => r.render_status === "ready");
      const outOfCredits = !!lastFailure?.render_error && isCreditExhaustion(String(lastFailure.render_error));

      let state: string;
      let headline: string;
      let detail: string | null = null;

      if (auth.state !== "ok") {
        state = auth.state === "not_configured" ? "not_configured" : "auth_error";
        headline = auth.state === "not_configured"
          ? "Higgsfield not connected"
          : "Higgsfield credentials rejected";
        detail = auth.detail;
      } else if (outOfCredits) {
        state = "no_credits";
        headline = "Higgsfield platform credits exhausted";
        detail = "Platform API credits are a separate wallet from your Higgsfield app subscription. Top up at platform.higgsfield.ai to re-enable art-directed renders.";
      } else if (lastFailure && (!lastSuccess || new Date(lastFailure.updated_at) > new Date(lastSuccess.updated_at))) {
        state = "degraded";
        headline = "Last Higgsfield render failed";
        detail = String(lastFailure.render_error ?? "").slice(0, 300) || null;
      } else if (lastSuccess) {
        state = "ready";
        headline = "Higgsfield connected";
        detail = "Concepts are being rendered before vectoring.";
      } else {
        state = "untested";
        headline = "Higgsfield connected";
        detail = "Credit balance is unknown until the first render runs — the platform exposes no balance endpoint.";
      }

      let probeResult: string | null | undefined;
      if (body?.probe === true) {
        probeResult = await probeHiggsfield();
        if (probeResult === null) {
          state = "ready";
          headline = "Higgsfield connected and funded";
          detail = "Test render accepted — credits are available.";
        } else {
          state = isCreditExhaustion(probeResult) ? "no_credits" : "degraded";
          headline = isCreditExhaustion(probeResult) ? "Higgsfield platform credits exhausted" : "Higgsfield test render failed";
          detail = probeResult;
        }
      }

      const fallbacks = rows.filter((r: any) => r.render_status === "unavailable" || r.render_status === "failed").length;

      return new Response(JSON.stringify({
        ok: true,
        state,
        headline,
        detail,
        auth: auth.state,
        fallbackCount: fallbacks,
        renderedCount: rows.filter((r: any) => r.render_status === "ready").length,
        probed: body?.probe === true,
        topUpUrl: "https://platform.higgsfield.ai",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }


    if (kind === "logo_cancel_run") {
      if (!runId) throw new Error("runId required");
      const now = new Date().toISOString();
      const { error } = await supabase.from("brand_logo_runs").update({ status: "canceled", canceled_at: now, heartbeat_at: now }).eq("id", runId).eq("snapshot_id", snapshotId);
      if (error) throw error;
      await supabase.from("brand_logo_directions").update({ status: "canceled" }).eq("run_id", runId).not("status", "in", '("ready","needs_review")');
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Hard reset: kill every in-flight run for this snapshot, drop all logo
    // directions (leases, retries, half-finished stages) and clear the kit's
    // logo list, so the studio returns to a clean slate with no ghost spinners.
    if (kind === "logo_force_reset") {
      const now = new Date().toISOString();
      const { data: runs, error: runsError } = await supabase.from("brand_logo_runs").select("id, status").eq("snapshot_id", snapshotId);
      if (runsError) throw new Error(`Could not read logo runs: ${runsError.message}`);
      const runIds = (runs ?? []).map((r: any) => r.id);
      let clearedDirections = 0;
      let canceledRuns = 0;
      if (runIds.length) {
        const { count, error: delError } = await supabase.from("brand_logo_directions").delete({ count: "exact" }).in("run_id", runIds);
        if (delError) throw new Error(`Could not delete logo concepts: ${delError.message}`);
        clearedDirections = count ?? 0;
        // Explicit id list instead of a negated status filter — no PostgREST
        // operator quirks, and terminal runs are simply left alone.
        const terminal = ["completed", "completed_with_review", "failed", "canceled"];
        const liveIds = (runs ?? []).filter((r: any) => !terminal.includes(r.status)).map((r: any) => r.id);
        if (liveIds.length) {
          const { error: cancelError } = await supabase.from("brand_logo_runs")
            .update({ status: "canceled", canceled_at: now, heartbeat_at: now, last_error: null })
            .in("id", liveIds);
          if (cancelError) throw new Error(`Could not cancel logo runs: ${cancelError.message}`);
          canceledRuns = liveIds.length;
        }
      }
      const { error: kitError } = await supabase.from("venture_brand_kits").update({ logos: [] }).eq("snapshot_id", snapshotId);
      if (kitError) throw new Error(`Could not clear saved logos: ${kitError.message}`);
      console.log(`logo_force_reset snapshot=${snapshotId} runs=${runIds.length} canceled=${canceledRuns} directions=${clearedDirections}`);
      return new Response(JSON.stringify({ ok: true, clearedRuns: canceledRuns, clearedDirections }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }



    if (kind === "logo_remove_direction") {
      if (!runId || !directionId) throw new Error("runId and directionId required");
      const current = await getRun(runId);
      if (!current.run) throw new Error("Logo run not found");
      const { error } = await supabase.from("brand_logo_directions").update({ status: "canceled", current_stage: "complete", asset: {}, completed_at: new Date().toISOString() }).eq("id", directionId).eq("run_id", runId);
      if (error) throw error;
      const refreshed = await getRun(runId);
      const logos = refreshed.directions.filter((item: any) => ["ready", "needs_review"].includes(item.status)).map((item: any) => item.asset);
      const { error: kitError } = await supabase.from("venture_brand_kits").update({ logos }).eq("snapshot_id", snapshotId);
      if (kitError) throw kitError;
      return new Response(JSON.stringify({ ok: true, logos }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (kind === "logo_create_run") {
      await supabase.from("brand_logo_runs").update({ status: "canceled", canceled_at: new Date().toISOString() }).eq("snapshot_id", snapshotId).not("status", "in", '("completed","completed_with_review","failed","canceled")');
      const { data: previous } = await supabase.from("brand_logo_runs").select("version").eq("snapshot_id", snapshotId).order("version", { ascending: false }).limit(1);
      const version = Number(previous?.[0]?.version ?? 0) + 1;
      const { data: run, error } = await supabase.from("brand_logo_runs").insert({ snapshot_id: snapshotId, user_id: userId, version, status: "developing_brief", requested_count: n, reference_images: referenceImages ?? [], heartbeat_at: new Date().toISOString() }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, run }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (kind === "logo_develop_brief") {
      if (!runId) throw new Error("runId required");
      const docsBlock = await loadBrandDocs(supabase, snapshotId);
      const strategy = await buildBrandStrategy(ctx, tokens, docsBlock);
      if (!strategy) throw new Error("Creative Director returned no strategy");
      const { error } = await supabase.from("brand_logo_runs").update({ strategy, status: "developing_directions", heartbeat_at: new Date().toISOString(), last_error: null }).eq("id", runId).eq("snapshot_id", snapshotId);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, strategy }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (kind === "logo_develop_directions") {
      if (!runId) throw new Error("runId required");
      const current = await getRun(runId);
      if (!current.run) throw new Error("Logo run not found");
      const docsBlock = await loadBrandDocs(supabase, snapshotId);
      const moodboardImages = await moodboardImageUrls(supabase, kit);
      const directions = await generateLogoConcepts(ctx, tokens, current.run.requested_count, current.run.strategy as BrandStrategy, docsBlock, current.run.reference_images, moodboardImages);

      const rows = directions.map((d, slot) => ({ run_id: runId, snapshot_id: snapshotId, slot, idempotency_key: `${runId}:${slot}`, direction_name: d.direction_name, logo_type: d.logo_type, concept: d, status: "queued", current_stage: "render_concept", render_status: "pending", render_path: null, render_error: null }));
      const { error } = await supabase.from("brand_logo_directions").upsert(rows, { onConflict: "run_id,slot" });
      if (error) throw error;
      await supabase.from("brand_logo_runs").update({ status: "rendering", heartbeat_at: new Date().toISOString(), last_error: null }).eq("id", runId);
      return new Response(JSON.stringify({ ok: true, directions }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Stage 3 — render the concept as a real designed mark before any vector
    // math happens. This stage never fails a direction: an unavailable provider
    // records why and hands the direction to the vector stage regardless, so a
    // Higgsfield outage degrades quality rather than breaking the run.
    if (kind === "logo_render_concept") {
      if (!runId || !directionId) throw new Error("runId and directionId required");
      const current = await getRun(runId);
      const run = current.run;
      const row = current.directions.find((item: any) => item.id === directionId);
      if (!run || !row) throw new Error("Logo direction not found");

      const advance = async (patch: Record<string, unknown>) => {
        await supabase.from("brand_logo_directions").update({
          current_stage: "develop_vector",
          status: "queued",
          lease_token: null,
          lease_expires_at: null,
          ...patch,
        }).eq("id", directionId);
        await supabase.from("brand_logo_runs").update({ heartbeat_at: new Date().toISOString() }).eq("id", runId);
      };

      // Already rendered, or already past this stage — nothing to do.
      if (row.render_path || (row.current_stage !== "render_concept" && kind === "logo_render_concept" && row.render_status !== "pending")) {
        return new Response(JSON.stringify({ ok: true, skipped: true, reason: "Concept already rendered" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (!higgsfieldConfigured()) {
        await advance({ render_status: "unavailable", render_error: "Higgsfield credentials are not configured." });
        return new Response(JSON.stringify({ ok: true, rendered: false, reason: "not_configured" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const leaseToken = crypto.randomUUID();
      const { data: claimed } = await supabase.from("brand_logo_directions").update({
        status: "rendering_concept",
        render_status: "rendering",
        lease_token: leaseToken,
        lease_expires_at: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
      }).eq("id", directionId).in("status", ["queued", "retry_wait", "failed"]).select("id").maybeSingle();
      if (!claimed) {
        return new Response(JSON.stringify({ ok: true, skipped: true, reason: "Direction is already being processed" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      await supabase.from("brand_logo_runs").update({ heartbeat_at: new Date().toISOString(), last_error: null }).eq("id", runId);

      const strategy = (run.strategy ?? null) as BrandStrategy | null;
      const concept = (row.concept ?? {}) as any;
      const prompt = buildLogoRenderPrompt(
        {
          name: row.direction_name,
          humanTruth: concept.human_link || strategy?.human_truth,
          craftMove: concept.craft_move || concept.geometric_operation,
          imagery: concept.symbol_concept || concept.one_line_idea,
          mood: concept.why_memorable,
        },
        {
          brandName: snap.company_name ?? undefined,
          positioning: strategy?.core_idea ?? ctx?.snap?.one_liner ?? undefined,
          palette: Array.isArray(tokens?.colors)
            ? tokens.colors
            : Object.values(tokens?.colors ?? {}).filter((v): v is string => typeof v === "string"),
          moodboard: typeof kit?.dna?.mood === "string" ? kit.dna.mood : undefined,
          personality: Array.isArray(kit?.dna?.personality) ? kit.dna.personality : undefined,
        },
      );

      try {
        const render = await renderLogoConcept({
          prompt,
          negativePrompt: logoNegativePrompt(),
          seed: seedForConcept(directionId),
        });
        const bytes = await fetchRenderBytes(render.imageUrl);
        const path = `brand/${userId}/${snapshotId}/logo-renders/${directionId}.png`;
        const { error: upErr } = await supabase.storage.from("user-media")
          .upload(path, bytes, { contentType: "image/png", upsert: true });
        if (upErr) throw upErr;

        await advance({
          render_status: "ready",
          render_path: path,
          render_provider: "higgsfield",
          render_job_id: render.jobId,
          render_error: null,
        });
        return new Response(JSON.stringify({ ok: true, rendered: true, path }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (error) {
        // Terminal provider problems (no credits, bad key) must not burn the
        // direction's three attempts — fall through to the brief-only path.
        const terminal = error instanceof HiggsfieldError && error.terminal;
        const message = errorMessage(error);
        await advance({
          render_status: terminal ? "unavailable" : "failed",
          render_error: message.slice(0, 500),
          render_provider: "higgsfield",
        });
        console.warn("logo render skipped", message);
        return new Response(JSON.stringify({ ok: true, rendered: false, reason: message }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }



    if (kind === "logo_draw_vector" || kind === "logo_retry_direction") {
      if (!runId || !directionId) throw new Error("runId and directionId required");
      const current = await getRun(runId);
      const run = current.run;
      const row = current.directions.find((item: any) => item.id === directionId);
      if (!run || !row) throw new Error("Logo direction not found");
      if (["ready", "needs_review"].includes(row.status) && kind !== "logo_retry_direction") {
        return new Response(JSON.stringify({ ok: true, asset: row.asset, direction: row }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const leaseToken = crypto.randomUUID();
      const leaseExpiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
      const { data: claimed, error: claimError } = await supabase.from("brand_logo_directions").update({ status: "developing_vector", current_stage: row.review_note ? "revise_vector" : "develop_vector", attempt_count: Number(row.attempt_count ?? 0) + 1, last_error: null, error_class: null, lease_token: leaseToken, lease_expires_at: leaseExpiresAt }).eq("id", directionId).in("status", kind === "logo_retry_direction" ? ["ready", "needs_review", "failed", "retry_wait"] : ["queued", "retry_wait", "failed"]).select("id").maybeSingle();
      if (claimError) throw claimError;
      if (!claimed) return new Response(JSON.stringify({ ok: true, skipped: true, reason: "Direction is already being processed" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await supabase.from("brand_logo_runs").update({ heartbeat_at: new Date().toISOString(), last_error: null }).eq("id", runId);
      try {
        const started = Date.now();
        const companyName = snap.company_name ?? "Venture";
        const docsBlock = await loadBrandDocs(supabase, snapshotId);
        const strategy = (run.strategy ?? null) as BrandStrategy | null;
        const dossier = buildDossier(ctx, tokens, strategy, docsBlock);

        // When stage 3 produced a render, the vector model traces it instead of
        // inventing geometry from the written brief.
        let renderUrl: string | null = null;
        if (row.render_path) {
          const { data: signedRender } = await supabase.storage.from("user-media")
            .createSignedUrl(row.render_path, 60 * 30);
          renderUrl = signedRender?.signedUrl ?? null;
        }

        const { spec, lint } = await developVectorSpec(row.concept as LogoDirection, strategy, ctx, tokens, dossier, reviewNote ?? row.review_note ?? undefined, renderUrl);
        const variants = await buildLogoVariants(spec, tokens, companyName);

        const uploaded = await uploadVectorAsset(supabase, snapshotId, userId, directionId, variants.mark, "mark");
        const uploadVariant = async (svg: string | null, name: string) => {
          if (!svg) return null;
          try { return await uploadVectorAsset(supabase, snapshotId, userId, directionId, svg, name); } catch { return null; }
        };
        const [horizontal, stacked, mono, knockout] = await Promise.all([
          uploadVariant(variants.horizontal, "horizontal"),
          uploadVariant(variants.stacked, "stacked"),
          uploadVariant(variants.mono, "mono"),
          uploadVariant(variants.knockout, "knockout"),
        ]);

        // Vision gate — only when there is time left in the request window.
        let visionPass = true;
        let visionNote = "";
        if (Date.now() - started < 60_000) {
          const png = await rasterizeSvg(variants.mark, 512);
          if (png) {
            const verdict = await critiqueMark(png, row.concept as LogoDirection, strategy);
            visionPass = verdict.pass;
            visionNote = verdict.note;
          }
        }

        const modelScores = spec.quality_scores ?? {};
        const scoreValues = Object.values(modelScores).map(Number).filter(Number.isFinite);
        const average = scoreValues.length ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length : 4;
        const passed = lint.pass && visionPass && average >= 3.5;
        const note = [
          visionPass ? "" : visionNote,
          ...(lint.pass ? [] : lint.findings),
        ].filter(Boolean).join(" ");
        const scores = { ...modelScores, geometry: Number(lint.score.toFixed(2)), ...lint.metrics };

        const asset = {
          ok: true,
          url: uploaded.url, path: uploaded.path, svg_url: uploaded.url, svg_path: uploaded.path,
          variants: {
            mark: { url: uploaded.url, path: uploaded.path },
            horizontal: horizontal ? { url: horizontal.url, path: horizontal.path } : null,
            stacked: stacked ? { url: stacked.url, path: stacked.path } : null,
            mono: mono ? { url: mono.url, path: mono.path } : null,
            knockout: knockout ? { url: knockout.url, path: knockout.path } : null,
          },
          usage: {
            clear_space: "Keep clear space equal to the height of the mark's core module on all sides.",
            min_size: "Do not reproduce the mark below 24px / 8mm.",
            wordmark_font: variants.wordmark_family,
          },
          direction_name: row.direction_name, logo_type: row.logo_type,
          render: row.render_path
            ? { path: row.render_path, url: renderUrl, provider: row.render_provider ?? "higgsfield" }
            : null,
          human_link: row.concept?.human_link ?? "",
          craft_move: row.concept?.craft_move ?? row.concept?.geometric_operation ?? "",
          one_line_idea: row.concept?.one_line_idea ?? row.concept?.symbol_concept,
          why_memorable: row.concept?.why_memorable ?? "",
          symbol_concept: row.concept?.symbol_concept,

          direction: row.concept, vector_spec: spec,
          review_passed: passed, review_note: note, review_score: scores,
          created_at: new Date().toISOString(),
        };
        const { error: publishError } = await supabase.rpc("publish_brand_logo_direction", { p_direction_id: directionId, p_run_id: runId, p_run_version: run.version, p_asset: asset, p_svg_path: uploaded.path, p_preview_path: uploaded.path, p_review_passed: passed, p_review_score: scores, p_review_note: note });
        if (publishError) throw publishError;
        return new Response(JSON.stringify({ ok: true, asset }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (error) {
        const attempts = Number(row.attempt_count ?? 0) + 1;
        const terminal = attempts >= 3;
        const message = errorMessage(error);
        await supabase.from("brand_logo_directions").update({ status: terminal ? "failed" : "retry_wait", last_error: message, error_class: classifyError(error), retry_at: terminal ? null : new Date(Date.now() + Math.min(60_000, 5_000 * 2 ** attempts)).toISOString(), lease_token: null, lease_expires_at: null }).eq("id", directionId).eq("lease_token", leaseToken);
        await supabase.from("brand_logo_runs").update({ heartbeat_at: new Date().toISOString(), last_error: message }).eq("id", runId);
        throw error;
      }
    }

    if (kind === "logo") {
      // Legacy single-shot path: retired — it could not fit inside one request.
      throw new Error("Use the resumable Logo Studio workflow — single-request logo generation is retired.");
    }

    // Generic kinds: moodboard / social
    {
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
      const fresh = results.filter((r) => r?.ok).map((r) => ({ url: r.url, path: r.path }));
      if (fresh.length && kind === "moodboard" && kit) {
        const existing = Array.isArray((kit as any).moodboard) ? (kit as any).moodboard : [];
        const next = [...fresh, ...existing].slice(0, 8);
        await supabase.from("venture_brand_kits").update({ moodboard: next }).eq("snapshot_id", snapshotId);
      }
    } catch { /* non-fatal */ }


    return new Response(JSON.stringify({ ok: true, kind, assets: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = errorMessage(e);
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

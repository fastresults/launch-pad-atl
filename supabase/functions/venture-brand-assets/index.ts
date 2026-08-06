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
import {
  applyConstruction,
  lintVectorSpec,
  renderLogoSvg,
  type Construction,
  type VectorSpec,
} from "../_shared/logo-geometry.ts";
import { fontStackFor, outlineWordmark } from "../_shared/logo-type.ts";
import { rasterizeSvg } from "../_shared/logo-raster.ts";

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
  one_line_idea?: string;   // the single shape idea, one sentence
  geometric_operation?: string; // the one construction move that creates the mark
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

async function callChatAI(messages: any[], opts: { json?: boolean; model?: string } = {}) {
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
  }, 60_000);
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
    try {
      const raw = await callChatAI(messages, { json: true, model });
      const parsed = parseJsonLoose(raw);
      const normalized = normalizeVectorResponse(parsed);
      if (normalized) return normalized;
      failures.push(`${model}: structured response contained no supported vector elements`);
      console.warn("invalid vector response", model, String(raw).slice(0, 240));
    } catch (error) {
      failures.push(`${model}: ${errorMessage(error)}`);
      console.warn("vector call failed", model, errorMessage(error));
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

/** Stage 1 — the one-page strategic brief every concept must serve. */
export async function buildBrandStrategy(ctx: any, tokens: any, docsBlock: string): Promise<BrandStrategy | null> {
  const system = `You are the strategy director at a brand identity studio. You write the one-page brief the design team works from. You are ruthless about specificity: a brief that could describe any company in this category is a failed brief.`;
  const user = `Read the venture below and write its identity brief.

VENTURE
${ventureBlockOf(ctx)}

BRAND TOKENS
${tokensBlockOf(tokens)}

${docsBlock ? `FINISHED BRAND ASSETS (the founder's own words — treat as authoritative)\n${docsBlock}` : ""}

Return STRICT JSON:
{"core_idea":"one sentence — the single idea the mark must carry","attributes":["three adjectives, no synonyms of each other"],"metaphor_territory":"the ONE visual territory worth mining (an object, action, structure or gesture from this venture's real world) and why","not_list":["4-6 things this brand must never look like — name the category clichés specifically"]}`;

  const parsed = await callChatJsonOnce([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
  if (!parsed?.core_idea) return null;
  return {
    core_idea: String(parsed.core_idea),
    attributes: Array.isArray(parsed.attributes) ? parsed.attributes.map(String) : [],
    metaphor_territory: String(parsed.metaphor_territory ?? ""),
    not_list: Array.isArray(parsed.not_list) ? parsed.not_list.map(String) : [],
  };
}

/** Stage 2 — generate wide, then cut. Only the strongest concepts survive. */
async function generateLogoConcepts(
  ctx: any,
  tokens: any,
  count: number,
  strategy: BrandStrategy | null,
  docsBlock: string,
  referenceImages?: string[],
): Promise<LogoDirection[]> {
  const system = `You are a senior brand identity designer with 20 years at Pentagram, COLLINS and Chermayeff & Geismar. You design MARKS, not illustrations. Your discipline: one idea per mark, drawn with the fewest possible elements, recognisable as a black silhouette at 16 pixels. You generate widely, then kill most of your own work.`;

  const strategyBlock = strategy
    ? `STRATEGY BRIEF (every concept must serve this)
Core idea: ${strategy.core_idea}
Attributes: ${strategy.attributes.join(", ")}
Metaphor territory: ${strategy.metaphor_territory}
Must never look like: ${strategy.not_list.join("; ")}`
    : "";

  const refsLine = referenceImages?.length
    ? `\nThe founder attached ${referenceImages.length} reference logo(s) they admire. Study them ONLY for structural principles — proportion, stroke weight, level of abstraction, counterform, wordmark tracking. Never restyle or echo their subject matter. State the borrowed principle in reference_learning.`
    : `\nNo references provided. Drive every concept from the strategy brief.`;

  const instruction = `PROCESS — follow it exactly:
1. Silently generate 10 candidate concepts across different logo types.
2. Score each 1-5 on: distinctiveness (would it be mistaken for a competitor?), simplicity (can it be described in one sentence and drawn with under 5 elements?), relevance (does it serve the core idea?), scalability (does it survive at 16px as a solid shape?), memorability (could someone redraw it from memory?).
3. Discard any concept scoring below 4 on simplicity or distinctiveness, and any concept that would work equally well for a different company in this category.
4. Return ONLY the ${count} strongest survivors, each a DIFFERENT logo_type.

Return STRICT JSON:
{"directions":[{"direction_name":"short evocative name","logo_type":"wordmark|lettermark|monogram|pictorial mark|abstract mark|emblem|combination mark","one_line_idea":"the shape, in ONE sentence a designer could draw from","geometric_operation":"the SINGLE construction move that creates the mark, e.g. 'a circle cut by two mirrored arcs' or 'an M built from three rotated modules'","why_memorable":"one sentence on why it sticks","symbol_concept":"max 2 sentences — the metaphor grounded in the strategy","construction_notes":"grid base, stroke-to-height ratio, corner treatment, counterforms, terminals, optical balance","typography_treatment":"for wordmark/lettermark/combination: case, tracking, weight, ligature; else 'n/a'","negative_space_play":"the hidden shape, or 'none'","color_application":"which palette token leads; flat 1-2 colour strategy","reference_learning":"${referenceImages?.length ? "the structural principle borrowed" : "n/a"}","avoid_list":"direction-specific anti-patterns","scores":{"distinctiveness":5,"simplicity":5,"relevance":5,"scalability":5,"memorability":5}}]}

Hard rules:
- Exactly ${count} directions, each a different logo_type.
- Every mark must be constructible as flat vector art in 1-2 colours. No scenes, no illustrations, no mascots with rendered detail, no depth.
- Every direction must be buildable from at most 12 geometric elements on a single module grid with ONE stroke weight. If you cannot state the geometric_operation in one clause, the idea is too complicated — kill it.
- Reject anything on the venture's own "must never look like" list above; that list outranks your instincts.
- Forbidden everywhere: globes, swooshes, generic leaves/checkmarks, handshake, lightbulb, puzzle piece, upward arrow, gradient-as-idea, lens flare, 3D bevels, circuit/hex "tech" clichés (unless the venture is literally hardware).`;

  const userContent: any[] = [{
    type: "text",
    text: `VENTURE\n${ventureBlockOf(ctx)}\n\nBRAND TOKENS\n${tokensBlockOf(tokens)}\n\n${strategyBlock}\n\n${docsBlock ? `FOUNDER'S OWN BRAND ASSETS\n${docsBlock.slice(0, 6000)}\n\n` : ""}${refsLine}\n\n${instruction}`,
  }];
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
 * The dossier is the single source of context every pass reads. Strategy work
 * used to be discarded before the mark was drawn; now the drawing pass sees
 * the venture, the brief, the finished brand assets and the anti-cliché list.
 */
function buildDossier(ctx: any, tokens: any, strategy: BrandStrategy | null, docsBlock: string): string {
  return [
    "VENTURE", ventureBlockOf(ctx),
    "", "BRAND TOKENS", tokensBlockOf(tokens),
    strategy ? `\nSTRATEGY BRIEF\nCore idea: ${strategy.core_idea}\nAttributes: ${strategy.attributes.join(", ")}\nMetaphor territory: ${strategy.metaphor_territory}\nMust never look like: ${strategy.not_list.join("; ")}` : "",
    docsBlock ? `\nFOUNDER'S OWN BRAND ASSETS (authoritative)\n${docsBlock.slice(0, 6000)}` : "",
  ].filter(Boolean).join("\n");
}

const DRAW_SYSTEM = `You are a mark-maker in the tradition of Chermayeff & Geismar, Paul Rand and Michael Bierut. You do not describe logos — you ENGINEER them: a module grid, one stroke weight, a single radius family, exact coordinates. Every mark you build is one idea, drawn with the fewest possible elements, and holds up as a solid black silhouette at 16 pixels. Return valid JSON only. Never use gradients, filters, masks, images, scripts or external URLs.`;

function drawInstruction(
  d: LogoDirection,
  dossier: string,
  companyName: string,
  wantsType: boolean,
  fixNotes: string[],
): string {
  return `Engineer the approved direction below as an exact 1000×1000 vector construction.

${dossier}

APPROVED DIRECTION
${JSON.stringify(d)}

CONSTRUCTION CONTRACT — declare it, then obey it
- module: the grid unit every coordinate is a multiple of (pick 20, 25 or 50)
- stroke_weight: ONE weight used by every stroked element (typically 3–5 modules)
- radii: the small set of corner radii allowed (multiples of the module)
- symmetry: the axis or rotation the construction is built on ("vertical mirror", "90° rotation", "none")

GEOMETRY
- Up to 12 elements total. Fewer is better: 3–7 is the target.
- Elements: rect (x,y,width,height,rx) · circle (cx,cy,r) · ellipse (cx,cy,rxr,ryr) · line (x1,y1,x2,y2) · path (d, commands M L H V C S Q T A Z) · group (children[], transform{translate,rotate,scale})
- Use group + transform to build modular, mirrored or rotationally repeated marks. That is how real geometric identities are constructed — do not hand-place duplicates.
- Use fillRule "evenodd" on a path to cut a counterform out of a solid shape. That is how negative-space ideas are made.
- Arcs (A) and smooth curves (S) exist — use true circular geometry, not polygon approximations.
- Every coordinate must be a multiple of the module. Every stroked element must use the identical stroke_weight. Never mix thick and thin strokes.
- Build the symbol anywhere in 0..1000; it is optically re-centred and scaled after you return it, so proportion matters, absolute position does not.
- Colour: fill/stroke from primary | secondary | accent | white | none. Two inks maximum plus white. Flat only.

OPTICAL DISCIPLINE
- Curves and points overshoot flat edges slightly; circles read smaller than squares of the same measure — compensate.
- Counterforms (the holes) must be as considered as the positive shapes.
- The silhouette must read as ONE idea at 16px. If two ideas compete, cut one.

${wantsType ? `WORDMARK: include wordmark with text exactly "${companyName}", a case, weight 300–800, and tracking in 1/1000 em (−40 to 120). It is set in the brand's real typeface and outlined at render time, so specify treatment, not a font name.` : "WORDMARK: omit it entirely — this is a symbol-only direction."}

${fixNotes.length ? `THE PREVIOUS ATTEMPT WAS REJECTED. Fix exactly these, changing nothing else that already worked:\n- ${fixNotes.join("\n- ")}` : ""}

Return STRICT JSON:
{"construction":{"module":25,"stroke_weight":100,"radii":[0,50],"symmetry":"vertical mirror"},"primitives":[{"kind":"path","d":"M 200 200 L 800 200 ...","fill":"primary","stroke":"none","strokeWidth":0,"fillRule":"evenodd"}]${wantsType ? `,"wordmark":{"text":"${companyName}","case":"upper","weight":600,"tracking":40}` : ""},"rationale":"one sentence naming the single geometric operation that creates the mark","quality_scores":{"relevance":5,"distinctiveness":5,"simplicity":5,"scalability":5,"balance":5}}
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
): Promise<{ spec: VectorSpec; lint: ReturnType<typeof lintVectorSpec> }> {
  const companyName = String(ctx?.snap?.company_name ?? "").trim();
  const wantsType = /wordmark|lettermark|monogram|combination|emblem/i.test(d.logo_type ?? "");
  const fixNotes = reviewNote ? [reviewNote] : [];
  let best: { spec: VectorSpec; lint: ReturnType<typeof lintVectorSpec> } | null = null;

  for (let pass = 0; pass < 2; pass++) {
    const normalized = await requestVectorResponse([
      { role: "system", content: DRAW_SYSTEM },
      { role: "user", content: drawInstruction(d, dossier, companyName, wantsType, fixNotes) },
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

/** Stage 4 — look at the mark that actually rendered and judge it. */
async function critiqueMark(
  b64: string,
  d: LogoDirection,
  strategy: BrandStrategy | null,
): Promise<{ pass: boolean; note: string }> {
  const system = `You are a design director reviewing a finished mark before it reaches the client. You are strict. You reject anything that is not a clean, flat, single-idea mark a serious company could adopt.`;
  const text = `Review this rendered mark against its brief.

Brief: ${d.one_line_idea ?? d.symbol_concept}
Logo type: ${d.logo_type}
${strategy?.core_idea ? `Must communicate: ${strategy.core_idea}` : ""}

Fail it if ANY of these are true: the shape is illegible, broken or reads as random geometry; it looks accidental rather than constructed; the elements are visually unbalanced or float apart; the counterforms are uneven; it carries more than one competing idea; it would disappear or turn to mush at 16px; it does not connect to the brief at all.

Return STRICT JSON: {"pass":true|false,"note":"if failing, ONE imperative sentence naming the exact geometric change to make"}`;

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
    const logoKinds = ["logo_create_run", "logo_develop_brief", "logo_develop_directions", "logo_draw_vector", "logo_retry_direction", "logo_get_run", "logo_cancel_run", "logo_remove_direction"];
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

    if (kind === "logo_cancel_run") {
      if (!runId) throw new Error("runId required");
      const now = new Date().toISOString();
      const { error } = await supabase.from("brand_logo_runs").update({ status: "canceled", canceled_at: now, heartbeat_at: now }).eq("id", runId).eq("snapshot_id", snapshotId);
      if (error) throw error;
      await supabase.from("brand_logo_directions").update({ status: "canceled" }).eq("run_id", runId).not("status", "in", '("ready","needs_review")');
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      const directions = await generateLogoConcepts(ctx, tokens, current.run.requested_count, current.run.strategy as BrandStrategy, docsBlock, current.run.reference_images);
      const rows = directions.map((d, slot) => ({ run_id: runId, snapshot_id: snapshotId, slot, idempotency_key: `${runId}:${slot}`, direction_name: d.direction_name, logo_type: d.logo_type, concept: d, status: "queued", current_stage: "develop_vector" }));
      const { error } = await supabase.from("brand_logo_directions").upsert(rows, { onConflict: "run_id,slot" });
      if (error) throw error;
      await supabase.from("brand_logo_runs").update({ status: "rendering", heartbeat_at: new Date().toISOString(), last_error: null }).eq("id", runId);
      return new Response(JSON.stringify({ ok: true, directions }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

        const { spec, lint } = await developVectorSpec(row.concept as LogoDirection, strategy, ctx, tokens, dossier, reviewNote ?? row.review_note ?? undefined);
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

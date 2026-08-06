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

// An agency process, not a single prompt:
//   1. Strategy    — read the venture's real assets, write a one-page brief.
//   2. Concepts    — generate 10 candidates, self-score, return the best 4.
//   3. Execution   — render each as a flat vector MARK (not a picture).
//   4. Critique    — look at what actually came back; retry the failures once.

type LogoDirection = {
  direction_name: string;
  logo_type: string; // wordmark | lettermark | monogram | pictorial mark | abstract mark | emblem | combination mark
  one_line_idea?: string;   // the single shape idea, one sentence
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

type VectorPrimitive = {
  kind: "rect" | "circle" | "path" | "line";
  x?: number; y?: number; width?: number; height?: number; rx?: number;
  cx?: number; cy?: number; r?: number; d?: string;
  x1?: number; y1?: number; x2?: number; y2?: number;
  fill?: "primary" | "secondary" | "accent" | "none" | "white";
  stroke?: "primary" | "secondary" | "accent" | "none" | "white";
  strokeWidth?: number;
};

type VectorSpec = {
  primitives: VectorPrimitive[];
  wordmark?: { text: string; case?: "upper" | "title" | "lower"; weight?: number; tracking?: number };
  rationale?: string;
  quality_scores?: Record<string, number>;
};

// Chat models used for the thinking passes, in fallback order. 2.5-pro's
// thinking budget occasionally eats the whole response and returns empty
// content, so a flash model always backs it up.
const THINK_MODELS = ["google/gemini-3.6-flash", "google/gemini-2.5-flash"];

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
  const res = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model ?? THINK_MODELS[0],
      messages,
      max_tokens: 8000,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  }, 45_000);
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
  const parsed = parseJsonLoose(await callChatAI(messages, { json: true, model: THINK_MODELS[0] }));
  if (!parsed) throw new Error("AI returned malformed structured output");
  return parsed;
}

function escapeXml(value: unknown): string {
  return String(value ?? "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&apos;", '"': "&quot;" }[c] ?? c));
}

function safeColor(value: unknown, fallback: string): string {
  const text = String(value ?? "").trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function sanitizePath(value: unknown): string {
  const path = String(value ?? "").trim();
  if (!path || path.length > 1200 || /[^0-9a-zA-Z.,+\-\s]/.test(path)) throw new Error("Vector path contains unsupported data");
  const commands = path.match(/[A-Za-z]/g) ?? [];
  if (commands.some((command) => !/[MLHVCQZ]/i.test(command))) throw new Error("Vector path uses an unsupported command");
  return path;
}

function renderVectorSvg(spec: VectorSpec, tokens: any, companyName: string): string {
  const palette = {
    primary: safeColor(tokens?.colors?.primary, "#171717"),
    secondary: safeColor(tokens?.colors?.secondary, "#4B5563"),
    accent: safeColor(tokens?.colors?.accent, "#C29B46"),
    white: "#FFFFFF",
    none: "none",
  };
  const primitives = Array.isArray(spec?.primitives) ? spec.primitives.slice(0, 5) : [];
  if (!primitives.length) throw new Error("Vector specification has no drawable elements");
  const color = (key: unknown, fallback: string) => palette[String(key ?? "") as keyof typeof palette] ?? fallback;
  const body = primitives.map((p) => {
    const fill = color(p.fill, palette.primary);
    const stroke = color(p.stroke, "none");
    const common = `fill="${fill}" stroke="${stroke}" stroke-width="${clampNumber(p.strokeWidth, 0, 32, 0)}" stroke-linecap="round" stroke-linejoin="round"`;
    if (p.kind === "rect") return `<rect x="${clampNumber(p.x, 0, 1000)}" y="${clampNumber(p.y, 0, 1000)}" width="${clampNumber(p.width, 1, 1000, 100)}" height="${clampNumber(p.height, 1, 1000, 100)}" rx="${clampNumber(p.rx, 0, 250)}" ${common}/>`;
    if (p.kind === "circle") return `<circle cx="${clampNumber(p.cx, 0, 1000, 500)}" cy="${clampNumber(p.cy, 0, 1000, 500)}" r="${clampNumber(p.r, 1, 500, 100)}" ${common}/>`;
    if (p.kind === "line") return `<line x1="${clampNumber(p.x1, 0, 1000)}" y1="${clampNumber(p.y1, 0, 1000)}" x2="${clampNumber(p.x2, 0, 1000)}" y2="${clampNumber(p.y2, 0, 1000)}" ${common}/>`;
    if (p.kind === "path") return `<path d="${escapeXml(sanitizePath(p.d))}" ${common}/>`;
    throw new Error("Unsupported vector primitive");
  }).join("");
  const wordmark = spec.wordmark?.text ? String(spec.wordmark.text) : "";
  const text = wordmark ? `<text x="500" y="900" text-anchor="middle" fill="${palette.primary}" font-family="Arial, Helvetica, sans-serif" font-size="${Math.max(42, Math.min(112, Math.floor(760 / Math.max(wordmark.length, 5))))}" font-weight="${clampNumber(spec.wordmark?.weight, 300, 800, 600)}" letter-spacing="${clampNumber(spec.wordmark?.tracking, 0, 20, 2)}">${escapeXml(wordmark || companyName)}</text>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" role="img" aria-label="${escapeXml(companyName)} logo"><rect width="1000" height="1000" fill="#FFFFFF"/><g>${body}</g>${text}</svg>`;
}

async function uploadVectorAsset(supabase: any, snapshotId: string, userId: string, directionId: string, svg: string) {
  const path = `${userId}/brand/${snapshotId}/logo-${directionId}.svg`;
  const bytes = new TextEncoder().encode(svg);
  const { error } = await supabase.storage.from("user-media").upload(path, bytes, { contentType: "image/svg+xml", upsert: true });
  if (error) throw new Error(`Vector upload failed: ${error.message}`);
  const { data: signed } = await supabase.storage.from("user-media").createSignedUrl(path, 60 * 60 * 24 * 7);
  return { path, url: signed?.signedUrl };
}

function classifyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/429|rate/i.test(message)) return "rate_limit";
  if (/402|credit/i.test(message)) return "credits";
  if (/abort|timeout/i.test(message)) return "provider_timeout";
  if (/structured|json|vector/i.test(message)) return "invalid_output";
  if (/upload|storage/i.test(message)) return "storage";
  return "provider_error";
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
{"directions":[{"direction_name":"short evocative name","logo_type":"wordmark|lettermark|monogram|pictorial mark|abstract mark|emblem|combination mark","one_line_idea":"the shape, in ONE sentence a designer could draw from","why_memorable":"one sentence on why it sticks","symbol_concept":"max 2 sentences — the metaphor grounded in the strategy","construction_notes":"grid base, stroke-to-height ratio, corner treatment, counterforms, terminals, optical balance","typography_treatment":"for wordmark/lettermark/combination: case, tracking, weight, ligature; else 'n/a'","negative_space_play":"the hidden shape, or 'none'","color_application":"which palette token leads; flat 1-2 colour strategy","reference_learning":"${referenceImages?.length ? "the structural principle borrowed" : "n/a"}","avoid_list":"direction-specific anti-patterns","scores":{"distinctiveness":5,"simplicity":5,"relevance":5,"scalability":5,"memorability":5}}]}

Hard rules:
- Exactly ${count} directions, each a different logo_type.
- Every mark must be constructible as flat vector art in 1-2 colours. No scenes, no illustrations, no mascots with rendered detail, no depth.
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

async function developVectorSpec(d: LogoDirection, strategy: BrandStrategy | null, ctx: any, tokens: any, reviewNote?: string): Promise<VectorSpec> {
  const companyName = String(ctx?.snap?.company_name ?? "").trim();
  const wantsType = /wordmark|lettermark|monogram|combination|emblem/i.test(d.logo_type ?? "");
  const parsed = await callChatJsonOnce([
    { role: "system", content: "You are a master identity designer who constructs simple production logos from geometric vector primitives. Return valid JSON only. Never use gradients, filters, masks, images, scripts, external URLs, or more than five primitives." },
    { role: "user", content: `Turn this approved direction into a precise 1000×1000 vector specification.
Brand: ${companyName}
Core idea: ${strategy?.core_idea ?? ""}
Direction: ${JSON.stringify(d)}
Palette tokens: ${tokensBlockOf(tokens)}
${reviewNote ? `Revision instruction: ${reviewNote}` : ""}

Allowed primitives only:
- rect: x,y,width,height,rx
- circle: cx,cy,r
- line: x1,y1,x2,y2,stroke,strokeWidth
- path: SVG path d using only M/L/H/V/C/Q/Z commands
Every primitive may use fill/stroke from primary|secondary|accent|white|none. Keep all coordinates in 0..1000. Maximum five primitives. Build the symbol inside x=150..850 and y=100..720. Use one clear silhouette and generous negative space.
${wantsType ? `Include wordmark.text exactly as "${companyName}" with case, weight 300-800, and tracking 0-20.` : "Omit wordmark entirely."}

Return STRICT JSON:
{"primitives":[{"kind":"path","d":"M ... Z","fill":"primary","stroke":"none","strokeWidth":0}],"wordmark":{"text":"${companyName}","case":"title","weight":600,"tracking":2},"rationale":"one sentence","quality_scores":{"relevance":1,"distinctiveness":1,"simplicity":1,"scalability":1,"balance":1}}
Scores are 1-5. Do not include wordmark when instructed to omit it.` },
  ]);
  const primitives = Array.isArray(parsed?.primitives) ? parsed.primitives : [];
  if (!primitives.length || primitives.length > 5) throw new Error("Vector specification is missing or too complex");
  const wordmark = wantsType ? { ...(parsed.wordmark ?? {}), text: companyName } : undefined;
  return { primitives, wordmark, rationale: String(parsed.rationale ?? ""), quality_scores: parsed.quality_scores ?? {} };
}

/** Stage 3 — describe a MARK, not a picture. */
function buildLogoImagePrompt(
  d: LogoDirection,
  ctx: any,
  tokens: any,
  strategy?: BrandStrategy | null,
  critique?: string,
): string {
  const snap = ctx.snap ?? {};
  const colors = tokens?.colors ?? {};
  const fonts = tokens?.fonts ?? {};
  const wantsType = /wordmark|lettermark|monogram|combination|emblem/i.test(d.logo_type ?? "");
  const paletteLine = [colors.primary, colors.secondary, colors.accent].filter(Boolean).join(", ");

  return [
    `Flat vector LOGO MARK design — "${d.direction_name}" (${d.logo_type}).`,
    snap.company_name ? `Brand name: ${snap.company_name}.` : "",
    snap.industry ? `Category: ${snap.industry}.` : "",
    strategy?.core_idea ? `The mark must communicate: ${strategy.core_idea}` : "",
    d.one_line_idea ? `THE SHAPE: ${d.one_line_idea}` : `THE SHAPE: ${d.symbol_concept}`,
    d.symbol_concept && d.one_line_idea ? `Concept: ${d.symbol_concept}` : "",
    `Construction: ${d.construction_notes} Drawn on a geometric grid with a single consistent stroke weight, mathematically clean curves, optically balanced, vector-precise edges.`,
    wantsType
      ? `Typography: ${d.typography_treatment && d.typography_treatment.toLowerCase() !== "n/a" ? d.typography_treatment : "clean geometric sans"}. Set the words "${snap.company_name ?? ""}" correctly spelled, tight even tracking, in a typeface in the spirit of ${fonts.heading ?? "a refined geometric sans"}. No tagline, no extra words, no lorem text.`
      : `Symbol only — absolutely NO letters, NO words, NO text of any kind anywhere in the image.`,
    d.negative_space_play && d.negative_space_play.toLowerCase() !== "none"
      ? `Negative space: ${d.negative_space_play}.`
      : "",
    `Colour: strictly flat. Maximum two solid colours${paletteLine ? ` drawn from ${paletteLine}` : ""} plus white. ${d.color_application ?? ""} No gradient, no tint ramp, no opacity fade.`,
    d.reference_learning && d.reference_learning.toLowerCase() !== "n/a"
      ? `Borrowed structural principle (never copy the reference): ${d.reference_learning}`
      : "",
    "SILHOUETTE TEST: the mark must still read as one clear idea when reduced to a solid black shape at 16 pixels. Fewer than five distinct elements. One idea only.",
    "Output: a single centred logo, generous even margin, on a pure white #FFFFFF background. Nothing else in the frame — no mockup, no business card, no presentation board, no grid guides, no multiple variations, no colour swatches, no annotations, no signature, no watermark, no drop shadow, no 3D, no bevel, no texture, no photographic element, no background scene.",
    `Avoid: ${d.avoid_list ?? "category clichés"}.${strategy?.not_list?.length ? ` Also never: ${strategy.not_list.join("; ")}.` : ""} Plus: stock clichés, generic AI flourishes, sparkles, glow, lens flare.`,
    critique ? `PREVIOUS ATTEMPT FAILED REVIEW — fix exactly this: ${critique}` : "",
  ].filter(Boolean).join(" ");
}

/** Stage 4 — look at what actually rendered and judge it against the brief. */
async function critiqueLogo(
  b64: string,
  d: LogoDirection,
  strategy: BrandStrategy | null,
): Promise<{ pass: boolean; note: string }> {
  const system = `You are a design director reviewing a rendered logo before it reaches the client. You are strict but fair. You reject anything that is not a clean, flat, single-idea mark.`;
  const text = `Review this rendered logo against its brief.

Brief: ${d.one_line_idea ?? d.symbol_concept}
Logo type: ${d.logo_type}
${strategy?.core_idea ? `Must communicate: ${strategy.core_idea}` : ""}

Fail it if ANY of these are true: it is a scene or illustration rather than a mark; it has gradients, shadows, 3D, texture or photographic elements; there is misspelled, garbled or unintended text; it shows multiple variations, a mockup or annotations on one canvas; it is too detailed to survive at 16px; it carries more than one competing idea; the background is not clean white.

Return STRICT JSON: {"pass":true|false,"note":"if failing, one imperative sentence telling the renderer exactly what to change"}`;

  const parsed = await callChatJson([
    { role: "system", content: system },
    {
      role: "user",
      content: [
        { type: "text", text },
        { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
      ],
    },
  ]);
  // A failed/unavailable critique must never block delivery.
  if (!parsed || typeof parsed.pass !== "boolean") return { pass: true, note: "" };
  return { pass: parsed.pass, note: String(parsed.note ?? "") };
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
      await supabase.from("brand_logo_directions").update({ status: "developing_vector", current_stage: row.review_note ? "revise_vector" : "develop_vector", attempt_count: Number(row.attempt_count ?? 0) + 1, last_error: null, error_class: null }).eq("id", directionId);
      try {
        const spec = await developVectorSpec(row.concept as LogoDirection, run.strategy as BrandStrategy, ctx, tokens, reviewNote ?? row.review_note ?? undefined);
        const svg = renderVectorSvg(spec, tokens, snap.company_name ?? "Venture");
        const uploaded = await uploadVectorAsset(supabase, snapshotId, userId, directionId, svg);
        const scores = spec.quality_scores ?? {};
        const scoreValues = Object.values(scores).map(Number).filter(Number.isFinite);
        const average = scoreValues.length ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length : 4;
        const passed = average >= 3.8;
        const note = passed ? "" : "Simplify the geometry and strengthen the silhouette before selecting this direction.";
        const asset = { ok: true, url: uploaded.url, path: uploaded.path, svg_url: uploaded.url, svg_path: uploaded.path, direction_name: row.direction_name, logo_type: row.logo_type, one_line_idea: row.concept?.one_line_idea ?? row.concept?.symbol_concept, why_memorable: row.concept?.why_memorable ?? "", symbol_concept: row.concept?.symbol_concept, direction: row.concept, vector_spec: spec, review_passed: passed, review_note: note, review_score: scores, created_at: new Date().toISOString() };
        const { error: publishError } = await supabase.rpc("publish_brand_logo_direction", { p_direction_id: directionId, p_run_id: runId, p_run_version: run.version, p_asset: asset, p_svg_path: uploaded.path, p_preview_path: uploaded.path, p_review_passed: passed, p_review_score: scores, p_review_note: note });
        if (publishError) throw publishError;
        return new Response(JSON.stringify({ ok: true, asset }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (error) {
        const attempts = Number(row.attempt_count ?? 0) + 1;
        const terminal = attempts >= 3;
        await supabase.from("brand_logo_directions").update({ status: terminal ? "failed" : "retry_wait", last_error: error instanceof Error ? error.message : String(error), error_class: classifyError(error), retry_at: terminal ? null : new Date(Date.now() + Math.min(60_000, 5_000 * 2 ** attempts)).toISOString(), lease_token: null, lease_expires_at: null }).eq("id", directionId);
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
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

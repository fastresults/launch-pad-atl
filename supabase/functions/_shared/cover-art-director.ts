// Builds an agency-grade cover art prompt that fuses the LOCKED brand kit
// (palette roles, typography, voice, logo) with venture context.
// Designed to be paired with multimodal image input: the caller passes the
// primary logo PNG to the image model so it composes around the actual mark
// rather than redrawing one.

import type { AssetSpec, ArtDirectionId } from "./social-platform-specs.ts";
import type { CanvasPlan } from "./canvas-plan.ts";

type Kit = {
  palette?: any;
  typography?: any;
  voice?: any;
  logos?: any[];
  dna?: any;
};

const DIRECTION_BRIEF: Record<ArtDirectionId, string> = {
  editorial:
    "EDITORIAL — Magazine-grade type-led layout in the tradition of Wallpaper*, Apartamento, It's Nice That, and Pentagram editorial work. ONE confident headline set in the brand heading family, tight tracking, ranged left. ≥55% negative space. The brand signature color anchors the composition as a confident solid block, full-bleed sidebar, folio stripe, or large flat mark — never a hairline. Optional 1px rule lines and a small folio mark. No photography, no illustration of objects. The composition should look like a printed spread.",
  photographic:
    "PHOTOGRAPHIC — One cinematic, photo-real subject relevant to this venture, in the tradition of Annie Leibovitz editorial, Joe McNally environmental portraits, or Steve McCurry — natural light, shallow depth of field, real-camera physics. Apply a confident duotone grade pushed toward the brand SIGNATURE color: the duotone midtones MUST read clearly as the signature hue, not as neutral gray. If the subject is monochrome, add a confident signature-colored gradient wash or a flat signature color block behind the subject covering ≥25% of the canvas. The final image, viewed at thumbnail size, must not be mistakable for grayscale. NO type overlay unless the spec explicitly requires a headline. Avoid stock-people-smiling-at-laptop tropes, avoid HDR, avoid AI-skin shine.",
  geometric:
    "GEOMETRIC — Bauhaus Dessau / Sagmeister / Paula Scher discipline. Bold flat shapes (circles, arcs, rectangles, triangles). At least one major focal shape is filled with the brand SIGNATURE color and occupies a substantial portion of the canvas. No gradients, no outlines, no drop shadows. Confident asymmetry, mathematical alignment.",
  illustrative:
    "ILLUSTRATIVE — Flat custom vector illustration in the tradition of Malika Favre, Christoph Niemann, or Tom Froese. Single conceptual image that represents the venture, two-tone or three-tone using only the locked palette. At least one major shape uses the SIGNATURE color as fill — not as a thin outline. Clean closed shapes, no gradients, no textures, generous negative space.",
};

const BANNED = `
HARD BANS (any of these = failure, regenerate without it):
- Generic AI tropes: "tech mesh", glowing orbs, neon swirls, abstract data lines, particle clouds, holographic anything.
- Fake screenshots, fake UI, fake app mockups, fake dashboards.
- Watermarks, signature glyphs, copyright marks, made-up logos.
- ANY readable text other than the single approved headline (when the asset spec calls for one). No tagline. No URL. No "Lorem". No gibberish letterforms.
- Isometric office workers, stock smiling founders, handshake cliches, lightbulbs, rocket ships, puzzle pieces.
- Heavy gradients, drop shadows, bevels, lens flares, glossy reflections.
- Reproductions or redraws of the attached logo. The attached logo is placed by us, not redrawn by you.
- Dark text on dark surfaces. Light text on light surfaces. ANY foreground/background pair below 4.5:1 contrast.
- Using a color that is not one of: surface, ink, signature, or accent from the canvas plan.
- Composition with NO visible signature color, or where signature is reduced to a hairline / 1px stroke / barely-there mark = failure.
- If the final image, viewed at 240px thumbnail size, could be mistaken for grayscale or for a 2-color black-and-white render, it is a failure.
- Any visible border, outline, frame, rule, hairline, stroke, or divider around the logo landing area — or anywhere else on the canvas. The logo sits directly on the composition with no container, no chip, no plate, no card, no bracket marks.
- Any rectangular tonal panel, ghosted box, faint fill, drop shadow, gradient edge, or "placeholder" shape in the logo corner. Treat that area as unmarked negative space that continues the surrounding composition — no window cut out for it.
`;


const QUALITY = `
QUALITY BAR (an award jury would accept this):
- One dominant focal element. ≥55% negative space.
- Use ONLY the four hex colors named in the canvas plan: surface (background), ink (text/marks), signature (the brand hue — MUST be visibly present as a confident shape/block/wash in its exact named hex), and accent (one supporting color, used sparingly).
- Typography (when present) must use the brand heading family, tight tracking, real type hierarchy, optical alignment.
- WCAG AA contrast (≥4.5:1) between any text and its background.
- Crisp edges, no AI-blur, no muddy color, no halftone artifacts.
- Looks like work from Pentagram, Collins, Mother NY, Order, or Wolff Olins — not a stock generator.
`;

function paletteBlock(kit: Kit) {
  const c = kit?.palette?.colors ?? {};
  const lines = Object.entries(c)
    .filter(([, v]) => typeof v === "string")
    .map(([k, v]) => `  - ${k}: ${v}`)
    .join("\n");
  return lines || "  (no palette locked)";
}

function typoBlock(kit: Kit) {
  const t = kit?.typography ?? {};
  const h = t.heading?.family ?? "—";
  const b = t.body?.family ?? "—";
  return `  - Heading family: ${h}\n  - Body family: ${b}`;
}

// Words in a company name that innocently collide with unrelated real-world
// trades / places, causing image models to render the trade instead of the
// venture. E.g. "Startup Workshops" → carpentry workshop scene.
const LITERAL_WORD_GUARDS: Record<string, string> = {
  workshop: `"Workshop" here means a facilitated founder-education session with people, laptops, whiteboards, and slides — NOT a carpentry, mechanical, woodworking, metal, or craft workshop. Do NOT depict workbenches, hand tools, sawdust, aprons, lumber, machinery, or artisan trades.`,
  workshops: `"Workshops" here means facilitated founder-education sessions — NOT carpentry, mechanical, or craft workshops. Do NOT depict workbenches, tools, aprons, or artisan trades.`,
  lab: `"Lab" is a metaphor for iterative experimentation — NOT a chemistry / medical / scientific laboratory. Do NOT depict beakers, microscopes, lab coats, or test tubes unless the venture is literally in life sciences.`,
  labs: `"Labs" is a metaphor for iterative experimentation — NOT a chemistry / medical / scientific laboratory. Do NOT depict beakers, microscopes, lab coats, or test tubes unless the venture is literally in life sciences.`,
  studio: `"Studio" is a brand metaphor — NOT necessarily an art / dance / recording studio. Do NOT depict easels, ballet bars, or microphones unless the venture is literally in those trades.`,
  garage: `"Garage" is a founder-culture metaphor — NOT a car repair bay. Do NOT depict cars, lifts, tires, or mechanic overalls unless the venture is literally automotive.`,
  kitchen: `"Kitchen" is a metaphor for making things — NOT a restaurant kitchen. Do NOT depict cooks, stoves, or food unless the venture is literally in food & beverage.`,
  forge: `"Forge" is a metaphor for crafting — NOT a blacksmith's forge. Do NOT depict anvils, hot metal, or blacksmiths unless the venture is literally in metalwork.`,
  foundry: `"Foundry" is a metaphor for building — NOT a metal-casting foundry. Do NOT depict molten metal or industrial casting unless the venture is literally in that trade.`,
  atelier: `"Atelier" is a brand metaphor — NOT a fashion or art atelier. Do NOT depict sewing, mannequins, or fashion sketches unless the venture is literally in that trade.`,
  factory: `"Factory" is a metaphor for scaled production — NOT an industrial factory floor. Do NOT depict conveyor belts or heavy machinery unless the venture is literally in manufacturing.`,
  works: `"Works" is a brand suffix — NOT an industrial works. Do NOT depict factories or heavy industry unless the venture is literally in that sector.`,
  hub: `"Hub" is a metaphor for a gathering point — NOT a transit hub or airport. Do NOT depict planes, terminals, or hubcaps unless the venture is literally in transit.`,
  garden: `"Garden" is a metaphor for cultivation — NOT a horticultural garden. Do NOT depict plants, soil, or gardeners unless the venture is literally in horticulture.`,
};

function literalWordGuards(name: string, industry?: string, subIndustry?: string): string[] {
  if (!name) return [];
  const ind = `${industry ?? ""} ${subIndustry ?? ""}`.toLowerCase();
  const guards: string[] = [];
  const tokens = name.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  for (const t of tokens) {
    const g = LITERAL_WORD_GUARDS[t];
    if (!g) continue;
    // Skip the guard if the industry actually IS that trade (e.g. real bakery).
    if (t === "kitchen" && /food|restaurant|bever/.test(ind)) continue;
    if ((t === "lab" || t === "labs") && /(life ?sci|biotech|pharma|medical)/.test(ind)) continue;
    if (t === "garage" && /auto|vehicle|car/.test(ind)) continue;
    if (t === "atelier" && /fashion|apparel|art/.test(ind)) continue;
    if ((t === "factory" || t === "works") && /manufactur|industrial/.test(ind)) continue;
    guards.push(g);
  }
  return guards;
}

function ventureBlock(ctx: any, _headlineOverride?: HeadlineOverride) {
  const brain = ctx?.brain ?? {};
  const snap = ctx?.snap ?? {};
  const name = brain?.identity?.company_name ?? snap?.company_name ?? "the venture";
  const oneLiner = brain?.identity?.one_liner ?? snap?.value_proposition ?? "";
  const concept = snap?.concept_summary ?? "";
  const customer = brain?.customer ?? "";
  const problem = brain?.problem ?? "";
  const solution = brain?.solution ?? "";
  const diff = (brain?.differentiators ?? []).slice(0, 3).join("; ");
  const industry = snap?.industry ?? "";
  const subIndustry = snap?.sub_industry ?? "";
  const track = snap?.track ?? "";
  const location = [snap?.city, snap?.region, snap?.country].filter(Boolean).join(", ");
  const guards = literalWordGuards(name, industry, subIndustry);

  // "Visual anchor": what the scene should evoke, derived from customer + industry.
  const anchorParts: string[] = [];
  if (customer) anchorParts.push(customer);
  else if (industry) anchorParts.push(`${industry} audience`);
  const visualAnchor = anchorParts.length ? anchorParts.join(" · ") : "";

  const lines: string[] = [
    `SUBJECT CONTEXT (for scene comprehension only — do NOT render any of these words as text on the canvas):`,
    `  - Name: ${name}`,
    industry && `  - Industry: ${industry}${subIndustry ? ` / ${subIndustry}` : ""}`,
    track && `  - Track: ${track}`,
    location && `  - Location: ${location}`,
    concept && `  - What it IS (plain description): ${concept}`,
    oneLiner && `  - One-liner: ${oneLiner}`,
    customer && `  - Customer / audience depicted: ${customer}`,
    problem && `  - Problem it solves: ${problem}`,
    solution && `  - How it solves it: ${solution}`,
    diff && `  - Differentiators: ${diff}`,
    visualAnchor && `  - VISUAL ANCHOR (aim the scene here): ${visualAnchor}`,
  ].filter(Boolean) as string[];

  if (guards.length) {
    lines.push(`  - LITERAL-WORD GUARDRAILS (the name contains everyday words that MUST NOT be interpreted literally):`);
    for (const g of guards) lines.push(`      • ${g}`);
  }
  return lines.join("\n");
}

// Deterministic scene resolver — NEVER reads the brand name. Picks a subject
// from track/industry/customer so the model gets a fully-decided scene BEFORE
// it ever encounters tokens like "Workshops" / "Lab" / "Garage".
type SceneDirective = {
  depict: string;
  subjects: string[];
  setting: string;
  mood: string;
  avoid: string[];
};

function resolveSceneDirective(ctx: any): SceneDirective {
  const brain = ctx?.brain ?? {};
  const snap = ctx?.snap ?? {};
  const name = brain?.identity?.company_name ?? snap?.company_name ?? "";
  const industry = (snap?.industry ?? "").toLowerCase();
  const subIndustry = (snap?.sub_industry ?? "").toLowerCase();
  const track = (snap?.track ?? "").toLowerCase();
  const customer = brain?.customer ?? "";
  const ind = `${industry} ${subIndustry}`;

  // Union of every literal-word ban that applies to this venture's name.
  const guards = literalWordGuards(name, snap?.industry, snap?.sub_industry);
  const avoidBase = new Set<string>();
  const addAvoid = (...items: string[]) => items.forEach((i) => avoidBase.add(i));
  if (guards.some((g) => /workshop/i.test(g))) addAvoid("workbench", "hand tools", "sawdust", "lumber", "aprons", "wood shavings", "carpentry machinery", "artisan trades");
  if (guards.some((g) => /\blab\b|laborator/i.test(g))) addAvoid("beakers", "microscopes", "lab coats", "test tubes");
  if (guards.some((g) => /studio/i.test(g))) addAvoid("easels", "ballet bars", "recording microphones");
  if (guards.some((g) => /garage/i.test(g))) addAvoid("cars", "lifts", "tires", "mechanic overalls");
  if (guards.some((g) => /kitchen/i.test(g))) addAvoid("stoves", "chefs", "restaurant kitchens");
  if (guards.some((g) => /forge|foundry/i.test(g))) addAvoid("anvils", "molten metal", "blacksmiths");
  if (guards.some((g) => /atelier/i.test(g))) addAvoid("sewing", "mannequins", "fashion sketches");
  if (guards.some((g) => /factory|works/i.test(g))) addAvoid("conveyor belts", "heavy machinery", "industrial floor");
  if (guards.some((g) => /hub/i.test(g))) addAvoid("airport terminals", "planes", "hubcaps");
  if (guards.some((g) => /garden/i.test(g))) addAvoid("soil", "gardeners", "plant nursery");

  // Track-first resolution.
  if (track.includes("main_street") || track.includes("main street")) {
    return {
      depict: `A confident local small-business owner${customer ? ` (${customer})` : ""} inside their own shop, cafe, or storefront during business hours — warm daylight, real fixtures, real product on display, one authentic human moment.`,
      subjects: ["small-business owner", "local storefront interior", "real product on display", "daylight"],
      setting: "authentic Main-Street shop or storefront",
      mood: "grounded, proud, community-rooted",
      avoid: [...avoidBase],
    };
  }

  // Industry-specific scenes.
  if (/food|restaurant|bever|cafe|coffee/.test(ind)) {
    return {
      depict: "A founder-operator in their food/beverage space — clean prep counter, real ingredients, natural window light, one confident portrait or over-the-shoulder shot.",
      subjects: ["founder-operator", "prep counter", "real ingredients"],
      setting: "modern food/beverage workspace",
      mood: "crafted, warm, intentional",
      avoid: [...avoidBase],
    };
  }
  if (/fitness|wellness|health club|gym/.test(ind)) {
    return {
      depict: "A founder-coach mid-session in a modern studio — one client, one clean movement, daylight through tall windows.",
      subjects: ["coach", "client", "studio floor"],
      setting: "modern boutique fitness studio",
      mood: "focused, kinetic, disciplined",
      avoid: [...avoidBase],
    };
  }
  if (/(life ?sci|biotech|pharma|medical|health tech)/.test(ind)) {
    return {
      depict: "A clinical-grade research or care setting with a professional at work — real instruments, calm daylight, no theatrics.",
      subjects: ["clinician or researcher", "modern equipment"],
      setting: "modern clinical or research environment",
      mood: "precise, considered, human",
      avoid: [...avoidBase],
    };
  }
  if (/auto|vehicle/.test(ind)) {
    return {
      depict: "A modern mobility workspace with a founder-engineer beside their vehicle or rig — clean floor, brand-lit, one confident hero angle.",
      subjects: ["founder-engineer", "vehicle or rig"],
      setting: "modern mobility workspace",
      mood: "engineered, deliberate",
      avoid: [...avoidBase],
    };
  }

  // Default: startup / tech / services / anything else → founder cohort in an
  // accelerator setting. This is the correct scene for a startup accelerator
  // brand like "Startup Workshops".
  return {
    depict: `A diverse cohort of early-stage founders${customer ? ` (audience: ${customer})` : ""} in a bright modern accelerator / coworking space — laptops open, sticky notes on glass walls, a facilitator mid-gesture at a whiteboard. Real people, natural daylight, one confident focal moment.`,
    subjects: ["early-stage founders", "facilitator", "laptops", "whiteboard", "sticky notes on glass"],
    setting: "modern accelerator / coworking studio, daylight",
    mood: "focused, collaborative, optimistic",
    avoid: [...avoidBase],
  };
}

function sceneDirectiveBlock(scene: SceneDirective): string {
  const avoid = scene.avoid.length ? scene.avoid.join(", ") : "(none)";
  return [
    `SCENE DIRECTIVE (HIGHEST PRIORITY — depict exactly this; ignore any literal reading of the brand name):`,
    `  DEPICT: ${scene.depict}`,
    `  KEY SUBJECTS: ${scene.subjects.join(", ")}`,
    `  SETTING: ${scene.setting}`,
    `  MOOD: ${scene.mood}`,
    `  DO NOT DEPICT: ${avoid}`,
  ].join("\n");
}


export type HeadlineOverride = { mode: "auto" | "custom" | "none"; text?: string };

export function autoHeadline(ctx: any): string {
  const brain = ctx?.brain ?? {};
  return (
    brain?.identity?.tagline ||
    brain?.identity?.one_liner ||
    ctx?.snap?.tagline ||
    ctx?.snap?.one_liner ||
    ""
  ).slice(0, 64);
}


// Resolves the final headline to render on the image.
// Returns { text, suppress } — when suppress=true the composition must be
// rendered with zero glyphs anywhere on the canvas.
export function resolveHeadline(
  ctx: any,
  override?: HeadlineOverride,
): { text: string; suppress: boolean } {
  if (override?.mode === "none") return { text: "", suppress: true };
  if (override?.mode === "custom") {
    return { text: (override.text || "").trim().slice(0, 64), suppress: false };
  }
  return { text: autoHeadline(ctx), suppress: false };
}

// ------- Per-asset composition systems -------



function assetSystem(
  asset: AssetSpec,
  hasLogoImage: boolean,
  headline: string,
  suppressHeadline: boolean,
  isCustomHeadline: boolean,
  logoZone?: { widthPct: number; heightPct: number; corner: "top-left" | "bottom-right" | "center" },
): string {
  const kind = asset.kind;
  const ratio = `${asset.width}:${asset.height}`;

  const suppressBlock = `- HEADLINE POLICY (STRICT): DO NOT render any headline, tagline, subhead, URL, callout, sticker, or lettering anywhere on the canvas. Zero glyphs. Zero words. Zero numbers. The composition must work as a pure image plus the reserved logo zone only.`;
  const verbatimNote = (h: string) =>
    isCustomHeadline
      ? `- HEADLINE (verbatim, exact wording, no substitutions, no rewrites, no punctuation changes): "${h}". Set in the brand heading family, ranged left, max two lines. This is the ONLY text permitted on the canvas apart from the reserved logo zone.`
      : `- If a headline is rendered, use the brand heading family, set ranged left, max two lines, headline candidate: "${h || "(use venture name only)"}".`;

  // Compose a size-aware reserved-zone directive when the compositor has
  // told us exactly how much canvas the logo will occupy.
  const zone = (defaultCorner: "top-left" | "bottom-right", defaultW: number, defaultH: number) => {
    const w = logoZone?.widthPct ?? defaultW;
    const h = logoZone?.heightPct ?? defaultH;
    const corner = (logoZone?.corner === "center" ? defaultCorner : (logoZone?.corner ?? defaultCorner));
    return `- LOGO LANDING AREA: leave the ${corner} region (approx. ${w}% × ${h}% of the canvas, with ~5% inset from both edges) as unmarked negative space that continues the surrounding composition. Do NOT frame it, do NOT outline it, do NOT draw a border, hairline, stroke, rule, divider, bracket, corner mark, ghosted panel, tonal shift, drop shadow, gradient edge, debossed plate, chip, card, or watermark around it or inside it. The surrounding composition must flow up to the edges of this area as if the logo were not there — no "window" cut out for it. We will composite the venture's actual logo directly on top of that area after generation; it needs no container of any kind.
- HARD EXCLUSION for the ${corner} logo landing area: NO headline text, NO subhead, NO caption, NO sticker, NO callout, NO URL, NO signature color block, NO sidebar stripe, NO focal shape, and NO photo subject may enter this rectangle or cross its edges. Any glyph or major shape that overlaps this rectangle is an automatic rejection — the logo will be composited on top and destroy the composition.
- Any signature-color block, sidebar stripe, or focal shape must terminate at least 8% of the canvas away from the outer edges of this rectangle. Signature color reaches its coverage target through blocks placed on the OPPOSITE side of the canvas from the logo landing area.
- Do NOT redraw, recreate, or paint the logo yourself anywhere on the canvas.`;
  };

  if (kind === "avatar") {
    return `AVATAR SYSTEM
- The attached image #1 is the venture's official logo. Place it perfectly centered, occupying ~70% of the canvas shortest side.
- Background: a single flat color drawn from the brand palette (prefer 'bg' if it contrasts with the logo; otherwise 'primary' or 'fg' — whichever yields ≥4.5:1 contrast against the logo's dominant ink).
- No additional shapes, type, gradients, or decorations. Just the logo on color.
- Logo pixels MUST be preserved — do not stylize, recolor, redraw, crop, or distort the mark.
- Output a perfect square at ${asset.width}x${asset.height}.`;
  }

  if (kind === "banner" || kind === "header" || kind === "channel_art") {
    return `BANNER / HEADER SYSTEM (${ratio})
- Treat the canvas as a 12-column print grid. Critical content lives in columns 2–8 (left-anchored); columns 9–12 stay quiet for platform UI overlap.
${zone("bottom-right", 16, 16)}
${suppressHeadline ? suppressBlock : verbatimNote(headline)}
- Strict safe inset of 8% on all sides — no critical content in the bleed.
- ${asset.guidance}`;
  }

  if (kind === "thumbnail" || kind === "video_poster" || kind === "vertical_pin") {
    return `THUMBNAIL / POSTER SYSTEM (${ratio})
- One bold focal subject occupies the upper two-thirds.${suppressHeadline ? " Composition must resolve without any text lockup." : " Headline (3–5 words) anchors the lower third, set in the brand heading family."}
${zone("top-left", 22, 22)}
- High contrast — readable as a 240px-wide thumbnail in a feed.
${suppressHeadline ? suppressBlock : `- HEADLINE (${isCustomHeadline ? "verbatim, exact wording, no substitutions" : "candidate"}): "${headline || "(use venture name)"}". Trim to fit${isCustomHeadline ? " ONLY by wrapping — never by rephrasing" : ""}.`}
- ${asset.guidance}`;
  }

  // pinned_post, story_cover, etc.
  const isSquareOrPortrait = asset.height >= asset.width;
  // Headline-landing zone: top-band exclusion so headlines can't collide with
  // signature sidebars, focal shapes, or the logo. Sized by aspect.
  const headlineBandPct = suppressHeadline
    ? 0
    : asset.width === asset.height
    ? 24
    : asset.height > asset.width * 1.5
    ? 14
    : 20;
  const headlineZoneBlock = suppressHeadline
    ? ""
    : `\n- HEADLINE LANDING AREA: reserve the TOP ${headlineBandPct}% of the canvas (full width, minus 8% side insets) exclusively for the headline text. NO sidebar stripe, NO signature block, NO focal shape, NO photo subject, NO logo may enter or cross this rectangle. The headline text is left-anchored inside this band, ranged left, max two lines, tight tracking, must fit fully within the band without any character clipping at the left or right edge. Do NOT wrap so tightly that any letterform touches or crosses the band's left/right/top edges — pull the type in by another 3% if in doubt.`;
  const sidebarCap = isSquareOrPortrait
    ? `\n- SIDEBAR / SIGNATURE BLOCK CAP: on this square or portrait canvas, any sidebar stripe or full-height signature block MUST NOT exceed 28% of canvas width, MUST sit on the OPPOSITE side of the canvas from the LOGO LANDING AREA, MUST START BELOW the HEADLINE LANDING AREA (never full-height across the headline band), and MUST NOT contain any lettering (no vertical headline, no rotated text, no glyphs). Reach the signature coverage target through additional flat shapes elsewhere on the canvas, not by widening or lengthening the sidebar.`
    : "";
  return `POST / COVER SYSTEM (${ratio})
- Treat as a single editorial frame. One focal element, ≥60% negative space.
${suppressHeadline ? suppressBlock : "- Optional type lockup uses the brand heading family." + (isCustomHeadline ? ` HEADLINE (verbatim, exact wording): "${headline}". Do not rephrase. Render it entirely inside the HEADLINE LANDING AREA below — never let letterforms touch or cross that band's edges.` : "")}
${headlineZoneBlock}
${zone("top-left", 24, 24)}${sidebarCap}
- Reserve an 8% safe inset on all sides for platform UI.
- ${asset.guidance}`;

}

// ------- Public builders -------

export function buildCoverArtPrompt(args: {
  platform: string;
  asset: AssetSpec;
  direction: ArtDirectionId;
  kit: Kit;
  ctx: any;
  plan: CanvasPlan;
  hasLogoImage?: boolean;
  retryNote?: string;
  userFeedback?: string;
  variationSeed?: string;
  headlineOverride?: HeadlineOverride;
  logoZone?: { widthPct: number; heightPct: number; corner: "top-left" | "bottom-right" | "center" };
}): string {
  const { platform, asset, direction, kit, ctx, plan, hasLogoImage = true, retryNote, userFeedback, variationSeed, headlineOverride, logoZone } = args;
  const brief = DIRECTION_BRIEF[direction];
  const palette = paletteBlock(kit);
  const typo = typoBlock(kit);
  const { text: headline, suppress: suppressHeadline } = resolveHeadline(ctx, headlineOverride);
  const isCustomHeadline = headlineOverride?.mode === "custom" && !!headline;
  const venture = ventureBlock(ctx, headlineOverride);
  const scene = resolveSceneDirective(ctx);
  const sceneBlock = sceneDirectiveBlock(scene);
  const system = assetSystem(asset, hasLogoImage, headline, suppressHeadline, isCustomHeadline, logoZone);
  const dims = `${asset.width}x${asset.height} (${asset.guidance})`;

  // Auto-derived tagline the model must NOT paint when the founder has taken
  // manual control of the on-image text.
  const autoTag = autoHeadline(ctx);
  // Explicit ban on re-drawing the brand wordmark anywhere in the scene — the
  // logo is composited server-side, and multimodal models otherwise tend to
  // echo the wordmark into the background as scene text.
  const brandName: string = (ctx?.brain?.identity?.company_name ?? ctx?.snap?.company_name ?? "").toString().trim();
  const wordmarkBan = brandName
    ? `\nWORDMARK BAN (STRICT): do NOT render the letters "${brandName}", any casing variant ("${brandName.toLowerCase()}", "${brandName.toUpperCase()}"), any spacing variant, or any typographic redraw of the brand mark anywhere in the composition — not on a shopfront, sticker, sign, monitor, poster, sidebar, footer, watermark, badge, or as ambient signage. The real logo is composited on top after generation; any painted brand text creates a duplicate.\n`
    : "";
  const primaryTextObjective = isCustomHeadline
    ? `\n## PRIMARY TEXT OBJECTIVE (READ FIRST — OVERRIDES ALL OTHER COPY GUIDANCE)\nThe ONLY lettering permitted anywhere on this canvas is the exact string:\n    "${headline}"\nRender it verbatim. No substitutions. No rewrites. No punctuation changes. No additional words, subheads, taglines, URLs, hashtags, or captions.\nFORBIDDEN TEXT: do NOT render "${autoTag}" or any paraphrase, translation, abbreviation, or restatement of it anywhere on the canvas.${wordmarkBan}`
    : suppressHeadline
    ? `\n## PRIMARY TEXT OBJECTIVE (READ FIRST — OVERRIDES ALL OTHER COPY GUIDANCE)\nZERO lettering on this canvas. No headline, no tagline, no subhead, no URL, no callout, no caption, no watermark. Zero glyphs. Zero words. Zero numbers.\nFORBIDDEN TEXT: do NOT render "${autoTag}" or any paraphrase of it.${wordmarkBan}`
    : `\n## PRIMARY TEXT OBJECTIVE\nAt most one short headline is permitted, set in the brand heading family.${wordmarkBan}`;



  const forbiddenLines = plan.forbiddenPairs.slice(0, 6).map(
    (p) => `  - Never place ${p.fg} on ${p.bg} (only ${p.ratio}:1 — illegible).`,
  ).join("\n") || "  - (none flagged)";

  const references = hasLogoImage
    ? `## Attached reference images (authoritative — honor exactly)
- Image #1: the venture's official logo. Use its colors and forms as-is. Do NOT redraw. For non-avatar assets, leave an unmarked area of negative space where the logo will land — no container, no frame, no border, no plate, no card, no outline, no ghosted rectangle around it. We composite the actual logo directly on top of the raw composition.
- Image #2: the canvas palette tile. The FOUR colors in this tile (surface, ink, signature, accent) are the ONLY colors permitted in the composition. No other colors. No tints. No gradients between them.`
    : `## Reference imagery
- No logo file was uploaded; do NOT invent a logo. Compose around a clean reserved rectangle in a non-focal corner.`;

  const feedbackBlock = userFeedback && userFeedback.trim()
    ? `\n## Founder feedback on the previous version (BINDING — honor every note)\nThe founder reviewed the last render and said:\n"""${userFeedback.trim().slice(0, 600)}"""\nTreat this as binding art-direction notes from the client. Apply every note unless it would violate the canvas plan or contrast rules above (those always win).\n`
    : "";

  const retryBlock = retryNote
    ? `\n## Previous attempt was rejected\n${retryNote}\nDo NOT repeat that mistake.\n`
    : "";

  return `You are an award-winning senior art director at Pentagram / Collins / Mother NY shipping a launch-day ${platform} ${asset.label} for the venture below. Anything that wouldn't pass a creative director's desk on a paying client engagement is unacceptable.

${references}
${primaryTextObjective}

## ${sceneBlock}

## Canvas plan (NON-NEGOTIABLE — exactly these four hex values, used as specified)
- Background surface: ${plan.surface}  ← the entire background fills with this exact hex
- Ink (all text, logo marks, lines): ${plan.ink}  ← AA-legible on the surface
- SIGNATURE brand color (MUST be visibly present): ${plan.displaySignature}  ← cover ≥${plan.signatureMinCoveragePct}% of the canvas. Use this EXACT hex — do not darken it toward black, do not desaturate it toward gray.
- Accent (one supporting color, used sparingly): ${plan.accent}
- Brand signature INTENSITY: ${plan.signatureIntensity.toUpperCase()} (drives coverage target of ${plan.signatureMinCoveragePct}%)
- Brand signature PLACEMENT (${plan.signaturePlacement}): ${plan.signaturePlacementBrief} Never reduce the signature to a hairline, 1px stroke, or tiny dot.
- Forbidden pairings detected in this palette:
${forbiddenLines}

## Locked brand kit (for typography reference only — colors are governed by the canvas plan above)
Palette roles available in the brand kit (reference, not a license to use them all):
${palette}
Typography:
${typo}

## Brand context (identity metadata — NOT a scene description)
The brand name below is a wordmark / label, not a subject to depict. If the Scene Directive at the top and any literal reading of the brand name conflict, the Scene Directive ALWAYS wins.
${venture}

The Scene Directive governs WHAT is depicted. The Canvas plan governs COLORS. The Headline policy governs TEXT. Never let the brand name's individual English words dictate the scene — always defer to the Scene Directive.

## Asset spec
  - Platform: ${platform}
  - Asset: ${asset.label}
  - Target dimensions: ${dims}

## Composition system
${system}

## Art direction
${brief}
${QUALITY}
${BANNED}
${feedbackBlock}${retryBlock}${variationSeed ? `\n## Variation seed\nSeed: ${variationSeed}. Use this to meaningfully vary composition, focal placement, and texture from any prior attempt while keeping every rule above.\n` : ""}
Deliver a single finished image at the spec'd aspect that a senior art director would ship to a paying client today. Background MUST be exactly ${plan.surface}. Any rendered glyphs, marks, or text MUST be exactly ${plan.ink}. The SIGNATURE color ${plan.displaySignature} MUST cover ≥${plan.signatureMinCoveragePct}% of the canvas as a confident shape (not a hairline). The only permitted secondary accent is ${plan.accent}. If the result reads as black-and-white at thumbnail size, you have failed.`;
}


// Deterministic avatar prompt: the surface color is decided server-side by
// measuring contrast against the logo's actual dominant ink, then passed in.
export function buildAvatarPrompt(args: {
  platform: string;
  asset: AssetSpec;
  surfaceHex: string;
  userFeedback?: string;
  retryNote?: string;
  variationSeed?: string;
}): string {
  const { platform, asset, surfaceHex, userFeedback, retryNote, variationSeed } = args;
  const feedbackBlock = userFeedback && userFeedback.trim()
    ? `\nFounder feedback on previous version (BINDING — apply unless it conflicts with logo preservation): """${userFeedback.trim().slice(0, 400)}"""\n`
    : "";
  const retryBlock = retryNote ? `\nRetry note: ${retryNote}\n` : "";
  const seedBlock = variationSeed ? `\nVariation seed: ${variationSeed} (vary subtle non-logo details across regenerations).\n` : "";
  return `You are placing the venture's official logo (attached as image #1) onto a profile avatar for ${platform}.

NON-NEGOTIABLE:
- PRESERVE THE LOGO PIXELS EXACTLY. Do not redraw, recolor, restyle, crop, distort, or "improve" the logo. Treat it as a placed asset.
- Center the logo on a perfectly square canvas at ${asset.width}x${asset.height}.
- The logo occupies ~70% of the canvas shortest side, with even padding on all four sides.
- Background: a single flat solid color, EXACTLY ${surfaceHex}. No gradients, no patterns, no shadows, no glow, no decorations, no text. This color was chosen server-side to guarantee maximum contrast against the logo — do not override it.
${feedbackBlock}${retryBlock}${seedBlock}
Output a single PNG: the logo, exactly as provided, centered on a solid ${surfaceHex} background.`;
}

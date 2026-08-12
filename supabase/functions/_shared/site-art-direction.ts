// Site art direction — the missing "creative director" step in the Website PRD
// pipeline.
//
// Before this file existed, every PRD shipped the same component menu (hero →
// 3-up feature grid → logo bar → pricing → FAQ → CTA band), so every generated
// site converged on the same average layout. An archetype is a committed
// design direction: one grid system, one type personality, one section rhythm,
// one motion character and two signature moves that only that archetype uses.
//
// Exactly ONE archetype is selected per venture (deterministically, from track
// + brand traits + tone words) and injected into the PRD prompt as a hard
// constraint. The model is never handed the menu again.

import { imageCraftBlock } from "./image-craft.ts";
import { copyCraftBlock } from "./copy-craft.ts";
import { surfaceSystemBlock } from "./surface-system.ts";

export type SiteArchetype = {
  key: string;
  name: string;
  /** One-line brief for the designer/model. */
  essence: string;
  /** Grid + layout system. */
  grid: string;
  /** Type personality and scale character. */
  typography: string;
  /** Ordered section rhythm for the home page. */
  rhythm: string[];
  /** Motion character. */
  motion: string;
  /** How colour is deployed across the page. */
  colour: string;
  /** Two moves that must appear and are unique to this direction. */
  signatureMoves: string[];
  /** Imagery character. */
  imagery: string;
  /** Layout habits that are banned in this direction. */
  never: string[];
};

export const SITE_ARCHETYPES: SiteArchetype[] = [
  {
    key: "editorial_broadsheet",
    name: "Editorial Broadsheet",
    essence:
      "A magazine cover, not a landing page. Oversized typographic statements carry the site; imagery supports the text rather than the other way around.",
    grid:
      "12-column asymmetric grid with a persistent 2-column baseline. Content spans 7/12 or 5/12 rather than centring; deliberate wide left margin acting as a gutter rail with running section numbers.",
    typography:
      "Display type at 96–140px on desktop, tight tracking (-0.02em), heavy weight contrast against a 17px/30 body serif or humanist sans. Drop-cap on the first editorial paragraph. Section numbers set in small caps.",
    rhythm: [
      "Full-width typographic masthead hero (headline only, no card, no stock image)",
      "Standfirst paragraph in an offset column with a pull-quote",
      "Editorial feature spread — image left, long-form argument right, alternating per block",
      "Numbered argument sequence (01/02/03) as full-width horizontal rules, not cards",
      "Data spread with an oversized statistic as typography",
      "Interview / founder voice block on an inverted colour field",
      "Index-style offer table",
      "Closing masthead CTA repeating the hero type treatment",
    ],
    motion:
      "Type reveals by line mask (clip-path, 420ms, stagger 80ms). No card hovers; links underline-grow. Slow parallax on full-bleed spreads only.",
    colour:
      "Paper-toned base with one saturated brand accent used sparingly for rules, numbers and links. Inverted (dark) full-bleed section every third block.",
    signatureMoves: [
      "A running left-hand rail with section numbers and a scroll-linked progress line",
      "At least one full-bleed inverted colour spread with the headline set at display scale",
    ],
    imagery:
      "Documentary, high-contrast, single-subject photography with generous negative space; images cropped to the grid, never rounded, never with drop shadows.",
    never: [
      "Centred hero with a paragraph and two buttons",
      "3-up icon-and-title feature cards",
      "Rounded-corner shadowed card grids",
    ],
  },
  {
    key: "cinematic_immersive",
    name: "Cinematic Immersive",
    essence:
      "The site opens like a film. Full-bleed motion imagery, a sticky caption rail, and copy that arrives over the frame.",
    grid:
      "Full-bleed canvas with a 1440px inner rail. Content anchors to the bottom-left third of each frame; sticky side caption column on desktop.",
    typography:
      "Condensed display headings in uppercase with wide tracking for kickers, generous 18px/32 body. Type sits over imagery with a gradient scrim, never in a solid box.",
    rhythm: [
      "Full-viewport cinematic hero (image or video) with bottom-anchored headline and a scroll cue",
      "Sticky-caption scroll sequence — imagery changes while the caption column pins",
      "Quiet interstitial: single centred line of copy on a dark field",
      "Chaptered offer sections, each opening with a full-bleed frame and a chapter number",
      "Proof reel — horizontal scroll of portraits or results",
      "Duotone stats band",
      "Closing full-bleed CTA frame with the logo lockup centred",
    ],
    motion:
      "Scroll-scrubbed image crossfades, pinned caption columns, 600ms ease-out reveals, subtle Ken Burns on hero stills. Everything disabled under prefers-reduced-motion.",
    colour:
      "Near-black base, brand accent as light source (glows, rules, focus states). Colour appears in imagery, not in UI chrome.",
    signatureMoves: [
      "A pinned scroll sequence where the caption column stays fixed while frames advance",
      "A chapter-numbered structure with full-bleed openers between every major section",
    ],
    imagery:
      "Cinematic stills with strong directional lighting, shallow depth of field, and a consistent colour grade pulled from the brand palette. 'Near-black' describes the UI chrome, NOT the photographs: every subject stays properly exposed at 35–55% luminance with open shadows, and headline contrast comes from a CSS gradient scrim laid over a clean image — never from a darkened render.",
    never: [
      "Light-grey section backgrounds alternating with white",
      "Icon grids",
      "Screenshot-in-a-browser-frame hero",
      "A hero image so dark the subject is unreadable, or darkness baked into the render instead of applied as a CSS scrim",
    ],
  },
  {
    key: "precision_product",
    name: "Precision Product Surface",
    essence:
      "A dense, confident product surface — bento composition, real interface detail, engineering credibility over marketing gloss.",
    grid:
      "Bento grid: 4- and 6-cell compositions with mixed spans, 1px hairline dividers, 1280px max width, 20px gutters. Tight vertical rhythm (72px section padding, not 160px).",
    typography:
      "Geometric or grotesk headings at 44–64px, monospace for labels, metrics and eyebrow text. 15px/26 body. Numerals tabular everywhere.",
    rhythm: [
      "Split hero — claim left, live interface detail or data visual right",
      "Hairline logo/proof rail (single line, monochrome)",
      "Bento capability composition with mixed cell spans and one interactive cell",
      "Deep-dive strip: one capability explained with a real UI close-up",
      "Metrics block with tabular numerals and a chart",
      "Comparison / spec table",
      "Integration or workflow diagram",
      "Compact pricing table with a toggle",
      "Low-key CTA band with a single field inline form",
    ],
    motion:
      "Restrained: 160ms hairline hover states, number count-ups on scroll, cell lift of 2px. No page-level parallax.",
    colour:
      "Neutral surface with a single functional accent for state and emphasis; semantic success/warning colours used honestly in data.",
    signatureMoves: [
      "A bento composition where at least one cell contains a real, interactive UI detail",
      "A monospace metadata language used consistently for eyebrows, labels and metrics",
    ],
    imagery:
      "Interface close-ups, isometric system diagrams, data visualisations, macro product detail. No lifestyle stock.",
    never: [
      "Gradient blob backgrounds",
      "Illustrated cartoon mascots",
      "Full-viewport hero with a single centred sentence",
    ],
  },
  {
    key: "warm_storefront",
    name: "Warm Storefront",
    essence:
      "A real place with real people. Texture, warmth, hand-set detail and local specificity beat polish.",
    grid:
      "Generous 8-column grid with overlapping cards, off-grid photo insets and hand-drawn rules. Rounded but irregular framing; content max 1120px.",
    typography:
      "Warm serif or slab headings 40–72px paired with a friendly humanist body at 17px/30. Handwritten/script accent used once per page maximum.",
    rhythm: [
      "Split hero — a real photograph of the place or the people, headline overlapping the image edge",
      "Welcome paragraph in the owner's voice with a signature",
      "What we do — three offerings as photo-led panels, not icon cards",
      "Proof: reviews with real names, faces and dates",
      "Practical block — hours, location, map, parking, what to expect",
      "Gallery strip",
      "Meet the team portraits",
      "FAQ in plain language",
      "CTA band with phone number, address and booking link",
    ],
    motion:
      "Minimal and soft: 240ms fades, gentle image scale on hover, no scroll hijacking.",
    colour:
      "Warm neutral paper base, brand colour in generous flat fields, textured overlays (grain, paper) at low opacity.",
    signatureMoves: [
      "An overlapping photo-and-text composition where the image breaks the section boundary",
      "A practical 'what to expect' block with real operational detail (hours, address, parking, timing)",
    ],
    imagery:
      "Natural-light documentary photography of the actual place, product and people; texture close-ups; no polished studio stock.",
    never: [
      "Dark-mode SaaS aesthetics",
      "Abstract 3D renders",
      "Generic smiling-team stock photography",
    ],
  },
  {
    key: "luxury_minimal",
    name: "Luxury Minimal",
    essence:
      "Restraint as the message. Enormous whitespace, few words, perfect proportion, one exquisite image per screen.",
    grid:
      "Centred 960px measure inside a very wide canvas. One idea per viewport. Section padding 180px+. Strict vertical centre axis.",
    typography:
      "High-contrast serif display 56–88px with wide letter-spacing on small caps eyebrows; 16px/34 body at short measure (max 62ch).",
    rhythm: [
      "Quiet hero — one line of type, one hairline rule, one small CTA",
      "Single full-bleed image at 21:9",
      "Statement paragraph centred at short measure",
      "Offer presented as three sequential full-viewport panels (not a grid)",
      "Detail close-up gallery in a 2-up asymmetric pair",
      "Testimonial as a single centred quotation",
      "Enquiry section with a minimal form (3 fields max)",
    ],
    motion:
      "Slow fades only (500ms, ease-out), no transforms above 8px, cursor-following highlight on the primary CTA.",
    colour:
      "Monochrome base with a single metallic or deep accent used at 5% coverage. Nothing else.",
    signatureMoves: [
      "One-idea-per-viewport pacing where each panel holds a single element",
      "A three-panel sequential offer presentation instead of a pricing card grid",
    ],
    imagery:
      "Editorial still life and portraiture with controlled light, deep shadow and one focal object per frame. Deep shadow means shaped falloff around a correctly exposed subject — the focal object and any face stay legible at 45–60% luminance with catchlights intact; text contrast is a CSS scrim, never a darker render.",
    never: [
      "Feature grids",
      "Badges, ribbons or discount callouts",
      "More than one CTA style on a page",
      "A hero or portrait so dark the subject is unreadable",
    ],
  },
  {
    key: "kinetic_brutal",
    name: "Kinetic Brutalist",
    essence:
      "Loud, structural and confident. Hard edges, exposed grid, oversized interaction feedback, colour used as architecture.",
    grid:
      "Exposed grid with visible 1–2px borders on every cell, no rounded corners, deliberate horizontal scroll strips, sticky stacked sections.",
    typography:
      "Ultra-bold grotesk headings 72–160px, tight leading (0.9), all-caps kickers, mono captions. Text can wrap the viewport edge.",
    rhythm: [
      "Oversized type hero with a marquee strip underneath",
      "Sticky stacked panels that overlay as the user scrolls",
      "Horizontal-scroll capability strip",
      "Bordered manifesto grid — statements in bordered cells, no icons",
      "Big-number results section",
      "Case study cards in a horizontal rail",
      "Loud CTA block with hover-inverting button",
    ],
    motion:
      "Marquee loops, sticky stack overlays, 120ms snap hovers with colour inversion, cursor-scale interactions.",
    colour:
      "Two flat brand colours in large blocks plus black rules. No gradients, no shadows.",
    signatureMoves: [
      "A sticky stacked-panel scroll where sections overlay one another",
      "A running marquee strip using brand vocabulary",
    ],
    imagery:
      "High-contrast cutouts, duotone treatments, halftone textures, oversized cropped subjects.",
    never: [
      "Soft shadows and rounded cards",
      "Pastel gradient meshes",
      "Centred paragraph-and-two-buttons hero",
    ],
  },
  {
    key: "trusted_institution",
    name: "Trusted Institution",
    essence:
      "Calm authority. Structured, evidence-led, easy to navigate — built for people making a considered, high-stakes decision.",
    grid:
      "Classic 12-column with a persistent secondary nav / table of contents on long pages. 1200px measure, clear 96px section rhythm, generous tables.",
    typography:
      "Transitional serif headings at 40–60px with a clean sans body at 17px/30. Strong heading hierarchy down to H4; captions and citations styled.",
    rhythm: [
      "Composed hero — headline, one supporting sentence, credibility rail (credentials, years, coverage)",
      "Situation / stakes explainer with a supporting diagram",
      "Structured service breakdown with a table of scope and outcomes",
      "Evidence section — outcomes, figures, named references",
      "Process timeline with clear stages and durations",
      "People / credentials section with portraits and bios",
      "Detailed FAQ grouped by theme",
      "Contact block with response-time commitment",
    ],
    motion:
      "Subtle: 200ms fades, sticky in-page nav highlighting the active section, no decorative animation.",
    colour:
      "Deep brand primary for headers and rules, near-white body surface, one restrained accent for links and CTAs.",
    signatureMoves: [
      "A sticky in-page table of contents on every long page",
      "A scope-and-outcomes table that names exactly what is delivered",
    ],
    imagery:
      "Composed environmental portraits, real document and artefact close-ups, clean explanatory diagrams and charts.",
    never: [
      "Playful illustration",
      "Countdown timers or urgency badges",
      "Vague hero claims with no supporting evidence",
    ],
  },
  {
    key: "community_energy",
    name: "Community Energy",
    essence:
      "People-first and kinetic. Faces, voices and momentum — the site feels like a room that is already full.",
    grid:
      "Collage grid mixing portrait tiles, quote cards and event rows; overlapping avatars; masonry proof wall; 1200px measure.",
    typography:
      "Rounded geometric headings 48–80px, energetic weight jumps, highlighter-style emphasis on key phrases, 17px/30 body.",
    rhythm: [
      "Hero with a portrait collage or faces wall and a direct, spoken headline",
      "Live counter row (members, sessions, cities)",
      "Voices wall — quotes with faces in a masonry layout",
      "How it works as a three-step timeline with photography",
      "Upcoming sessions / events list with real dates",
      "Member spotlight story",
      "Join block with a single-field signup",
    ],
    motion:
      "Avatar hover pops, counter roll-ups, marquee of member names, 220ms springs.",
    colour:
      "Bright brand accent used generously as highlight fields behind text, warm neutral base.",
    signatureMoves: [
      "A faces wall built from real portraits rather than logos",
      "A dated, concrete upcoming-sessions list instead of a generic CTA",
    ],
    imagery:
      "Candid group and portrait photography, in-the-room moments, screenshots of real conversations.",
    never: [
      "Corporate stock handshakes",
      "Empty-room hero imagery",
      "Icon-only feature grids with no people",
    ],
  },
];

const TRACK_BIAS: Record<string, string[]> = {
  lifestyle: ["warm_storefront", "community_energy", "editorial_broadsheet"],
  ecommerce_dtc: ["cinematic_immersive", "luxury_minimal", "editorial_broadsheet"],
  scalable_tech: ["precision_product", "kinetic_brutal", "cinematic_immersive"],
  marketplace: ["precision_product", "community_energy", "editorial_broadsheet"],
  deep_tech: ["precision_product", "trusted_institution", "cinematic_immersive"],
  social_impact: ["community_energy", "editorial_broadsheet", "trusted_institution"],
  corporate: ["trusted_institution", "precision_product", "editorial_broadsheet"],
  existing: ["editorial_broadsheet", "trusted_institution", "warm_storefront"],
};

const TRAIT_HINTS: Record<string, string[]> = {
  editorial_broadsheet: ["editorial", "intellectual", "journalistic", "literary", "thoughtful", "considered", "candid", "opinionated"],
  cinematic_immersive: ["cinematic", "dramatic", "bold", "immersive", "emotive", "aspirational", "moody", "premium"],
  precision_product: ["precise", "technical", "engineered", "analytical", "efficient", "systematic", "data", "rigorous"],
  warm_storefront: ["warm", "friendly", "local", "handmade", "welcoming", "homely", "neighbourly", "approachable", "artisan"],
  luxury_minimal: ["luxury", "minimal", "refined", "elegant", "quiet", "understated", "exclusive", "crafted"],
  kinetic_brutal: ["bold", "loud", "disruptive", "irreverent", "rebellious", "energetic", "raw", "unapologetic"],
  trusted_institution: ["trusted", "authoritative", "credible", "professional", "expert", "reliable", "serious", "compliant"],
  community_energy: ["community", "human", "inclusive", "supportive", "collaborative", "playful", "optimistic", "social"],
};

function normWords(input: unknown): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (!v) return;
    if (typeof v === "string") {
      out.push(...v.toLowerCase().split(/[^a-z]+/i).filter((w) => w.length > 2));
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === "object") Object.values(v as Record<string, unknown>).forEach(walk);
  };
  walk(input);
  return out;
}

/** Stable hash so the same venture always resolves to the same direction. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export type ArchetypeInput = {
  snapshotId?: string | null;
  track?: string | null;
  /** Brand kit row (dna.traits, voice.tone_words, art_direction, …). */
  brandKit?: Record<string, any> | null;
  /** Any extra free text to score against (concept summary, positioning). */
  freeText?: string | null;
};

/**
 * Pick exactly one archetype for this venture: brand traits and tone words vote
 * first, the track biases the field, and the snapshot id breaks ties so the
 * choice is stable across regenerations.
 */
export function selectArchetype(input: ArchetypeInput): SiteArchetype {
  const kit = input.brandKit ?? null;
  const words = new Set([
    ...normWords(kit?.dna?.traits ?? kit?.dna?.mood ?? kit?.dna?.personality),
    ...normWords(kit?.voice?.tone_words ?? kit?.voice?.toneWords),
    ...normWords(kit?.dna?.positioning ?? kit?.dna?.promise),
    ...normWords(kit?.art_direction),
    ...normWords(input.freeText ?? ""),
  ]);

  const bias = TRACK_BIAS[(input.track ?? "").toLowerCase()] ?? [];
  const scored = SITE_ARCHETYPES.map((a) => {
    let score = 0;
    for (const hint of TRAIT_HINTS[a.key] ?? []) if (words.has(hint)) score += 3;
    const biasIndex = bias.indexOf(a.key);
    if (biasIndex >= 0) score += 4 - biasIndex; // 4 / 3 / 2
    return { a, score };
  });

  const best = Math.max(...scored.map((s) => s.score));
  const leaders = scored.filter((s) => s.score === best).map((s) => s.a);
  if (leaders.length === 1) return leaders[0];
  const seed = hash(`${input.snapshotId ?? ""}|${input.track ?? ""}`);
  return leaders[seed % leaders.length];
}

/**
 * The motion + depth contract, written from THIS archetype.
 *
 * Section 5 of the master prompt used to be four hardcoded lines (fade,
 * slide-up, hover scale), so every venture got the same flat site no matter
 * which direction was locked. This block carries the archetype's own motion
 * character, its two signature moves, and the parallax depth stack that makes
 * full-bleed sections read as depth rather than as a flat picture.
 */
export function motionSpecBlock(a: SiteArchetype): string {
  return [
    `## MOTION & DEPTH CONTRACT (LOCKED — "${a.name}")`,
    "Motion is part of the art direction, not a decoration layer added at the end. Specify it in Section 5 of the PRD and restate it in the master prompt in enough detail to build without guessing.",
    "",
    `- **Motion character (build to this, not to a generic fade)**: ${a.motion}`,
    "- **Signature scroll moment**: exactly ONE per site, taken from the signature moves below. Name the technique (pinned section with scroll progress, scroll-scrubbed image sequence, clip-path line-mask headline reveal, horizontal proof reel, headline that scales into the sticky header), the trigger, the scroll distance it occupies, and what it looks like at the start, middle and end of the scrub.",
    ...a.signatureMoves.map((s) => `  - ${s}`),
    "- **Parallax depth stack**: every full-bleed section declares three planes — background plate translating at 0.25x scroll, midground subject at 0.6x, foreground type at 1.0x — with a CSS gradient scrim sitting between plate and type. Darkening for legibility lives in the scrim, never in the image render.",
    "- **Headline entrance**: display headlines mask in line by line via `clip-path` over 420ms with an 80ms stagger and the easing curve below. Body copy and cards follow with opacity 0→1 plus a 16px translateY, 60ms stagger.",
    "- **Micro-interactions**: every interactive element has hover, active and focus-visible states; 180ms transitions on `cubic-bezier(.22,1,.36,1)`; focus rings drawn on the brand accent, never the browser default.",
    "- **Page transitions**: route changes fade and slide up 12px over 280ms, ease-out, with scroll restored to top.",
    "- **Performance**: animate `transform` and `opacity` only; drive scroll effects from IntersectionObserver or a scroll-linked animation, never a scroll event handler; reserve `aspect-ratio` on every image so cumulative layout shift stays at zero.",
    "- **Reduced motion**: `prefers-reduced-motion: reduce` disables every transform, scrub and parallax translate and ships the same composition as a still — a reduced-motion visitor must see a finished layout, not a broken one.",
    "",
    "A PRD whose motion section could be pasted into any other site's PRD is a failure.",
  ].join("\n");
}

/** The prompt block injected into the Website PRD generation. */
export function artDirectionBlock(a: SiteArchetype): string {
  return [
    `## SITE ART DIRECTION (LOCKED — "${a.name}")`,
    "A creative director has already chosen this direction for this venture. It is not a menu and not a suggestion: every layout, section order, type decision and motion choice in this PRD must express it. A PRD that could describe any other direction is a failure.",
    "",
    `- **Essence**: ${a.essence}`,
    `- **Grid & layout system**: ${a.grid}`,
    `- **Typography**: ${a.typography}`,
    `- **Colour deployment**: ${a.colour}`,
    `- **Motion character**: ${a.motion}`,
    `- **Imagery character**: ${a.imagery}`,
    "",
    "**Home-page section rhythm — use this order (adapt the labels to the venture's real offer, never collapse it into a generic hero/features/pricing stack):**",
    ...a.rhythm.map((r, i) => `${i + 1}. ${r}`),
    "",
    "**Signature moves — BOTH must appear in the PRD, be named explicitly, and be specified in enough detail to build:**",
    ...a.signatureMoves.map((s) => `- ${s}`),
    "",
    "**Banned in this direction (writing any of these is a hard failure):**",
    ...a.never.map((n) => `- ${n}`),
    "",
    `Name the direction "${a.name}" explicitly in Section 1 of the PRD and again in the paste-ready master prompt, and derive every inner page's layout from the same system so the site reads as one designed thing.`,
  ].join("\n");
}

export function archetypeForPrompt(input: ArchetypeInput): { archetype: SiteArchetype; block: string } {
  const archetype = selectArchetype(input);
  return {
    archetype,
    block:
      `${artDirectionBlock(archetype)}\n\n${motionSpecBlock(archetype)}\n\n${imageCraftBlock()}\n\n${copyCraftBlock()}\n\n${surfaceSystemBlock()}`,
  };
}


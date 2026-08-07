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
  const hw = t.heading?.weight ?? "";
  const b = t.body?.family ?? "—";
  const bw = t.body?.weight ?? "";
  return [
    `  - Heading family: ${h}${hw ? ` (weight ${hw})` : ""} — if ANY glyph is rendered it must be set in this exact typeface, or the closest available cut of it. Do not substitute a geometric sans for a serif, or a serif for a sans.`,
    `  - Body family: ${b}${bw ? ` (weight ${bw})` : ""}`,
    `  - No decorative, script, condensed-display, or novelty type. No fake letterforms, no lorem glyphs, no scrambled characters.`,
  ].join("\n");
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
  camera: string;
  composition: string;
  avoid: string[];
};

type SceneVariant = Omit<SceneDirective, "avoid"> & { tags?: string[] };

// Composition rotations layered on top of any picked variant so even repeat
// picks vary framing.
const COMPOSITIONS = [
  "rule-of-thirds, subject anchored left, generous negative space on the right",
  "centered environmental portrait, subject filling middle third",
  "over-the-shoulder view, subject in lower-right, foreground detail bokeh",
  "wide establishing shot, subject small within setting, architectural framing",
  "close macro detail of hands + object, shallow focus, no full face",
  "flat-lay top-down, objects arranged asymmetrically, single accent",
  "low-angle heroic, subject looking off-frame, ceiling / sky negative space",
  "two-shot conversation, both subjects mid-gesture, catch-light in eyes",
];

const CAMERAS = [
  "35mm prime, f/2, natural window daylight",
  "50mm prime, f/1.8, soft north-light",
  "85mm portrait, f/2.8, golden-hour spill",
  "24mm wide, f/4, ambient overhead daylight",
  "macro 100mm, f/4, single-source raking light",
  "documentary handheld, natural mixed light",
];

// Scene libraries per bucket. Each entry is one legitimate on-brand scene;
// they rotate per post so a 4-post week reads as an editorial set, not the
// same photo four times.
const LIBRARY_STARTUP: SceneVariant[] = [
  // Human moment — not at a laptop
  { depict: "A single founder on a rooftop at dusk holding a printed pitch, city skyline going amber behind them.", subjects: ["founder", "rooftop", "printed pitch"], setting: "urban rooftop at dusk", mood: "resolved, quiet", camera: CAMERAS[2], composition: COMPOSITIONS[6], tags: ["story", "portrait"] },
  { depict: "A founder mid-stride through a city crosswalk at rush hour, portfolio in hand, motion blur on the crowd around them.", subjects: ["founder", "crosswalk", "portfolio"], setting: "urban crosswalk", mood: "kinetic, decisive", camera: CAMERAS[5], composition: COMPOSITIONS[0], tags: ["momentum"] },
  { depict: "A candid handshake between a founder and a first customer on a shop-lit sidewalk, both smiling naturally.", subjects: ["founder", "customer", "handshake"], setting: "storefront sidewalk", mood: "warm, arrived", camera: CAMERAS[1], composition: COMPOSITIONS[2], tags: ["customer"] },
  { depict: "A lone silhouette of a founder against a floor-to-ceiling window at night, city lights beyond as bokeh field.", subjects: ["founder silhouette", "window", "city lights"], setting: "high-floor office at night", mood: "contemplative", camera: CAMERAS[2], composition: COMPOSITIONS[6], tags: ["brand", "story"] },

  // Metaphor / conceptual
  { depict: "A single warmly lit doorway at the end of a dark hallway, light spilling across the floor toward the camera.", subjects: ["doorway", "light"], setting: "long dark hallway", mood: "opportunity", camera: CAMERAS[3], composition: COMPOSITIONS[3], tags: ["launch", "story"] },
  { depict: "A paper airplane arcing across a wall of graph paper, its shadow trailing behind it.", subjects: ["paper airplane", "graph paper wall"], setting: "graphic wall", mood: "playful, forward", camera: CAMERAS[4], composition: COMPOSITIONS[0], tags: ["idea"] },
  { depict: "A single chess piece mid-move on a marble board, other pieces softly out of focus.", subjects: ["chess piece", "marble board"], setting: "chess board macro", mood: "strategic", camera: CAMERAS[4], composition: COMPOSITIONS[4], tags: ["strategy"] },
  { depict: "A brass compass resting on weathered wood, cardinal marks catching a single side light.", subjects: ["compass", "wood"], setting: "wood tabletop macro", mood: "grounded, deliberate", camera: CAMERAS[4], composition: COMPOSITIONS[5], tags: ["direction"] },
  { depict: "The edge of a runway with lights vanishing into low fog, one taxiing figure implied in the distance.", subjects: ["runway", "runway lights", "fog"], setting: "airfield at dawn", mood: "anticipation", camera: CAMERAS[3], composition: COMPOSITIONS[3], tags: ["launch"] },
  { depict: "A footbridge under construction stretching over open water toward a far shore in golden light.", subjects: ["bridge", "water", "far shore"], setting: "coastal construction", mood: "building, aspirational", camera: CAMERAS[3], composition: COMPOSITIONS[3], tags: ["building"] },

  // Object-forward macro (no faces)
  { depict: "A fountain pen crossing out a line of printed strategy on cream paper, ink still wet.", subjects: ["fountain pen", "printed page"], setting: "desk macro", mood: "decisive", camera: CAMERAS[4], composition: COMPOSITIONS[4], tags: ["revision", "strategy"] },
  { depict: "A stack of business cards fanned across a linen surface with one card standing on edge.", subjects: ["business cards", "linen"], setting: "flat-lay linen", mood: "crafted", camera: CAMERAS[3], composition: COMPOSITIONS[5], tags: ["brand"] },
  { depict: "A single espresso cup resting on a signed contract, steam curling above the rim.", subjects: ["espresso", "contract"], setting: "cafe table macro", mood: "closed, calm", camera: CAMERAS[4], composition: COMPOSITIONS[4], tags: ["deal", "milestone"] },
  { depict: "A vintage brass key resting on a hand-drawn blueprint, single raking light across the paper texture.", subjects: ["key", "blueprint"], setting: "drafting table macro", mood: "unlocking", camera: CAMERAS[4], composition: COMPOSITIONS[5], tags: ["access", "launch"] },
  { depict: "A boarding pass, passport, and Moleskine on a walnut desk beside a coffee ring — top-down.", subjects: ["boarding pass", "passport", "notebook"], setting: "walnut desk flat-lay", mood: "moving", camera: CAMERAS[3], composition: COMPOSITIONS[5], tags: ["travel", "growth"] },

  // Environmental / outdoor
  { depict: "Aerial of a coastal highway curving along cliffs at sunrise, one car on the road.", subjects: ["coastal highway", "sunrise"], setting: "aerial coast", mood: "expansive", camera: CAMERAS[3], composition: COMPOSITIONS[3], tags: ["journey"] },
  { depict: "A lone tree on a green hill under storm light, distant rain visible on one side of the frame.", subjects: ["tree", "hill", "storm light"], setting: "open landscape", mood: "resilient", camera: CAMERAS[3], composition: COMPOSITIONS[6], tags: ["resilience"] },
  { depict: "A neon-lit alley at night with a single figure walking away from camera, wet reflections underfoot.", subjects: ["alley", "neon", "figure"], setting: "urban alley at night", mood: "cinematic", camera: CAMERAS[2], composition: COMPOSITIONS[0], tags: ["brand"] },
  { depict: "A mountain ridgeline emerging from morning fog, first sunlight touching the highest peak only.", subjects: ["ridgeline", "fog", "sunlight"], setting: "mountain morning", mood: "arriving", camera: CAMERAS[3], composition: COMPOSITIONS[3], tags: ["milestone"] },

  // Editorial / graphic
  { depict: "A saturated single-color field with one small paper boat centered, long shadow across the plane.", subjects: ["paper boat", "color field"], setting: "graphic studio still-life", mood: "quiet, iconic", camera: CAMERAS[3], composition: COMPOSITIONS[5], tags: ["brand", "idea"] },
  { depict: "A torn-paper reveal exposing a textured surface beneath — the tear diagonal across the frame.", subjects: ["torn paper", "texture"], setting: "graphic macro", mood: "unveiling", camera: CAMERAS[4], composition: COMPOSITIONS[4], tags: ["launch", "reveal"] },
  { depict: "A duotone portrait cropped tight on the eyes only, direct gaze, single light source.", subjects: ["eyes", "duotone portrait"], setting: "editorial studio", mood: "resolute", camera: CAMERAS[2], composition: COMPOSITIONS[1], tags: ["portrait", "brand"] },
  { depict: "A long-exposure light trail sweeping across an empty street at night, buildings crisp on either side.", subjects: ["light trail", "empty street"], setting: "night street long exposure", mood: "motion, ambition", camera: CAMERAS[3], composition: COMPOSITIONS[0], tags: ["momentum"] },
];

const LIBRARY_MAIN_STREET: SceneVariant[] = [
  { depict: "A shop owner behind the counter of their own storefront, one product held up in warm daylight through the front window.", subjects: ["owner", "counter", "product"], setting: "small-business storefront interior", mood: "proud, grounded", camera: CAMERAS[1], composition: COMPOSITIONS[1], tags: ["owner", "portrait", "story"] },
  { depict: "A customer and owner mid-exchange at the register, both smiling naturally, product bags on the counter.", subjects: ["owner", "customer"], setting: "shop register", mood: "community, warm", camera: CAMERAS[5], composition: COMPOSITIONS[7], tags: ["customer", "service", "community"] },
  { depict: "A macro of hands wrapping or preparing the shop's signature product, brown paper and twine on a wood surface.", subjects: ["hands", "product", "wrapping"], setting: "shop prep counter", mood: "crafted", camera: CAMERAS[4], composition: COMPOSITIONS[4], tags: ["craft", "product", "how-to"] },
  { depict: "An exterior morning shot of the storefront awning with the OPEN sign lit and a chalkboard on the sidewalk.", subjects: ["storefront", "chalkboard", "OPEN sign"], setting: "sidewalk exterior", mood: "inviting, local", camera: CAMERAS[3], composition: COMPOSITIONS[3], tags: ["neighborhood", "brand", "launch"] },
  { depict: "A flat-lay of the shop's product beside a handwritten note and a customer card on brown craft paper.", subjects: ["product", "note", "card"], setting: "wood tabletop, top-down", mood: "thoughtful", camera: CAMERAS[3], composition: COMPOSITIONS[5], tags: ["gift", "resource", "toolkit"] },
  { depict: "A wide establishing shot of the block the shop sits on, storefront visible, foot traffic softly out of focus.", subjects: ["block", "storefront"], setting: "neighborhood street", mood: "rooted", camera: CAMERAS[3], composition: COMPOSITIONS[3], tags: ["location", "story"] },
  // Metaphor / object additions
  { depict: "A hand-lettered chalkboard sign leaned against a brick wall, one flower in a jar beside it.", subjects: ["chalkboard sign", "brick", "flower"], setting: "sidewalk still-life", mood: "handmade", camera: CAMERAS[4], composition: COMPOSITIONS[5], tags: ["brand"] },
  { depict: "A ring of keys resting on a fresh lease agreement, morning light across the paper.", subjects: ["keys", "lease"], setting: "counter macro", mood: "milestone", camera: CAMERAS[4], composition: COMPOSITIONS[4], tags: ["milestone"] },
  { depict: "A neighborhood at dusk with the shop's warm interior glowing among cooler storefronts.", subjects: ["street at dusk", "shop glow"], setting: "neighborhood dusk", mood: "welcoming", camera: CAMERAS[3], composition: COMPOSITIONS[3], tags: ["brand"] },
];

const LIBRARY_FOOD: SceneVariant[] = [
  { depict: "Chef-owner plating a dish under a single warm pendant, steam rising, tickets on a rail behind.", subjects: ["chef", "plate"], setting: "restaurant pass", mood: "crafted", camera: CAMERAS[2], composition: COMPOSITIONS[1], tags: ["portrait", "story"] },
  { depict: "Overhead of hands arranging fresh ingredients on a marble counter, one hand mid-motion with a knife.", subjects: ["hands", "ingredients"], setting: "prep counter", mood: "kinetic", camera: CAMERAS[3], composition: COMPOSITIONS[5], tags: ["prep", "process", "how-to"] },
  { depict: "A guest at the counter receiving their drink, the barista in soft focus behind, morning light through window.", subjects: ["guest", "barista"], setting: "cafe counter", mood: "warm", camera: CAMERAS[1], composition: COMPOSITIONS[2], tags: ["customer", "service"] },
  { depict: "Macro of espresso pouring into a ceramic cup, ripples in the crema, a single accent color plate behind.", subjects: ["espresso", "cup"], setting: "bar top", mood: "crafted, quiet", camera: CAMERAS[4], composition: COMPOSITIONS[4], tags: ["product", "craft"] },
  { depict: "Establishing shot of the dining room at first light, chairs down, sun bars across empty tables.", subjects: ["dining room"], setting: "morning restaurant interior", mood: "anticipatory", camera: CAMERAS[3], composition: COMPOSITIONS[3], tags: ["space", "brand"] },
  { depict: "A single lit menu propped on a wine-red banquette, ambient candles flickering around it.", subjects: ["menu", "banquette"], setting: "evening dining nook", mood: "invitational", camera: CAMERAS[2], composition: COMPOSITIONS[1], tags: ["brand"] },
  { depict: "Flat-lay of raw ingredients arranged as a color story on butcher paper — no hands.", subjects: ["ingredients", "butcher paper"], setting: "top-down still-life", mood: "editorial", camera: CAMERAS[3], composition: COMPOSITIONS[5], tags: ["seasonal"] },
  { depict: "A market bag of produce set on a bike basket outside a shop at sunrise.", subjects: ["produce", "bike"], setting: "sidewalk sunrise", mood: "local, honest", camera: CAMERAS[1], composition: COMPOSITIONS[2], tags: ["sourcing"] },
];

const LIBRARY_FITNESS: SceneVariant[] = [
  { depict: "Coach cuing a client mid-movement on the studio floor, chalk-dusted plates and a rig in the background.", subjects: ["coach", "client"], setting: "boutique training floor", mood: "focused, kinetic", camera: CAMERAS[2], composition: COMPOSITIONS[2] },
  { depict: "Macro of a hand chalking up on a bar; the rest of the athlete blurs out of focus behind.", subjects: ["hand", "chalk", "bar"], setting: "training rig", mood: "disciplined", camera: CAMERAS[4], composition: COMPOSITIONS[4] },
  { depict: "Wide low-angle of a solo athlete mid-rep under tall windows; long shadows on the floor.", subjects: ["athlete"], setting: "studio floor", mood: "resolute", camera: CAMERAS[3], composition: COMPOSITIONS[6] },
  { depict: "Two-shot of coach and client laughing during a rest set, water bottles at their feet.", subjects: ["coach", "client"], setting: "studio bench", mood: "community", camera: CAMERAS[5], composition: COMPOSITIONS[7] },
  { depict: "A solo runner on an empty coastal road at sunrise, long shadow trailing behind.", subjects: ["runner", "coastal road"], setting: "coast at sunrise", mood: "grit", camera: CAMERAS[3], composition: COMPOSITIONS[3] },
  { depict: "Flat-lay of shoes, tape, and a written training log on concrete.", subjects: ["shoes", "log"], setting: "concrete flat-lay", mood: "committed", camera: CAMERAS[3], composition: COMPOSITIONS[5] },
  { depict: "An empty studio at first light, one kettlebell centered in a pool of window sun.", subjects: ["kettlebell", "empty studio"], setting: "studio dawn", mood: "quiet before", camera: CAMERAS[3], composition: COMPOSITIONS[3] },
];

const LIBRARY_HEALTH: SceneVariant[] = [
  { depict: "A clinician reviewing a monitor with a colleague, calm overhead light, no dramatization.", subjects: ["clinician", "colleague", "monitor"], setting: "modern clinical suite", mood: "precise", camera: CAMERAS[0], composition: COMPOSITIONS[0] },
  { depict: "Macro of gloved hands operating a modern instrument on a clean tray.", subjects: ["hands", "instrument"], setting: "prep tray", mood: "considered", camera: CAMERAS[4], composition: COMPOSITIONS[4] },
  { depict: "A researcher at a workstation of screens, calm posture, no theatrics.", subjects: ["researcher", "workstation"], setting: "modern research bay", mood: "steady", camera: CAMERAS[1], composition: COMPOSITIONS[1] },
  { depict: "A calm sunrise view from a hospital window over a waking city.", subjects: ["window", "cityscape"], setting: "clinical window at dawn", mood: "hopeful", camera: CAMERAS[3], composition: COMPOSITIONS[3] },
  { depict: "Macro of a single pill bottle beside a handwritten note on a wood table.", subjects: ["bottle", "note"], setting: "quiet home surface", mood: "human", camera: CAMERAS[4], composition: COMPOSITIONS[5] },
  { depict: "A patient hand resting in a clinician's hand — cropped close, respectful.", subjects: ["hands"], setting: "clinical macro", mood: "trust", camera: CAMERAS[4], composition: COMPOSITIONS[4] },
];

const LIBRARY_MOBILITY: SceneVariant[] = [
  { depict: "A founder-engineer beside their vehicle on a clean shop floor, single spot lighting the mark, wide framing.", subjects: ["engineer", "vehicle"], setting: "modern mobility shop", mood: "engineered", camera: CAMERAS[3], composition: COMPOSITIONS[3] },
  { depict: "Macro of a hand on a control surface — dashboard, throttle, or terminal — instrument reflections in the surface.", subjects: ["hand", "control surface"], setting: "cockpit macro", mood: "precise", camera: CAMERAS[4], composition: COMPOSITIONS[4] },
  { depict: "An overhead of an empty test track marked with fresh tire arcs at golden hour.", subjects: ["track", "tire arcs"], setting: "aerial test track", mood: "iterating", camera: CAMERAS[3], composition: COMPOSITIONS[3] },
  { depict: "A single vehicle silhouetted against a horizon of desert light, dust plume trailing.", subjects: ["vehicle", "horizon"], setting: "desert road", mood: "ambition", camera: CAMERAS[3], composition: COMPOSITIONS[6] },
  { depict: "Flat-lay of blueprints, calipers, and a coffee cup on a steel workbench.", subjects: ["blueprints", "tools"], setting: "workbench flat-lay", mood: "engineered", camera: CAMERAS[3], composition: COMPOSITIONS[5] },
];

// Human-care ventures: elder care, home care, assisted living, childcare,
// caregiving, in-home support. Previously these fell through to
// LIBRARY_STARTUP, which is how a passport flat-lay ended up representing an
// elderly residence.
const LIBRARY_CARE: SceneVariant[] = [
  { depict: "An older adult and a caregiver seated together in a sunlit living room, mid-conversation, both relaxed and smiling naturally.", subjects: ["older adult", "caregiver", "living room"], setting: "warm residential living room, late-morning light", mood: "warm, dignified", camera: CAMERAS[1], composition: COMPOSITIONS[7], tags: ["care", "customer", "trust"] },
  { depict: "A caregiver's hand steadying an older adult's hand on a wooden banister — cropped close, respectful, no faces.", subjects: ["hands", "banister"], setting: "home staircase macro", mood: "steady, trusted", camera: CAMERAS[4], composition: COMPOSITIONS[4], tags: ["trust", "care"] },
  { depict: "An older adult tending potted herbs on a back porch, a caregiver nearby holding the watering can.", subjects: ["older adult", "caregiver", "porch plants"], setting: "residential back porch", mood: "independent, tended", camera: CAMERAS[0], composition: COMPOSITIONS[0], tags: ["independence", "care"] },
  { depict: "A quiet, made-up bedroom in a residential care home — soft linens, a reading lamp, a framed family photo on the nightstand.", subjects: ["bedroom", "reading lamp", "family photo"], setting: "residential care bedroom", mood: "safe, homelike", camera: CAMERAS[3], composition: COMPOSITIONS[3], tags: ["home", "brand"] },
  { depict: "A family member and a care coordinator talking across a kitchen table, a mug between them, calm daylight.", subjects: ["family member", "care coordinator", "kitchen table"], setting: "home kitchen", mood: "reassuring", camera: CAMERAS[1], composition: COMPOSITIONS[7], tags: ["family", "customer"] },
  { depict: "Three generations walking slowly along a tree-lined neighborhood sidewalk, the eldest arm-in-arm in the middle.", subjects: ["older adult", "family", "sidewalk"], setting: "leafy residential street", mood: "connected", camera: CAMERAS[2], composition: COMPOSITIONS[0], tags: ["family", "community"] },
  { depict: "A caregiver setting a warm meal in front of an older adult at a small dining table, steam rising.", subjects: ["caregiver", "older adult", "meal"], setting: "home dining nook", mood: "nourishing, everyday", camera: CAMERAS[0], composition: COMPOSITIONS[2], tags: ["daily", "care"] },
  { depict: "Macro of a weekly care schedule handwritten on a paper planner beside reading glasses on a kitchen counter.", subjects: ["planner", "reading glasses"], setting: "kitchen counter macro", mood: "organized, human", camera: CAMERAS[4], composition: COMPOSITIONS[5], tags: ["process", "trust"] },
];

function pickLibrary(track: string, industry: string): SceneVariant[] {
  // Care matching runs FIRST: an elder-care venture on the main-street track
  // is still a care business, not a storefront.
  if (/(elder|senior|aging|geriatric|assisted living|residential care|nursing|home care|homecare|caregiv|hospice|memory care|child ?care|day ?care|in-home)/.test(industry)) return LIBRARY_CARE;
  if (track.includes("main_street") || track.includes("main street")) return LIBRARY_MAIN_STREET;
  if (/food|restaurant|bever|cafe|coffee/.test(industry)) return LIBRARY_FOOD;
  if (/fitness|wellness|health club|gym/.test(industry)) return LIBRARY_FITNESS;
  if (/(life ?sci|biotech|pharma|medical|health tech|clinic|therap)/.test(industry)) return LIBRARY_HEALTH;
  if (/auto|vehicle|mobility/.test(industry)) return LIBRARY_MOBILITY;
  return LIBRARY_STARTUP;
}

// FNV-1a hash for deterministic per-post scene rotation.
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

// Signal we use to steer + rotate the scene per post. Callers pass a stable
// discriminator (post_id + variationSeed) plus optional pillar/format/notes
// hints; we hash it into an index and bias by tag matches.
export type SceneSignal = {
  discriminator?: string;
  pillar?: string | null;
  format?: string | null;
  assetNotes?: string | null;
};

function resolveSceneDirective(ctx: any, signal?: SceneSignal): SceneDirective {
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

  const lib = pickLibrary(track, ind);

  // Score every variant by tag match against post signals; hash-rotate ties.
  const signalStr = [signal?.pillar, signal?.format, signal?.assetNotes].filter(Boolean).join(" ").toLowerCase();
  const scored = lib.map((v, i) => {
    let score = 0;
    if (v.tags?.length && signalStr) {
      for (const t of v.tags) if (signalStr.includes(t.toLowerCase())) score = Math.min(2, score + 1);
    }
    return { v, i, score };
  });
  // Sort by score desc, keep a wide top pool so rotation actually rotates.
  scored.sort((a, b) => b.score - a.score);
  const minPool = Math.min(6, lib.length);
  let pool = scored.filter((s) => s.score === scored[0].score);
  if (pool.length < minPool) pool = scored.slice(0, minPool);

  // Recent-used memory per snapshot (best-effort; resets on cold start).
  const snapshotKey = String(snap?.id ?? snap?.snapshot_id ?? "");
  const recent = getRecent(snapshotKey);
  const fresh = pool.filter((s) => !recent.includes(s.i));
  const finalPool = fresh.length ? fresh : pool;

  const rotorSeed = `${snapshotKey}|${signal?.discriminator || String(Date.now())}`;
  const rotor = hash32(rotorSeed);
  const picked = finalPool[rotor % finalPool.length];
  const chosen = picked.v;
  rememberRecent(snapshotKey, picked.i);

  // Compose the depict string with a fresh camera+composition per post so
  // even repeat variant picks vary framing.
  const compositionIdx = hash32(rotorSeed + "|comp") % COMPOSITIONS.length;
  const cameraIdx = hash32(rotorSeed + "|cam") % CAMERAS.length;

  const depictWithAudience = customer
    ? `${chosen.depict} Audience implied: ${customer}.`
    : chosen.depict;

  return {
    depict: depictWithAudience,
    subjects: chosen.subjects,
    setting: chosen.setting,
    mood: chosen.mood,
    camera: CAMERAS[cameraIdx],
    composition: COMPOSITIONS[compositionIdx],
    avoid: [...avoidBase],
  };
}

// Best-effort per-snapshot recent-scene memory. In-memory only; if the edge
// worker cold-starts between calls, memory resets and that's fine.
const RECENT_MAX = 4;
const RECENT_BY_SNAPSHOT: Map<string, number[]> = new Map();
function getRecent(key: string): number[] {
  if (!key) return [];
  return RECENT_BY_SNAPSHOT.get(key) ?? [];
}
function rememberRecent(key: string, idx: number) {
  if (!key) return;
  const arr = RECENT_BY_SNAPSHOT.get(key) ?? [];
  const next = [idx, ...arr.filter((i) => i !== idx)].slice(0, RECENT_MAX);
  RECENT_BY_SNAPSHOT.set(key, next);
}

function sceneDirectiveBlock(scene: SceneDirective): string {
  const avoid = scene.avoid.length ? scene.avoid.join(", ") : "(none)";
  return [
    `SCENE DIRECTIVE (HIGHEST PRIORITY — depict exactly this specific scene; ignore any literal reading of the brand name):`,
    `  DEPICT: ${scene.depict}`,
    `  KEY SUBJECTS: ${scene.subjects.join(", ")}`,
    `  SETTING: ${scene.setting}`,
    `  MOOD: ${scene.mood}`,
    `  CAMERA / LIGHT: ${scene.camera}`,
    `  COMPOSITION: ${scene.composition}`,
    `  DO NOT DEPICT: ${avoid}`,
    `  ANTI-CLICHÉ: unless the DEPICT line above explicitly names them, do NOT include any of: sticky notes, Post-it notes, a whiteboard with notes, "team standing in front of a whiteboard", cofounders around a laptop, a facilitator pointing at notes, hands pressing notes onto glass. These are banned defaults.`,
    `  PROP BAN (unless the DEPICT line names the prop explicitly): no passports, boarding passes, luggage, maps or globes, business-card mockups, stationery/brand-mockup flat-lays, stock-photo handshakes in suits, generic open-plan tech offices, server racks, currency, stock charts, or screens displaying UI. These props read as generic stock imagery and are off-brief for this venture.`,
    `  ON-TOPIC TEST: a stranger seeing this image alone must be able to guess this venture's actual line of work. If the frame could belong to any company in any industry, it is wrong — rebuild it around the DEPICT line.`,
    `  IMPORTANT: this scene is UNIQUE to this post — deliver exactly the scene described above. Do not blend it with a generic startup-office fallback.`,
  ].join("\n");
}

// Per-platform composition rules. Social crops are unforgiving: LinkedIn
// banners get center-cropped behind the profile photo, Facebook covers crop
// differently on mobile vs desktop. Give the model the real safe zones.
function platformCompositionBlock(platform: string, asset: AssetSpec): string {
  const p = platform.toLowerCase();
  const kind = String(asset.kind || "").toLowerCase();
  const lines: string[] = [
    `PLATFORM CROP SAFETY (${platform} ${asset.label}) — the render must survive real-world cropping:`,
  ];
  if (kind === "avatar") {
    lines.push(
      `  - The avatar is displayed as a CIRCLE at 40-64px. Keep everything inside the middle 70% circle; corners will be cut off.`,
      `  - Single centered element on a flat field. No scene, no photograph, no text, no border ring.`,
    );
  } else if (/linkedin/.test(p)) {
    lines.push(
      `  - The bottom-left ~22% of the banner is covered by the profile photo — keep it as empty surface, no subject, no focal detail.`,
      `  - Place the subject in the right two-thirds; leave the left third as calm negative space.`,
      `  - On mobile the outer ~12% at each side is cropped away. Nothing important within 12% of either edge.`,
    );
  } else if (/facebook/.test(p)) {
    lines.push(
      `  - Desktop and mobile crop differently: only the CENTER 60% horizontally and the middle 80% vertically is guaranteed visible. Keep the subject fully inside that region.`,
      `  - The bottom-left quarter is overlapped by the page name and profile photo — keep it clean surface.`,
    );
  } else if (/instagram/.test(p)) {
    lines.push(
      `  - Feed previews center-crop to a square. Keep the subject within the central square of the canvas.`,
      `  - Leave the outer 8% as bleed; nothing meaningful there.`,
    );
  } else {
    lines.push(
      `  - Keep the subject within the central 80% of the canvas; treat the outer 10% on all sides as crop bleed.`,
    );
  }
  lines.push(
    `  - One subject, one focal point. No collage, no split-panel montage, no multiple unrelated photographs stitched together.`,
    `  - Horizon lines stay level; do not crop a face or the primary object at an edge.`,
  );
  return lines.join("\n");
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
  sceneSignal?: SceneSignal;
  // When true, we render the headline server-side after generation. The prompt
  // suppresses all glyphs and reserves the top band as unmarked negative space.
  serverRenderedHeadline?: boolean;
}): string {
  const { platform, asset, direction, kit, ctx, plan, hasLogoImage = true, retryNote, userFeedback, variationSeed, headlineOverride, logoZone, sceneSignal, serverRenderedHeadline } = args;
  const brief = DIRECTION_BRIEF[direction];
  const palette = paletteBlock(kit);
  const typo = typoBlock(kit);
  // If the headline will be composited server-side, force the model into
  // zero-glyph mode — otherwise Gemini paints its own (badly-fit) headline
  // AND ours ends up on top, producing duplicate text.
  //
  // With no explicit override we ALSO stay silent. Auto-derived taglines were
  // getting painted in whatever font the model felt like, off-brand and often
  // mangled. Text only lands on a cover when the founder asks for it.
  const effectiveOverride: HeadlineOverride = serverRenderedHeadline
    ? { mode: "none" }
    : (headlineOverride ?? { mode: "none" });
  const { text: headline, suppress: suppressHeadline } = resolveHeadline(ctx, effectiveOverride);
  const isCustomHeadline = effectiveOverride?.mode === "custom" && !!headline;
  const venture = ventureBlock(ctx, effectiveOverride);
  const scene = resolveSceneDirective(ctx, sceneSignal);
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

/**
 * Image craft contracts.
 *
 * The Website PRD used to tell the builder WHAT each image is about but never
 * HOW it must be shot, so every prompt came out as adjectives ("cinematic",
 * "moody", "on-brand") and the renders were unusable: heroes baked so dark the
 * subject disappeared under the text scrim, call-out images that were a lone
 * arrow on a flat gradient, and people who looked like plastic AI renders.
 *
 * Each recipe below is a hard craft spec — exposure target, lens/technique,
 * composition rule, a minimum-legibility test and its own never-do list — and
 * is injected verbatim into the PRD so every generation prompt inherits it.
 */

export type VisualKind = "hero" | "portrait" | "spot" | "product" | "texture";

export type ImageRecipe = {
  kind: VisualKind;
  /** Human label used in the PRD's Visual type column. */
  label: string;
  /** Exposure / contrast target the render must hit. */
  exposure: string;
  /** Lens, lighting and capture technique. */
  technique: string;
  /** Framing and composition rule. */
  composition: string;
  /** The test the image must pass to ship. */
  legibility: string;
  /** How type is allowed to sit on or near the image. */
  overlay: string;
  /** Hard bans for this visual type. */
  never: string[];
};

export const IMAGE_RECIPES: Record<VisualKind, ImageRecipe> = {
  hero: {
    kind: "hero",
    label: "hero / full-bleed",
    exposure:
      "Properly exposed mid-tones — the main subject sits at roughly 35–55% luminance with open, detailed shadows and at least one clean highlight. The picture must be fully readable BEFORE any overlay is applied.",
    technique:
      "One dominant, directional light source with soft fill; 35mm or 50mm equivalent; shallow-to-medium depth of field; natural colour grade pulled from the brand palette rather than a heavy filter.",
    composition:
      "16:9. Deliberate negative space in the text zone (left third or lower third) where the subject does not compete with the headline; the focal subject occupies the opposite third.",
    legibility:
      "At 25% brightness on a phone in daylight, a viewer must still be able to name what the picture shows.",
    overlay:
      "Darkening for text contrast happens in CSS — a token-based gradient scrim over the clean image, never baked into the render. State the scrim direction and which side of the frame stays clean.",
    never: [
      "Near-black frames where the subject is unreadable",
      "A second darkening pass baked into the image on top of a CSS scrim",
      "Abstract gradient smoke with no subject",
      "Text, words, numbers, hex codes, logos or watermarks rendered into the image",
    ],
  },
  portrait: {
    kind: "portrait",
    label: "portrait / people",
    exposure:
      "Studio-grade exposure: face at 45–60% luminance, catchlights visible in both eyes, no crushed shadow on the shadow-side cheek, no blown highlights on the forehead.",
    technique:
      "85mm equivalent at roughly f/2. Soft key at 45 degrees with a large modifier, gentle fill, subtle rim/hair light to separate the subject from the background. Real skin texture — visible pores, fine lines, natural asymmetry — and honest colour in every skin tone.",
    composition:
      "4:5 or 1:1. Head-and-shoulders or waist-up, eye contact with the lens, natural relaxed posture, real wardrobe appropriate to the person's actual work. Background is the subject's real environment, softly out of focus and readable as a place.",
    legibility:
      "The portrait must pass as a photograph a working commercial photographer delivered — if it reads as an AI render, it fails.",
    overlay:
      "No type over faces. Captions, names and roles sit outside the frame or on a solid card beneath it.",
    never: [
      "Plastic, waxy or airbrushed CGI skin",
      "Uncanny symmetrical faces, malformed hands or extra fingers",
      "Burned-in text, hex codes, captions or watermarks",
      "Generic smiling-stock-model energy, crossed arms in an empty grey office",
      "Identifiable real public figures",
    ],
  },
  spot: {
    kind: "spot",
    label: "spot / call-out",
    exposure:
      "Bright, high-clarity rendering with strong subject-to-background separation; mid-tone background, no muddy dark fields.",
    technique:
      "One unmistakable subject rendered with real material detail — a photograph, a tangible object, a real interface fragment or a purposeful diagram. Brand colour appears as the field or accent, not as the entire content of the frame.",
    composition:
      "4:5 or 1:1. The subject fills 60–75% of the frame, centred or on a clear diagonal, with quiet margins.",
    legibility:
      "The image must be instantly readable at 480px wide in a card — if you cannot say what it is in one second at that size, it fails.",
    overlay: "No type inside the frame; the card's heading carries the message.",
    never: [
      "A lone arrow, chart squiggle or abstract line on a flat colour field",
      "Floating icon soup, 3D emoji piles or generic app-icon clusters",
      "Cluttered scenes with no focal point",
      "Text, labels or numbers rendered into the image",
    ],
  },
  product: {
    kind: "product",
    label: "product / interface",
    exposure:
      "Clean, evenly lit, accurate colour; the surface or screen is the brightest thing in the frame.",
    technique:
      "Honest perspective on a simple plane or in a real context. Interfaces show true layout shapes — tiles, rows, charts — with all copy rendered as soft illegible blur so no fake text appears.",
    composition:
      "16:9 or 4:3, generous margin, one hero angle rather than a collage of screens.",
    legibility: "A viewer must be able to tell what the product does from the shapes alone.",
    overlay: "Annotations, if any, are HTML callouts positioned over the image — never baked in.",
    never: [
      "Browser-chrome mockups floating in a gradient",
      "Fake legible UI copy or invented brand names inside the screen",
      "Tilted screen collages with drop shadows",
    ],
  },
  texture: {
    kind: "texture",
    label: "texture / gradient band",
    exposure:
      "Low contrast and mid-toned so type placed on it always clears AA contrast without an extra scrim.",
    technique:
      "Derived from exact brand hex values — grain, paper, mesh or light-leak character consistent with the mood board.",
    composition: "Wide band, no focal subject, safe to crop at any width.",
    legibility: "Used only behind type or as a section divider; never presented as an image in its own right.",
    overlay: "Type sits directly on it; verify contrast against the darkest and lightest point of the band.",
    never: [
      "Purple/cyan default AI gradient meshes unless those are literally the brand colours",
      "Blurry photographs used as a stand-in for texture",
    ],
  },
};

/** Global rules every generated image obeys regardless of type. */
export const UNIVERSAL_IMAGE_RULES = [
  "Never render text, words, letters, numbers, hex codes, logos or watermarks inside a generated image — all type is real HTML.",
  "Match the approved mood board's lighting, subject matter and colour grade; generic stock is a failure.",
  "Reference two exact brand hex values in every prompt, and name the exposure target explicitly.",
  "Contrast for text legibility is applied in CSS, never baked into the render.",
  "Every image needs specific alt text describing what is actually shown.",
];

export function recipeBlock(r: ImageRecipe): string {
  return [
    `### ${r.label}`,
    `- **Exposure target**: ${r.exposure}`,
    `- **Technique**: ${r.technique}`,
    `- **Composition**: ${r.composition}`,
    `- **Legibility test**: ${r.legibility}`,
    `- **Text overlay**: ${r.overlay}`,
    `- **Never**: ${r.never.join("; ")}.`,
  ].join("\n");
}

/** The full craft contract injected into the Website PRD prompt. */
export function imageCraftBlock(): string {
  return [
    "## IMAGE CRAFT CONTRACT (LOCKED)",
    "Every generation prompt in this PRD must OPEN with the craft recipe for its visual type below, verbatim, and then describe the venture-specific subject. Adjectives are not art direction — exposure, lens, composition and the legibility test are.",
    "",
    ...Object.values(IMAGE_RECIPES).map(recipeBlock),
    "",
    "### Universal rules",
    ...UNIVERSAL_IMAGE_RULES.map((r) => `- ${r}`),
  ].join("\n\n");
}

/** Compact restatement for the paste-ready master prompt. */
export function imageCraftSummary(): string {
  return Object.values(IMAGE_RECIPES)
    .map((r) => `**${r.label}** — ${r.exposure} ${r.technique} ${r.composition} ${r.legibility} Never: ${r.never.join("; ")}.`)
    .join(" ");
}

/** Prefix a subject description with its craft recipe, for images we generate ourselves. */
export function craftPrompt(kind: VisualKind, subject: string): string {
  const r = IMAGE_RECIPES[kind];
  return [
    subject.trim().replace(/\.$/, "") + ".",
    `Exposure: ${r.exposure}`,
    `Technique: ${r.technique}`,
    `Composition: ${r.composition}`,
    `Do not include: ${r.never.join("; ")}.`,
    UNIVERSAL_IMAGE_RULES[0],
  ].join(" ");
}

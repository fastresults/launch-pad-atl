/**
 * Copy craft contract — the words half of what `image-craft.ts` does for
 * pictures. The Website PRD used to ask for "1–2 body paragraphs" per section
 * with no word floors and no specificity rules, so the model wrote two short
 * generic sentences per section and moved on. These recipes are injected into
 * the PRD prompt verbatim and enforced afterwards by `identity-guard.ts`.
 */

export type CopyKind =
  | "hero"
  | "problem"
  | "offer"
  | "process"
  | "proof"
  | "pricing"
  | "faq"
  | "case_study"
  | "blog"
  | "about";

export type CopyRecipe = {
  kind: CopyKind;
  label: string;
  /** What must be written, structurally. */
  shape: string;
  /** Minimum words for one instance of this section type. */
  floor: number;
  /** What makes it specific to THIS venture rather than any competitor. */
  specificity: string;
  never: string[];
};

export const COPY_RECIPES: Record<CopyKind, CopyRecipe> = {
  hero: {
    kind: "hero",
    label: "Hero",
    shape:
      "H1 of 10 words or fewer naming the outcome the visitor gets (not the category the company is in); a sub-headline of 20–35 words naming the audience, the mechanism and one piece of proof; a 40–70 word body paragraph that says what happens when you click; a primary and a secondary CTA label, each starting with a verb and naming the artifact ('Book the 20-minute fit call', 'See a sample build').",
    floor: 110,
    specificity:
      "Name the audience out loud, name the mechanism, and carry one number (price, timeframe, count, or result).",
    never: [
      "an H1 that would be true of any competitor in the category",
      "\"Learn more\", \"Get started\", \"Discover\", \"Explore\" as a CTA label",
      "abstract nouns as the promise (solutions, innovation, excellence)",
    ],
  },
  problem: {
    kind: "problem",
    label: "Problem / stakes",
    shape:
      "90–140 words in the customer's own language: the situation they are in today, the three specific things that go wrong, the cost of leaving it alone (time, money, or opportunity, quantified), and one sentence that reframes the problem the way this company sees it.",
    floor: 90,
    specificity:
      "Quote the customer's phrasing, not the industry's. Name the cost with a number or a timeframe.",
    never: [
      "\"In today's fast-paced world\" or any variation",
      "a problem statement that never names who has the problem",
    ],
  },
  offer: {
    kind: "offer",
    label: "Offer / feature card",
    shape:
      "Per card: a 2–4 word label, a 12–18 word benefit line, and a 45–80 word body that says what the thing actually is, what the customer does with it, and what changes afterwards. A grid of six cards therefore carries 300+ words of body copy, not six one-liners.",
    floor: 60,
    specificity: "Name the deliverable, the format, and who does the work.",
    never: [
      "a card body that only restates the card label",
      "identical sentence structure across every card in the grid",
    ],
  },
  process: {
    kind: "process",
    label: "Process step",
    shape:
      "Per step: a step name, 40–70 words covering what happens, what the customer has to do, what they walk away with, and how long it takes. Steps read as a sequence — each one references the state left by the previous step.",
    floor: 40,
    specificity: "Every step carries a duration and a named artifact.",
    never: ["steps that are verbs with no content (\"Discover / Design / Deliver\")"],
  },
  proof: {
    kind: "proof",
    label: "Proof / results",
    shape:
      "Each metric gets the number, the unit, the baseline it improved from, the timeframe, and one sentence of context. Testimonials carry a full name, role, company, and a quote of 25–50 words that names a specific outcome.",
    floor: 60,
    specificity: "A bare number with a label is not proof — always give the baseline and timeframe.",
    never: ["invented awards or fake client logos", "quotes that only say the company was \"great to work with\""],
  },
  pricing: {
    kind: "pricing",
    label: "Pricing tier",
    shape:
      "Per tier: who it is for in one sentence, the price and billing basis, 5–8 inclusions written as full sentences (not two-word bullets), what is explicitly NOT included, the guarantee or refund line, and one sentence handling the biggest objection to that tier.",
    floor: 120,
    specificity: "Real prices in real currency. Name what the buyer gets in the first week.",
    never: ["\"Contact us\" as the only pricing information on the page", "inclusions written as bare nouns"],
  },
  faq: {
    kind: "faq",
    label: "FAQ",
    shape:
      "At least 8 questions written the way a real buyer would type them, each answered in 60–110 words. Answer the objection behind the question, not the literal question, and end each answer with the next step.",
    floor: 60,
    specificity: "Cover price, timeline, what happens if it doesn't work, who it's not for, and how to start.",
    never: ["one-sentence answers", "questions no buyer would ever ask"],
  },
  case_study: {
    kind: "case_study",
    label: "Case study",
    shape:
      "350–500 words: the client and their situation, what was failing, exactly what was done (named steps and artifacts), the measured result with a before and after, and a pull quote from a named person.",
    floor: 350,
    specificity: "Named client (or a clearly-labelled representative composite), real numbers, real dates.",
    never: ["a case study that never states a result"],
  },
  blog: {
    kind: "blog",
    label: "Blog / launch post",
    shape:
      "700–1,000 words with an actual argument: an opening that stakes a position, three sections that support it with examples, a counter-argument acknowledged and answered, and a close that connects to the offer without turning into an ad.",
    floor: 700,
    specificity: "Draw the examples from this venture's market, not from generic tech anecdotes.",
    never: ["a launch announcement dressed up as an article", "listicles of platitudes"],
  },
  about: {
    kind: "about",
    label: "About / founder narrative",
    shape:
      "500–700 words: the origin moment with a date and a place, the belief that came out of it, the credential that makes the claim credible, what the company refuses to do, and who it is not for.",
    floor: 500,
    specificity: "Specific people, specific years, specific decisions.",
    never: ["\"We are passionate about…\"", "a founder story with no dates, places or names"],
  },
};

/** Words that mark generic AI marketing copy. Guard counts hits against these. */
export const BANNED_COPY_PHRASES = [
  "empower",
  "seamless",
  "unlock",
  "elevate",
  "cutting-edge",
  "state-of-the-art",
  "game-changing",
  "revolutionize",
  "revolutionise",
  "world-class",
  "best-in-class",
  "leverage synerg",
  "take it to the next level",
  "in today's fast-paced",
  "one-stop shop",
  "we are passionate about",
  "solutions provider",
  "lorem ipsum",
];

/** Per-route minimum copy, restated to the model and enforced by the guard. */
export const ROUTE_WORD_FLOORS: { route: string; floor: number }[] = [
  { route: "/ (Home)", floor: 900 },
  { route: "/about", floor: 600 },
  { route: "/services or /products (index)", floor: 500 },
  { route: "each service/product detail route", floor: 550 },
  { route: "/pricing", floor: 600 },
  { route: "/case-studies + the written case study", floor: 400 },
  { route: "/blog + the written launch post", floor: 700 },
  { route: "/faq", floor: 700 },
  { route: "/contact", floor: 300 },
  { route: "/legal/privacy and /legal/terms", floor: 300 },
];

/** Total Section 4 floor implied by the route table above. */
export const SECTION4_WORD_FLOOR = 3500;

function recipeBlock(r: CopyRecipe): string {
  return [
    `### ${r.label} (minimum ${r.floor} words per instance)`,
    `- Shape: ${r.shape}`,
    `- Specificity: ${r.specificity}`,
    `- Never: ${r.never.join("; ")}.`,
  ].join("\n");
}

/** The full contract injected into the PRD system prompt. */
export function copyCraftBlock(): string {
  return [
    "## COPY CRAFT CONTRACT (LOCKED)",
    "",
    "Every section of page copy in Section 4 is written to the recipe for its section type. Word counts are floors, not targets — a section under its floor is an incomplete PRD and will be rejected and regenerated. Write finished copy a visitor will read, never a description of what the copy should say.",
    "",
    ...Object.values(COPY_RECIPES).map(recipeBlock),
    "",
    "### Headline contract",
    "- A headline makes a claim; it never names a category. \"Partner With Objective Experts\", \"Our Services\" and \"Why Choose Us\" are failures — they say nothing a competitor could not say.",
    "- Nine words or fewer, verb-led where the sentence allows, and carrying at least one concrete noun from this venture's own world (the thing being bought, the person it is for, the moment it matters).",
    "- The sub-headline states the mechanism in one sentence: how the outcome is actually produced.",
    "- Every section opens with the reader's stake before the company's credentials. Credentials are proof, not the lead.",
    "- CTA labels name the outcome in the first person where natural (\"Get my claim reviewed\", \"Book the walkthrough\"). \"Learn more\", \"Get started\", \"Submit\" and \"Click here\" are banned.",
    "- Every page ships its microcopy too: field labels, helper text, placeholder text, validation errors, empty states, loading states and the success message a visitor sees after submitting.",
    "",
    "### Universal copy rules",
    "- Every page must be recognisably about THIS company. If a paragraph could be pasted onto a competitor's site unchanged, rewrite it.",
    "- At least one concrete number, name, place or timeframe every 150 words.",
    "- Vary sentence length. No section may be three sentences of identical rhythm.",
    "- CTA labels start with a verb and name the artifact. \"Learn more\" and \"Get started\" are banned everywhere.",
    `- These words and phrases are banned outright: ${BANNED_COPY_PHRASES.join(", ")}.`,
    "- No square-bracket placeholders, no \"TBD\", no \"insert…\", no Lorem ipsum.",
    "",
    "### Per-route word floors for Section 4 (body copy only, excluding tables)",
    ...ROUTE_WORD_FLOORS.map((r) => `- ${r.route}: ${r.floor}+ words`),
    "",
    `Section 4 in total is at least ${SECTION4_WORD_FLOOR} words and is the longest section of the document.`,
  ].join("\n");
}

/** Short restatement for the paste-ready master prompt. */
export function copyCraftSummary(): string {
  return [
    "Copy contract: use the Section 4 copy verbatim — never summarise it. Hero H1 ≤ 10 words naming the outcome, sub-headline 20–35 words, body 40–70 words. Every feature/offer card carries 45–80 words of body copy, not a one-liner. Every process step names what happens, what the customer does, what they get and how long it takes. Pricing tiers state who they are for, full-sentence inclusions, exclusions and a guarantee. At least 8 FAQ answers of 60–110 words each. The case study runs 350–500 words and the launch post 700–1,000.",
    `Banned words everywhere: ${BANNED_COPY_PHRASES.join(", ")}. CTA labels start with a verb and name the artifact — never "Learn more" or "Get started".`,
  ].join(" ");
}

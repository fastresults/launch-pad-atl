// Per-deliverable prompt profiles.
//
// The dashboard pipeline used to run every deliverable through one generic
// system prompt ("3-6 sections, 100-220 words each"). That's right for a
// one-page brief and catastrophically wrong for a Website PRD — it capped the
// PRD at ~1,200 words no matter how much corpus the founder had uploaded.
//
// A profile declares how long a document should be, what its spine of sections
// is, whether it needs multi-pass generation, and which corpus queries to run
// so retrieval covers the whole document rather than one topic.

export type PromptProfile = {
  sectionsMin: number;
  sectionsMax: number;
  wordsMin: number;
  wordsMax: number;
  /** Extra system-prompt guidance appended to the base instructions. */
  systemExtra?: string;
  /** Required section headings, in order. When set, the model must follow it. */
  spine?: string[];
  /** Generate the spine in batches instead of one completion. */
  multiPass?: boolean;
  /** Sections per model call when multiPass is on. */
  batchSize?: number;
  /** Topic queries for corpus retrieval (in addition to the deliverable label). */
  corpusQueries?: string[];
  /** Chunks retrieved per corpus query. */
  corpusLimitPerQuery?: number;
};

export const DEFAULT_PROFILE: PromptProfile = {
  sectionsMin: 3,
  sectionsMax: 6,
  wordsMin: 100,
  wordsMax: 220,
  corpusLimitPerQuery: 10,
};

const WEBSITE_PRD_SPINE = [
  "Product summary and success criteria",
  "Who this site is for (ICP, jobs-to-be-done, objections)",
  "Positioning and message hierarchy",
  "Information architecture and sitemap",
  "Home page specification",
  "Secondary page specifications",
  "Conversion paths, forms, and CTAs",
  "Brand and design tokens",
  "Content inventory and copy blocks",
  "SEO and metadata plan",
  "Analytics and conversion events",
  "Tech, data model, and integrations",
  "Launch checklist and acceptance criteria",
  "Appendix: paste-ready AI-builder prompt",
];

const PROFILES: Record<string, PromptProfile> = {
  website_prd: {
    sectionsMin: 12,
    sectionsMax: 16,
    wordsMin: 400,
    wordsMax: 900,
    multiPass: true,
    batchSize: 3,
    spine: WEBSITE_PRD_SPINE,
    corpusLimitPerQuery: 8,
    corpusQueries: [
      "brand name, tagline, voice, tone, visual identity, colors and typography",
      "the offer, products, services, pricing and packaging",
      "target audience, ideal customer, their pain and objections",
      "proof: testimonials, results, credentials, partners, press",
      "product roadmap, features, how the service is delivered",
      "competitors, positioning and differentiation",
      "contact details, locations, hours, calls to action",
    ],
    systemExtra: [
      "You are writing a Product Requirements Document that an AI website builder can execute verbatim.",
      "Be exhaustive and concrete. Specify real copy (headlines, subheads, button labels), real section order, real field names — never placeholders like 'TBD' or 'insert here'.",
      "Use the founder's actual brand names, offers, prices, locations and proof from the context. Never invent facts the context does not support; if something is genuinely unknown, state the assumption explicitly and mark it as an assumption.",
      "Use markdown tables for sitemaps, token tables, event tables and acceptance criteria.",
      "The 'Brand and design tokens' section MUST reproduce the brand kit exactly: a markdown table of every color token with its hex, the heading and body font families with their Google Fonts <link> import line, the type scale, and the permanent logo URL rendered as a literal <img src=\"...\"> tag plus any lockup variant URLs. Copy the URLs character for character — never shorten, rewrite, or substitute a placeholder logo.",
      "The final appendix section must contain one long, paste-ready build prompt inside a fenced code block, and that prompt must itself inline the exact hex values, the font import line, and the <img src=\"...\"> logo tag so a builder produces an on-brand site on the first pass.",
    ].join(" "),
  },
  website_4pg: {
    sectionsMin: 8,
    sectionsMax: 12,
    wordsMin: 300,
    wordsMax: 700,
    multiPass: true,
    batchSize: 3,
    corpusLimitPerQuery: 8,
    corpusQueries: [
      "brand name, tagline, voice and visual identity",
      "the offer, services and pricing",
      "target audience and their objections",
      "proof, testimonials and credentials",
    ],
    systemExtra:
      "Write the actual page copy, ready to paste. Every page gets a hero, body sections, and a call to action with real words — not descriptions of words.",
  },
  pitch_deck_outline: {
    sectionsMin: 10,
    sectionsMax: 14,
    wordsMin: 150,
    wordsMax: 350,
    corpusLimitPerQuery: 8,
    corpusQueries: [
      "the problem, the solution and why now",
      "market size, competitors and differentiation",
      "traction, proof and financials",
    ],
  },
  brand_guidelines_book: {
    sectionsMin: 8,
    sectionsMax: 12,
    wordsMin: 250,
    wordsMax: 600,
    multiPass: true,
    batchSize: 3,
    corpusLimitPerQuery: 8,
    corpusQueries: [
      "logo, colors, typography and visual identity",
      "voice, tone and messaging",
      "do's and don'ts, usage rules and examples",
    ],
  },
};

export function profileFor(key: string): PromptProfile {
  return { ...DEFAULT_PROFILE, ...(PROFILES[key] ?? {}) };
}

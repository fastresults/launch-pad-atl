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

const PROFILES: Record<string, Partial<PromptProfile>> = {
  // website_prd deliberately carries NO spine, section counts or systemExtra.
  // Its full structure lives in SPECIALIZED_PROMPTS.website_prd, and its art
  // direction is injected per-venture from _shared/site-art-direction.ts.
  // Declaring a second, different outline here made the model hedge between
  // two structures and produced generic output — only retrieval config belongs
  // in this entry.
  website_prd: {
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

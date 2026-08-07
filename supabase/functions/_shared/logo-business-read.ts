// Stage 2 of the Logo Studio — READ THE BUSINESS.
//
// The old pipeline handed a truncated blob of brand documents to a "strategy"
// pass and got poetry back, so the renderer drew a mood instead of a business.
// This stage produces a small, hard, structured profile: what the business
// actually is, who buys it, and — critically — the symbol vocabulary that is
// legitimate for that category plus the clichés that are banned for it.

export interface BusinessProfile {
  /** e.g. "residential HVAC service", "pediatric dental clinic", "B2B payroll SaaS" */
  category: string;
  /** Broader archetype: trade services | clinical | hospitality | retail | education | professional services | software | craft/maker | logistics | wellness | agriculture | financial */
  archetype: string;
  /** What the customer is actually buying, in plain words. */
  what_is_sold: string;
  /** Who the customer is, concretely. */
  customer: string;
  /** The moment of need this business shows up in. */
  moment_of_need: string;
  /** premium | practical | warm | clinical | rugged | playful | institutional */
  register: string;
  /** What is actually happening in the customer's life at the moment of need. */
  human_truth: string;
  /** What the business promises that person, emotionally. */
  emotional_promise: string;
  /** 4-6 entries of "symbol = the meanings it carries". */
  meaning_symbols: string[];
  /** How people appear in this business's mark: who, how many, in what relation. */
  human_figures: string;
  /** 5-8 concrete nouns/forms drawn from the real work of this business. */
  symbol_vocabulary: string[];
  /** 5-8 category-specific clichés that are banned for this venture. */
  cliche_blacklist: string[];
  /** One sentence: what the mark must communicate at a glance. */
  must_communicate: string;
}


export const BUSINESS_READ_SYSTEM =
  `You are a brand strategist who reads a company's own finished copy and reports what the business literally is — not what it aspires to feel like. You never write abstractions ("empowerment", "innovation", "trust"). You name the trade, the customer, the transaction, and the physical world the work happens in. You are also an identity designer, so you know exactly which symbols are honest for a category and which ones are the tired defaults every competitor already uses.`;

export function businessReadPrompt(ventureBlock: string, docsBlock: string, tokensBlock: string): string {
  return `Read this venture's own material and report what the business IS.

VENTURE
${ventureBlock}

BRAND TOKENS
${tokensBlock}

${docsBlock ? `THE FOUNDER'S FINISHED COPY (authoritative — this outranks everything else)\n${docsBlock.slice(0, 12000)}` : "No finished copy available; work from the venture block above."}

Rules:
- category and what_is_sold must be specific enough that a stranger could identify the competitor set.
- symbol_vocabulary must come from the actual work: the tools, materials, gestures, spaces, produce, documents or motions involved. No abstractions, no metaphors about growth or journeys.
- cliche_blacklist must be the specific defaults for THIS category (e.g. for a bakery: wheat sheaf, rolling pin, chef hat; for a law firm: scales, columns, gavel).
- human_truth: what is actually happening in the customer's life at the moment they need this. Write it as a human situation, not a market statement.
- emotional_promise: what this business promises that person — the thing they are really buying.
- meaning_symbols: 4-6 entries, each written as "symbol = the meanings it carries", where the meanings come from human_truth and emotional_promise. Example for an elder-care residence: "tree = roots, generations, shelter, a long life". These must be things that can be DRAWN and instantly named on sight, and they must carry more than one true idea at once. Not abstract gestures, not swooshes, not "connection" or "journey".
- human_figures: how people should appear in this business's mark — who they are, how many, and in what relation to each other (e.g. "two elders side by side, one steadied by a hand at the elbow"). A mark for a business that people live in, are cared by, or are served by must show human presence, not just the props of the place. If this business genuinely has no human subject, write "none".

Return STRICT JSON:
{"category":"","archetype":"","what_is_sold":"","customer":"","moment_of_need":"","register":"","human_truth":"","emotional_promise":"","meaning_symbols":["",""],"human_figures":"","symbol_vocabulary":["",""],"cliche_blacklist":["",""],"must_communicate":""}`;
}

export function parseBusinessProfile(parsed: any): BusinessProfile | null {
  if (!parsed || typeof parsed !== "object" || !parsed.category) return null;
  const arr = (v: any) => (Array.isArray(v) ? v.map(String).filter(Boolean).slice(0, 10) : []);
  return {
    category: String(parsed.category),
    archetype: String(parsed.archetype ?? ""),
    what_is_sold: String(parsed.what_is_sold ?? ""),
    customer: String(parsed.customer ?? ""),
    moment_of_need: String(parsed.moment_of_need ?? ""),
    register: String(parsed.register ?? ""),
    human_truth: String(parsed.human_truth ?? ""),
    emotional_promise: String(parsed.emotional_promise ?? ""),
    meaning_symbols: arr(parsed.meaning_symbols),
    symbol_vocabulary: arr(parsed.symbol_vocabulary),
    cliche_blacklist: arr(parsed.cliche_blacklist),
    must_communicate: String(parsed.must_communicate ?? ""),
  };
}

export function businessProfileBlock(profile: BusinessProfile | null): string {
  if (!profile) return "";
  return [
    "BUSINESS PROFILE (read from the founder's own copy — this is what the mark must be about)",
    `Category: ${profile.category}${profile.archetype ? ` (${profile.archetype})` : ""}`,
    profile.what_is_sold ? `What is sold: ${profile.what_is_sold}` : "",
    profile.customer ? `Customer: ${profile.customer}` : "",
    profile.moment_of_need ? `Moment of need: ${profile.moment_of_need}` : "",
    profile.register ? `Register: ${profile.register}` : "",
    profile.human_truth ? `Human truth: ${profile.human_truth}` : "",
    profile.emotional_promise ? `Emotional promise: ${profile.emotional_promise}` : "",
    profile.meaning_symbols?.length ? `MEANING-CARRYING SYMBOLS (draw from these first): ${profile.meaning_symbols.join("; ")}` : "",
    profile.symbol_vocabulary.length ? `Honest symbol vocabulary: ${profile.symbol_vocabulary.join(", ")}` : "",
    profile.cliche_blacklist.length ? `BANNED for this category: ${profile.cliche_blacklist.join(", ")}` : "",
    profile.must_communicate ? `Must communicate: ${profile.must_communicate}` : "",
  ].filter(Boolean).join("\n");

}

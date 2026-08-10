/**
 * Distinctive facts pulled out of the venture's second brain.
 *
 * Used as a checkable contract: a Website PRD written from the full brain must
 * actually name real prices, real segments and real proof points. If fewer than
 * three of these tokens survive into the document, the copy is generic no
 * matter how polished it reads.
 */

const STOP = new Set([
  "The", "This", "That", "Our", "Your", "Their", "We", "They", "It", "A", "An",
  "And", "But", "For", "With", "From", "Into", "Company", "Business", "Startup",
]);

function walkStrings(value: unknown, out: string[], depth = 0) {
  if (depth > 6 || out.length > 400) return;
  if (typeof value === "string") {
    if (value.length <= 400) out.push(value);
    return;
  }
  if (typeof value === "number") {
    out.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) walkStrings(v, out, depth + 1);
    return;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) walkStrings(v, out, depth + 1);
  }
}

/**
 * Short, distinctive strings a real PRD should echo: money amounts, measured
 * quantities and multi-word proper nouns (segments, places, programs).
 */
export function brainFactTokens(brain: unknown, extra: unknown = null, max = 16): string[] {
  const strings: string[] = [];
  walkStrings(brain, strings);
  walkStrings(extra, strings);

  const money = new Set<string>();
  const quantities = new Set<string>();
  const nouns = new Set<string>();

  for (const s of strings) {
    for (const m of s.match(/[$£€]\s?\d[\d,]*(?:\.\d+)?/g) ?? []) money.add(m.replace(/\s+/g, ""));
    for (const m of s.match(/\b\d[\d,.]*\s?(?:%|hours?|days?|weeks?|months?|years?|clients?|customers?|members?|athletes?|stores?|seats?)\b/gi) ?? []) {
      quantities.add(m.trim());
    }
    for (const m of s.match(/\b([A-Z][a-z]{2,})(?:\s+(?:of\s+|the\s+)?[A-Z][a-z]{2,}){1,3}\b/g) ?? []) {
      const head = m.split(/\s+/)[0];
      if (!STOP.has(head) && m.length <= 48) nouns.add(m);
    }
  }

  const pick = (set: Set<string>, n: number) => Array.from(set).slice(0, n);
  const tokens = [
    ...pick(money, 6),
    ...pick(quantities, 5),
    ...pick(nouns, 8),
  ];
  return Array.from(new Set(tokens)).slice(0, max);
}

/** How many of the brain's distinctive facts actually appear in the document. */
export function countFactEchoes(raw: string, tokens: string[]): number {
  if (!raw || !tokens.length) return 0;
  const hay = raw.toLowerCase().replace(/\s+/g, " ");
  let hits = 0;
  for (const t of tokens) {
    const needle = t.toLowerCase().replace(/\s+/g, " ");
    if (needle.length >= 3 && hay.includes(needle)) hits++;
  }
  return hits;
}

/** Prompt block listing the facts the document must carry. */
export function brainFactsBlock(tokens: string[]): string {
  if (!tokens.length) return "";
  return [
    "\n## Non-negotiable venture facts (from the second brain — use them verbatim)",
    "The document must name at least six of these concretely in the body copy. Never round them, never replace them with placeholders, never write a generic equivalent.",
    ...tokens.map((t) => `- ${t}`),
  ].join("\n");
}

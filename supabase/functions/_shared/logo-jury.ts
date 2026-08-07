// Stage 5 of the Logo Studio — THE JURY.
//
// Judges the mark that actually rendered against the craft spec derived from
// the founder's references and the business profile derived from their copy.
// A fail returns one imperative correction note that drives exactly one
// re-render; nothing below the bar is ever shown to the founder.

import type { CraftSpec } from "./logo-reference-read.ts";
import type { BusinessProfile } from "./logo-business-read.ts";

export interface JuryVerdict {
  pass: boolean;
  note: string;
  scores: Record<string, number>;
}

export const JURY_SYSTEM =
  `You are the jury for a professional identity award. You have seen ten thousand AI-generated marks and can spot one instantly: primitive shapes arranged neatly, a blob with a dot, a seal with rays, mangled letterforms. You are not kind. Most submissions fail. You only pass work a practising identity designer would publish under their own name.`;

export function juryInstruction(
  claimedIdea: string,
  craftMove: string,
  logoType: string,
  spec: CraftSpec | null,
  profile: BusinessProfile | null,
  brand?: { palette?: string[]; mood?: string } | null,
): string {
  return `Judge the attached rendered mark.

It claims: ${claimedIdea || "unstated"}
Craft move claimed: ${craftMove || "unstated"}
Logo type: ${logoType || "unstated"}
${profile ? `Business: ${profile.category}. It must communicate: ${profile.must_communicate}` : ""}
${profile?.human_truth ? `Human truth behind this business: ${profile.human_truth}` : ""}
${profile?.emotional_promise ? `Emotional promise it must carry: ${profile.emotional_promise}` : ""}
${profile?.cliche_blacklist?.length ? `Banned category clichés: ${profile.cliche_blacklist.join(", ")}` : ""}

${brand?.palette?.length ? `Locked brand palette it must use: ${brand.palette.join(", ")}` : ""}
${brand?.mood ? `Brand visual world: ${brand.mood}` : ""}
${spec ? `Reference craft spec it must match: ${spec.construction} construction, abstraction ${spec.abstraction}/5, at most ${spec.element_count} elements, ${spec.colour_count} ink(s), ${spec.shared_quality}` : ""}

Fail it if ANY of these are true:
- It contains letters, words, numerals, initials or lettering of any kind. This is an automatic fail, no matter how good the rest is.
- The parts do not fuse: shapes merely sit near each other, overlap loosely, or float apart instead of sharing a contour, a tangent or a counterform.
- The curves are not deliberate: wobbly, lumpy, sagging, randomly tapering strokes, uneven weight, bulging joins, or corners and terminals that are cut differently across the mark.
- It carries decorative filler: a swoosh, sparkle, highlight arc, orbiting dot or accent leaf that could be removed without losing the idea.
- Knocked out as one flat colour at 24px it does not still read as the same distinct shape.
- It reads as auto-generated: primitives arranged neatly, with no drawing in it.
- It uses a banned category cliché, or has nothing to do with the business.
- Its construction contradicts the reference craft spec (too many shapes, wrong abstraction level, wrong stroke character).
- The claimed craft move is not visibly present.
- More than one competing idea.
- It would work unchanged for a different company in the same category.
- It ignores the locked brand palette, or introduces colours that are not in it.
- It does not belong in the brand's visual world (wrong temperature, softness or register).
- NAMING TEST: name what you see in three words, without being told what it is meant to be. If the honest answer is "an abstract shape", "a ribbon", "a swirl" or anything with no subject in it, this fails.
- MEANING TEST: it is decoration. It carries no human idea about this business — nothing about the customer's situation, the promise, or the life being served.
- CROSS-SECTOR TEST: it would work unchanged for a business in an unrelated sector (a yoga studio, a consultancy, a crypto fund). Automatic fail regardless of how well it is drawn.

Score honestly 1-5 on: fusion, curve_quality, silhouette_read, structure_match, craft, relevance, distinctiveness, scalability, palette_fidelity, moodboard_fit, meaning_read, subject_legibility.
Pass only if every score is 4 or higher. If there is any lettering, set every score to 1 and fail.

Return STRICT JSON: {"pass":true|false,"note":"if failing, ONE imperative sentence naming the exact change to make on the next render","scores":{"fusion":1,"curve_quality":1,"silhouette_read":1,"structure_match":1,"craft":1,"relevance":1,"distinctiveness":1,"scalability":1,"palette_fidelity":1,"moodboard_fit":1,"meaning_read":1,"subject_legibility":1}}`;

}

export function parseJuryVerdict(parsed: any): JuryVerdict | null {
  if (!parsed || typeof parsed !== "object" || typeof parsed.pass !== "boolean") return null;
  const scores: Record<string, number> = {};
  for (const [k, v] of Object.entries(parsed.scores ?? {})) {
    const n = Number(v);
    if (Number.isFinite(n)) scores[k] = n;
  }
  return { pass: parsed.pass, note: String(parsed.note ?? ""), scores };
}

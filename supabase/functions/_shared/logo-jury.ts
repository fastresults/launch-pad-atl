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
${profile?.cliche_blacklist?.length ? `Banned category clichés: ${profile.cliche_blacklist.join(", ")}` : ""}
${brand?.palette?.length ? `Locked brand palette it must use: ${brand.palette.join(", ")}` : ""}
${brand?.mood ? `Brand visual world: ${brand.mood}` : ""}
${spec ? `Reference craft spec it must match: ${spec.construction} construction, abstraction ${spec.abstraction}/5, at most ${spec.element_count} elements, ${spec.colour_count} ink(s), ${spec.shared_quality}` : ""}

Fail it if ANY of these are true:
- It reads as auto-generated: primitives arranged neatly, with no drawing in it.
- It contains letters, words or lettering of any kind.
- It uses a banned category cliché, or has nothing to do with the business.
- Its construction contradicts the reference craft spec (too many elements, wrong abstraction level, wrong stroke character).
- The claimed craft move is not visibly present.
- Shapes are broken, lumpy, accidental, unbalanced, or float apart.
- More than one competing idea, or it turns to mush at 24px.
- It would work unchanged for a different company in the same category.
- It ignores the locked brand palette, or introduces colours that are not in it.
- It does not belong in the brand's visual world (wrong temperature, softness or register).

Score honestly 1-5 on: structure_match, craft, relevance, distinctiveness, scalability, palette_fidelity, moodboard_fit.
Pass only if every score is 4 or higher.

Return STRICT JSON: {"pass":true|false,"note":"if failing, ONE imperative sentence naming the exact change to make on the next render","scores":{"structure_match":1,"craft":1,"relevance":1,"distinctiveness":1,"scalability":1,"palette_fidelity":1,"moodboard_fit":1}}`;
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

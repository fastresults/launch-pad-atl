// Stage 1 of the Logo Studio — READ THE REFERENCES.
//
// The founder's three inspiration logos are the visual target. A vision pass
// reduces them to a CRAFT SPEC: structural constraints only, never subject
// matter. Everything downstream — concepting, rendering, the jury — is judged
// against this spec, which is why the references are now mandatory.

export interface CraftSpec {
  /** geometric | organic | typographic | emblem | hybrid */
  construction: string;
  /** 1 (literal) – 5 (fully abstract) */
  abstraction: number;
  /** How many distinct visual elements the marks average. */
  element_count: number;
  /** e.g. "heavy, uniform", "thin, hairline", "modulated" */
  stroke_character: string;
  /** e.g. "sharp corners, flat terminals" */
  corner_and_terminals: string;
  /** How counterforms / negative space behave across the three. */
  counterform: string;
  /** e.g. "vertical mirror", "rotational", "asymmetric" */
  symmetry: string;
  /** Typical number of inks. */
  colour_count: number;
  /** The ONE quality all three share — the thing to inherit. */
  shared_quality: string;
  /** Structural things to avoid, inferred from what the references are NOT. */
  avoid: string[];
}

export const REFERENCE_READ_SYSTEM =
  `You are an identity designer performing a structural teardown of reference marks. You describe HOW they are built — proportion, stroke, abstraction, counterform, symmetry, ink count — and never what they depict. Subject matter is irrelevant and must never be reported.`;

export const REFERENCE_READ_INSTRUCTION = `The attached images are logos the founder admires. Analyse their CONSTRUCTION only.

Report the shared structural DNA, not the subjects. If the three disagree on a property, report the dominant tendency.

Return STRICT JSON:
{"construction":"geometric|organic|typographic|emblem|hybrid","abstraction":1-5,"element_count":1-6,"stroke_character":"","corner_and_terminals":"","counterform":"","symmetry":"","colour_count":1-3,"shared_quality":"the ONE quality all three share, in one sentence","avoid":["structural qualities these references clearly reject"]}`;

export function parseCraftSpec(parsed: any): CraftSpec | null {
  if (!parsed || typeof parsed !== "object" || !parsed.construction) return null;
  const num = (v: any, min: number, max: number, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
  };
  return {
    construction: String(parsed.construction),
    abstraction: num(parsed.abstraction, 1, 5, 3),
    element_count: num(parsed.element_count, 1, 6, 2),
    stroke_character: String(parsed.stroke_character ?? ""),
    corner_and_terminals: String(parsed.corner_and_terminals ?? ""),
    counterform: String(parsed.counterform ?? ""),
    symmetry: String(parsed.symmetry ?? ""),
    colour_count: num(parsed.colour_count, 1, 3, 2),
    shared_quality: String(parsed.shared_quality ?? ""),
    avoid: Array.isArray(parsed.avoid) ? parsed.avoid.map(String).filter(Boolean).slice(0, 8) : [],
  };
}

export function craftSpecBlock(spec: CraftSpec | null): string {
  if (!spec) return "";
  return [
    "CRAFT SPEC (read from the founder's 3 inspiration marks — these are HARD constraints)",
    `Construction: ${spec.construction}`,
    `Abstraction level: ${spec.abstraction}/5`,
    `Element ceiling: ${spec.element_count} distinct elements — never more`,
    spec.stroke_character ? `Stroke: ${spec.stroke_character}` : "",
    spec.corner_and_terminals ? `Corners & terminals: ${spec.corner_and_terminals}` : "",
    spec.counterform ? `Counterform behaviour: ${spec.counterform}` : "",
    spec.symmetry ? `Symmetry: ${spec.symmetry}` : "",
    `Ink count: ${spec.colour_count}`,
    spec.shared_quality ? `Inherit this above all: ${spec.shared_quality}` : "",
    spec.avoid.length ? `Structurally avoid: ${spec.avoid.join("; ")}` : "",
    "Inherit STRUCTURE only. Never echo the references' subject matter.",
  ].filter(Boolean).join("\n");
}

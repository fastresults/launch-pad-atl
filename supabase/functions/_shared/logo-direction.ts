// Logo Studio — the creative direction pass.
//
// Replaces the old question-by-question interview. The founder describes what
// they want once, optionally uploads inspiration, and sets a few dials. This
// module reads the brand guide and the Second Brain content, weighs the
// founder's own words above everything else, and returns ONE creative
// direction plus a shared SET LAW and three concepts that differ in idea, not
// in decoration.

import { aiFetch } from "./ai-fetch.ts";
import { MODELS } from "./models.ts";
import type { BusinessProfile } from "./logo-business-read.ts";
import type { CraftSpec } from "./logo-reference-read.ts";

const CHAT_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type MarkType = "symbol" | "wordmark" | "lettermark" | "combination" | "open";

export interface ReferenceImage {
  /** Signed or public URL of the founder's inspiration image. */
  url: string;
  /** Why it is here: shape | colour | typography | feeling */
  reason: string;
  /** Storage path, when we uploaded it. */
  path?: string;
  label?: string;
}

export interface FounderIntake {
  /** The highest-weight input in the whole pipeline: their own words. */
  description: string;
  markType: MarkType;
  /** Each 1-5. See DIAL_LABELS for what the poles mean. */
  dials: Record<string, number>;
  /** Things the mark must never do. */
  avoid: string[];
  references: ReferenceImage[];
}

export const DIAL_LABELS: Record<string, [string, string]> = {
  abstraction: ["literal", "abstract"],
  weight: ["light and fine", "heavy and solid"],
  geometry: ["geometric and constructed", "organic and drawn"],
  warmth: ["cool and technical", "warm and human"],
  era: ["classic and timeless", "contemporary and sharp"],
};

export interface Concept {
  id: string;
  title: string;
  /** The one-sentence shape idea. */
  idea: string;
  /** The extra true idea the form carries beyond its literal subject. */
  second_read: string;
  /** The literal subject a stranger would name on sight. */
  reads_as: string;
  /** The single drawing move that creates the mark. */
  craft_move: string;
  logo_type: string;
  /** Concrete drawing instructions for this one mark. */
  render_brief: string;
}

export interface CreativeDirection {
  headline: string;
  core_idea: string;
  attributes: string[];
  metaphor: string;
  subject_presence: string;
  colour_roles: { dominant: string; secondary: string; accent: string };
  avoid: string[];
  /** One law all three marks obey: container, stroke, detail budget, colour assignment. */
  set_law: string;
  /** Plain language, addressed to the founder — this is the approval gate. */
  rationale: string;
  concepts: Concept[];
}

export interface DirectionDossier {
  companyName: string;
  ventureBlock: string;
  brandGuideBlock: string;
  brainBlock: string;
  docsBlock: string;
  profile: BusinessProfile | null;
  craftSpec: CraftSpec | null;
  palette: string[];
}

function clean(v: unknown, max = 400): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function arr(v: unknown, max = 8): string[] {
  return Array.isArray(v) ? v.map((x) => clean(x, 220)).filter(Boolean).slice(0, max) : [];
}

/** Models sometimes wrap JSON in prose or fences. Take the first object we can parse. */
export function parseJsonLoose(text: string): any {
  const trimmed = (text ?? "").trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch { /* fall through */ }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(trimmed.slice(start, end + 1)); } catch { /* fall through */ }
  }
  throw new Error("The art director returned an unreadable response. Try again.");
}

export async function chatJson(
  apiKey: string,
  messages: any[],
  opts: { model?: string; timeoutMs?: number } = {},
): Promise<any> {
  const res = await aiFetch(
    CHAT_URL,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: opts.model ?? MODELS.pro,
        messages,
        response_format: { type: "json_object" },
      }),
    },
    { timeoutMs: opts.timeoutMs ?? 90_000, retries: 1 },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Art director unavailable (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  return parseJsonLoose(typeof text === "string" ? text : JSON.stringify(text));
}

const SYSTEM =
  `You are the art director of an identity studio whose marks get published in identity annuals. You do not run questionnaires. You read a company's own finished writing, look at what the founder has shown you, and then commit to ONE creative direction and three concepts that share a single construction law.

You are ruthless about three things:
1. The founder's own description outranks your taste. If they described something, it appears in the work.
2. A mark must be ABOUT the business — a nameable subject carrying a human idea — never a swoosh, ribbon, orbit, blob, globe, lightbulb, handshake, gear or generic leaf.
3. The three concepts differ in IDEA. They never differ in container, stroke weight or detail density — those are fixed once, for the whole set, by the set law.`;

function intakeBlock(intake: FounderIntake): string {
  const dials = Object.entries(intake.dials ?? {})
    .map(([key, value]) => {
      const poles = DIAL_LABELS[key];
      if (!poles) return `${key}: ${value}/5`;
      return `${key}: ${value}/5 (1 = ${poles[0]}, 5 = ${poles[1]})`;
    })
    .join("\n");

  const refs = (intake.references ?? [])
    .map((r, i) => `Reference ${i + 1}: attached for its ${r.reason || "overall feeling"}`)
    .join("\n");

  return [
    intake.description
      ? `## THE FOUNDER'S OWN WORDS (highest weight — the direction must visibly answer this)\n${intake.description.slice(0, 2000)}`
      : "## The founder did not describe a mark. Propose one from the brand and the business.",
    intake.markType && intake.markType !== "open" ? `## Mark type they asked for\n${intake.markType}` : "",
    dials ? `## Direction dials\n${dials}` : "",
    intake.avoid?.length ? `## Never do this (LAW)\n${intake.avoid.map((a) => `- ${a}`).join("\n")}` : "",
    refs ? `## Inspiration they uploaded (images attached)\nRead these for PRINCIPLE only — proportion, abstraction level, stroke, colour behaviour. Never restyle or echo their subject matter.\n${refs}` : "",
  ].filter(Boolean).join("\n\n");
}

export function dossierBlock(d: DirectionDossier): string {
  return [
    `## The business\n${d.ventureBlock}`,
    d.brandGuideBlock ? `## The locked brand guide (first reference — the mark must live inside this system)\n${d.brandGuideBlock}` : "",
    d.brainBlock ? `## Second Brain — what this venture has decided about itself\n${d.brainBlock.slice(0, 6000)}` : "",
    d.docsBlock ? `## Their finished strategy copy (authoritative)\n${d.docsBlock.slice(0, 10000)}` : "",
  ].filter(Boolean).join("\n\n");
}

const SHAPE = `Return STRICT JSON:
{
  "headline": "two to four words naming the direction",
  "core_idea": "one sentence: the single idea the identity is built on",
  "attributes": ["three brand attributes, one word or short phrase each"],
  "metaphor": "the one visual metaphor territory, named concretely",
  "subject_presence": "who or what must appear in the mark, and in what relation. If people belong in this mark, say exactly how they appear. If they genuinely do not, write 'none'.",
  "colour_roles": {"dominant":"#hex — carries the structure","secondary":"#hex — carries supporting mass","accent":"#hex — used once, on the element that carries the meaning"},
  "avoid": ["the not-list: category clichés and anything the founder banned"],
  "set_law": "ONE sentence stating the container rule (contained roundel | open form | anchored baseline), the single stroke weight, the detail budget (max closed shapes), and the colour role assignment. Every concept obeys this verbatim.",
  "rationale": "80-120 words of plain prose addressed to the founder: what you are making, why it is right for this business, and how their own description shaped it. No headings, no bullets.",
  "concepts": [
    {
      "title": "two to four words",
      "idea": "one sentence a designer could draw from: what the shape IS and how it is constructed",
      "second_read": "the additional true idea the form carries beyond its literal subject",
      "reads_as": "the literal subject a stranger names on sight, in three words",
      "craft_move": "the single drawing move that creates the mark",
      "logo_type": "symbol | combination | lettermark | wordmark | emblem",
      "render_brief": "one paragraph of concrete drawing instructions: subject, construction, what encloses what, what the negative space does, where strokes meet, which colour role lands where"
    }
  ]
}

Rules for the concepts:
- Exactly three. Each must be a different IDEA — not the same subject at three sizes.
- Each must be nameable on sight. Kill anything a stranger would call "an abstract shape".
- Each must carry a second read. One literal object with nothing else is an icon, not an identity.
- If subject_presence names people, at least two concepts must contain a human figure or an unmistakable human gesture.
- No lettering inside any symbol. A wordmark, if requested, is typeset separately in the brand typeface.
- Every concept must obey the set law exactly.`;

/**
 * Read the brand + Second Brain + the founder's description and commit to one
 * direction with three concepts. Inspiration images are attached as vision
 * input so the references are read for principle, never restyled.
 */
export async function buildCreativeDirection(
  apiKey: string,
  dossier: DirectionDossier,
  intake: FounderIntake,
  previous?: CreativeDirection | null,
  correction?: string,
): Promise<CreativeDirection> {
  const text = [
    dossierBlock(dossier),
    dossier.profile
      ? `## What the business literally is\nCategory: ${dossier.profile.category}\nCustomer: ${dossier.profile.customer}\nMoment of need: ${dossier.profile.moment_of_need}\nHuman truth: ${dossier.profile.human_truth}\nEmotional promise: ${dossier.profile.emotional_promise}\nHonest symbol vocabulary: ${dossier.profile.symbol_vocabulary.join(", ")}\nBanned clichés for this category: ${dossier.profile.cliche_blacklist.join(", ")}\nHuman presence: ${dossier.profile.human_figures}`
      : "",
    dossier.craftSpec
      ? `## Structural DNA read from their inspiration\n${dossier.craftSpec.construction} construction, abstraction ${dossier.craftSpec.abstraction}/5, at most ${dossier.craftSpec.element_count} elements, ${dossier.craftSpec.stroke_character}, ${dossier.craftSpec.colour_count} ink(s). Inherit: ${dossier.craftSpec.shared_quality}`
      : "",
    intakeBlock(intake),
    dossier.palette.length ? `## Palette hexes available\n${dossier.palette.join(", ")}` : "",
    previous ? `## The direction you proposed last time\n${JSON.stringify({ headline: previous.headline, core_idea: previous.core_idea, set_law: previous.set_law, concepts: previous.concepts.map((c) => c.title) })}` : "",
    correction ? `## The founder's correction — not optional, it becomes law\n${correction}` : "",
    SHAPE,
  ].filter(Boolean).join("\n\n");

  const content: any[] = [{ type: "text", text }];
  for (const ref of (intake.references ?? []).slice(0, 5)) {
    if (typeof ref.url === "string" && (ref.url.startsWith("http") || ref.url.startsWith("data:image/"))) {
      content.push({ type: "image_url", image_url: { url: ref.url } });
    }
  }

  const parsed = await chatJson(apiKey, [
    { role: "system", content: SYSTEM },
    { role: "user", content },
  ], { timeoutMs: 120_000 });

  return normalizeDirection(parsed, dossier.palette);
}

export function normalizeDirection(parsed: any, palette: string[] = []): CreativeDirection {
  const roles = parsed?.colour_roles ?? {};
  const hex = (v: unknown, fallback: string) =>
    typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v.trim()) ? v.trim() : fallback;

  const concepts: Concept[] = (Array.isArray(parsed?.concepts) ? parsed.concepts : [])
    .slice(0, 3)
    .map((c: any) => ({
      id: crypto.randomUUID(),
      title: clean(c?.title, 60) || "The mark",
      idea: clean(c?.idea, 500),
      second_read: clean(c?.second_read, 300),
      reads_as: clean(c?.reads_as, 120),
      craft_move: clean(c?.craft_move, 240),
      logo_type: clean(c?.logo_type, 40) || "symbol",
      render_brief: clean(c?.render_brief, 1600),
    }));

  return {
    headline: clean(parsed?.headline, 80) || "Direction",
    core_idea: clean(parsed?.core_idea, 400),
    attributes: arr(parsed?.attributes, 3),
    metaphor: clean(parsed?.metaphor, 240),
    subject_presence: clean(parsed?.subject_presence, 400),
    colour_roles: {
      dominant: hex(roles.dominant, palette[0] ?? "#111111"),
      secondary: hex(roles.secondary, palette[1] ?? palette[0] ?? "#444444"),
      accent: hex(roles.accent, palette[2] ?? palette[1] ?? "#B8860B"),
    },
    avoid: arr(parsed?.avoid, 10),
    set_law: clean(parsed?.set_law, 600),
    rationale: clean(parsed?.rationale, 1400),
    concepts,
  };
}

/** One extra concept in the same set, when the founder wants another swing. */
export async function refineConceptBrief(
  apiKey: string,
  direction: CreativeDirection,
  concept: Concept,
  instruction: string,
): Promise<Concept> {
  const parsed = await chatJson(apiKey, [
    { role: "system", content: SYSTEM },
    {
      role: "user",
      content: `The founder is looking at this mark and asked for a change. Rewrite its drawing brief — same idea, their change applied, still obeying the set law.

SET LAW: ${direction.set_law}
DIRECTION: ${direction.core_idea}
NOT-LIST: ${direction.avoid.join("; ")}

CURRENT CONCEPT
title: ${concept.title}
reads as: ${concept.reads_as}
idea: ${concept.idea}
second read: ${concept.second_read}
craft move: ${concept.craft_move}
render brief: ${concept.render_brief}

THE FOUNDER SAID (law): ${instruction}

Return STRICT JSON with the same concept fields: {"title":"","idea":"","second_read":"","reads_as":"","craft_move":"","logo_type":"","render_brief":"","change_note":"one short sentence naming exactly what changed"}`,
    },
  ], { timeoutMs: 90_000 });

  return {
    id: concept.id,
    title: clean(parsed?.title, 60) || concept.title,
    idea: clean(parsed?.idea, 500) || concept.idea,
    second_read: clean(parsed?.second_read, 300) || concept.second_read,
    reads_as: clean(parsed?.reads_as, 120) || concept.reads_as,
    craft_move: clean(parsed?.craft_move, 240) || concept.craft_move,
    logo_type: clean(parsed?.logo_type, 40) || concept.logo_type,
    render_brief: clean(parsed?.render_brief, 1600) || concept.render_brief,
  };
}

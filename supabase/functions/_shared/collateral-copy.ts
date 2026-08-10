// Real copy for the collateral templates.
//
// A Fortune-100 deck master is not filled with "Point headline" and "Body copy
// sits here". This pass writes the small amount of text the templates carry,
// in the brand's own voice, from the venture's real positioning.
//
// It is handed the WHOLE dossier — brain, snapshot positioning, confirmed
// numbers, banned assumptions and excerpts from the founder's own uploads —
// because a deck written from a one-liner reads like a deck written from a
// one-liner.

import { aiFetch } from "./ai-fetch.ts";
import { MODELS } from "./models.ts";
import type { CollateralCopy } from "./collateral-svg.ts";

const SYSTEM = `You write the specimen copy that fills a brand's document and deck templates.
Rules:
- Every line must be true to the venture described. No invented metrics, no client names.
- You are given the venture's CONFIRMED NUMBERS. Use them on the numbers slide — formatted for a
  slide ("$485K", "1,500", "30+"), with a label and a one-line note that says what the number means.
  Only return "—" for a figure when no confirmed number fits that slot.
- Use the market facts, differentiators and business model. Specifics beat adjectives.
- Obey the banned assumptions absolutely: never state or imply any of them.
- Plain, specific, confident. No jargon, no hype, no exclamation marks.
- Deck point headlines: 2-5 words. Deck point bodies: one sentence, max 18 words.
- Agenda items: 2-5 words each, in the order a real meeting would run.
- Timeline steps: a short label (e.g. "Week 1") plus one sentence of what happens.
- The quote must be a line the founder could truthfully say — never attributed to a fake customer.
- Scope lines: a concrete deliverable, max 8 words each.
- Never use generic filler like "Where we are today", "Point headline", "How it works",
  "Add your figure" or "By the numbers". Every line must name something only this venture would say.
- Never end mid-thought. Every line is a complete idea.
Return strict JSON only.`;

export type CollateralCopyInput = {
  company: string;
  tagline?: string | null;
  oneLiner?: string | null;
  problem?: string | null;
  solution?: string | null;
  customer?: string | null;
  differentiators?: string[] | null;
  voice?: string | null;
  /** Full dossier — the difference between a real deck and a template. */
  industry?: string | null;
  location?: string | null;
  founder?: string | null;
  concept?: string | null;
  valueProposition?: string | null;
  differentiation?: string | null;
  businessModel?: string | null;
  marketFacts?: string[] | null;
  knownNumbers?: Record<string, string | number> | null;
  bannedAssumptions?: string[] | null;
  /** Short excerpts from the founder's own uploaded material. */
  sourceExcerpts?: string[] | null;
};

/** Canned lines the templates fall back to. Their presence means the copy pass failed. */
export const COPY_PLACEHOLDERS = [
  "Where we are today",
  "One sentence that frames what this section proves.",
  "Point headline",
  "Supporting detail, kept short",
  "Add your figure",
  "Replace with a number you can defend.",
  "A short paragraph that carries the argument",
  "What we propose",
  "By the numbers",
  "The path",
  "How it works",
];

/** Is this copy object real venture copy, or an empty shell? */
export function copyIsUsable(copy: CollateralCopy | null | undefined): boolean {
  const d = copy?.deck;
  if (!d) return false;
  const filled = [d.section, d.statement, d.splitBody, d.timelineTitle, d.quote].filter(
    (s) => typeof s === "string" && s.trim().length > 3,
  ).length;
  return filled >= 4 && (d.points?.length ?? 0) === 3 && (d.agenda?.length ?? 0) >= 4 &&
    (d.timeline?.length ?? 0) >= 3;
}

function labelFor(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function attempt(
  key: string,
  model: string,
  input: CollateralCopyInput,
): Promise<CollateralCopy | null> {
  const res = await aiFetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: JSON.stringify({
              venture: input,
              confirmed_numbers_hint: Object.entries(input.knownNumbers ?? {}).map(([k, v]) => ({
                key: k, label: labelFor(k), value: v,
              })),
              respond_with: {
                deck: {
                  section: "a real section title this company would present, 2-4 words",
                  sectionSub: "one sentence framing what the section proves, max 16 words",
                  points: "array of exactly 3 objects: { title, body } — each about this venture specifically",
                  closing: "2-3 words to close a deck",
                  agenda: "array of 4-6 agenda items, 2-5 words each",
                  agendaSub: "one sentence saying what the meeting decides, max 16 words",
                  statement: "the single strongest true sentence about this venture, max 14 words",
                  splitTitle: "title for a how-it-works slide, 2-4 words, specific to this venture",
                  splitBody: "one short paragraph explaining how it actually works, max 45 words",
                  statsTitle: "title for a numbers slide, 2-4 words",
                  stats: "array of exactly 3 objects: { figure, label, note } — use the confirmed numbers",
                  timelineTitle: "title for a process slide, 2-4 words",
                  timeline: "array of exactly 4 objects: { label, body }",
                  quote: "one sentence the founder could truthfully say, max 16 words",
                  quoteAttribution: "the founder's name and title if known, else the company name",
                },
                proposal: {
                  scope: "array of 5 concrete scope lines this company would sell",
                  terms: "one sentence of proposal terms, max 24 words",
                },
                invoice: { terms: "one sentence of payment terms, max 20 words" },
                notecard: "one short line for a thank-you card, max 8 words",
                voiceDo: "one sentence, what writers should do in this brand's voice",
                voiceDont: "one sentence, what writers should avoid",
              },
            }),
          },
        ],
        response_format: { type: "json_object" },
      }),
    },
    { timeoutMs: 45_000, retries: 1 },
  );
  if (!res.ok) {
    console.warn(`[collateral copy] gateway ${res.status} on ${model}`);
    return null;
  }
  const data = await res.json();
  const raw = String(data?.choices?.[0]?.message?.content ?? "{}").replace(/^```json\s*|```$/g, "").trim();
  const parsed = JSON.parse(raw);

  const str = (v: unknown, max: number) => {
    const s = String(v ?? "").replace(/\s+/g, " ").trim();
    return s && s.length <= max ? s : s ? s.slice(0, max).replace(/\s\S*$/, "") : "";
  };

  const points = Array.isArray(parsed?.deck?.points)
    ? parsed.deck.points.slice(0, 3).map((p: any) => ({ title: str(p?.title, 34), body: str(p?.body, 130) }))
      .filter((p: any) => p.title && p.body)
    : [];

  const agenda = Array.isArray(parsed?.deck?.agenda)
    ? parsed.deck.agenda.slice(0, 6).map((s: unknown) => str(s, 38)).filter(Boolean)
    : [];

  const stats = Array.isArray(parsed?.deck?.stats)
    ? parsed.deck.stats.slice(0, 3)
      .map((s: any) => ({ figure: str(s?.figure, 10) || "—", label: str(s?.label, 30), note: str(s?.note, 90) }))
      .filter((s: any) => s.label)
    : [];

  const timeline = Array.isArray(parsed?.deck?.timeline)
    ? parsed.deck.timeline.slice(0, 4)
      .map((s: any) => ({ label: str(s?.label, 18), body: str(s?.body, 90) }))
      .filter((s: any) => s.label && s.body)
    : [];

  return {
    deck: {
      section: str(parsed?.deck?.section, 40),
      sectionSub: str(parsed?.deck?.sectionSub, 120),
      points,
      closing: str(parsed?.deck?.closing, 24),
      agenda,
      agendaSub: str(parsed?.deck?.agendaSub, 120),
      statement: str(parsed?.deck?.statement, 110),
      splitTitle: str(parsed?.deck?.splitTitle, 34),
      splitBody: str(parsed?.deck?.splitBody, 280),
      statsTitle: str(parsed?.deck?.statsTitle, 34),
      stats,
      timelineTitle: str(parsed?.deck?.timelineTitle, 34),
      timeline,
      quote: str(parsed?.deck?.quote, 120),
      quoteAttribution: str(parsed?.deck?.quoteAttribution, 48),
    },
    proposal: {
      scope: Array.isArray(parsed?.proposal?.scope) ? parsed.proposal.scope.slice(0, 7).map((s: unknown) => str(s, 60)).filter(Boolean) : [],
      terms: str(parsed?.proposal?.terms, 170),
    },
    invoice: { terms: str(parsed?.invoice?.terms, 150) },
    notecard: str(parsed?.notecard, 56),
    voiceDo: str(parsed?.voiceDo, 120),
    voiceDont: str(parsed?.voiceDont, 120),
  };
}

export async function writeCollateralCopy(input: CollateralCopyInput): Promise<CollateralCopy | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    console.error("[collateral copy] LOVABLE_API_KEY missing — templates would fall back to placeholder text");
    return null;
  }

  const supplied = Object.entries(input)
    .filter(([, v]) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && !v.length))
    .map(([k]) => k);
  console.log(
    `[collateral copy] writing for "${input.company}" — fields: ${supplied.join(", ")} · numbers: ${
      Object.keys(input.knownNumbers ?? {}).length
    } · facts: ${input.marketFacts?.length ?? 0}`,
  );

  // Two passes: the fast model first, then a stronger one. A silent null here
  // is what produces a generic deck, so it is worth the second call.
  const ladder: string[] = [MODELS.flash, MODELS.pro];
  for (const model of ladder) {
    try {
      const out = await attempt(key, model, input);
      if (copyIsUsable(out)) {
        console.log(`[collateral copy] ok via ${model}`);
        return out;
      }
      console.warn(`[collateral copy] ${model} returned unusable copy — retrying`);
    } catch (e) {
      console.warn(`[collateral copy] ${model} failed: ${(e as Error).message}`);
    }
  }
  console.error("[collateral copy] all attempts failed — refusing to publish placeholder copy");
  return null;
}

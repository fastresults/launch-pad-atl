// Real copy for the collateral templates.
//
// A Fortune-100 deck master is not filled with "Point headline" and "Body copy
// sits here". This pass writes the small amount of text the templates carry,
// in the brand's own voice, from the venture's real positioning.

import { aiFetch } from "./ai-fetch.ts";
import { MODELS } from "./models.ts";
import type { CollateralCopy } from "./collateral-svg.ts";

const SYSTEM = `You write the specimen copy that fills a brand's document and deck templates.
Rules:
- Every line must be true to the venture described. No invented metrics, no client names.
- Plain, specific, confident. No jargon, no hype, no exclamation marks.
- Deck point headlines: 2-5 words. Deck point bodies: one sentence, max 18 words.
- Scope lines: a concrete deliverable, max 8 words each.
- Never end mid-thought. Every line is a complete idea.
Return strict JSON only.`;

export async function writeCollateralCopy(input: {
  company: string;
  tagline?: string | null;
  oneLiner?: string | null;
  problem?: string | null;
  solution?: string | null;
  customer?: string | null;
  differentiators?: string[] | null;
  voice?: string | null;
}): Promise<CollateralCopy | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;

  try {
    const res = await aiFetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
        body: JSON.stringify({
          model: MODELS.flashLite,
          messages: [
            { role: "system", content: SYSTEM },
            {
              role: "user",
              content: JSON.stringify({
                venture: input,
                respond_with: {
                  deck: {
                    section: "a real section title this company would present, 2-4 words",
                    sectionSub: "one sentence framing what the section proves, max 16 words",
                    points: "array of exactly 3 objects: { title, body }",
                    closing: "2-3 words to close a deck, e.g. 'Let's build it'",
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
      { timeoutMs: 30_000, retries: 1 },
    );
    if (!res.ok) return null;
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

    return {
      deck: {
        section: str(parsed?.deck?.section, 40),
        sectionSub: str(parsed?.deck?.sectionSub, 120),
        points,
        closing: str(parsed?.deck?.closing, 24),
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
  } catch {
    return null;
  }
}

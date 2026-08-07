// Poster copy pass — distills a calendar post (long hook + body + CTA) into the
// three-part editorial lockup used by the poster compositor:
//   kicker    — short letterspaced eyebrow (2–4 words)
//   headline  — display line, <= 60 chars, no trailing punctuation
//   ctaLine   — one short action line, <= 42 chars
// Falls back to a deterministic local distillation when AI is unavailable.
//
// Hard rule: a headline is never chopped mid-thought. Every shortening path
// lands on a sentence / clause / word boundary and then drops trailing function
// words, so "…why having a professional manager beats an" can't ship.

import { trimDangling } from "./content-ad-director.ts";

const AI_CHAT = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "openai/gpt-5.6-sol";

export type PosterCopy = {
  kicker: string;
  headline: string;
  ctaLine: string;
  source: "ai" | "fallback" | "override";
  /** true when the source copy had to be shortened to fit the poster */
  truncated: boolean;
};

function clean(s: unknown, cap: number): string {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .trim()
    .slice(0, cap)
    .replace(/[\s,;:\-–—]+$/g, "");
}

/** Cut at the last sentence / clause / word boundary inside `cap`, never mid-thought. */
export function firstClause(s: string, cap: number): string {
  const t = String(s ?? "").replace(/\s+/g, " ").replace(/^["'“”]+|["'“”]+$/g, "").trim();
  if (!t) return "";
  if (t.length <= cap) return trimDangling(t.replace(/[.]+$/, ""));
  const hard = t.slice(0, cap + 1);
  const sentence = Math.max(hard.lastIndexOf(". "), hard.lastIndexOf("? "), hard.lastIndexOf("! "));
  if (sentence >= Math.floor(cap * 0.4)) return trimDangling(hard.slice(0, sentence));
  const clauseStop = Math.max(
    hard.lastIndexOf(" — "),
    hard.lastIndexOf(" – "),
    hard.lastIndexOf(", "),
    hard.lastIndexOf(": "),
    hard.lastIndexOf("; "),
  );
  const base = clauseStop > cap * 0.45 ? hard.slice(0, clauseStop) : hard.slice(0, hard.lastIndexOf(" "));
  return trimDangling(base);
}

/** Headline is unusable if it's empty, over budget, or ends on a function word. */
export function headlineIssue(h: string, cap: number): string | null {
  const t = (h || "").trim();
  if (!t) return "empty";
  if (t.length > cap) return "too_long";
  if (/[,;:\-–—]$/.test(t)) return "dangling_punctuation";
  if (trimDangling(t) !== t.replace(/[\s.!?]+$/g, "")) return "dangling_word";
  return null;
}

/** Shorten an existing headline by one clause / a few words — used by the QA retry. */
export function shortenHeadline(h: string, cap: number): string {
  const t = (h || "").trim();
  if (!t) return t;
  const target = Math.max(24, Math.min(cap, Math.floor(t.length * 0.75)));
  const cut = firstClause(t, target);
  return cut || firstClause(t, Math.max(24, Math.floor(t.length * 0.6)));
}

export function fallbackPosterCopy(post: {
  hook?: string | null;
  body?: string | null;
  cta?: string | null;
  pillar?: string | null;
}, cap = 60): PosterCopy {
  const source = String(post.hook || post.body || "").trim();
  const headline = firstClause(source, cap);
  return {
    kicker: clean(post.pillar || "", 26).toUpperCase(),
    headline,
    ctaLine: clean(post.cta || "", 42),
    source: "fallback",
    truncated: !!source && headline.length < source.replace(/\s+/g, " ").trim().length,
  };
}

export async function buildPosterCopy(args: {
  apiKey: string;
  brandName?: string | null;
  valueProp?: string | null;
  headlineCap?: number;
  post: { hook?: string | null; body?: string | null; cta?: string | null; pillar?: string | null; platform?: string | null };
  headlineOverride?: { mode: "auto" | "custom" | "none"; text?: string } | null;
}): Promise<PosterCopy> {
  const { post, headlineOverride } = args;
  const cap = Math.max(28, Math.min(90, args.headlineCap ?? 60));
  if (headlineOverride?.mode === "none") {
    return { kicker: "", headline: "", ctaLine: "", source: "override", truncated: false };
  }

  const fb = fallbackPosterCopy(post, cap);

  let ai: Partial<PosterCopy> = {};
  if (args.apiKey) {
    const sys = `You are an award-winning editorial poster copywriter. Distill a social post into a magazine-cover lockup.
Return STRICT JSON: { "kicker": string, "headline": string, "ctaLine": string }
Rules:
- kicker: 1-4 words, uppercase-friendly eyebrow naming the theme or audience. No punctuation.
- headline: a COMPLETE, grammatical, arresting display line that stands on its own. MAX ${cap} characters — write short, do not truncate. It must never end on an article, preposition, conjunction or auxiliary verb ("an", "the", "of", "and", "is"...). No ellipsis, no trailing punctuation, no quotes, no emoji, no hashtags.
- Avoid unbroken words longer than 18 characters; rephrase instead.
- ctaLine: one short imperative line, MAX 42 characters. No URLs unless present in the source CTA.
- Plain sentence case for the headline; never shout.
No prose outside the JSON.`;
    const user = `Brand: ${args.brandName ?? "(unnamed)"}
Value proposition: ${args.valueProp ?? ""}
Pillar: ${post.pillar ?? ""}
Platform: ${post.platform ?? ""}
Hook: ${post.hook ?? ""}
Body: ${String(post.body ?? "").slice(0, 500)}
CTA: ${post.cta ?? ""}`;

    const ask = async (extra?: string): Promise<Partial<PosterCopy>> => {
      const messages: any[] = [
        { role: "system", content: sys },
        { role: "user", content: extra ? `${user}\n\nREWRITE NOTE: ${extra}` : user },
      ];
      const res = await fetch(AI_CHAT, {
        method: "POST",
        headers: { Authorization: `Bearer ${args.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, messages, response_format: { type: "json_object" } }),
      });
      if (!res.ok) {
        console.warn("poster copy gateway error", res.status, await res.text());
        return {};
      }
      const data = await res.json();
      const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
      return {
        kicker: clean(parsed.kicker, 26).toUpperCase(),
        headline: String(parsed.headline ?? "").replace(/\s+/g, " ").trim(),
        ctaLine: clean(parsed.ctaLine, 42),
      };
    };

    try {
      ai = await ask();
      const issue = headlineIssue(ai.headline ?? "", cap);
      if (issue) {
        // One rewrite attempt rather than silently slicing the sentence.
        const retry = await ask(
          `Your previous headline was rejected (${issue}): "${ai.headline ?? ""}". Return a complete sentence under ${cap} characters that ends on a strong noun or verb.`,
        );
        if (retry.headline && !headlineIssue(retry.headline, cap)) ai = { ...ai, ...retry };
      }
    } catch (e) {
      console.warn("poster copy failed", e);
    }
  }

  const aiHeadlineOk = !!ai.headline && !headlineIssue(ai.headline, cap);
  const rawOverride = headlineOverride?.mode === "custom" ? (headlineOverride.text ?? "").trim() : "";

  let headline: string;
  let truncated = false;
  if (rawOverride) {
    headline = firstClause(rawOverride, cap);
    truncated = headline.length < rawOverride.replace(/\s+/g, " ").length;
  } else if (aiHeadlineOk) {
    headline = ai.headline!;
  } else if (ai.headline) {
    headline = firstClause(ai.headline, cap);
    truncated = headline.length < ai.headline.length;
  } else {
    headline = fb.headline;
    truncated = fb.truncated;
  }

  return {
    kicker: ai.kicker || fb.kicker,
    headline,
    ctaLine: ai.ctaLine || fb.ctaLine,
    source: ai.headline && !rawOverride ? "ai" : (rawOverride ? "override" : "fallback"),
    truncated,
  };
}

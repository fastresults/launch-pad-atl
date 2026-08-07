// Poster copy pass — distills a calendar post (long hook + body + CTA) into the
// three-part editorial lockup used by the poster compositor:
//   kicker    — short letterspaced eyebrow (2–4 words)
//   headline  — display line, <= 60 chars, no trailing punctuation
//   ctaLine   — one short action line, <= 42 chars
// Falls back to a deterministic local distillation when AI is unavailable.

const AI_CHAT = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "openai/gpt-5.6-sol";

export type PosterCopy = {
  kicker: string;
  headline: string;
  ctaLine: string;
  source: "ai" | "fallback" | "override";
};

function clean(s: unknown, cap: number): string {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .trim()
    .slice(0, cap)
    .replace(/[\s,;:\-–—]+$/g, "");
}

function firstClause(s: string, cap: number): string {
  const t = clean(s, 400);
  if (!t) return "";
  if (t.length <= cap) return t.replace(/[.]+$/, "");
  const hard = t.slice(0, cap + 1);
  const stop = Math.max(hard.lastIndexOf(". "), hard.lastIndexOf(" — "), hard.lastIndexOf(", "), hard.lastIndexOf(": "));
  const base = stop > cap * 0.45 ? hard.slice(0, stop) : hard.slice(0, hard.lastIndexOf(" "));
  return base.replace(/[\s,;:.\-–—]+$/g, "");
}

export function fallbackPosterCopy(post: {
  hook?: string | null;
  body?: string | null;
  cta?: string | null;
  pillar?: string | null;
}): PosterCopy {
  return {
    kicker: clean(post.pillar || "", 26).toUpperCase(),
    headline: firstClause(post.hook || post.body || "", 60),
    ctaLine: clean(post.cta || "", 42),
    source: "fallback",
  };
}

export async function buildPosterCopy(args: {
  apiKey: string;
  brandName?: string | null;
  valueProp?: string | null;
  post: { hook?: string | null; body?: string | null; cta?: string | null; pillar?: string | null; platform?: string | null };
  headlineOverride?: { mode: "auto" | "custom" | "none"; text?: string } | null;
}): Promise<PosterCopy> {
  const { post, headlineOverride } = args;
  if (headlineOverride?.mode === "none") {
    return { kicker: "", headline: "", ctaLine: "", source: "override" };
  }

  const fb = fallbackPosterCopy(post);

  let ai: Partial<PosterCopy> = {};
  if (args.apiKey) {
    try {
      const sys = `You are an award-winning editorial poster copywriter. Distill a social post into a magazine-cover lockup.
Return STRICT JSON: { "kicker": string, "headline": string, "ctaLine": string }
Rules:
- kicker: 1-4 words, uppercase-friendly eyebrow naming the theme or audience. No punctuation.
- headline: a complete, arresting display line. MAX 60 characters. No ellipsis, no trailing punctuation, no quotes, no emoji, no hashtags.
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

      const res = await fetch(AI_CHAT, {
        method: "POST",
        headers: { Authorization: `Bearer ${args.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "system", content: sys }, { role: "user", content: user }],
          response_format: { type: "json_object" },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data?.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(raw);
        ai = {
          kicker: clean(parsed.kicker, 26).toUpperCase(),
          headline: clean(parsed.headline, 60),
          ctaLine: clean(parsed.ctaLine, 42),
        };
      } else {
        console.warn("poster copy gateway error", res.status, await res.text());
      }
    } catch (e) {
      console.warn("poster copy failed", e);
    }
  }

  const headline = headlineOverride?.mode === "custom" && headlineOverride.text?.trim()
    ? firstClause(headlineOverride.text, 90)
    : (ai.headline || fb.headline);

  return {
    kicker: ai.kicker || fb.kicker,
    headline,
    ctaLine: ai.ctaLine || fb.ctaLine,
    source: ai.headline ? "ai" : (headlineOverride?.mode === "custom" ? "override" : "fallback"),
  };
}

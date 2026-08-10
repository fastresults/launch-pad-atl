// Poster copy pass — writes the three-part editorial lockup used by the poster
// compositor from a calendar post:
//   kicker    — short letterspaced eyebrow (topic / audience)
//   headline  — a WRITTEN display line, 4–9 words, that lands one clear message
//   ctaLine   — one short action line
//
// Hard rule: the post's hook is source material, never the headline. A hook is
// an article sentence; slicing it yields "Dealing with Dementia: Tips for local
// families navigating" — a topic with its ending lopped off. The copywriter
// writes a line instead, and a validator rejects article-title phrasing.

import { trimDangling } from "./content-ad-director.ts";

const AI_CHAT = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "openai/gpt-5.6-sol";

export type HeadlineSource = "written" | "founder" | "fallback" | "none";

export type PosterCopy = {
  kicker: string;
  headline: string;
  ctaLine: string;
  source: HeadlineSource;
  /** why the written headline was rejected, when we had to fall back */
  headlineIssue?: string | null;
  /** the model's one-line rationale for the chosen line (logged, not rendered) */
  rationale?: string | null;
  /** true when source copy had to be shortened rather than written */
  truncated: boolean;
  /** set when the line still echoes a claim an earlier week already spent */
  repeatsClaim?: string | null;
  /** which of the week's three arguments this ad ran (claim / proof / edge) */
  approach?: string | null;
  /** true when the line carries a concrete particular (number, timeframe, named thing) */
  specific?: boolean;
  /** set when the line leans on advertising boilerplate ("proven results") */
  vagueness?: string | null;

};

const STOP = new Set([
  "the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "with", "your", "you", "our",
  "that", "this", "it", "is", "are", "be", "make", "makes", "into", "every", "more", "than",
]);

/** Content-word overlap: catches "polished ads drain margin" vs "trade polished ads for trust". */
export function usedClaimEcho(headline: string, claims: string[]): { claim: string; index: number } | null {
  const words = (s: string) =>
    new Set(
      s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
        .filter((w) => w.length > 2 && !STOP.has(w)),
    );
  const h = words(headline);
  if (h.size < 2) return null;
  for (let i = 0; i < claims.length; i++) {
    const c = words(claims[i]);
    if (c.size < 2) continue;
    let hit = 0;
    for (const w of h) if (c.has(w)) hit++;
    if (hit / Math.min(h.size, c.size) >= 0.6) return { claim: claims[i], index: i };
  }
  return null;
}


const MAX_WORDS = 9;
const MIN_WORDS = 3;

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

// Phrasings that mean "this is an article, not a headline".
const ARTICLE_TITLE_PATTERNS: { re: RegExp; why: string }[] = [
  { re: /^(tips|ideas|ways|reasons|things|steps|lessons|questions|mistakes)\b/i, why: "listicle opener" },
  { re: /\b(tips|guide|checklist|overview|introduction|breakdown|roundup)\s+(for|to|on|about)\b/i, why: "guide phrasing" },
  { re: /^(why|how|what|when|where|who)\b.*\b(matters|works|is important|you should)\b/i, why: "explainer phrasing" },
  { re: /\b(everything you need to know|a closer look|deep dive|101)\b/i, why: "article cliché" },
  { re: /\b(navigating|exploring|understanding|discussing|considering)\b/i, why: "gerund topic phrasing" },
];

const VERBS_OK = /\b(is|are|isn't|aren't|was|were|get|gets|got|make|makes|made|take|takes|keep|keeps|turn|turns|build|builds|built|start|starts|stop|stops|find|finds|know|knows|need|needs|want|wants|beat|beats|win|wins|cost|costs|save|saves|pay|pays|run|runs|call|calls|ask|asks|leave|leaves|stay|stays|come|comes|go|goes|can|can't|won't|don't|doesn't|should|shouldn't|will|deserve|deserves|belong|belongs|feel|feels|look|looks|works?|help|helps|hire|hires|choose|chooses|change|changes|fix|fixes|carry|carries|hold|holds|show|shows|matter|matters|drain|drains|drained|validate|validates|prove|proves|proved|test|tests|ship|ships|shipped|launch|launches|scale|scales|spend|spends|waste|wastes|burn|burns|buy|buys|sell|sells|close|closes|convert|converts|earn|earns|grow|grows|lose|loses|lost|kill|kills|skip|skips|book|books|fund|funds|price|prices|charge|charges|track|tracks|measure|measures|cut|cuts|raise|raises|fill|fills|open|opens|answer|answers|reply|replies|follow|follows|teach|teaches|learn|learns|trust|trusts|believe|believes|decide|decides|delay|delays|risk|risks|owe|owes|beats|outsell|outsells|outperform|outperforms|let|lets|watch|watches|write|writes|read|reads|send|sends|post|posts|share|shares|use|uses|swap|swaps|replace|replaces|double|doubles|halve|halves|protect|protects|defend|defends|earned|paid|built|drove|drive|drives|move|moves|shrink|shrinks|stretch|stretches|add|adds|remove|removes)\b/i;

/** Reject anything that isn't a written headline. Returns a reason, or null. */
/** Split issues into hard (never ship) and soft (a style flag only). */
export function headlineIssueDetail(h: string, cap: number, kicker = ""): { issue: string | null; soft: boolean } {
  const issue = headlineIssue(h, cap, kicker);
  if (!issue) return { issue: null, soft: false };
  // The verb lexicon can't know every claim verb. A line that clears every
  // other gate is a written headline, not a fallback — flag it, ship it.
  const soft = issue === "names a topic instead of making a claim" || issue === "reads as a topic with a subtitle";
  return { issue, soft };
}

export function headlineIssue(h: string, cap: number, kicker = ""): string | null {
  const t = (h || "").trim();
  if (!t) return "empty";
  if (t.length > cap) return `over ${cap} characters`;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length > MAX_WORDS) return `over ${MAX_WORDS} words`;
  if (words.length < MIN_WORDS) return "too short to carry a message";
  if (/[,;:\-–—]$/.test(t)) return "ends on punctuation";
  if (/\.{2,}|…/.test(t)) return "contains an ellipsis";
  if (/#\w/.test(t)) return "contains a hashtag";
  if (trimDangling(t) !== t.replace(/[\s.!?]+$/g, "")) return "ends on a function word";
  for (const p of ARTICLE_TITLE_PATTERNS) if (p.re.test(t)) return p.why;
  // "Topic: subtitle" is only allowed when both halves are complete thoughts.
  const colon = t.indexOf(":");
  if (colon > 0) {
    const [a, b] = [t.slice(0, colon), t.slice(colon + 1)];
    if (!VERBS_OK.test(a) || !VERBS_OK.test(b)) return "reads as a topic with a subtitle";
  } else if (!VERBS_OK.test(t)) {
    return "names a topic instead of making a claim";
  }
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, "").trim();
  if (kicker && norm(t).startsWith(norm(kicker)) && norm(kicker).length > 6) return "repeats the kicker";
  return null;
}

// ---------------------------------------------------------------------------
// Ogilvy's test: "The headline that promises a benefit, in specific terms,
// outsells the clever one." These two checks enforce specificity.
// ---------------------------------------------------------------------------

/** Category boilerplate — words that could sit on any competitor's poster. */
const VAGUE_PHRASES: { re: RegExp; why: string }[] = [
  { re: /\b(proven|real|authentic|powerful|seamless|effortless|game[- ]chang\w+|next[- ]level|world[- ]class|cutting[- ]edge|innovative|unlock\w*|elevate\w*|transform\w*|revolutioniz\w*|supercharg\w*|leverage\w*)\b/i, why: "advertising adjective" },
  { re: /\b(results|solutions|strategies|insights|success|growth|impact|value|potential|performance)\b\s*$/i, why: "abstract noun ending" },
  { re: /\bthat (work|works|matter|matters|convert|converts|scale|scales)\b/i, why: "empty qualifier" },
  { re: /\b(more|better|faster|smarter|bigger)\b(?!\s+than\s+\S)/i, why: "comparative with nothing to compare to" },
];

/** A concrete particular: a number, a unit of time, money, or a named thing. */
export function hasParticular(h: string): boolean {
  const t = h || "";
  if (/\d/.test(t)) return true;
  if (/\$|%|£|€/.test(t)) return true;
  if (/\b(one|two|three|four|five|six|seven|eight|nine|ten|twelve|dozen|half|double|triple)\b/i.test(t)) return true;
  if (/\b(day|days|week|weeks|month|months|hour|hours|minute|minutes|year|years|monday|friday|weekend|tonight|today|overnight)\b/i.test(t)) return true;
  // A proper noun that isn't the first word reads as a named, checkable thing.
  if (/\s[A-Z][a-z]{2,}/.test(t)) return true;
  return false;
}

/** Returns the reason a headline reads generic, or null. */
export function specificityIssue(h: string): string | null {
  const t = (h || "").trim();
  if (!t) return null;
  for (const p of VAGUE_PHRASES) if (p.re.test(t)) return p.why;
  return null;
}


/** Shorten an existing headline by a clause — the compositor's last-resort refit. */
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
}, cap = 52): PosterCopy {
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
  /** Other hooks in the same week — the line must not repeat their claim. */
  siblingHooks?: string[];
  /** Campaign kicker vocabulary so eyebrows stay consistent across the set. */
  kickerTaxonomy?: string[];
  /** Funnel stage this week occupies, from the campaign arc. */
  stage?: { label: string; job: string; audience?: string; temperature?: string } | null;
  /** The single claim this week owns. Nothing else may be argued. */
  assignedAngle?: string | null;
  /** Claims spent by earlier weeks — hard negative context. */
  usedClaims?: string[];
  /** The week's proof: the concrete particular this flight is allowed to print. */
  proof?: string | null;
  /** Which of the week's three arguments this ad runs, plus its brief. */
  approach?: { name: string; brief: string } | null;
  /** Headlines already written for this week — never paraphrase them. */
  siblingHeadlines?: string[];
  /** How hard this week is allowed to ask, plus the brief for that rung. */
  ctaRung?: { rung: string; brief: string; offer?: string | null } | null;
  post: { hook?: string | null; body?: string | null; cta?: string | null; pillar?: string | null; platform?: string | null };
  headlineOverride?: { mode: "auto" | "custom" | "none"; text?: string } | null;


}): Promise<PosterCopy> {

  const { post, headlineOverride } = args;
  const cap = Math.max(28, Math.min(72, args.headlineCap ?? 52));

  if (headlineOverride?.mode === "none") {
    return { kicker: "", headline: "", ctaLine: "", source: "none", truncated: false };
  }

  const fb = fallbackPosterCopy(post, cap);

  // Founder typed a headline: use it verbatim, length-guarded only.
  const typed = headlineOverride?.mode === "custom" ? (headlineOverride.text ?? "").trim() : "";
  if (typed) {
    const headline = firstClause(typed, cap);
    return {
      kicker: fb.kicker,
      headline,
      ctaLine: fb.ctaLine,
      source: "founder",
      truncated: headline.length < typed.replace(/\s+/g, " ").length,
    };
  }

  let ai: { kicker?: string; headline?: string; ctaLine?: string; rationale?: string } = {};
  let issue: string | null = "no ai key";
  let soft = false;
  let repeats: string | null = null;


  if (args.apiKey) {
    const sys = `You are an award-winning advertising copywriter writing the headline on a printed poster. The post below is your SOURCE MATERIAL, not your headline — never quote or truncate it.

Return STRICT JSON:
{ "kicker": string, "headline": string, "ctaLine": string, "rationale": string }

Write three candidate headlines in your head, pick the strongest, and return only that one.

headline — this is the whole job:
- ${MIN_WORDS}-${MAX_WORDS} words, MAX ${cap} characters. Short is the point.
- It must LAND ONE MESSAGE: a promise, a tension, a claim, or a consequence the reader feels. A reader who sees only this line should know what is being offered or argued.
- It must contain a verb. Never a bare topic or noun phrase.
- BANNED: article-title phrasing — "Tips for…", "Why X matters", "How to…", "Everything you need to know", "Navigating/Understanding/Exploring X", listicles, and "Topic: subtitle" constructions unless both halves are complete sentences.
- No ellipsis, no trailing punctuation, no quotes, no emoji, no hashtags, no unbroken word over 18 characters.
- Sentence case. Never shout. Do not repeat the kicker's words.
- SPECIFIC, not general. Ogilvy's rule: the specific promise outsells the clever line. Where the brief gives you a number, a timeframe, a named thing or a real result, PRINT IT. A headline that could be lifted onto a competitor's poster without changing a word has failed.
- BANNED vocabulary: proven, real, authentic, powerful, seamless, effortless, game-changing, next-level, world-class, innovative, unlock, elevate, transform, supercharge, leverage — and bare abstractions as the payoff word ("…that drives results", "…for real growth", "…with real impact").

kicker — 1-4 words naming the AUDIENCE or the moment they are in, so the headline never has to.
ctaLine — obey the CTA rung given below exactly. It sets how hard this ad is allowed to ask; an early-funnel ad that asks for a booking is wrong, and so is a late-funnel ad that only says "see how it works". MAX 42 characters, starts with a verb, no URL unless the source CTA has one. If the rung is "none", return an empty string.
rationale — one sentence on why this line lands.


No prose outside the JSON.`;
    const siblings = (args.siblingHooks ?? []).filter(Boolean).slice(0, 6);
    const taxonomy = (args.kickerTaxonomy ?? []).filter(Boolean).slice(0, 6);
    const used = (args.usedClaims ?? []).filter(Boolean).slice(0, 10);
    const written = (args.siblingHeadlines ?? []).filter(Boolean).slice(0, 6);

    const stage = args.stage ?? null;
    const rung = args.ctaRung ?? null;
    const user = `Brand: ${args.brandName ?? "(unnamed)"}
Value proposition: ${args.valueProp ?? ""}
Pillar: ${post.pillar ?? ""}
Platform: ${post.platform ?? ""}
Source hook: ${post.hook ?? ""}
Source body: ${String(post.body ?? "").slice(0, 600)}
Source CTA: ${post.cta ?? ""}${
      stage
        ? `\n\nCAMPAIGN POSITION — this ad runs at the "${stage.label}" stage of a sequential funnel.
- Job of this week: ${stage.job}
- Audience (${stage.temperature ?? "warm"}): ${stage.audience || "the buyer described above"}`
        : ""
    }${
      args.assignedAngle
        ? `\n- The ONE claim this week owns — argue this and nothing else: ${args.assignedAngle}`
        : ""
    }${
      args.proof
        ? `\n- The week's PROOF — the concrete particular you are allowed to print: ${args.proof}`
        : ""
    }${
      args.approach
        ? `\n- This ad's angle on that claim is "${args.approach.name}": ${args.approach.brief} The other ads this week take the other angles, so do not write theirs.`
        : ""
    }${
      rung
        ? `\n- CTA rung "${rung.rung}": ${rung.brief}${rung.offer ? `\n- The offer, when you are allowed to name it: ${rung.offer}` : ""}`
        : ""
    }${
      used.length
        ? `\n\nALREADY SPENT by earlier weeks of this campaign. Repeating any of these — in any wording — is a failure:\n- ${used.join("\n- ")}`
        : ""
    }${
      taxonomy.length ? `\n\nCampaign kicker vocabulary (pick the closest fit, or a close variant): ${taxonomy.join(" | ")}` : ""
    }${
      written.length
        ? `\n\nHeadlines ALREADY WRITTEN for this same week — yours must not paraphrase any of them:\n- ${written.join("\n- ")}`
        : ""
    }${
      siblings.length
        ? `\n\nOther posts running the same week — make a DIFFERENT argument from all of these:\n- ${siblings.join("\n- ")}`
        : ""
    }`;




    const ask = async (note?: string) => {
      const res = await fetch(AI_CHAT, {
        method: "POST",
        headers: { Authorization: `Bearer ${args.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: note ? `${user}\n\nREWRITE NOTE: ${note}` : user },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) {
        console.warn("poster copy gateway error", res.status, await res.text());
        return {};
      }
      const data = await res.json();
      const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
      return {
        kicker: clean(parsed.kicker, 26).toUpperCase(),
        headline: String(parsed.headline ?? "").replace(/\s+/g, " ").replace(/^["'“”]+|["'“”]+$/g, "").trim(),
        ctaLine: clean(parsed.ctaLine, 42),
        rationale: clean(parsed.rationale, 160),
      };
    };

    try {
      ai = await ask();
      let detail = headlineIssueDetail(ai.headline ?? "", cap, ai.kicker ?? "");
      issue = detail.issue;
      soft = detail.soft;
      if (issue && !soft) {
        const retry = await ask(
          `Your headline "${ai.headline ?? ""}" was rejected: ${issue}. Write a different line — ${MIN_WORDS}-${MAX_WORDS} words, under ${cap} characters, with a verb, that makes a claim a reader can act on. Do not restate the source hook.`,
        );
        const retryDetail = headlineIssueDetail(retry.headline ?? "", cap, retry.kicker ?? ai.kicker ?? "");
        if (retry.headline && !retryDetail.issue) {
          ai = { ...ai, ...retry }; issue = null; soft = false;
        } else if (retry.headline && retryDetail.soft) {
          // The second attempt only tripped the soft gate — better than a hard reject.
          ai = { ...ai, ...retry }; issue = retryDetail.issue; soft = true;
        } else {
          console.warn("[poster-copy] headline rejected twice", { first: ai.headline, second: retry.headline, issue, retryIssue: retryDetail.issue });
        }
      }
      // Cross-week repetition: a line that restates a claim an earlier week
      // already spent teaches a returning viewer nothing.
      const echoed = usedClaimEcho(ai.headline ?? "", used);
      if (echoed) {
        const retry = await ask(
          `Your headline restates a claim week ${echoed.index + 1} of this campaign already made ("${echoed.claim}"). Make a different argument entirely — the one this week owns${args.assignedAngle ? `: ${args.assignedAngle}` : ""}.`,
        );
        const retryDetail = headlineIssueDetail(retry.headline ?? "", cap, retry.kicker ?? ai.kicker ?? "");
        if (retry.headline && !usedClaimEcho(retry.headline, used) && (!retryDetail.issue || retryDetail.soft)) {
          ai = { ...ai, ...retry }; issue = retryDetail.issue; soft = retryDetail.soft;
        } else {
          repeats = echoed.claim;
          console.warn("[poster-copy] headline repeats an earlier week's claim", { headline: ai.headline, claim: echoed.claim });
        }
      }

      // Within-week paraphrase: three ads must argue three ways.
      const twin = usedClaimEcho(ai.headline ?? "", written);
      if (twin) {
        const retry = await ask(
          `Your headline paraphrases another ad already running this week ("${twin.claim}"). Take this ad's assigned angle instead${args.approach ? ` — "${args.approach.name}": ${args.approach.brief}` : ""}.`,
        );
        const retryDetail = headlineIssueDetail(retry.headline ?? "", cap, retry.kicker ?? ai.kicker ?? "");
        if (retry.headline && !usedClaimEcho(retry.headline, written) && !usedClaimEcho(retry.headline, used) && (!retryDetail.issue || retryDetail.soft)) {
          ai = { ...ai, ...retry }; issue = retryDetail.issue; soft = retryDetail.soft;
        } else {
          console.warn("[poster-copy] headline paraphrases a sibling ad", { headline: ai.headline, sibling: twin.claim });
        }
      }

      // Ogilvy's specificity test. A generic line ships only if a rewrite
      // can't beat it — but it is always flagged so the founder can see it.
      vague = specificityIssue(ai.headline ?? "");
      const generic = vague || (args.proof && !hasParticular(ai.headline ?? ""));
      if (generic) {
        const why = vague
          ? `it leans on ${vague}`
          : "it carries no concrete particular — no number, timeframe, or named thing";
        const retry = await ask(
          `Your headline "${ai.headline ?? ""}" is too general: ${why}. Rewrite it around the specific${args.proof ? `: ${args.proof}` : " detail in the source material"}. Print the number or the named thing in the line itself.`,
        );
        const retryDetail = headlineIssueDetail(retry.headline ?? "", cap, retry.kicker ?? ai.kicker ?? "");
        const retryVague = specificityIssue(retry.headline ?? "");
        const better = !!retry.headline
          && (!retryDetail.issue || retryDetail.soft)
          && !retryVague
          && !usedClaimEcho(retry.headline, used)
          && (!args.proof || hasParticular(retry.headline));
        if (better) {
          ai = { ...ai, ...retry }; issue = retryDetail.issue; soft = retryDetail.soft; vague = null;
        } else {
          console.warn("[poster-copy] headline stayed generic", { headline: ai.headline, why });
        }
      }

    } catch (e) {
      console.warn("poster copy failed", e);
      issue = "copy pass failed";
    }
  }

  // A soft flag (verb lexicon miss) still counts as a written headline.
  const wrote = !!ai.headline && (!issue || soft);
  // A "none" rung deliberately ships without an ask.
  const suppressCta = args.ctaRung?.rung === "none";
  return {
    kicker: ai.kicker || fb.kicker,
    headline: wrote ? ai.headline! : (ai.headline ? firstClause(ai.headline, cap) : fb.headline),
    ctaLine: suppressCta ? "" : (ai.ctaLine || fb.ctaLine),
    repeatsClaim: repeats,

    source: wrote ? "written" : "fallback",
    headlineIssue: issue,
    rationale: ai.rationale ?? null,
    truncated: wrote ? false : true,
  };
}

// Per-channel caption rules + deterministic caption assembly.
//
// The calendar post row already holds hook / body / cta / hashtags, so building
// a paste-ready caption needs no model call — this module does it locally and
// instantly. AI is only used to *shorten* a caption that busts a hard limit
// (see the venture-post-caption edge function).

export type HashtagPlacement = "inline" | "first-comment" | "none";

export type CaptionSpec = {
  id: string;
  label: string;
  /** hard character limit enforced by the channel */
  limit: number;
  /** the length we aim for — engagement sweet spot, not a hard cap */
  target: number;
  /** where the channel truncates with "…more"; shown as a marker */
  fold?: number;
  hashtagsMin: number;
  hashtagsMax: number;
  hashtags: HashtagPlacement;
  /** channels with a separate title/headline field */
  titleLimit?: number;
  note?: string;
};

export const CAPTION_SPECS: CaptionSpec[] = [
  {
    id: "instagram", label: "Instagram", limit: 2200, target: 500, fold: 125,
    hashtagsMin: 3, hashtagsMax: 5, hashtags: "first-comment",
    note: "Only the first 125 characters show before “more” — lead with the hook.",
  },
  {
    id: "facebook", label: "Facebook", limit: 63206, target: 400, fold: 250,
    hashtagsMin: 0, hashtagsMax: 2, hashtags: "inline",
    note: "Short beats long here. Put the link CTA in the body.",
  },
  {
    id: "linkedin", label: "LinkedIn", limit: 3000, target: 900, fold: 210,
    hashtagsMin: 2, hashtagsMax: 3, hashtags: "inline",
    note: "First 210 characters show before “see more”.",
  },
  {
    id: "x", label: "X", limit: 280, target: 240,
    hashtagsMin: 1, hashtagsMax: 2, hashtags: "inline",
    note: "Hard 280 limit — anything longer needs a thread.",
  },
  {
    id: "tiktok", label: "TikTok", limit: 2200, target: 300, fold: 100,
    hashtagsMin: 3, hashtagsMax: 5, hashtags: "inline",
    note: "The caption doubles as the on-screen hook.",
  },
  {
    id: "threads", label: "Threads", limit: 500, target: 400,
    hashtagsMin: 1, hashtagsMax: 3, hashtags: "inline",
  },
  {
    id: "youtube", label: "YouTube / Shorts", limit: 5000, target: 800, titleLimit: 100,
    hashtagsMin: 2, hashtagsMax: 3, hashtags: "inline",
    note: "Title is separate and capped at 100 characters.",
  },
  {
    id: "pinterest", label: "Pinterest", limit: 500, target: 300, titleLimit: 100,
    hashtagsMin: 2, hashtagsMax: 4, hashtags: "inline",
  },
];

export function specFor(platform?: string | null): CaptionSpec {
  const p = String(platform ?? "").toLowerCase().replace(/[^a-z]/g, "");
  const hit = CAPTION_SPECS.find((s) => p.includes(s.id) || s.id.includes(p) && p.length > 1);
  if (hit) return hit;
  if (p.includes("twitter")) return CAPTION_SPECS.find((s) => s.id === "x")!;
  if (p.includes("short") || p.includes("reel")) return CAPTION_SPECS.find((s) => s.id === "instagram")!;
  return CAPTION_SPECS[0];
}

export type CaptionPost = {
  id?: string;
  hook?: string | null;
  body?: string | null;
  cta?: string | null;
  hashtags?: string[] | null;
  platform?: string | null;
  pillar?: string | null;
};

export type AssembledCaption = {
  caption: string;
  firstComment: string | null;
  title: string | null;
  hashtags: string[];
  chars: number;
  limit: number;
  target: number;
  fold?: number;
  overBy: number;
};

function tidy(s: unknown): string {
  return String(s ?? "").replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
}

function normalizeTags(tags: string[] | null | undefined, spec: CaptionSpec): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags ?? []) {
    const t = tidy(raw).replace(/^#+/, "").replace(/[^A-Za-z0-9_]/g, "");
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(`#${t}`);
    if (out.length >= spec.hashtagsMax) break;
  }
  return out;
}

/** Trim to `cap` on a sentence, then clause, then word boundary — never mid-word. */
export function trimToLimit(text: string, cap: number): string {
  const t = tidy(text);
  if (t.length <= cap) return t;
  const hard = t.slice(0, cap);
  const sentence = Math.max(hard.lastIndexOf(". "), hard.lastIndexOf("! "), hard.lastIndexOf("? "));
  if (sentence > cap * 0.5) return hard.slice(0, sentence + 1).trim();
  const word = hard.lastIndexOf(" ");
  return (word > cap * 0.5 ? hard.slice(0, word) : hard).replace(/[\s,;:\-–—]+$/g, "").trim();
}

/**
 * Deterministically assemble a paste-ready caption for one channel.
 * Order: hook → body → CTA → hashtags (inline, or split into a first comment).
 */
export function assembleCaption(
  post: CaptionPost,
  spec: CaptionSpec,
  opts?: { overrideCaption?: string | null },
): AssembledCaption {
  const tags = normalizeTags(post.hashtags, spec);
  const inline = spec.hashtags === "inline" ? tags : [];
  const firstComment = spec.hashtags === "first-comment" && tags.length ? tags.join(" ") : null;

  let caption: string;
  if (opts?.overrideCaption) {
    caption = tidy(opts.overrideCaption);
  } else {
    const hook = tidy(post.hook);
    const body = tidy(post.body);
    const cta = tidy(post.cta);
    const blocks: string[] = [];
    if (hook) blocks.push(hook);
    if (body && body !== hook) blocks.push(body);
    if (cta) blocks.push(cta);
    caption = blocks.join("\n\n");

    // Reserve room for inline hashtags before trimming the prose.
    const tagBlock = inline.length ? `\n\n${inline.join(" ")}` : "";
    const room = spec.limit - tagBlock.length;
    if (caption.length > room) caption = trimToLimit(caption, room);
    caption = `${caption}${tagBlock}`;
  }

  const chars = caption.length;
  const title = spec.titleLimit
    ? trimToLimit(tidy(post.hook) || tidy(post.pillar), spec.titleLimit)
    : null;

  return {
    caption,
    firstComment,
    title,
    hashtags: tags,
    chars,
    limit: spec.limit,
    target: spec.target,
    fold: spec.fold,
    overBy: Math.max(0, chars - spec.limit),
  };
}

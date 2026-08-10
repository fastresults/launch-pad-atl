// Flight-level campaign architecture.
//
// The campaign CARD governs how a week LOOKS. This module governs what a week
// ARGUES. Without it every week is an independent pillar rotation: the same
// four claims recycled, every CTA a mid-funnel "see how it works", and no
// progression from a cold viewer to a booked customer.
//
// One arc is derived per flight and cached on venture_content_progress. Each
// week gets a card: funnel stage, audience segment and temperature, the single
// claim that week owns, the proof it leans on, and the CTA rung it is allowed
// to ask for. Claims are assigned to exactly one week, so the copywriter can be
// handed everything earlier weeks already said as negative context.

import { aiFetch } from "./ai-fetch.ts";

const CHAT_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type CtaRung = "none" | "follow" | "learn" | "compare" | "answer" | "book";

export type ArcStage =
  | "disrupt"
  | "reframe"
  | "proof"
  | "differentiate"
  | "objection"
  | "offer"
  | "proof_at_scale"
  | "urgency";

export type ArcWeek = {
  week: number;
  stage: ArcStage;
  /** Human label for the stage, shown in the studio. */
  stage_label: string;
  /** Who this week talks to. */
  audience: string;
  temperature: "cold" | "warm" | "hot";
  /** The job of the week, one sentence. */
  job: string;
  /** The ONE claim this week owns. No other week may make it. */
  claim: string;
  /** What backs the claim up (a number, a story, a demo, a guarantee). */
  proof: string;
  /** How hard this week is allowed to ask. */
  cta_rung: CtaRung;
  /** All-caps eyebrow vocabulary shaped by the audience, not the topic. */
  kicker_taxonomy: string[];
  /** What success looks like for this week. */
  metric: string;
};

export type CampaignArc = {
  weeks: ArcWeek[];
  /** Every distinct angle in the flight, in the order they are spent. */
  angle_ledger: string[];
  /** The thing the flight is ultimately selling. */
  offer: { name: string; terms: string; ask: string };
  derived_at?: string;
  source?: "ai" | "default";
};

export const STAGE_ORDER: { stage: ArcStage; label: string; job: string; rung: CtaRung; temp: "cold" | "warm" | "hot" }[] = [
  { stage: "disrupt", label: "Disrupt", job: "Name the expensive belief the buyer holds", rung: "none", temp: "cold" },
  { stage: "reframe", label: "Reframe", job: "Show the mechanism behind the problem", rung: "follow", temp: "cold" },
  { stage: "proof", label: "Proof", job: "One customer, one number, one story", rung: "learn", temp: "warm" },
  { stage: "differentiate", label: "Differentiate", job: "Why this beats the obvious alternative", rung: "compare", temp: "warm" },
  { stage: "objection", label: "Objection", job: "Kill the top reasons not to buy", rung: "answer", temp: "warm" },
  { stage: "offer", label: "Offer", job: "State the offer plainly, with its terms", rung: "book", temp: "hot" },
  { stage: "proof_at_scale", label: "Proof at scale", job: "Volume of results and risk reversal", rung: "book", temp: "hot" },
  { stage: "urgency", label: "Urgency", job: "Deadline, capacity, the cost of waiting", rung: "book", temp: "hot" },
];

export const CTA_RUNG_BRIEF: Record<CtaRung, string> = {
  none: "Do NOT ask for anything. The ad ends on the claim. Return an empty ctaLine.",
  follow: "Ask only for attention: save, follow, or watch. Never a link, never a booking.",
  learn: "Ask the reader to consume one specific thing (a case study, a teardown, a number).",
  compare: "Ask the reader to compare this against the alternative they are using today.",
  answer: "Answer the objection and invite a reply, DM or question. Low friction, not a purchase.",
  book: "Ask for the conversion outright, naming the offer: book, start, claim the seat, buy.",
};

function tidy(v: unknown, cap = 200): string {
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, cap) : "";
}

function asRung(v: unknown, fallback: CtaRung): CtaRung {
  const s = tidy(v, 20).toLowerCase();
  return (["none", "follow", "learn", "compare", "answer", "book"] as CtaRung[]).includes(s as CtaRung)
    ? (s as CtaRung)
    : fallback;
}

export function isUsableArc(a: any): a is CampaignArc {
  return !!a && Array.isArray(a.weeks) && a.weeks.length > 0 && typeof a.weeks[0]?.stage === "string";
}

/** A stage arc that works without an AI call — the shape is always right. */
export function defaultCampaignArc(weekNumbers: number[]): CampaignArc {
  const weeks = weekNumbers.map((w, i) => {
    const s = STAGE_ORDER[i % STAGE_ORDER.length];
    return {
      week: w,
      stage: s.stage,
      stage_label: s.label,
      audience: "",
      temperature: s.temp,
      job: s.job,
      claim: "",
      proof: "",
      cta_rung: s.rung,
      kicker_taxonomy: [],
      metric: "",
    } as ArcWeek;
  });
  return {
    weeks,
    angle_ledger: [],
    offer: { name: "", terms: "", ask: "" },
    derived_at: new Date().toISOString(),
    source: "default",
  };
}

function normalize(raw: any, weekNumbers: number[]): CampaignArc {
  const base = defaultCampaignArc(weekNumbers);
  const byWeek = new Map<number, any>();
  for (const w of Array.isArray(raw?.weeks) ? raw.weeks : []) {
    const n = Number(w?.week);
    if (Number.isFinite(n)) byWeek.set(n, w);
  }
  const weeks = base.weeks.map((fallback) => {
    const w = byWeek.get(fallback.week);
    if (!w) return fallback;
    // The stage is assigned POSITIONALLY (see defaultCampaignArc). The model
    // used to choose it and would happily return three "urgency" weeks in a
    // row, which is nagging, not a funnel. We keep its audience/claim/proof.
    const stage = STAGE_ORDER.find((s) => s.stage === fallback.stage) ?? null;
    return {
      week: fallback.week,
      stage: fallback.stage,
      stage_label: fallback.stage_label,
      audience: tidy(w.audience, 90),
      temperature: (stage?.temp ?? fallback.temperature) as ArcWeek["temperature"],

      job: tidy(w.job, 200) || fallback.job,
      claim: tidy(w.claim, 200),
      proof: tidy(w.proof, 200),
      cta_rung: asRung(w.cta_rung, stage?.rung ?? fallback.cta_rung),
      kicker_taxonomy: (Array.isArray(w.kicker_taxonomy) ? w.kicker_taxonomy : [])
        .map((k: any) => tidy(k, 26).toUpperCase())
        .filter(Boolean)
        .slice(0, 6),
      metric: tidy(w.metric, 120),
    } as ArcWeek;
  });
  return {
    weeks,
    angle_ledger: (Array.isArray(raw?.angle_ledger) ? raw.angle_ledger : [])
      .map((a: any) => tidy(a, 160))
      .filter(Boolean)
      .slice(0, 24),
    offer: {
      name: tidy(raw?.offer?.name, 90),
      terms: tidy(raw?.offer?.terms, 200),
      ask: tidy(raw?.offer?.ask, 90),
    },
    derived_at: new Date().toISOString(),
    source: "ai",
  };
}

/** Derive the arc for the whole flight from the venture and its calendar. */
export async function deriveCampaignArc(args: {
  weekNumbers: number[];
  posts: { week?: number | null; pillar?: string | null; format?: string | null; platform?: string | null; hook?: string | null }[];
  businessLine?: string | null;
  brandName?: string | null;
  valueProp?: string | null;
  customer?: string | null;
}): Promise<CampaignArc | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;
  const weeks = args.weekNumbers.slice(0, 12);
  if (!weeks.length) return null;

  const stageMenu = STAGE_ORDER.map((s) => `${s.stage} (${s.label}) — ${s.job}; asks: ${s.rung}`).join("\n");

  const sys = `You are a direct-response campaign strategist. You are given a flight of paid social weeks that currently rotates the same content pillars over and over. Rebuild it as a sequential funnel that moves one viewer from never having heard of the brand to buying.

Return JSON only:
{
  "offer": { "name": string, "terms": string, "ask": string },
  "angle_ledger": [ "<distinct angle>", ... ],
  "weeks": [ { "week": number, "stage": string, "audience": string, "temperature": "cold"|"warm"|"hot", "job": string, "claim": string, "proof": string, "cta_rung": "none"|"follow"|"learn"|"compare"|"answer"|"book", "kicker_taxonomy": ["SHORT LABEL"], "metric": string } ]
}

Stages, in order (use them in this order across the flight, one per week):
${stageMenu}

Hard rules:
- One week, one claim. No two weeks may argue the same thing, use the same number, or restate each other in new words.
- angle_ledger lists every claim, in the order the weeks spend them. Exactly one per week.
- The CTA rung must escalate: early weeks ask for nothing, only the last third asks for the sale.
- audience must name a real segment of buyer that shifts as the flight warms (e.g. "operators still hand-making every ad"), not "founders".
- kicker_taxonomy labels the AUDIENCE or their moment, 1-3 words, all caps, never a topic noun like "STRATEGY" or "SYSTEM".
- claim must be a sentence a person could disagree with, not a topic.
- Ground the offer in the venture's actual business. If no price or term is known, say what the ask is without inventing numbers.`;

  const byWeek = new Map<number, string[]>();
  for (const p of args.posts) {
    const w = Number(p.week);
    if (!Number.isFinite(w)) continue;
    const line = `[${tidy(p.pillar, 40) || "post"} / ${tidy(p.platform, 24) || "?"}] ${tidy(p.hook, 140)}`;
    byWeek.set(w, [...(byWeek.get(w) ?? []), line]);
  }
  const user = [
    args.brandName ? `Brand: ${args.brandName}` : "",
    args.businessLine ? `Line of work: ${args.businessLine}` : "",
    args.valueProp ? `Value proposition: ${tidy(args.valueProp, 600)}` : "",
    args.customer ? `Customer: ${tidy(args.customer, 400)}` : "",
    `Weeks to architect: ${weeks.join(", ")}`,
    "Current calendar (repetitive — use only as raw material):",
    ...weeks.map((w) => `Week ${w}:\n  ${(byWeek.get(w) ?? ["(no posts yet)"]).slice(0, 4).join("\n  ")}`),
  ].filter(Boolean).join("\n");

  try {
    const res = await aiFetch(CHAT_URL, {
      method: "POST",
      headers: { "Lovable-API-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "medium",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        response_format: { type: "json_object" },
      }),
    }, { timeoutMs: 120_000, retries: 1 });
    if (!res.ok) {
      console.warn("[campaign-arc] gateway", res.status);
      return null;
    }
    const json = await res.json();
    const parsed = JSON.parse(json?.choices?.[0]?.message?.content ?? "");
    return normalize(parsed, weeks);
  } catch (e) {
    console.warn("[campaign-arc] derive failed", e);
    return null;
  }
}

/**
 * Load the cached arc, deriving + persisting on first use. Never throws — a
 * null result means the ad falls back to week-local direction.
 */
export async function ensureCampaignArc(
  admin: any,
  snapshotId: string,
  weekNumbers: number[],
  build: () => Promise<CampaignArc | null>,
  opts: { force?: boolean } = {},
): Promise<CampaignArc | null> {
  if (!snapshotId) return null;
  try {
    const { data } = await admin
      .from("venture_content_progress")
      .select("campaign_arc")
      .eq("snapshot_id", snapshotId)
      .maybeSingle();
    const cached = data?.campaign_arc;
    if (!opts.force && isUsableArc(cached)) {
      const known = new Set((cached as CampaignArc).weeks.map((w) => w.week));
      if (weekNumbers.every((w) => known.has(w))) return cached as CampaignArc;
    }
  } catch (e) {
    console.warn("[campaign-arc] cache read failed", e);
  }

  const arc = (await build()) ?? defaultCampaignArc(weekNumbers);
  try {
    await admin
      .from("venture_content_progress")
      .update({ campaign_arc: arc })
      .eq("snapshot_id", snapshotId);
  } catch (e) {
    console.warn("[campaign-arc] cache write failed", e);
  }
  return arc;
}

export function weekCard(arc: CampaignArc | null, week: number): ArcWeek | null {
  if (!arc) return null;
  return arc.weeks.find((w) => w.week === week) ?? null;
}

/** Everything earlier weeks already claimed — negative context for the copywriter. */
export function claimsBefore(arc: CampaignArc | null, week: number): string[] {
  if (!arc) return [];
  return arc.weeks
    .filter((w) => w.week < week && w.claim)
    .map((w) => w.claim)
    .slice(-10);
}

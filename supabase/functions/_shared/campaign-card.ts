// Week-level campaign art direction.
//
// Each ad used to be generated blind to the other posts in its week, so a set
// of seven could arrive with seven different colour grades, three type scales
// and no shared identity. This module derives ONE campaign card per week —
// grade, light, lens, type scale, layout rotation, kicker taxonomy — which
// every ad in that week is generated against. Scenes still vary; the look
// does not.

import { aiFetch } from "./ai-fetch.ts";

const CHAT_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type CampaignCard = {
  /** Colour grade every frame in the week shares. */
  grade: string;
  /** Time of day / light quality. */
  time_of_day: string;
  /** Lens family, so depth and compression match across the set. */
  lens: string;
  /** Display type scale multiplier, 0.9-1.1. */
  type_scale: number;
  /** Type-band share of canvas height, 0.30-0.46. */
  band_ratio: number;
  /** Poster layouts to rotate through, in order. */
  layout_rotation: string[];
  /** Short all-caps kicker labels the week draws from. */
  kicker_taxonomy: string[];
  /** One-line statement of what the week is arguing. */
  through_line: string;
  week?: number;
  derived_at?: string;
};

const LAYOUTS = ["bottom-scrim", "centered-plate", "edge-rule"];

function tidy(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function clamp(n: unknown, lo: number, hi: number, fallback: number): number {
  const v = typeof n === "number" && Number.isFinite(n) ? n : fallback;
  return Math.min(hi, Math.max(lo, v));
}

export function isUsableCard(c: any): c is CampaignCard {
  return !!c && typeof c.grade === "string" && c.grade.length > 3 && Array.isArray(c.layout_rotation);
}

export function defaultCampaignCard(week: number): CampaignCard {
  return {
    grade: "warm neutral grade, muted mid-tones, gentle film contrast",
    time_of_day: "late-afternoon window light",
    lens: "35mm prime at f/2",
    type_scale: 1,
    band_ratio: 0.38,
    layout_rotation: ["bottom-scrim", "bottom-scrim", "edge-rule", "bottom-scrim", "centered-plate"],
    kicker_taxonomy: [],
    through_line: "",
    week,
    derived_at: new Date().toISOString(),
  };
}

function normalize(raw: any, week: number): CampaignCard {
  const rotation = (Array.isArray(raw?.layout_rotation) ? raw.layout_rotation : [])
    .map((l: any) => tidy(l).toLowerCase())
    .filter((l: string) => LAYOUTS.includes(l));
  return {
    grade: tidy(raw?.grade).slice(0, 200) || defaultCampaignCard(week).grade,
    time_of_day: tidy(raw?.time_of_day).slice(0, 120) || "late-afternoon window light",
    lens: tidy(raw?.lens).slice(0, 120) || "35mm prime at f/2",
    type_scale: clamp(raw?.type_scale, 0.9, 1.1, 1),
    band_ratio: clamp(raw?.band_ratio, 0.3, 0.46, 0.38),
    layout_rotation: rotation.length ? rotation.slice(0, 8) : defaultCampaignCard(week).layout_rotation,
    kicker_taxonomy: (Array.isArray(raw?.kicker_taxonomy) ? raw.kicker_taxonomy : [])
      .map((k: any) => tidy(k).toUpperCase().slice(0, 28))
      .filter(Boolean)
      .slice(0, 8),
    through_line: tidy(raw?.through_line).slice(0, 220),
    week,
    derived_at: new Date().toISOString(),
  };
}

/** Derive a campaign card from the week's posts and the venture's scene brief. */
export async function deriveCampaignCard(args: {
  week: number;
  posts: { pillar?: string | null; format?: string | null; hook?: string | null }[];
  businessLine?: string | null;
  brandName?: string | null;
  palette?: { surface?: string; ink?: string; accent?: string } | null;
}): Promise<CampaignCard | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;

  const sys = `You are the art director of an award-winning brand campaign. You are setting the LOOK for one week of paid social posters so the set reads as one campaign, not seven unrelated images.

Return JSON only:
{
  "grade": "<one colour-grade instruction every frame shares>",
  "time_of_day": "<one light condition for the set>",
  "lens": "<one lens family, e.g. '50mm prime at f/1.8'>",
  "type_scale": <0.9-1.1>,
  "band_ratio": <0.30-0.46, share of canvas height reserved for type>,
  "layout_rotation": ["bottom-scrim","edge-rule",...],
  "kicker_taxonomy": ["SHORT LABEL", "..."],
  "through_line": "<one sentence naming the argument this week makes>"
}
Rules: layouts only from bottom-scrim, centered-plate, edge-rule; lead with bottom-scrim and use centered-plate at most once. Kickers are 1-3 words, all caps, one per post, no punctuation. The grade must be achievable in a real photograph, not a filter name.`;

  const user = [
    args.brandName ? `Brand: ${args.brandName}` : "",
    args.businessLine ? `Line of work: ${args.businessLine}` : "",
    args.palette ? `Brand palette: surface ${args.palette.surface}, ink ${args.palette.ink}, accent ${args.palette.accent}` : "",
    `Week ${args.week} posts:`,
    ...args.posts.slice(0, 10).map((p, i) =>
      `${i + 1}. [${tidy(p.pillar) || "post"} / ${tidy(p.format) || "single"}] ${tidy(p.hook).slice(0, 160)}`
    ),
  ].filter(Boolean).join("\n");

  try {
    const res = await aiFetch(CHAT_URL, {
      method: "POST",
      headers: { "Lovable-API-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "low",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        response_format: { type: "json_object" },
      }),
    }, { timeoutMs: 60_000, retries: 1 });
    if (!res.ok) {
      console.warn("[campaign-card] gateway", res.status);
      return null;
    }
    const json = await res.json();
    const parsed = JSON.parse(json?.choices?.[0]?.message?.content ?? "");
    return normalize(parsed, args.week);
  } catch (e) {
    console.warn("[campaign-card] derive failed", e);
    return null;
  }
}

/**
 * Load the cached campaign card for a week, deriving + persisting on first use.
 * Never throws — a null result means the ad falls back to per-post direction.
 */
export async function ensureCampaignCard(
  admin: any,
  snapshotId: string,
  week: number,
  build: () => Promise<CampaignCard | null>,
  opts: { force?: boolean } = {},
): Promise<CampaignCard | null> {
  if (!snapshotId || !Number.isFinite(week)) return null;
  const key = String(week);
  let existing: Record<string, any> = {};
  try {
    const { data } = await admin
      .from("venture_content_progress")
      .select("campaign_cards")
      .eq("snapshot_id", snapshotId)
      .maybeSingle();
    existing = (data?.campaign_cards ?? {}) as Record<string, any>;
    if (!opts.force && isUsableCard(existing[key])) return existing[key] as CampaignCard;
  } catch (e) {
    console.warn("[campaign-card] cache read failed", e);
  }

  const card = await build();
  if (!card) return null;
  try {
    await admin
      .from("venture_content_progress")
      .update({ campaign_cards: { ...existing, [key]: card } })
      .eq("snapshot_id", snapshotId);
  } catch (e) {
    console.warn("[campaign-card] cache write failed", e);
  }
  return card;
}

/** Pick the layout for a post from the week's rotation, deterministically. */
export function layoutForIndex(card: CampaignCard | null, index: number, fallback: string): string {
  const rot = card?.layout_rotation?.length ? card.layout_rotation : null;
  if (!rot) return fallback;
  return rot[Math.abs(index) % rot.length] ?? fallback;
}

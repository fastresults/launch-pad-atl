// @ts-nocheck
// Mirror data captured in the Startup Brief workflow into attendee_profiles
// (the row backing /dashboard/profile). Merge-not-overwrite: never clobber
// values the founder has manually typed on the Profile page.
import { supabase } from "@/integrations/supabase/client";

async function uid() {
  return (await supabase.auth.getUser()).data.user!.id;
}

function firstSentence(s?: string | null): string {
  if (!s) return "";
  const t = String(s).trim();
  const m = t.match(/^(.{1,180}?[.!?])(\s|$)/);
  return (m ? m[1] : t).trim();
}

function joinClean(parts: Array<string | null | undefined>, sep = " — "): string {
  return parts.map((p) => (p ?? "").toString().trim()).filter(Boolean).join(sep);
}

function deriveStartupName(pitch?: string | null): string {
  const text = (pitch ?? "").trim();
  if (!text) return "";
  const patterns = [
    /^(?:we are|we're|i am|i'm|this is)\s+([^,.;:!?]+(?:,\s*(?:llc|inc\.?|co\.?|company|studio|labs|group))?)/i,
    /^([^,.;:!?]+?)\s+(?:helps?|is|makes?|builds?|brings?|provides?|offers?)\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const name = match?.[1]?.trim().replace(/^the\s+/i, "");
    if (name && name.split(/\s+/).length <= 6) return name;
  }
  return "";
}

function archetypeToStage(arc?: string | string[] | null): string {
  const raw = Array.isArray(arc) ? arc.join(" ") : (arc ?? "");
  const a = raw.toLowerCase();
  if (!a) return "";
  if (a.includes("launched") || a.includes("revenue") || a.includes("scaling")) return "launched";
  if (a.includes("mvp") || a.includes("beta") || a.includes("pilot")) return "mvp";
  // Pre-launch archetypes (main-street, service, creator, ecommerce/DTC, etc.)
  return "idea";
}

export type SyncOptions = { markComplete?: boolean; overwrite?: boolean };
export type SyncResult = { fieldsFilled: number; markedComplete: boolean };

export async function syncProfileFromBrief(opts: SyncOptions = {}): Promise<SyncResult> {
  const userId = await uid();

  const [briefRes, founderRes, marketRes, profileRes, baseProfileRes] = await Promise.all([
    supabase.from("attendee_business_brief").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("attendee_founder_profile").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("attendee_market_profile").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("attendee_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("display_name").eq("user_id", userId).maybeSingle(),
  ]);

  const brief: any = briefRes.data ?? {};
  const founder: any = founderRes.data ?? {};
  const market: any = marketRes.data ?? {};
  const profile: any = profileRes.data ?? {};
  const displayName = baseProfileRes.data?.display_name ?? "";

  // attendee_founder_profile real columns: right_person_reason, unfair_advantage,
  // raw_text, linkedin_url, extracted (jsonb). No full_name/headline/background columns.
  const extracted: any = founder.extracted ?? {};

  const headlineFromExtract =
    extracted.headline || extracted.title || extracted.current_title || "";
  const backgroundFromExtract =
    extracted.summary || extracted.bio || extracted.about || "";
  const skillsFromExtract: string[] = Array.isArray(extracted.skills) ? extracted.skills : [];

  const founderBackgroundComposed = joinClean(
    [
      backgroundFromExtract || founder.raw_text || brief.origin_story,
      founder.right_person_reason ? `Why I'm the right person: ${founder.right_person_reason}` : "",
      founder.unfair_advantage ? `Unfair advantage: ${founder.unfair_advantage}` : "",
    ],
    "\n\n"
  );

  const valuePropComposed = joinClean(
    [brief.unique_insight, brief.offer_description, founder.unfair_advantage],
    " — "
  );

  // Build the candidate values
  const candidate: Record<string, any> = {
    full_name: extracted.full_name || displayName,
    headline: headlineFromExtract || firstSentence(brief.one_line_pitch),
    background: founderBackgroundComposed,
    primary_goal: brief.twelve_month_vision,
    business_name: deriveStartupName(brief.one_line_pitch),
    industry: market.industry,
    stage: archetypeToStage(market.archetype),
    problem_solved: brief.problem_statement,
    value_prop: valuePropComposed,
    target_market: joinClean(
      [brief.target_customer, market.geography, market.customer_type],
      " · "
    ),
    business_model: brief.business_model,
  };

  // Default: merge-not-overwrite. Force mode is used when the founder explicitly
  // asks Profile & Intake to mirror the completed Startup Brief.
  const patch: Record<string, any> = {};
  for (const [k, v] of Object.entries(candidate)) {
    const existing = (profile as any)[k];
    const isEmpty =
      existing === null ||
      existing === undefined ||
      (Array.isArray(existing) ? existing.length === 0 : String(existing).trim() === "");
    const hasNew =
      v !== null &&
      v !== undefined &&
      (Array.isArray(v) ? v.length > 0 : String(v).trim() !== "");
    if ((opts.overwrite || isEmpty) && hasNew) patch[k] = v;
  }

  // Skills (array merge)
  const existingSkills: string[] = Array.isArray(profile.skills) ? profile.skills : [];
  if ((opts.overwrite || existingSkills.length === 0) && skillsFromExtract.length > 0) {
    patch.skills = skillsFromExtract;
  }

  let markedComplete = false;
  if (opts.markComplete && !profile.intake_completed_at) {
    patch.intake_completed_at = new Date().toISOString();
    markedComplete = true;
  }

  const fieldsFilled = Object.keys(patch).filter((k) => k !== "intake_completed_at").length;

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase
      .from("attendee_profiles")
      .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
    if (error) {
      console.error("[syncProfileFromBrief] upsert failed", error);
      throw new Error(error.message);
    }
  }

  return { fieldsFilled, markedComplete };
}

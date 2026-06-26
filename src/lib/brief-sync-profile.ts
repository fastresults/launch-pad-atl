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

function archetypeToStage(arc?: string | null): string {
  const a = (arc ?? "").toLowerCase();
  if (!a) return "";
  if (a.includes("launch") || a.includes("revenue") || a.includes("ecom")) return "launched";
  if (a.includes("mvp") || a.includes("beta") || a.includes("pilot")) return "mvp";
  return "idea";
}

export type SyncOptions = { markComplete?: boolean };
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

  const brief = briefRes.data ?? {};
  const founder = founderRes.data ?? {};
  const market = marketRes.data ?? {};
  const profile = profileRes.data ?? {};
  const displayName = baseProfileRes.data?.display_name ?? "";

  // Build the candidate values
  const candidate: Record<string, any> = {
    full_name: founder.full_name || displayName,
    headline: founder.headline || firstSentence(brief.one_line_pitch),
    background: founder.background || brief.origin_story,
    primary_goal: brief.twelve_month_vision,
    industry: market.industry,
    stage: archetypeToStage(market.archetype),
    problem_solved: brief.problem_statement,
    value_prop: joinClean([brief.unique_insight, brief.offer_description]),
    target_market: joinClean([brief.target_customer, market.geography, market.customer_type], " · "),
    business_model: brief.business_model,
  };

  // Merge-not-overwrite: only fill where profile is empty/null.
  const patch: Record<string, any> = {};
  for (const [k, v] of Object.entries(candidate)) {
    const existing = (profile as any)[k];
    const isEmpty = existing === null || existing === undefined || String(existing).trim() === "";
    const hasNew = v !== null && v !== undefined && String(v).trim() !== "";
    if (isEmpty && hasNew) patch[k] = v;
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
    if (error) throw new Error(error.message);
  }

  return { fieldsFilled, markedComplete };
}

// @ts-nocheck
// Canonical founder context — the single read API every surface uses to
// pre-populate fields without re-asking. Reads from every table that already
// stores a fact and merges with a clear precedence:
//
//   1. attendee_profiles  (most recent, founder-edited)
//   2. attendee_business_brief / attendee_founder_profile / attendee_market_profile
//   3. member_intakes / profiles / auth user metadata
//
// Surfaces (hub.new, hub-review SetupSubStep, IntakeGatewayDialog, Social
// Setup intake) call this once on mount and use it to prefill the form.
// They never need to know which table a value came from.
import { supabase } from "@/integrations/supabase/client";
import { getEffectiveUserId } from "@/lib/effective-user";

export type CanonicalFounderContext = {
  identity: {
    user_id: string;
    full_name: string;
    email: string;
    phone: string;
    display_name: string;
    headline: string;
    background: string;
    linkedin_url: string;
  };
  market: {
    industry: string;
    sub_industry: string;
    stage: string;          // "idea" | "mvp" | "launched" | ""
    archetype: string;      // raw MarketBlock archetype value
    geography: string[];
    customer_type: string;  // "b2c" | "b2b" | "both" | ""
    channels: string[];
    city: string;
    region: string;
    country: string;
    market_scope: "local" | "regional" | "national" | "international" | "";
  };
  concept: {
    company_name: string;
    one_line_pitch: string;
    problem_statement: string;
    offer_description: string;
    target_customer: string;
    unique_insight: string;
    business_model: string;
    pricing_idea: string;
    business_concept_blob: string; // assembled multi-line description
    differentiation: string;
    twelve_month_vision: string;
  };
  financials: {
    current_revenue: number | null;
    funding_raised: number | null;
    monthly_burn: number | null;
    runway_months: number | null;
  };
  // Provenance: tells the UI which fact came from which surface so we can
  // render "from your Brief" / "from your resume" tags later (R5).
  provenance: Record<string, "profile" | "brief" | "founder" | "market" | "intake" | "auth" | "">;
};

function s(v: any): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function firstNonEmpty(...vals: any[]): string {
  for (const v of vals) {
    const t = s(v);
    if (t) return t;
  }
  return "";
}

function archetypeToStage(arc?: string | string[] | null): string {
  const raw = Array.isArray(arc) ? arc.join(" ") : (arc ?? "");
  const a = raw.toLowerCase();
  if (!a) return "";
  if (a.includes("launched") || a.includes("revenue") || a.includes("scaling")) return "launched";
  if (a.includes("mvp") || a.includes("beta") || a.includes("pilot")) return "mvp";
  return "idea";
}

function geoToMarketScope(
  geography: string[] | undefined,
): "local" | "regional" | "national" | "international" | "" {
  if (!geography || geography.length === 0) return "";
  const joined = geography.join(" ").toLowerCase();
  if (joined.includes("international") || joined.includes("global")) return "international";
  if (joined.includes("national") || joined.includes("country")) return "national";
  if (joined.includes("regional") || joined.includes("state") || joined.includes("multi-city")) return "regional";
  return "local";
}

export async function getCanonicalFounderContext(): Promise<CanonicalFounderContext | null> {
  let userId: string;
  try { userId = await getEffectiveUserId(); } catch { return null; }

  const [
    profileRes,
    briefRes,
    founderRes,
    marketRes,
    pubProfileRes,
    intakeRes,
  ] = await Promise.all([
    supabase.from("attendee_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("attendee_business_brief").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("attendee_founder_profile").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("attendee_market_profile").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("display_name,email").eq("user_id", userId).maybeSingle(),
    supabase.from("member_intakes").select("*").eq("user_id", userId).maybeSingle(),
  ]);


  const profile: any = profileRes.data ?? {};
  const brief: any = briefRes.data ?? {};
  const founder: any = founderRes.data ?? {};
  const market: any = marketRes.data ?? {};
  const pub: any = pubProfileRes.data ?? {};
  const intake: any = intakeRes.data ?? {};
  const meta: any = user.user_metadata ?? {};
  const extracted: any = founder.extracted ?? {};

  const prov: CanonicalFounderContext["provenance"] = {};
  const trackProv = (key: string, source: CanonicalFounderContext["provenance"][string]) => {
    if (!prov[key]) prov[key] = source;
  };

  // ---- identity ----
  const full_name = firstNonEmpty(profile.full_name, extracted.full_name, pub.display_name, meta.display_name, meta.name, meta.full_name);
  if (full_name) trackProv("full_name", profile.full_name ? "profile" : extracted.full_name ? "founder" : "auth");

  const email = firstNonEmpty(user.email, pub.email);
  trackProv("email", "auth");

  const phone = firstNonEmpty(profile.phone, meta.phone);
  if (phone) trackProv("phone", profile.phone ? "profile" : "auth");

  const headline = firstNonEmpty(profile.headline, extracted.headline, extracted.title);
  if (headline) trackProv("headline", profile.headline ? "profile" : "founder");

  const background = firstNonEmpty(profile.background, extracted.summary, extracted.bio, founder.raw_text, brief.origin_story);
  if (background) trackProv("background", profile.background ? "profile" : founder.raw_text || extracted.summary ? "founder" : "brief");

  // ---- market ----
  const industry = firstNonEmpty(profile.industry, market.industry, intake.industry);
  if (industry) trackProv("industry", profile.industry ? "profile" : market.industry ? "market" : "intake");

  const stage = firstNonEmpty(profile.stage, archetypeToStage(market.archetype));
  if (stage) trackProv("stage", profile.stage ? "profile" : "market");

  const geography: string[] = Array.isArray(market.geography) ? market.geography : [];
  const channels: string[] = Array.isArray(market.channels) ? market.channels : [];
  const customer_type = firstNonEmpty(market.customer_type);
  if (customer_type) trackProv("customer_type", "market");

  // ---- concept ----
  const one_line_pitch = firstNonEmpty(brief.one_line_pitch, intake.one_line_idea);
  if (one_line_pitch) trackProv("one_line_pitch", brief.one_line_pitch ? "brief" : "intake");

  const company_name = firstNonEmpty(profile.business_name, intake.startup_name);
  if (company_name) trackProv("company_name", profile.business_name ? "profile" : "intake");

  const problem_statement = firstNonEmpty(profile.problem_solved, brief.problem_statement);
  if (problem_statement) trackProv("problem_statement", profile.problem_solved ? "profile" : "brief");

  const offer_description = s(brief.offer_description);
  if (offer_description) trackProv("offer_description", "brief");

  const target_customer = firstNonEmpty(profile.target_market, brief.target_customer);
  if (target_customer) trackProv("target_customer", profile.target_market ? "profile" : "brief");

  const unique_insight = firstNonEmpty(brief.unique_insight, founder.unfair_advantage);
  if (unique_insight) trackProv("unique_insight", brief.unique_insight ? "brief" : "founder");

  const business_model = firstNonEmpty(profile.business_model, brief.business_model);
  if (business_model) trackProv("business_model", profile.business_model ? "profile" : "brief");

  const pricing_idea = s(brief.pricing_idea);
  if (pricing_idea) trackProv("pricing_idea", "brief");

  const twelve_month_vision = firstNonEmpty(profile.primary_goal, brief.twelve_month_vision);
  if (twelve_month_vision) trackProv("twelve_month_vision", profile.primary_goal ? "profile" : "brief");

  // Assembled "business concept" blob for hub.new
  const conceptParts = [
    one_line_pitch && `What we're building: ${one_line_pitch}`,
    problem_statement && `Problem we're solving: ${problem_statement}`,
    offer_description && `What we offer: ${offer_description}`,
    target_customer && `Who it's for: ${target_customer}`,
  ].filter(Boolean);
  const business_concept_blob = conceptParts.join("\n\n");

  return {
    identity: {
      user_id: user.id,
      full_name,
      email,
      phone,
      display_name: s(pub.display_name) || s(meta.display_name),
      headline,
      background,
      linkedin_url: s(founder.linkedin_url),
    },
    market: {
      industry,
      sub_industry: "",
      stage,
      archetype: Array.isArray(market.archetype) ? market.archetype.join(", ") : s(market.archetype),
      geography,
      customer_type,
      channels,
      city: "",
      region: "",
      country: "",
      market_scope: geoToMarketScope(geography),
    },
    concept: {
      company_name,
      one_line_pitch,
      problem_statement,
      offer_description,
      target_customer,
      unique_insight,
      business_model,
      pricing_idea,
      business_concept_blob,
      differentiation: unique_insight,
      twelve_month_vision,
    },
    financials: {
      current_revenue: profile.current_revenue ?? null,
      funding_raised: profile.funding_raised ?? null,
      monthly_burn: profile.monthly_burn ?? null,
      runway_months: profile.runway_months ?? null,
    },
    provenance: prov,
  };
}

/**
 * Convenience: an empty-string-safe field with provenance label. Use in UI:
 *   const f = fieldFrom(ctx, "industry");  // { value, source }
 */
export function fieldFrom(
  ctx: CanonicalFounderContext | null,
  key: string,
): { value: string; source: string } {
  if (!ctx) return { value: "", source: "" };
  const lookup: Record<string, string> = {
    full_name: ctx.identity.full_name,
    email: ctx.identity.email,
    phone: ctx.identity.phone,
    headline: ctx.identity.headline,
    background: ctx.identity.background,
    industry: ctx.market.industry,
    stage: ctx.market.stage,
    customer_type: ctx.market.customer_type,
    company_name: ctx.concept.company_name,
    one_line_pitch: ctx.concept.one_line_pitch,
    problem_statement: ctx.concept.problem_statement,
    offer_description: ctx.concept.offer_description,
    target_customer: ctx.concept.target_customer,
    unique_insight: ctx.concept.unique_insight,
    business_model: ctx.concept.business_model,
    pricing_idea: ctx.concept.pricing_idea,
    twelve_month_vision: ctx.concept.twelve_month_vision,
  };
  return { value: lookup[key] ?? "", source: ctx.provenance[key] ?? "" };
}

export function provenanceLabel(source: string): string {
  switch (source) {
    case "brief": return "from your Startup Brief";
    case "founder": return "from your founder profile / resume";
    case "market": return "from your market block";
    case "profile": return "from Profile & Intake";
    case "intake": return "from your welcome answers";
    case "auth": return "from your account";
    default: return "";
  }
}

// Mark every venture_snapshot owned by the current user as brain-dirty.
// Triggered after canonical writes (brief, profile, intake) so the next
// AI run rebuilds the compressed reasoning blob from fresh canonical data.
export async function markAllMySnapshotBrainsDirty(): Promise<void> {
  try {
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) return;
    await supabase
      .from("venture_snapshots")
      .update({ snapshot_brain_dirty: true })
      .eq("user_id", uid);
  } catch (e) {
    console.warn("[markAllMySnapshotBrainsDirty] failed", e);
  }
}

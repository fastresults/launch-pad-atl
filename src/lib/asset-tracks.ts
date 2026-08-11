// Classifies every sprint asset into one of four tracks so the UI can group
// and label rows consistently. Keys match `venture_document_types.type`.
import { Compass, BookOpen, Activity, Zap, type LucideIcon } from "lucide-react";

export type AssetTrack = "Introduction" | "Education" | "Tracking" | "Action";

export const ASSET_TRACK: Record<string, AssetTrack> = {
  // Day 1
  executive_summary: "Introduction",
  vision_mission: "Introduction",
  problem_solution: "Introduction",
  ai_tool_stack_recommendation: "Education",
  // Day 2
  value_proposition: "Introduction",
  pricing_offer_sheet: "Action",
  // Day 3
  customer_personas: "Introduction",
  first_50_warm_list: "Tracking",
  crm_pipeline_starter: "Tracking",
  // Day 4
  pre_sell_offer_test: "Action",
  landing_page_waitlist_test: "Action",
  presell_landing_prd: "Education",
  // Day 5
  competitive_positioning: "Introduction",
  market_analysis: "Education",
  // Day 6
  go_to_market_plan: "Education",
  sales_playbook: "Education",
  outbound_dm_email_scripts: "Action",
  booking_calendar_setup: "Action",
  sales_call_recording_stack: "Tracking",
  supplier_shortlist: "Action",
  // Day 7
  brand_messaging: "Introduction",
  brand_messaging_house: "Introduction",
  brand_voice_tone_guide: "Education",
  brand_strategy_framework: "Education",
  // Day 8
  legal_structure_brief: "Education",
  terms_privacy_refund_pack: "Action",
  insurance_starter: "Action",
  // Day 9
  payments_checkout_setup: "Action",
  business_bank_books_starter: "Action",
  // Day 10
  domain_email_dns_checklist: "Action",
  analytics_pixel_setup: "Tracking",
  email_marketing_setup: "Action",
  // Day 11
  website_prd: "Education",
  visual_identity_brief: "Introduction",
  logo_brand_asset_pack: "Action",
  // Day 12
  fulfillment_sop: "Education",
  customer_support_starter: "Action",
  operating_plan: "Education",
  ai_support_bot_setup: "Action",
  automation_recipes_starter: "Action",
  bom_and_landed_cost: "Tracking",
  // Day 13
  launch_content_kit: "Action",
  content_calendar_90day: "Tracking",
  social_media_audit_setup: "Tracking",
  founder_operating_cadence: "Tracking",
  // Day 14
  paid_ads_starter_pack: "Action",
  reviews_testimonials_kit: "Action",
  financial_model: "Tracking",
  ad_creative_pack: "Action",
  referral_affiliate_starter: "Action",
};

export interface TrackMeta {
  label: AssetTrack;
  short: string;
  icon: LucideIcon;
  dot: string;
  chip: string;
  order: number;
}

export const TRACK_META: Record<AssetTrack, TrackMeta> = {
  Introduction: {
    label: "Introduction",
    short: "Intro",
    icon: Compass,
    dot: "bg-indigo-400",
    chip: "bg-indigo-500/10 text-indigo-300 border-indigo-400/30",
    order: 1,
  },
  Education: {
    label: "Education",
    short: "Edu",
    icon: BookOpen,
    dot: "bg-primary",
    chip: "bg-primary/10 text-primary border-primary/30",
    order: 2,
  },
  Tracking: {
    label: "Tracking",
    short: "Track",
    icon: Activity,
    dot: "bg-amber-400",
    chip: "bg-amber-500/10 text-amber-300 border-amber-400/30",
    order: 3,
  },
  Action: {
    label: "Action",
    short: "Action",
    icon: Zap,
    dot: "bg-teal-400",
    chip: "bg-teal-500/10 text-teal-300 border-teal-400/30",
    order: 4,
  },
};

export const TRACK_ORDER: AssetTrack[] = ["Introduction", "Education", "Tracking", "Action"];

export function trackFor(key: string): AssetTrack {
  const t = ASSET_TRACK[key];
  if (!t) {
    if (typeof import.meta !== "undefined" && (import.meta as any).env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[asset-tracks] No track mapping for key "${key}" — defaulting to Action.`);
    }
    return "Action";
  }
  return t;
}

interface TrackChipProps {
  track: AssetTrack;
  className?: string;
}

export function trackChipClass(track: AssetTrack, extra = "") {
  const m = TRACK_META[track];
  return `inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${m.chip} ${extra}`.trim();
}

// Split an asset's estimated_minutes into read vs do time based on its track.
// Introduction/Education = pure read. Action = pure do. Tracking = 50/50.
export function timeSplit(track: AssetTrack, minutes: number): { read: number; do: number } {
  const m = Math.max(0, Math.round(minutes ?? 0));
  switch (track) {
    case "Introduction":
    case "Education":
      return { read: m, do: 0 };
    case "Tracking":
      return { read: Math.round(m / 2), do: Math.ceil(m / 2) };
    case "Action":
      return { read: 0, do: m };
  }
}

export function formatDuration(min: number): string {
  const m = Math.max(0, Math.round(min ?? 0));
  if (m === 0) return "0m";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

// Short verb suffix for a row-level time chip, e.g. "25m read" / "45m to build".
export function timeChipLabel(track: AssetTrack, minutes: number): string {
  const { read, do: build } = timeSplit(track, minutes);
  if (read && build) return `${formatDuration(read)} read + ${formatDuration(build)} setup`;
  if (build) return `${formatDuration(build)} to build`;
  return `${formatDuration(read)} read`;
}


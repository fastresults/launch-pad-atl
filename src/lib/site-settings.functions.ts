import { supabase } from "@/integrations/supabase/client";

export const DASHBOARD_NAV_KEYS = [
  "today",
  "workshop",
  "brief",
  "deliverables",
  "hub",
  "operations",
  "files",
  "profile",
] as const;
export type DashboardNavKey = (typeof DASHBOARD_NAV_KEYS)[number];
export type DashboardNavVisibility = Record<DashboardNavKey, boolean>;

export const DEFAULT_DASHBOARD_NAV_VISIBILITY: DashboardNavVisibility = {
  today: true,
  workshop: true,
  brief: true,
  deliverables: true,
  hub: true,
  operations: true,
  files: true,
  profile: true,
};

export type SiteSettings = {
  registration_open: boolean;
  inquiry_notification_email: string | null;
  show_business_ideas_scroller: boolean;
  landing_only_mode: boolean;
  dashboard_nav_visibility: DashboardNavVisibility;
  [key: string]: unknown;
};

function unwrap<T>(input: any): T {
  if (input && typeof input === "object" && "data" in input && Object.keys(input).length === 1) {
    return input.data as T;
  }
  return (input ?? {}) as T;
}

function coerceNavVisibility(value: unknown): DashboardNavVisibility {
  const out = { ...DEFAULT_DASHBOARD_NAV_VISIBILITY };
  if (value && typeof value === "object") {
    for (const k of DASHBOARD_NAV_KEYS) {
      const v = (value as Record<string, unknown>)[k];
      if (v === false) out[k] = false;
    }
  }
  return out;
}

export async function getPublicSiteSettings(): Promise<SiteSettings> {
  const { data } = await supabase
    .from("site_settings")
    .select("key, value");
  const rows = data ?? [];
  const map = new Map<string, unknown>();
  for (const r of rows as Array<{ key: string; value: unknown }>) {
    map.set(r.key, r.value);
  }
  const regOpen = map.get("registration_open");
  const inquiryEmail = map.get("inquiry_notification_email");
  const showScroller = map.get("show_business_ideas_scroller");
  const landingOnly = map.get("landing_only_mode");
  return {
    registration_open: regOpen === false ? false : true,
    inquiry_notification_email: typeof inquiryEmail === "string" ? inquiryEmail : null,
    show_business_ideas_scroller: showScroller === false ? false : true,
    landing_only_mode: landingOnly === true,
    dashboard_nav_visibility: coerceNavVisibility(map.get("dashboard_nav_visibility")),
  };
}


export async function updateSiteSetting(input: any) {
  const { key, value } = unwrap<{ key: string; value: unknown }>(input);
  if (!key) throw new Error("Missing setting key");
  const { error } = await supabase
    .from("site_settings")
    .upsert(
      { key, value: value as any, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  if (error) throw new Error(error.message);
}

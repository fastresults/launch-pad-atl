import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  home_variant?: string;
  registration_open?: boolean;
  [key: string]: unknown;
};

export async function getPublicSiteSettings(): Promise<SiteSettings> {
  const { data } = await supabase.from("site_settings").select("key, value");
  if (!data) return {};
  return Object.fromEntries(data.map((row: { key: string; value: unknown }) => [row.key, row.value]));
}

export async function updateSiteSetting(_data?: any) { return null as any; }

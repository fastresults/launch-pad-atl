import { supabase } from "@/integrations/supabase/client";

export type SiteVariant = "original" | "selection";

export type SiteSettings = {
  home_variant: SiteVariant;
  register_variant: SiteVariant;
  registration_open: boolean;
  updated: {
    home_variant: string | null;
    register_variant: string | null;
  };
  [key: string]: unknown;
};

function unwrap<T>(input: any): T {
  if (input && typeof input === "object" && "data" in input && Object.keys(input).length === 1) {
    return input.data as T;
  }
  return (input ?? {}) as T;
}

function coerceVariant(v: unknown): SiteVariant {
  return v === "selection" ? "selection" : "original";
}

export async function getPublicSiteSettings(): Promise<SiteSettings> {
  const { data } = await supabase
    .from("site_settings")
    .select("key, value, updated_at");
  const rows = data ?? [];
  const map = new Map<string, { value: unknown; updated_at: string | null }>();
  for (const r of rows as Array<{ key: string; value: unknown; updated_at: string | null }>) {
    map.set(r.key, { value: r.value, updated_at: r.updated_at });
  }

  const home = map.get("home_variant");
  const reg = map.get("register_variant");
  const regOpen = map.get("registration_open");

  return {
    home_variant: coerceVariant(home?.value),
    register_variant: coerceVariant(reg?.value),
    registration_open: regOpen?.value === false ? false : true,
    updated: {
      home_variant: home?.updated_at ?? null,
      register_variant: reg?.updated_at ?? null,
    },
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

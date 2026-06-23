import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  registration_open: boolean;
  inquiry_notification_email: string | null;
  [key: string]: unknown;
};

function unwrap<T>(input: any): T {
  if (input && typeof input === "object" && "data" in input && Object.keys(input).length === 1) {
    return input.data as T;
  }
  return (input ?? {}) as T;
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
  return {
    registration_open: regOpen === false ? false : true,
    inquiry_notification_email: typeof inquiryEmail === "string" ? inquiryEmail : null,
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

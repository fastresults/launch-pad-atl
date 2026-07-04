// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { getEffectiveUserId } from "@/lib/effective-user";
import type { SetupStage } from "@/lib/zernio-setup-guides";


export type BrandKit = {
  user_id: string;
  display_name: string | null;
  handle: string | null;
  short_bio: string | null;
  long_bio: string | null;
  website_url: string | null;
  logo_url: string | null;
  banner_url: string | null;
  vibe: string | null;
  color_mood: string | null;
  brand_colors: string[] | null;
  created_at?: string;
  updated_at?: string;
};

export type ProgressRow = {
  id: string;
  user_id: string;
  platform: string;
  account_created: boolean;
  email_verified: boolean;
  profile_completed: boolean;
  zernio_connected: boolean;
  skipped: boolean;
  notes: string | null;
  updated_at: string;
};

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data?.user?.id) throw new Error("Not signed in");
  return data.user.id;
}

export async function getBrand(): Promise<BrandKit | null> {
  const uid = await getUserId();
  const { data, error } = await supabase
    .from("social_setup_brand")
    .select("*")
    .eq("user_id", uid)
    .maybeSingle();
  if (error) throw error;
  return data as BrandKit | null;
}

export async function upsertBrand(input: Partial<BrandKit>): Promise<BrandKit> {
  const uid = await getUserId();
  const { data, error } = await supabase
    .from("social_setup_brand")
    .upsert({ ...input, user_id: uid }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data as BrandKit;
}

export async function listProgress(): Promise<ProgressRow[]> {
  const uid = await getUserId();
  const { data, error } = await supabase
    .from("social_setup_progress")
    .select("*")
    .eq("user_id", uid);
  if (error) throw error;
  return (data ?? []) as ProgressRow[];
}

export async function upsertProgressStage(
  platform: string,
  stage: SetupStage | "skipped",
  value: boolean,
): Promise<ProgressRow> {
  const uid = await getUserId();
  // fetch existing row so we preserve the other stages
  const { data: existing } = await supabase
    .from("social_setup_progress")
    .select("*")
    .eq("user_id", uid)
    .eq("platform", platform)
    .maybeSingle();

  const next = {
    user_id: uid,
    platform,
    account_created: existing?.account_created ?? false,
    email_verified: existing?.email_verified ?? false,
    profile_completed: existing?.profile_completed ?? false,
    zernio_connected: existing?.zernio_connected ?? false,
    skipped: existing?.skipped ?? false,
    [stage]: value,
  };

  const { data, error } = await supabase
    .from("social_setup_progress")
    .upsert(next, { onConflict: "user_id,platform" })
    .select()
    .single();
  if (error) throw error;
  return data as ProgressRow;
}

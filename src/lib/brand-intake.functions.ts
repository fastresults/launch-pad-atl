// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export type BrandPackage = {
  user_id: string;
  status: "draft" | "approved";
  intake_input: {
    description?: string;
    tone?: string;
    industry?: string | null;
    founder_name?: string | null;
    website?: string | null;
  };
  identity: {
    display_name?: string;
    handle_suggestions?: string[];
    short_bio?: string;
    long_bio?: string;
  };
  per_platform_bios: Record<string, string>;
  visual_direction: {
    vibe?: string;
    color_mood?: string;
    brand_colors?: string[];
    logo_prompt?: string;
  };
  launch_kit: {
    pinned_post_short?: string;
    pinned_post_long?: string;
    link_in_bio?: string;
    hashtags?: string[];
    first_week_ideas?: string[];
  };
  model_used?: string | null;
  tokens_used?: number | null;
  created_at?: string;
  updated_at?: string;
};

async function call(body: any) {
  const { data, error } = await supabase.functions.invoke("brand-intake", { body });
  if (error) throw new Error(error.message || "Brand intake request failed");
  if (data && typeof data === "object" && "error" in data && data.error) {
    const err: any = new Error(data.error);
    err.code = (data as any).code;
    err.reason = (data as any).reason;
    err.upstreamStatus = (data as any).upstreamStatus;
    throw err;
  }
  return data;
}

export async function getBrandPackage(): Promise<BrandPackage | null> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u?.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("social_setup_brand_package")
    .select("*")
    .eq("user_id", uid)
    .maybeSingle();
  if (error) throw error;
  return (data as BrandPackage) ?? null;
}

export async function generateBrandPackage(input: {
  description: string;
  tone: "professional" | "founder_personal" | "playful" | "authoritative";
  industry?: string;
  founder_name?: string;
  website?: string;
}): Promise<BrandPackage> {
  const data = await call({ action: "generate", ...input });
  return data.package as BrandPackage;
}

export async function updateBrandPackage(
  patch: Partial<Pick<BrandPackage, "identity" | "per_platform_bios" | "visual_direction" | "launch_kit">>,
): Promise<BrandPackage> {
  const data = await call({ action: "update", ...patch });
  return data.package as BrandPackage;
}

export async function approveBrandPackage(): Promise<void> {
  await call({ action: "approve" });
}

export const TONES: { value: string; label: string; helper: string }[] = [
  { value: "professional", label: "Professional", helper: "Polished, neutral, B2B-ready." },
  { value: "founder_personal", label: "Founder-personal", helper: "First-person, warm, story-led." },
  { value: "playful", label: "Playful", helper: "Casual, witty, lots of personality." },
  { value: "authoritative", label: "Authoritative", helper: "Expert voice, confident, no hedging." },
];

export const PLATFORM_BIO_LIMITS: Record<string, number> = {
  twitter: 160,
  instagram: 150,
  facebook: 255,
  linkedin_personal: 220,
  linkedin_company: 2000,
  tiktok: 80,
  youtube: 1000,
  pinterest: 160,
  reddit: 200,
  bluesky: 256,
  threads: 150,
  googlebusiness: 750,
  telegram: 255,
  snapchat: 80,
  discord: 120,
};

// Map a SetupGuide.platform value → the package's per_platform_bios key.
// For LinkedIn we default to linkedin_personal; the platform card can fall
// back to linkedin_company.
export const SETUP_PLATFORM_TO_BIO_KEY: Record<string, string> = {
  twitter: "twitter",
  instagram: "instagram",
  facebook: "facebook",
  linkedin: "linkedin_personal",
  tiktok: "tiktok",
  youtube: "youtube",
  pinterest: "pinterest",
  reddit: "reddit",
  bluesky: "bluesky",
  threads: "threads",
  googlebusiness: "googlebusiness",
  telegram: "telegram",
  snapchat: "snapchat",
  discord: "discord",
};

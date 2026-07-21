import { supabase } from "@/integrations/supabase/client";
import { enqueueTransactionalEmail } from "@/lib/email/enqueue";

import { getEffectiveUserId } from "@/lib/effective-user";

const ADMIN_NOTIFY_EMAIL = "fastresults@gmail.com";

async function uid() { return await getEffectiveUserId(); }

const STARTUP_TYPE_TO_ARCHETYPE: Record<string, string> = {
  "online-services": "service",
  "main-street": "main-street",
  "tech-product": "saas",
  "physical-product": "ecommerce",
  "creator-media": "creator",
  "nonprofit": "service",
  "other": "",
};

export async function getMyIntake() {
  const { data } = await supabase.from("member_intakes").select("*").eq("user_id", await uid()).maybeSingle();
  return { intake: data };
}

export async function submitMyIntake(data: { startup_type: string; startup_name?: string | null; one_line_idea: string; supporting_info?: string | null }) {
  const userId = await uid();
  const { error } = await supabase.from("member_intakes").upsert({ ...data, user_id: userId, status: "submitted" }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);

  // R3 — pipe welcome answers directly into the canonical Brief tables so the
  // founder never has to retype them when they reach /dashboard/brief.
  // Merge-not-overwrite: only fill columns that are currently empty.
  try {
    const { data: existingBrief } = await supabase
      .from("attendee_business_brief")
      .select("one_line_pitch,origin_story")
      .eq("user_id", userId)
      .maybeSingle();
    const briefPatch: Record<string, any> = {};
    if (!existingBrief?.one_line_pitch && data.one_line_idea?.trim()) {
      briefPatch.one_line_pitch = data.one_line_idea.trim();
    }
    if (!existingBrief?.origin_story && data.supporting_info?.trim()) {
      briefPatch.origin_story = data.supporting_info.trim();
    }
    if (Object.keys(briefPatch).length > 0) {
      await supabase
        .from("attendee_business_brief")
        .upsert({ user_id: userId, ...briefPatch }, { onConflict: "user_id" });
    }

    const archetype = STARTUP_TYPE_TO_ARCHETYPE[data.startup_type];
    if (archetype) {
      const { data: existingMarket } = await supabase
        .from("attendee_market_profile")
        .select("archetype")
        .eq("user_id", userId)
        .maybeSingle();
      if (!existingMarket?.archetype) {
        await supabase
          .from("attendee_market_profile")
          .upsert({ user_id: userId, archetype: [archetype] } as any, { onConflict: "user_id" });
      }
    }

    if (data.startup_name?.trim()) {
      const { data: existingProfile } = await supabase
        .from("attendee_profiles")
        .select("business_name")
        .eq("user_id", userId)
        .maybeSingle();
      if (!existingProfile?.business_name) {
        await supabase
          .from("attendee_profiles")
          .upsert({ user_id: userId, business_name: data.startup_name.trim() }, { onConflict: "user_id" });
      }
    }
  } catch (e) {
    // Non-fatal — the welcome submit still succeeded.
    console.warn("[submitMyIntake] canonical pipe failed:", e);
  }
}

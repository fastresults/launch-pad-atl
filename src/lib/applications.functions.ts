import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Cohort id for the inaugural Atlanta selection workshop (July 23, 2026).
// Reuses the existing cohorts row with date 2026-07-23.
const SELECTION_COHORT_ID = "2026-07-15";

const ApplicationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  about_you: z.string().trim().min(60).max(1500),
  about_startup: z.string().trim().min(60).max(2000),
  why_now: z.string().trim().min(30).max(1000),
  stage: z.enum(["idea", "early", "existing"]),
  industry: z.string().trim().min(1).max(80),
  linkedin_url: z.string().trim().max(255).optional().or(z.literal("")),
  can_attend: z.literal(true),
  referral_source: z.string().trim().max(120).optional().or(z.literal("")),
});

export const submitFounderApplication = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => ApplicationSchema.parse(i))
  .handler(async ({ data }) => {
    const combined =
      `ABOUT THE FOUNDER:\n${data.about_you}\n\n` +
      `ABOUT THE STARTUP:\n${data.about_startup}\n\n` +
      `WHY THIS, WHY NOW:\n${data.why_now}` +
      (data.linkedin_url ? `\n\nLINKEDIN: ${data.linkedin_url}` : "");

    const { data: inserted, error } = await supabaseAdmin
      .from("workshop_registrations")
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        business_idea: combined,
        industry: data.industry,
        stage: data.stage,
        referral_source: data.referral_source || null,
        tier_interest: "selection",
        cohort_id: SELECTION_COHORT_ID,
        status: "applied",
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("[applications] insert failed", error);
      throw new Error("Could not save your application. Please try again.");
    }
    return { ok: true as const, id: (inserted as { id: string }).id };
  });

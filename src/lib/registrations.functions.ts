import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const RegistrationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  business_idea: z.string().trim().min(10).max(2000),
  industry: z.string().trim().min(1).max(80),
  stage: z.enum(["idea", "early", "existing"]),
  referral_source: z.string().trim().max(120).optional().or(z.literal("")),
  tier_interest: z.enum(["founders", "cohort"]).optional(),
  cohort_id: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const createRegistration = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => RegistrationSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("workshop_registrations").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      business_idea: data.business_idea,
      industry: data.industry,
      stage: data.stage,
      referral_source: data.referral_source || null,
      tier_interest: data.tier_interest ?? null,
      cohort_id: data.cohort_id ?? null,
    });
    if (error) {
      console.error("[registrations] insert failed", error);
      throw new Error("Could not save your registration. Please try again.");
    }
    return { ok: true as const };
  });

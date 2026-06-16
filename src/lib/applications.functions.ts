// @ts-nocheck
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const ApplicationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  linkedin_url: z.string().trim().url().optional().or(z.literal("")),
  business_idea: z.string().trim().min(10).max(2000),
  industry: z.string().trim().min(1),
  stage: z.enum(["idea", "early", "existing"]),
  why_free_cohort: z.string().trim().min(10).max(2000),
  referral_source: z.string().trim().max(120).optional().or(z.literal("")),
});

export const submitFounderApplication = async (data: any) => {
  const parsed = ApplicationSchema.parse(data);
  const { error } = await supabase.from("founder_applications").insert({ ...parsed, status: "pending" });
  if (error) throw new Error(error.message);
};

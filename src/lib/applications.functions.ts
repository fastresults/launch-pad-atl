// @ts-nocheck
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { enqueueTransactionalEmail } from "@/lib/email/enqueue";

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
  const { data: inserted, error } = await supabase
    .from("founder_applications")
    .insert({ ...parsed, status: "pending" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const firstName = parsed.name?.trim().split(/\s+/)[0] || undefined;
  try {
    await enqueueTransactionalEmail({
      templateName: "application-received",
      recipientEmail: parsed.email,
      idempotencyKey: `application-received-${inserted?.id}`,
      templateData: { firstName, fullName: parsed.name },
    });
  } catch (e) {
    console.warn("[submitFounderApplication] email enqueue failed:", e);
  }
};

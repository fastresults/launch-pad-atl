import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { enqueueTransactionalEmail } from "@/lib/email/enqueue.server";

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
    const { data: inserted, error } = await supabaseAdmin
      .from("founder_applications")
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        linkedin_url: data.linkedin_url || null,
        about_you: data.about_you,
        about_startup: data.about_startup,
        why_now: data.why_now,
        industry: data.industry,
        stage: data.stage,
        referral_source: data.referral_source || null,
        can_attend: data.can_attend,
        cohort_id: SELECTION_COHORT_ID,
        status: "applied",
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("[applications] insert failed", error);
      throw new Error("Could not save your application. Please try again.");
    }

    const applicationId = (inserted as { id: string }).id;

    // Fire confirmation email. Never fail the submission if email fails —
    // application is already saved and visible in admin.
    try {
      const cleanName = data.name.trim().replace(/\s+/g, " ");
      const firstName = cleanName.split(" ")[0] || undefined;
      console.log("[applications] enqueue confirmation", {
        applicationId,
        recipient: data.email,
        name: cleanName,
        firstName,
      });
      await enqueueTransactionalEmail({
        templateName: "application-received",
        recipientEmail: data.email,
        idempotencyKey: `application-confirm-${applicationId}`,
        templateData: { firstName, fullName: cleanName },
      });
    } catch (emailErr) {
      console.error("[applications] confirmation email failed", emailErr);
    }

    return { ok: true as const, id: applicationId };
  });

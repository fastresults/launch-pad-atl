import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { enqueueTransactionalEmail } from "@/lib/email/enqueue.server";

const PUBLIC_SITE_URL = "https://startuplabs.online";

const InquirySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().min(3).max(180),
  message: z.string().trim().min(10).max(4000),
  // Honeypot — must be empty
  website: z.string().max(0).optional().or(z.literal("")),
});

export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => InquirySchema.parse(i))
  .handler(async ({ data }) => {
    // Insert inquiry
    const { data: inserted, error } = await supabaseAdmin
      .from("inquiries")
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject,
        message: data.message,
        status: "new",
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("[inquiries] insert failed", error);
      throw new Error("Could not submit your message. Please try again.");
    }

    const inquiryId = (inserted as { id: string }).id;

    // Seed first thread message (inbound)
    await supabaseAdmin.from("inquiry_messages").insert({
      inquiry_id: inquiryId,
      direction: "inbound",
      author_name: data.name,
      body: data.message,
    });

    const firstName = data.name.trim().split(/\s+/)[0] || undefined;

    // Confirmation email to submitter
    try {
      await enqueueTransactionalEmail({
        templateName: "inquiry-received",
        recipientEmail: data.email,
        idempotencyKey: `inquiry-confirm-${inquiryId}`,
        templateData: { firstName, subject: data.subject },
      });
    } catch (err) {
      console.error("[inquiries] confirmation email failed", err);
    }

    // Admin notification email
    try {
      const { data: settingRow } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", "inquiry_notification_email")
        .maybeSingle();

      const adminEmail =
        (settingRow?.value as string | undefined) ?? "fastresults@gmail.com";

      if (adminEmail) {
        await enqueueTransactionalEmail({
          templateName: "inquiry-admin-notification",
          recipientEmail: adminEmail,
          idempotencyKey: `inquiry-admin-${inquiryId}`,
          templateData: {
            fromName: data.name,
            fromEmail: data.email,
            fromPhone: data.phone || undefined,
            subject: data.subject,
            message: data.message,
            inquiryUrl: `${PUBLIC_SITE_URL}/admin/inquiries/${inquiryId}`,
          },
          replyTo: data.email,
        });
      }
    } catch (err) {
      console.error("[inquiries] admin notification failed", err);
    }

    return { ok: true as const, id: inquiryId };
  });

import { supabase } from "@/integrations/supabase/client";
import { enqueueTransactionalEmail } from "@/lib/email/enqueue";

const ADMIN_NOTIFY_EMAIL = "fastresults@gmail.com";

type InquiryData = { name: string; email: string; phone?: string; subject: string; message: string; website?: string };

async function createInquiry(data: InquiryData) {
  if (data.website) return;
  const { data: inserted, error } = await supabase
    .from("inquiries")
    .insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject,
      message: data.message,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return inserted?.id as string | undefined;
}

export async function submitInquiry(data: InquiryData) {
  const inquiryId = await createInquiry(data);
  if (!inquiryId) return;

  const firstName = data.name?.trim().split(/\s+/)[0] || undefined;

  // Fire-and-forget; failures are already swallowed inside enqueueTransactionalEmail.
  try {
    await Promise.all([
      enqueueTransactionalEmail({
        templateName: "inquiry-received",
        recipientEmail: data.email,
        idempotencyKey: `inquiry-received-${inquiryId}`,
        templateData: { firstName, subject: data.subject },
      }),
      enqueueTransactionalEmail({
        templateName: "inquiry-admin-notification",
        recipientEmail: ADMIN_NOTIFY_EMAIL,
        idempotencyKey: `inquiry-admin-${inquiryId}`,
        templateData: {
          fromName: data.name,
          fromEmail: data.email,
          fromPhone: data.phone || undefined,
          subject: data.subject,
          message: data.message,
        },
      }),
    ]);
  } catch (e) {
    console.warn("[submitInquiry] email enqueue failed:", e);
  }
}

export async function submitLandingFreeLaunchInquiry(data: InquiryData) {
  const inquiryId = await createInquiry(data);
  if (!inquiryId) return;

  const adminEmail = await enqueueTransactionalEmail({
    templateName: "inquiry-admin-notification",
    recipientEmail: ADMIN_NOTIFY_EMAIL,
    idempotencyKey: `landing-free-launch-admin-${inquiryId}`,
    templateData: {
      fromName: data.name,
      fromEmail: data.email,
      fromPhone: data.phone || undefined,
      subject: data.subject,
      message: data.message,
    },
  });

  if (!adminEmail.queued) {
    throw new Error(
      "Your response was saved, but the admin email did not queue. Please try again or contact Startup Labs directly.",
    );
  }

  const firstName = data.name?.trim().split(/\s+/)[0] || undefined;
  const confirmation = await enqueueTransactionalEmail({
    templateName: "inquiry-received",
    recipientEmail: data.email,
    idempotencyKey: `landing-free-launch-received-${inquiryId}`,
    templateData: { firstName, subject: data.subject },
  });

  if (!confirmation.queued) {
    console.warn("[submitLandingFreeLaunchInquiry] confirmation email enqueue failed", confirmation.reason);
  }
}

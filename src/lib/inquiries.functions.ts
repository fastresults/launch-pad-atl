import { supabase } from "@/integrations/supabase/client";
import { enqueueTransactionalEmail } from "@/lib/email/enqueue";

const ADMIN_NOTIFY_EMAIL = "fastresults@gmail.com";

export async function submitInquiry(data: { name: string; email: string; phone?: string; subject: string; message: string; website?: string }) {
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

  const inquiryId = inserted?.id;
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

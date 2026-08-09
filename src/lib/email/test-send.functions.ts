import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { enqueueTransactionalEmail } from "@/lib/email/enqueue";
import { getSessionUser } from "@/lib/effective-user";

async function assertAdmin(userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role);
  if (!roles.includes("admin") && !roles.includes("super_admin")) {
    throw new Error("Forbidden: admin access required");
  }
}

const Schema = z.object({
  recipientEmail: z.string().trim().email(),
  firstName: z.string().trim().min(1).max(80).optional(),
});

export const sendTestApplicationReceivedEmail = async (data: any) => {
    await assertAdmin((await getSessionUser())!.id);
    const result = await enqueueTransactionalEmail({
      templateName: "application-received",
      recipientEmail: data.recipientEmail,
      idempotencyKey: `test-app-received-${Date.now()}`,
      templateData: { firstName: data.firstName },
    });
    return result;
  };

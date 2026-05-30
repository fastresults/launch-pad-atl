import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { enqueueTransactionalEmail } from "@/lib/email/enqueue.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
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

export const sendTestApplicationReceivedEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => Schema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const result = await enqueueTransactionalEmail({
      templateName: "application-received",
      recipientEmail: data.recipientEmail,
      idempotencyKey: `test-app-received-${Date.now()}`,
      templateData: { firstName: data.firstName },
    });
    return result;
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { enqueueTransactionalEmail } from "@/lib/email/enqueue.server";

const STARTUP_TYPES = [
  "online-services",
  "main-street",
  "tech-product",
  "physical-product",
  "creator-media",
  "nonprofit",
  "other",
] as const;

const intakeSchema = z.object({
  startup_type: z.enum(STARTUP_TYPES),
  startup_name: z.string().trim().max(120).optional().nullable(),
  one_line_idea: z.string().trim().min(5).max(400),
  supporting_info: z.string().trim().max(4000).optional().nullable(),
});

export const getMyIntake = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data } = await supabaseAdmin
      .from("member_intakes")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return { intake: data };
  });

async function adminEmail(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "super_admin")
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("user_id", data.user_id)
    .maybeSingle();
  return profile?.email ?? null;
}

export const submitMyIntake = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => intakeSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { userId } = context;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", userId)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from("member_intakes")
      .upsert(
        {
          user_id: userId,
          startup_type: data.startup_type,
          startup_name: data.startup_name ?? null,
          one_line_idea: data.one_line_idea,
          supporting_info: data.supporting_info ?? null,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);

    // Fire-and-forget email notifications
    if (profile?.email) {
      enqueueTransactionalEmail({
        templateName: "member-intake-received",
        recipientEmail: profile.email,
        idempotencyKey: `member-intake-received:${userId}`,
        templateData: {
          firstName: profile.display_name?.split(" ")[0] ?? null,
          startupName: data.startup_name ?? null,
        },
      }).catch((e) => console.error("intake-received email failed", e));
    }

    const adminTo = await adminEmail();
    if (adminTo) {
      enqueueTransactionalEmail({
        templateName: "member-intake-admin-notification",
        recipientEmail: adminTo,
        idempotencyKey: `member-intake-admin:${userId}:${Date.now()}`,
        templateData: {
          memberName: profile?.display_name ?? profile?.email ?? "New member",
          memberEmail: profile?.email ?? "",
          startupType: data.startup_type,
          startupName: data.startup_name ?? null,
          oneLineIdea: data.one_line_idea,
          supportingInfo: data.supporting_info ?? null,
        },
      }).catch((e) => console.error("intake-admin email failed", e));
    }

    return { ok: true };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { enqueueTransactionalEmail } from "@/lib/email/enqueue.server";

export type InquiryStatus = "new" | "in_progress" | "replied" | "closed";

async function assertAdmin(userId: string) {
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const ok = (roles ?? []).some(
    (r) => r.role === "admin" || r.role === "super_admin",
  );
  if (!ok) throw new Error("Forbidden");
}

export const listInquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        status: z
          .enum(["new", "in_progress", "replied", "closed", "all"])
          .optional(),
        search: z.string().trim().max(120).optional(),
      })
      .optional()
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);

    let q = supabaseAdmin
      .from("inquiries")
      .select(
        "id, name, email, subject, message, status, last_activity_at, created_at",
      )
      .order("last_activity_at", { ascending: false })
      .limit(200);

    const status = data?.status;
    if (status && status !== "all") q = q.eq("status", status);

    const search = data?.search?.trim();
    if (search) {
      // Simple ilike across a few columns
      q = q.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%`,
      );
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const { data: countsRaw } = await supabaseAdmin
      .from("inquiries")
      .select("status");
    const counts: Record<string, number> = {
      new: 0,
      in_progress: 0,
      replied: 0,
      closed: 0,
    };
    for (const r of countsRaw ?? []) {
      const s = (r as { status: string }).status;
      if (s in counts) counts[s] += 1;
    }

    return { inquiries: rows ?? [], counts };
  });

export const getInquiry = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);

    const [{ data: inquiry, error: e1 }, { data: messages, error: e2 }] =
      await Promise.all([
        supabaseAdmin
          .from("inquiries")
          .select(
            "id, name, email, phone, subject, message, status, assigned_to, created_at, updated_at, last_activity_at",
          )
          .eq("id", data.id)
          .single(),
        supabaseAdmin
          .from("inquiry_messages")
          .select("id, direction, author_id, author_name, body, created_at")
          .eq("inquiry_id", data.id)
          .order("created_at", { ascending: true }),
      ]);

    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);

    return { inquiry, messages: messages ?? [] };
  });

export const updateInquiryStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "in_progress", "replied", "closed"]),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("inquiries")
      .update({ status: data.status, last_activity_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const replyToInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        body: z.string().trim().min(1).max(8000),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);

    // Load inquiry
    const { data: inq, error: e1 } = await supabaseAdmin
      .from("inquiries")
      .select("id, name, email, subject")
      .eq("id", data.id)
      .single();
    if (e1 || !inq) throw new Error(e1?.message || "Inquiry not found");

    // Load admin's display name for sign-off / author attribution
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", context.userId)
      .maybeSingle();
    const agentName = profile?.display_name || profile?.email || "The team";

    // Insert outbound message
    const { error: e2 } = await supabaseAdmin.from("inquiry_messages").insert({
      inquiry_id: data.id,
      direction: "outbound",
      author_id: context.userId,
      author_name: agentName,
      body: data.body,
    });
    if (e2) throw new Error(e2.message);

    // Update status + activity
    await supabaseAdmin
      .from("inquiries")
      .update({
        status: "replied",
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    // Resolve reply-to from site settings
    const { data: settingRow } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "inquiry_notification_email")
      .maybeSingle();
    const replyTo =
      (settingRow?.value as string | undefined) ?? profile?.email ?? undefined;

    const firstName = inq.name.trim().split(/\s+/)[0] || undefined;

    // Send reply email
    try {
      await enqueueTransactionalEmail({
        templateName: "inquiry-reply",
        recipientEmail: inq.email,
        idempotencyKey: `inquiry-reply-${data.id}-${Date.now()}`,
        templateData: {
          firstName,
          subject: inq.subject,
          body: data.body,
          agentName,
        },
        replyTo,
      });
    } catch (err) {
      console.error("[inquiries] reply email failed", err);
      throw new Error("Reply saved but email could not be sent.");
    }

    return { ok: true as const };
  });

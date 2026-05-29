import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ===== Profile =====
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("attendee_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      const { data: ins, error: insErr } = await supabase
        .from("attendee_profiles")
        .insert({ user_id: userId })
        .select("*")
        .single();
      if (insErr) throw new Error(insErr.message);
      return { profile: ins };
    }
    return { profile: data };
  });

const FounderSection = z.object({
  full_name: z.string().trim().max(200).optional().nullable(),
  headline: z.string().trim().max(200).optional().nullable(),
  background: z.string().trim().max(4000).optional().nullable(),
  skills: z.array(z.string().trim().max(80)).max(40).optional(),
  time_commitment_hours: z.number().int().min(0).max(168).optional().nullable(),
  primary_goal: z.string().trim().max(1000).optional().nullable(),
});

const BusinessSection = z.object({
  business_name: z.string().trim().max(200).optional().nullable(),
  industry: z.string().trim().max(120).optional().nullable(),
  stage: z.string().trim().max(40).optional().nullable(),
  target_market: z.string().trim().max(1000).optional().nullable(),
  problem_solved: z.string().trim().max(2000).optional().nullable(),
  value_prop: z.string().trim().max(2000).optional().nullable(),
  competitors: z.array(z.string().trim().max(200)).max(20).optional(),
  business_model: z.string().trim().max(2000).optional().nullable(),
});

const FinancialSection = z.object({
  current_revenue: z.number().min(0).max(1e12).optional().nullable(),
  funding_raised: z.number().min(0).max(1e12).optional().nullable(),
  monthly_burn: z.number().min(0).max(1e10).optional().nullable(),
  runway_months: z.number().int().min(0).max(240).optional().nullable(),
});

const UpsertInput = z.object({
  section: z.enum(["founder", "business", "financial", "complete"]),
  data: z.record(z.string(), z.unknown()),
});

export const upsertMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpsertInput.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    let payload: Record<string, unknown> = {};
    if (data.section === "founder") payload = FounderSection.parse(data.data);
    else if (data.section === "business") payload = BusinessSection.parse(data.data);
    else if (data.section === "financial") payload = FinancialSection.parse(data.data);
    else if (data.section === "complete") payload = { intake_completed_at: new Date().toISOString() };

    const { error } = await supabase
      .from("attendee_profiles")
      .update(payload as never)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===== Documents =====
export const listMyDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("attendee_documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { documents: data ?? [] };
  });

const UploadUrlInput = z.object({
  kind: z.enum(["pitch_deck", "business_plan", "logo", "other"]),
  filename: z.string().trim().min(1).max(200),
  mime: z.string().trim().min(1).max(120),
});

export const createDocumentUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UploadUrlInput.parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const safe = data.filename.replace(/[^\w.\-]+/g, "_");
    const docId = crypto.randomUUID();
    const path = `${userId}/${docId}-${safe}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("attendee-docs")
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, token: signed.token, signedUrl: signed.signedUrl };
  });

const FinalizeInput = z.object({
  kind: z.enum(["pitch_deck", "business_plan", "logo", "other"]),
  storage_path: z.string().trim().min(1).max(500),
  original_name: z.string().trim().min(1).max(200),
  size_bytes: z.number().int().min(0).max(50 * 1024 * 1024),
  mime_type: z.string().trim().min(1).max(120),
});

export const finalizeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => FinalizeInput.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    if (!data.storage_path.startsWith(`${userId}/`)) {
      throw new Error("Invalid storage path");
    }
    const { data: row, error } = await supabase
      .from("attendee_documents")
      .insert({
        user_id: userId,
        kind: data.kind,
        storage_path: data.storage_path,
        original_name: data.original_name,
        size_bytes: data.size_bytes,
        mime_type: data.mime_type,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { document: row };
  });

export const deleteMyDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: doc } = await supabase
      .from("attendee_documents")
      .select("storage_path,user_id")
      .eq("id", data.id)
      .single();
    if (!doc || doc.user_id !== userId) throw new Error("Not found");
    await supabaseAdmin.storage.from("attendee-docs").remove([doc.storage_path]);
    const { error } = await supabase.from("attendee_documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDocumentDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: doc, error } = await supabase
      .from("attendee_documents")
      .select("storage_path,user_id,original_name")
      .eq("id", data.id)
      .single();
    if (error || !doc) throw new Error("Not found");
    // RLS already gates this; admins can fetch too.
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("attendee-docs")
      .createSignedUrl(doc.storage_path, 60 * 10);
    if (sErr) throw new Error(sErr.message);
    return { url: signed.signedUrl, filename: doc.original_name };
  });

// ===== Goals =====
export const listMyGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("attendee_goals")
      .select("*")
      .eq("user_id", userId)
      .order("horizon", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { goals: data ?? [] };
  });

const GoalInput = z.object({
  id: z.string().uuid().optional(),
  horizon: z.union([z.literal(30), z.literal(60), z.literal(90)]),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(["pending", "in_progress", "done"]).default("pending"),
  due_date: z.string().date().optional().nullable(),
});

export const upsertGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => GoalInput.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    if (data.id) {
      const { error } = await supabase
        .from("attendee_goals")
        .update({
          horizon: data.horizon,
          title: data.title,
          description: data.description ?? null,
          status: data.status,
          due_date: data.due_date ?? null,
        })
        .eq("id", data.id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("attendee_goals").insert({
        user_id: userId,
        horizon: data.horizon,
        title: data.title,
        description: data.description ?? null,
        status: data.status,
        due_date: data.due_date ?? null,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("attendee_goals")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===== Progress =====
export const getMyProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("attendee_progress")
      .select("*")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { progress: data ?? [] };
  });

const ModuleProgressInput = z.object({
  module_key: z.string().trim().min(1).max(80),
  status: z.enum(["pending", "in_progress", "done"]),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const updateModuleProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ModuleProgressInput.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("attendee_progress").upsert(
      {
        user_id: userId,
        module_key: data.module_key,
        status: data.status,
        notes: data.notes ?? null,
        completed_at: data.status === "done" ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,module_key" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===== Deliverables (attendee-facing, published only) =====
export const listMyDeliverables = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("attendee_deliverables")
      .select(
        "id, deliverable_key, content_current, published_at, publish_status, deliverable_types(label, description, stage_label, sort_order)",
      )
      .eq("user_id", userId)
      .eq("publish_status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { deliverables: data ?? [] };
  });

export const getMyDeliverable = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ key: z.string().min(1).max(80) }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("attendee_deliverables")
      .select(
        "id, deliverable_key, content_current, published_at, publish_status, deliverable_types(label, description, stage_label)",
      )
      .eq("user_id", userId)
      .eq("deliverable_key", data.key)
      .eq("publish_status", "published")
      .lte("published_at", new Date().toISOString())
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { deliverable: row };
  });

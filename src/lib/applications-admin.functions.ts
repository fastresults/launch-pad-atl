import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const STATUSES = [
  "applied",
  "reviewing",
  "shortlisted",
  "selected",
  "waitlisted",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof STATUSES)[number];

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

async function getActorDisplayName(userId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("display_name, email")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.display_name || data?.email || "Admin";
}

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        status: z.enum(STATUSES).optional(),
        search: z.string().trim().max(120).optional(),
      })
      .optional()
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);

    let q = supabaseAdmin.from("founder_applications").select("*");
    if (data?.status) q = q.eq("status", data.status);
    if (data?.search) {
      const s = `%${data.search}%`;
      q = q.or(`name.ilike.${s},email.ilike.${s},industry.ilike.${s}`);
    }

    // Default sort: applied = oldest first (fair queue); others newest first
    q =
      data?.status === "applied" || !data?.status
        ? q.order("created_at", { ascending: data?.status === "applied" })
        : q.order("status_changed_at", { ascending: false });

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    // Per-status counts (no filter applied)
    const { data: countRows } = await supabaseAdmin
      .from("founder_applications")
      .select("status");
    const counts: Record<ApplicationStatus, number> = {
      applied: 0, reviewing: 0, shortlisted: 0, selected: 0,
      waitlisted: 0, rejected: 0, withdrawn: 0,
    };
    for (const r of countRows ?? []) {
      const s = r.status as ApplicationStatus;
      if (s in counts) counts[s]++;
    }

    return { applications: rows ?? [], counts };
  });

export const getApplication = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);

    const { data: app, error } = await supabaseAdmin
      .from("founder_applications")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !app) throw new Error("Application not found");

    const { data: notes } = await supabaseAdmin
      .from("application_notes")
      .select("*")
      .eq("application_id", data.id)
      .order("created_at", { ascending: false });

    let registration = null as null | {
      id: string;
      status: string;
      created_at: string;
    };
    if (app.converted_registration_id) {
      const { data: reg } = await supabaseAdmin
        .from("workshop_registrations")
        .select("id, status, created_at")
        .eq("id", app.converted_registration_id)
        .maybeSingle();
      registration = reg ?? null;
    }

    return { application: app, notes: notes ?? [], registration };
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(STATUSES),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);

    const { data: current } = await supabaseAdmin
      .from("founder_applications")
      .select("status")
      .eq("id", data.id)
      .single();
    if (!current) throw new Error("Application not found");
    if (current.status === data.status) return { ok: true };

    const { error } = await supabaseAdmin
      .from("founder_applications")
      .update({
        status: data.status,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    const actor = await getActorDisplayName(context.userId);
    await supabaseAdmin.from("application_notes").insert({
      application_id: data.id,
      author_id: context.userId,
      author_name: actor,
      kind: "system",
      body: `Status changed: ${current.status} → ${data.status}`,
    });

    return { ok: true };
  });

export const addApplicationNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        applicationId: z.string().uuid(),
        body: z.string().trim().min(1).max(4000),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const actor = await getActorDisplayName(context.userId);
    const { error } = await supabaseAdmin.from("application_notes").insert({
      application_id: data.applicationId,
      author_id: context.userId,
      author_name: actor,
      kind: "note",
      body: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const promoteApplicationToRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);

    const { data: result, error } = await supabaseAdmin.rpc(
      "promote_application",
      { _app_id: data.id },
    );
    if (error) throw new Error(error.message);

    const actor = await getActorDisplayName(context.userId);
    await supabaseAdmin.from("application_notes").insert({
      application_id: data.id,
      author_id: context.userId,
      author_name: actor,
      kind: "system",
      body: `Promoted to registration ${result}`,
    });

    return { ok: true, registrationId: result as string };
  });

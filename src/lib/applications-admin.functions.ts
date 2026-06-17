// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

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

function unwrap<T>(input: any): T {
  if (input && typeof input === "object" && "data" in input && Object.keys(input).length === 1) {
    return input.data as T;
  }
  return (input ?? {}) as T;
}

type ListFilter = { status?: ApplicationStatus; search?: string };

export async function listApplications(input?: any) {
  const { status, search } = unwrap<ListFilter>(input);

  // counts across all statuses (independent of current filter)
  const { data: allRows } = await supabase
    .from("founder_applications")
    .select("status");
  const counts: Record<string, number> = {};
  for (const r of allRows ?? []) {
    const k = (r as any).status ?? "unknown";
    counts[k] = (counts[k] ?? 0) + 1;
  }

  let q = supabase
    .from("founder_applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  let applications = data ?? [];
  if (search) {
    const s = search.toLowerCase();
    applications = applications.filter(
      (a: any) =>
        (a.name ?? "").toLowerCase().includes(s) ||
        (a.email ?? "").toLowerCase().includes(s) ||
        (a.about_startup ?? "").toLowerCase().includes(s),
    );
  }

  return { applications, counts };
}

export async function getApplication(input: any) {
  const { id } = unwrap<{ id: string }>(input);
  const { data } = await supabase
    .from("founder_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function updateApplicationStatus(input: any) {
  const { id, status } = unwrap<{ id: string; status: ApplicationStatus }>(input);
  const { error } = await supabase
    .from("founder_applications")
    .update({ status, status_changed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addApplicationNote(input: any) {
  const { id, note } = unwrap<{ id: string; note: string }>(input);
  const { error } = await supabase
    .from("founder_applications")
    .update({ admin_notes: note })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function promoteApplicationToRegistration(input: any) {
  const { id } = unwrap<{ id: string }>(input);
  const { data: app } = await supabase
    .from("founder_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!app) throw new Error("Application not found");
  const { data: reg, error } = await supabase
    .from("workshop_registrations")
    .insert({
      email: (app as any).email,
      name: (app as any).name,
      tier_interest: "founders",
      status: "confirmed",
    })
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (reg?.id) {
    await supabase
      .from("founder_applications")
      .update({ converted_registration_id: reg.id, status: "selected" })
      .eq("id", id);
  }
}

export async function updateApplication(input: any) {
  const args = unwrap<{ id: string; patch?: Record<string, any>; [k: string]: any }>(input);
  const { id, patch, ...rest } = args;
  const update = patch ?? rest;
  const finalPatch: Record<string, any> = { ...update };
  if (finalPatch.status) finalPatch.status_changed_at = new Date().toISOString();
  const { error } = await supabase
    .from("founder_applications")
    .update(finalPatch)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function bulkUpdateApplications(input: any) {
  const args = unwrap<{ ids: string[]; status?: ApplicationStatus; patch?: Record<string, any> }>(
    input,
  );
  const update = args.patch ?? (args.status ? { status: args.status } : {});
  if (Object.keys(update).length === 0 || !args.ids?.length) {
    return { updated: 0 };
  }
  const finalPatch: Record<string, any> = { ...update };
  if (finalPatch.status) finalPatch.status_changed_at = new Date().toISOString();
  const { error } = await supabase
    .from("founder_applications")
    .update(finalPatch)
    .in("id", args.ids);
  if (error) throw new Error(error.message);
  return { updated: args.ids.length };
}

export async function bulkDeleteApplications(input: any) {
  const { ids } = unwrap<{ ids: string[] }>(input);
  if (!ids?.length) return { deleted: 0, skipped: [] };

  // Skip rows already promoted to a registration.
  const { data: rows } = await supabase
    .from("founder_applications")
    .select("id, name, converted_registration_id")
    .in("id", ids);

  const skipped = (rows ?? [])
    .filter((r: any) => r.converted_registration_id)
    .map((r: any) => ({
      id: r.id,
      name: r.name,
      reason: "Already promoted to a registration",
    }));
  const deletable = ids.filter(
    (id) => !skipped.find((s) => s.id === id),
  );

  if (deletable.length) {
    const { error } = await supabase
      .from("founder_applications")
      .delete()
      .in("id", deletable);
    if (error) throw new Error(error.message);
  }

  return { deleted: deletable.length, skipped };
}

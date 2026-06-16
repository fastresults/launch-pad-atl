// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

const STATUSES = ["pending", "reviewing", "accepted", "rejected", "waitlisted"] as const;
export type ApplicationStatus = (typeof STATUSES)[number];

export async function listApplications(data?: { status?: ApplicationStatus }) {
  let q = supabase.from("founder_applications").select("*").order("created_at", { ascending: false });
  if (data?.status) q = q.eq("status", data.status);
  const { data: rows } = await q;
  return rows ?? [];
}
export async function getApplication(data: { id: string }) {
  const { data: row } = await supabase.from("founder_applications").select("*").eq("id", data.id).maybeSingle();
  return row;
}
export async function updateApplicationStatus(data: { id: string; status: ApplicationStatus }) {
  const { error } = await supabase.from("founder_applications").update({ status: data.status }).eq("id", data.id);
  if (error) throw new Error(error.message);
}
export async function addApplicationNote(data: { id: string; note: string }) {
  const { error } = await supabase.from("founder_applications").update({ admin_notes: data.note }).eq("id", data.id);
  if (error) throw new Error(error.message);
}
export async function promoteApplicationToRegistration(data: { id: string }) {
  const { data: app } = await supabase.from("founder_applications").select("*").eq("id", data.id).maybeSingle();
  if (!app) throw new Error("Application not found");
  const { error } = await supabase.from("workshop_registrations").insert({ email: app.email, name: app.name, tier_interest: "founders", status: "confirmed" });
  if (error) throw new Error(error.message);
}
export async function updateApplication(data: { id: string; [key: string]: any }) {
  const { id, ...rest } = data;
  const { error } = await supabase.from("founder_applications").update(rest).eq("id", id);
  if (error) throw new Error(error.message);
}
export async function bulkUpdateApplications(data: { ids: string[]; status: ApplicationStatus }) {
  const { error } = await supabase.from("founder_applications").update({ status: data.status }).in("id", data.ids);
  if (error) throw new Error(error.message);
}
export async function bulkDeleteApplications(data: { ids: string[] }) {
  const { error } = await supabase.from("founder_applications").delete().in("id", data.ids);
  if (error) throw new Error(error.message);
}

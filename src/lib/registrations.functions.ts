import { supabase } from "@/integrations/supabase/client";

export async function createRegistration(data: any) {
  const { error } = await supabase.from("workshop_registrations").insert({ ...data, status: "pending" });
  if (error) throw new Error(error.message);
}
export async function confirmRegistrationPayment(data: { id: string }) {
  const { error } = await supabase.from("workshop_registrations").update({ status: "confirmed" }).eq("id", data.id);
  if (error) throw new Error(error.message);
}
export async function markRegistrationRefunded(data: { id: string }) {
  const { error } = await supabase.from("workshop_registrations").update({ status: "refunded" }).eq("id", data.id);
  if (error) throw new Error(error.message);
}
export async function simulatePaidRegistrations(_data: any) { return; }
export async function resetTestRegistrations(_data: any) { return; }
export async function listCohortRegistrations(data: { cohortId: string }) {
  const { data: rows } = await supabase.from("workshop_registrations").select("*").eq("cohort_id", data.cohortId).order("created_at", { ascending: false });
  return rows ?? [];
}

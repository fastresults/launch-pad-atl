import { supabase } from "@/integrations/supabase/client";

export async function createRegistration(data: any) {
  // Pending row — actual seat consumption happens at payment time via
  // reserve_cohort_seat (F16). Creating a pending row never reserves a seat.
  const { error } = await supabase.from("workshop_registrations").insert({ ...data, status: "pending" });
  if (error) throw new Error(error.message);
}

// F16: route admin-initiated payment confirmations through the atomic
// reserve_cohort_seat RPC. That function takes a FOR UPDATE lock on the
// cohort row, recounts paid/confirmed registrations, and refuses to mark a
// row paid once the chosen tier is full. A raw UPDATE bypasses that guard
// and lets concurrent admin clicks oversell.
export async function confirmRegistrationPayment(data: { id: string }) {
  const { data: reg, error: regErr } = await supabase
    .from("workshop_registrations")
    .select("cohort_id, assigned_tier, tier_interest, status")
    .eq("id", data.id)
    .maybeSingle();
  if (regErr) throw new Error(regErr.message);
  if (!reg) throw new Error("Registration not found");

  // No cohort attached → nothing to reserve; fall back to a plain update.
  if (!reg.cohort_id) {
    const { error } = await supabase
      .from("workshop_registrations")
      .update({ status: "confirmed" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return;
  }

  const requestedTier = (reg.assigned_tier ?? reg.tier_interest ?? "cohort") as "founders" | "cohort";
  const { error } = await supabase.rpc("reserve_cohort_seat", {
    _registration_id: data.id,
    _cohort_id: reg.cohort_id,
    _requested_tier: requestedTier === "founders" ? "founders" : "cohort",
  });
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

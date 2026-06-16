import { supabase } from "@/integrations/supabase/client";

export type TierAvailability = { taken: number; displayedTaken: number; soldOut: boolean };
export type CohortAvailability = { founders: TierAvailability; cohort: TierAvailability; cohortSoldOut: boolean };

export async function getCohortAvailability(data: { cohort_id: string }): Promise<CohortAvailability> {
  const { data: rows } = await supabase
    .from("workshop_registrations")
    .select("tier_interest")
    .eq("cohort_id", data.cohort_id)
    .not("status", "eq", "cancelled");

  const foundersTaken = (rows ?? []).filter(r => r.tier_interest === "founders").length;
  const cohortTaken = (rows ?? []).filter(r => r.tier_interest === "cohort").length;

  const { data: cohort } = await supabase.from("cohorts").select("founders_seats, cohort_seats").eq("id", data.cohort_id).maybeSingle();
  const foundersSeats = cohort?.founders_seats ?? 5;
  const cohortSeats = cohort?.cohort_seats ?? 10;

  const foundersSoldOut = foundersTaken >= foundersSeats;
  const cohortSoldOut = cohortTaken >= cohortSeats;

  return {
    founders: { taken: foundersTaken, displayedTaken: foundersTaken, soldOut: foundersSoldOut },
    cohort: { taken: cohortTaken, displayedTaken: cohortTaken, soldOut: cohortSoldOut },
    cohortSoldOut: foundersSoldOut && cohortSoldOut,
  };
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { computeDisplayedTaken, type ScarcityMode } from "./cohorts";

export type TierAvailability = {
  price_cents: number;
  capacity: number;
  // Real numbers — drive reservations, roll-over, sold-out logic
  taken: number;
  remaining: number;
  soldOut: boolean;
  // Displayed numbers — drive the public UI badge
  displayedTaken: number;
  displayedRemaining: number;
  scarcityMode: ScarcityMode;
  showSellingFast: boolean;
};

export type CohortAvailability = {
  cohort_id: string;
  founders: TierAvailability;
  cohort: TierAvailability;
  totalCapacity: number;
  totalTaken: number;
  totalRemaining: number;
  cohortSoldOut: boolean;
  nextTier: "founders" | "cohort" | null;
  isActiveCohort: boolean;
};

const Input = z.object({ cohort_id: z.string().min(1) });

export const getCohortAvailability = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => Input.parse(i))
  .handler(async ({ data }): Promise<CohortAvailability> => {
    const { cohort_id } = data;

    const { data: cohort, error: cErr } = await supabaseAdmin
      .from("cohorts" as never)
      .select(
        "id, founders_price_cents, founders_seats, cohort_price_cents, cohort_seats, founders_display_floor, founders_warming_boost, founders_honest_threshold_pct, cohort_display_floor, cohort_warming_boost, cohort_honest_threshold_pct",
      )
      .eq("id", cohort_id)
      .single();

    if (cErr || !cohort) {
      throw new Error("Cohort not found");
    }
    const c = cohort as unknown as {
      id: string;
      founders_price_cents: number;
      founders_seats: number;
      cohort_price_cents: number;
      cohort_seats: number;
      founders_display_floor: number;
      founders_warming_boost: number;
      founders_honest_threshold_pct: number;
      cohort_display_floor: number;
      cohort_warming_boost: number;
      cohort_honest_threshold_pct: number;
    };

    const { data: regs, error: rErr } = await supabaseAdmin
      .from("workshop_registrations")
      .select("assigned_tier, status")
      .eq("cohort_id", cohort_id)
      .in("status", ["paid", "confirmed"]);

    if (rErr) {
      console.error("[availability] count failed", rErr);
    }
    const rows = (regs ?? []) as Array<{ assigned_tier: string | null }>;
    const foundersTaken = rows.filter((r) => r.assigned_tier === "founders").length;
    const cohortTaken = rows.filter((r) => r.assigned_tier === "cohort").length;

    const foundersDisp = computeDisplayedTaken(
      foundersTaken,
      c.founders_seats,
      c.founders_display_floor,
      c.founders_warming_boost,
      c.founders_honest_threshold_pct,
    );
    const cohortDisp = computeDisplayedTaken(
      cohortTaken,
      c.cohort_seats,
      c.cohort_display_floor,
      c.cohort_warming_boost,
      c.cohort_honest_threshold_pct,
    );

    const foundersSoldOut = foundersTaken >= c.founders_seats;
    const cohortSoldOutReal = cohortTaken >= c.cohort_seats;

    const founders: TierAvailability = {
      price_cents: c.founders_price_cents,
      capacity: c.founders_seats,
      taken: foundersTaken,
      remaining: Math.max(c.founders_seats - foundersTaken, 0),
      soldOut: foundersSoldOut,
      displayedTaken: foundersDisp.displayedTaken,
      displayedRemaining: Math.max(c.founders_seats - foundersDisp.displayedTaken, 0),
      scarcityMode: foundersDisp.mode,
      showSellingFast: !foundersSoldOut && foundersDisp.mode !== "honest",
    };
    const cohortTier: TierAvailability = {
      price_cents: c.cohort_price_cents,
      capacity: c.cohort_seats,
      taken: cohortTaken,
      remaining: Math.max(c.cohort_seats - cohortTaken, 0),
      soldOut: cohortSoldOutReal,
      displayedTaken: cohortDisp.displayedTaken,
      displayedRemaining: Math.max(c.cohort_seats - cohortDisp.displayedTaken, 0),
      scarcityMode: cohortDisp.mode,
      showSellingFast: !cohortSoldOutReal && cohortDisp.mode !== "honest",
    };
    const totalCapacity = founders.capacity + cohortTier.capacity;
    const totalTaken = founders.taken + cohortTier.taken;
    const totalRemaining = Math.max(totalCapacity - totalTaken, 0);
    const cohortSoldOut = totalRemaining === 0;
    const nextTier: "founders" | "cohort" | null = cohortSoldOut
      ? null
      : founders.soldOut
      ? "cohort"
      : "founders";

    return {
      cohort_id,
      founders,
      cohort: cohortTier,
      totalCapacity,
      totalTaken,
      totalRemaining,
      cohortSoldOut,
      nextTier,
    };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type TierAvailability = {
  price_cents: number;
  capacity: number;
  taken: number;
  remaining: number;
  soldOut: boolean;
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
};

const Input = z.object({ cohort_id: z.string().min(1) });

export const getCohortAvailability = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => Input.parse(i))
  .handler(async ({ data }): Promise<CohortAvailability> => {
    const { cohort_id } = data;

    const { data: cohort, error: cErr } = await supabaseAdmin
      .from("cohorts" as never)
      .select("id, founders_price_cents, founders_seats, cohort_price_cents, cohort_seats")
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

    const founders: TierAvailability = {
      price_cents: c.founders_price_cents,
      capacity: c.founders_seats,
      taken: foundersTaken,
      remaining: Math.max(c.founders_seats - foundersTaken, 0),
      soldOut: foundersTaken >= c.founders_seats,
    };
    const cohortTier: TierAvailability = {
      price_cents: c.cohort_price_cents,
      capacity: c.cohort_seats,
      taken: cohortTaken,
      remaining: Math.max(c.cohort_seats - cohortTaken, 0),
      soldOut: cohortTaken >= c.cohort_seats,
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

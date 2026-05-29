import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildCohortFromRow, type Cohort, type CohortRow } from "./cohorts";

const COHORT_FIELDS =
  "id, cohort_date, tz, start_time, end_time, status, seats_left, venue_name, venue_address, venue_city, venue_region, venue_postal, sort_order, founders_price_cents, founders_seats, cohort_price_cents, cohort_seats, founders_display_floor_pct, founders_warming_boost, founders_honest_threshold_pct, cohort_display_floor_pct, cohort_warming_boost, cohort_honest_threshold_pct";

/**
 * Resolve the current user's workshop cohort by matching their email
 * to a workshop_registrations row. Returns null if no registration yet.
 */
export const getMyCohort = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = userRes?.user?.email;
    if (!email) return { cohort: null as Cohort | null };

    const { data: reg } = await supabaseAdmin
      .from("workshop_registrations")
      .select("cohort_id")
      .eq("email", email)
      .not("cohort_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const cohortId = (reg as { cohort_id?: string } | null)?.cohort_id;
    if (!cohortId) return { cohort: null as Cohort | null };

    const { data: row } = await supabaseAdmin
      .from("cohorts" as never)
      .select(COHORT_FIELDS)
      .eq("id", cohortId)
      .maybeSingle();

    if (!row) return { cohort: null as Cohort | null };
    return { cohort: buildCohortFromRow(row as CohortRow) };
  });

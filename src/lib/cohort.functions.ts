import { supabase } from "@/integrations/supabase/client";
import { getEffectiveUserId } from "@/lib/effective-user";
import { buildCohortFromRow, type Cohort, type CohortRow } from "./cohorts";

const COHORT_FIELDS =
  "id, cohort_date, tz, start_time, end_time, status, seats_left, venue_name, venue_address, venue_city, venue_region, venue_postal, sort_order, founders_price_cents, founders_seats, cohort_price_cents, cohort_seats, founders_display_floor_pct, founders_warming_boost, founders_honest_threshold_pct, cohort_display_floor_pct, cohort_warming_boost, cohort_honest_threshold_pct";

export async function getMyCohort(): Promise<{ cohort: Cohort | null }> {
  let uid: string;
  try { uid = await getEffectiveUserId(); } catch { return { cohort: null }; }
  // Resolve email for the effective user so cohort lookup matches when impersonating.
  const { data: prof } = await supabase.from("profiles").select("email").eq("user_id", uid).maybeSingle();
  const email = (prof as { email?: string } | null)?.email;
  if (!email) return { cohort: null };

  const { data: reg } = await supabase
    .from("workshop_registrations")
    .select("cohort_id")
    .eq("email", email)
    .not("cohort_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();


  const cohortId = (reg as { cohort_id?: string } | null)?.cohort_id;
  if (!cohortId) return { cohort: null };

  const { data: row } = await supabase
    .from("cohorts" as never)
    .select(COHORT_FIELDS)
    .eq("id", cohortId)
    .maybeSingle();

  if (!row) return { cohort: null };
  return { cohort: buildCohortFromRow(row as CohortRow) };
}

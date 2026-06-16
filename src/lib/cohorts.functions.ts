import { supabase } from "@/integrations/supabase/client";
import { buildCohortFromRow, type Cohort, type CohortRow } from "./cohorts";

export async function listCohorts(): Promise<Cohort[]> {
  const { data, error } = await supabase
    .from("cohorts")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return (data as CohortRow[]).map(buildCohortFromRow);
}

export async function upsertCohort(_data?: any) { return null as any; }

export async function deleteCohort(_data?: any) { return null as any; }

// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { getEffectiveUserId } from "@/lib/effective-user";

/**
 * The venture brief's location. This is the source of truth for which state
 * the founder is forming their entity in (see src/lib/entity-state.ts).
 * Uses the most recently updated venture snapshot.
 */
export async function getMyBriefLocation(): Promise<{ city: string | null; region: string | null } | null> {
  const userId = await getEffectiveUserId();
  const { data, error } = await supabase
    .from("venture_snapshots")
    .select("city,region,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  if (!data) return null;
  return { city: data.city ?? null, region: data.region ?? null };
}

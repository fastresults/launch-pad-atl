// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

import { getEffectiveUserId } from "@/lib/effective-user";

async function uid() { return await getEffectiveUserId(); }

export async function getFounderMemory() {
  const { data } = await supabase.from("founder_memory").select("*").eq("user_id", await uid()).maybeSingle();
  return data ?? {};
}

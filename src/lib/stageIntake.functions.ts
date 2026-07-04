// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

import { getEffectiveUserId } from "@/lib/effective-user";

async function uid() { return await getEffectiveUserId(); }

export async function getMyIntake(data: { stage: number }) {
  const { data: row } = await supabase.from("stage_intakes").select("*").eq("user_id", await uid()).eq("stage", data.stage).maybeSingle();
  return row ?? {};
}
export async function listMyIntakes() {
  const { data } = await supabase.from("stage_intakes").select("*").eq("user_id", await uid()).order("stage", { ascending: true });
  return data ?? [];
}
export async function updateMyIntake(data: { stage: number; [key: string]: any }) {
  const userId = await uid();
  const { stage, ...rest } = data;
  const { error } = await supabase.from("stage_intakes").upsert({ ...rest, user_id: userId, stage }, { onConflict: "user_id,stage" });
  if (error) throw new Error(error.message);
}

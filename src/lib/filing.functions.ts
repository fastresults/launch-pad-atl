// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

async function uid() { return (await supabase.auth.getUser()).data.user!.id; }

export async function getMyFiling() {
  const { data } = await supabase.from("member_filings").select("*").eq("user_id", await uid()).maybeSingle();
  return data ?? {};
}
export async function updateMyFiling(data: any) {
  const userId = await uid();
  const { error } = await supabase.from("member_filings").upsert({ ...data, user_id: userId }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

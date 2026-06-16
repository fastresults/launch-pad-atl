import { supabase } from "@/integrations/supabase/client";

async function uid() { return (await supabase.auth.getUser()).data.user!.id; }

export async function getMyIntake() {
  const { data } = await supabase.from("member_intakes").select("*").eq("user_id", await uid()).maybeSingle();
  return { intake: data };
}
export async function submitMyIntake(data: { startup_type: string; startup_name?: string | null; one_line_idea: string; supporting_info?: string | null }) {
  const userId = await uid();
  const { error } = await supabase.from("member_intakes").upsert({ ...data, user_id: userId, status: "submitted" }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

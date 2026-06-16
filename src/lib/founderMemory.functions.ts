import { supabase } from "@/integrations/supabase/client";

async function uid() { return (await supabase.auth.getUser()).data.user!.id; }

export async function getFounderMemory() {
  const { data } = await supabase.from("founder_memory").select("*").eq("user_id", await uid()).maybeSingle();
  return data ?? {};
}

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getFounderMemory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("attendee_founder_memory")
      .select("id, source, source_key, block_n, field_keys, qa, summary, bullets, created_at")
      .eq("user_id", userId)
      .is("superseded_at", null)
      .order("source", { ascending: true })
      .order("source_key", { ascending: true });
    if (error) throw new Error(error.message);
    return { memories: data ?? [] };
  });

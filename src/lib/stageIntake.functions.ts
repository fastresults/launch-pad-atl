import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyIntake = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ deliverable_key: z.string().min(1).max(80) }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("attendee_stage_intake")
      .select("*")
      .eq("user_id", userId)
      .eq("deliverable_key", data.deliverable_key)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { intake: row };
  });

export const listMyIntakes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("attendee_stage_intake")
      .select("deliverable_key, intake, completed_at, updated_at")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { intakes: data ?? [] };
  });

const UpdateInput = z.object({
  deliverable_key: z.string().min(1).max(80),
  intake: z.record(z.string(), z.string().max(8000)),
  voice_transcripts: z.record(z.string(), z.string().max(8000)).optional(),
  complete: z.boolean().optional(),
});

export const updateMyIntake = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateInput.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const patch = {
      user_id: userId,
      deliverable_key: data.deliverable_key,
      intake: data.intake,
      voice_transcripts: data.voice_transcripts ?? {},
      completed_at: data.complete ? new Date().toISOString() : null,
    };
    const { error } = await supabase
      .from("attendee_stage_intake")
      .upsert(patch, { onConflict: "user_id,deliverable_key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BRIEF_KEYS = [
  "one_line_pitch","origin_story","problem_statement","target_customer","unique_insight",
  "offer_description","pricing_idea","business_model","inspiration_brands","twelve_month_vision",
] as const;
type BriefKey = (typeof BRIEF_KEYS)[number];

export const getMyBrief = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("attendee_business_brief")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      const { data: ins, error: insErr } = await supabase
        .from("attendee_business_brief")
        .insert({ user_id: userId })
        .select("*")
        .single();
      if (insErr) throw new Error(insErr.message);
      return { brief: ins };
    }
    return { brief: data };
  });

const UpdateInput = z.object({
  field: z.enum(BRIEF_KEYS),
  value: z.string().trim().max(8000),
  voice_transcript: z.string().trim().max(8000).optional(),
});

export const updateBriefField = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateInput.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    // Compute completeness
    const { data: cur } = await supabase
      .from("attendee_business_brief")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    const merged: Record<string, unknown> = { ...(cur ?? { user_id: userId }) };
    merged[data.field] = data.value || null;
    const transcripts = { ...((cur?.voice_transcripts as Record<string, string> | null) ?? {}) };
    if (data.voice_transcript) transcripts[data.field] = data.voice_transcript;
    const score = BRIEF_KEYS.reduce((acc, k) => acc + (merged[k] && String(merged[k]).trim().length > 0 ? 1 : 0), 0);
    const patch = {
      [data.field]: data.value || null,
      voice_transcripts: transcripts,
      completeness_score: score,
      completed_at: score === BRIEF_KEYS.length ? new Date().toISOString() : null,
    };
    const { error } = await supabase
      .from("attendee_business_brief")
      .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true, score };
  });

export const adminGetBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r) => ["admin", "super_admin"].includes(r.role));
    if (!isAdmin) throw new Error("Forbidden");
    const { data: brief, error } = await supabase
      .from("attendee_business_brief")
      .select("*")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { brief };
  });

export type { BriefKey };

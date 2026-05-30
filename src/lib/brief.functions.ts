import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { createHash } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { BRIEF_BLOCKS, fieldLabel } from "@/lib/brief-blocks";

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

// ===== Block checkpoint summaries =====

const SummaryOutputSchema = z.object({
  summary: z.string().min(1).max(2000),
  bullets: z.array(z.string().min(1).max(280)).min(2).max(5),
});

const SummarizeInput = z.object({ block: z.union([z.literal(1), z.literal(2), z.literal(3)]) });

function hashAnswers(qa: Array<{ key: string; answer: string; voice_transcript?: string | null }>): string {
  const normalized = qa
    .map((q) => `${q.key}::${(q.answer ?? "").trim()}::${(q.voice_transcript ?? "").trim()}`)
    .join("||");
  return createHash("sha256").update(normalized).digest("hex");
}

export const summarizeBriefBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SummarizeInput.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const block = BRIEF_BLOCKS.find((b) => b.id === data.block);
    if (!block) throw new Error("Unknown block");

    const { data: brief, error: briefErr } = await supabase
      .from("attendee_business_brief")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (briefErr) throw new Error(briefErr.message);
    if (!brief) throw new Error("No brief found");

    const transcripts = (brief.voice_transcripts as Record<string, string> | null) ?? {};
    const qa = block.fieldKeys.map((key) => ({
      key,
      label: fieldLabel(key),
      answer: ((brief as Record<string, unknown>)[key] as string | null) ?? "",
      voice_transcript: transcripts[key] ?? null,
    }));

    const hasContent = qa.some((q) => (q.answer ?? "").trim().length > 0);
    if (!hasContent) throw new Error("No answers to summarize yet");

    const contentHash = hashAnswers(qa);
    const sourceKey = `block_${block.id}`;

    // Cached current memory with same hash?
    const { data: existing } = await supabase
      .from("attendee_founder_memory")
      .select("id, summary, bullets, content_hash, created_at")
      .eq("user_id", userId)
      .eq("source", "brief_block")
      .eq("source_key", sourceKey)
      .is("superseded_at", null)
      .maybeSingle();

    if (existing && existing.content_hash === contentHash && existing.summary) {
      return {
        summary: existing.summary as string,
        bullets: (existing.bullets as string[]) ?? [],
        cached: true,
      };
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
    const model = createLovableAiGatewayProvider(apiKey)("google/gemini-3-flash-preview");

    const prompt = [
      `You are an encouraging startup coach. The founder just finished block "${block.title}" of their startup brief.`,
      `Write a short recap so they feel heard before they move on. Use second person ("you", "your startup"). Always say "startup", never "business". Do NOT invent facts that aren't in their answers.`,
      ``,
      `Their answers in this block:`,
      ...qa.map((q) => `\n• ${q.label}\n  ${q.answer.trim() || "(skipped)"}`),
      ``,
      `Return:`,
      `- summary: 3–5 sentence prose recap that reflects their thinking back to them in plain language.`,
      `- bullets: 3–4 short bullets (≤ 18 words each) capturing the key takeaways from this block.`,
    ].join("\n");

    const { output } = await generateText({
      model,
      output: Output.object({ schema: SummaryOutputSchema }),
      prompt,
    });
    const out = output as { summary: string; bullets: string[] };

    // Mark prior memory superseded
    if (existing) {
      await supabase
        .from("attendee_founder_memory")
        .update({ superseded_at: new Date().toISOString() })
        .eq("id", existing.id);
    }

    const { error: insErr } = await supabase.from("attendee_founder_memory").insert({
      user_id: userId,
      source: "brief_block",
      source_key: sourceKey,
      block_n: block.id,
      field_keys: block.fieldKeys,
      qa: qa as unknown as never,
      summary: out.summary,
      bullets: out.bullets,
      model: "google/gemini-3-flash-preview",
      content_hash: contentHash,
    });
    if (insErr) throw new Error(insErr.message);

    return { summary: out.summary, bullets: out.bullets, cached: false };
  });

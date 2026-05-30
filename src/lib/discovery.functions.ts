import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { createHash } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { extractTextFromResumeFile } from "@/lib/discovery.server";

// ===================== Founder profile =====================

const ExtractedFounderSchema = z.object({
  headline: z.string().max(200).optional().default(""),
  years_experience: z.number().int().min(0).max(80).optional().nullable(),
  location: z.string().max(200).optional().default(""),
  roles: z
    .array(
      z.object({
        title: z.string().max(160),
        company: z.string().max(160).optional().default(""),
        years: z.string().max(40).optional().default(""),
      }),
    )
    .max(20)
    .optional()
    .default([]),
  industries: z.array(z.string().max(120)).max(20).optional().default([]),
  skills: z.array(z.string().max(80)).max(40).optional().default([]),
  education: z.array(z.string().max(200)).max(10).optional().default([]),
  wins: z.array(z.string().max(280)).max(10).optional().default([]),
});

export type ExtractedFounder = z.infer<typeof ExtractedFounderSchema>;

export const getFounderProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("attendee_founder_profile" as never)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { profile: data ?? null };
  });

const UpsertFounderInput = z.object({
  source: z.enum(["resume", "linkedin", "manual"]).optional(),
  source_file_path: z.string().max(500).optional().nullable(),
  linkedin_url: z.string().url().max(500).optional().nullable(),
  raw_text: z.string().max(40000).optional().nullable(),
  extracted: ExtractedFounderSchema.partial().optional(),
  right_person_reason: z.string().max(2000).optional().nullable(),
  unfair_advantage: z.string().max(2000).optional().nullable(),
});

export const upsertFounderProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpsertFounderInput.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const patch: Record<string, unknown> = { user_id: userId };
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) patch[k] = v;
    }
    const { error } = await supabase
      .from("attendee_founder_profile" as never)
      .upsert(patch as never, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ExtractInput = z
  .object({
    raw_text: z.string().trim().max(40000).optional().nullable(),
    linkedin_url: z.string().url().max(500).optional().nullable(),
    source: z.enum(["resume", "linkedin", "manual"]),
    source_file_path: z.string().max(500).optional().nullable(),
  })
  .refine(
    (v) => (v.raw_text && v.raw_text.length >= 20) || !!v.source_file_path || !!v.linkedin_url,
    { message: "Provide a resume file, a LinkedIn URL, or pasted text." },
  );

export const extractFounderFromText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ExtractInput.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    // Resolve the text we'll feed to the model from whichever source we have.
    let textForModel = (data.raw_text ?? "").trim();
    let resolvedRawText = textForModel;
    let noteToUser: string | null = null;

    if (!textForModel && data.source_file_path) {
      const { text, reason } = await extractTextFromResumeFile(data.source_file_path);
      if (text) {
        textForModel = text;
        resolvedRawText = text;
      } else {
        noteToUser = reason ?? "We couldn't read that file. Paste your background to continue.";
      }
    }

    let extracted: ExtractedFounder = ExtractedFounderSchema.parse({});

    if (textForModel.length >= 20) {
      const model = createLovableAiGatewayProvider(apiKey)("google/gemini-3-flash-preview");
      const prompt = [
        "You are extracting a founder's professional profile from text they provided.",
        "Be faithful to the source — do not invent. If a field isn't present, leave it empty.",
        "Return ONLY the structured object.",
        "",
        data.linkedin_url ? `LinkedIn URL (for reference): ${data.linkedin_url}` : "",
        "",
        "TEXT:",
        textForModel,
      ]
        .filter(Boolean)
        .join("\n");

      const { output } = await generateText({
        model,
        output: Output.object({ schema: ExtractedFounderSchema }),
        prompt,
      });
      extracted = output as ExtractedFounder;
    } else if (data.linkedin_url) {
      // LinkedIn-only path: we can't scrape, but we still save the URL and let them continue.
      noteToUser =
        noteToUser ??
        "LinkedIn pages can't be auto-read. Add a short bio below for stronger AI alignment.";
    }

    const { error } = await supabase
      .from("attendee_founder_profile" as never)
      .upsert(
        {
          user_id: userId,
          source: data.source,
          source_file_path: data.source_file_path ?? null,
          linkedin_url: data.linkedin_url ?? null,
          raw_text: resolvedRawText || null,
          extracted: extracted as unknown,
          extracted_at: new Date().toISOString(),
        } as never,
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { extracted, note: noteToUser };
  });

// ===================== Market profile =====================

const MarketSchema = z.object({
  archetype: z.array(z.string().max(60)).max(8).optional().default([]),
  geography: z.string().max(120).optional().nullable(),
  industry: z.string().max(160).optional().nullable(),
  channels: z.array(z.string().max(60)).max(8).optional().default([]),
  customer_type: z.enum(["b2c", "b2b", "both"]).optional().nullable(),
  market_note: z.string().max(2000).optional().nullable(),
});

export const getMarketProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("attendee_market_profile" as never)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { profile: data ?? null };
  });

export const upsertMarketProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => MarketSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("attendee_market_profile" as never)
      .upsert({ user_id: userId, ...data } as never, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===================== Summaries to founder memory =====================

const SummaryOutputSchema = z.object({
  summary: z.string().min(1).max(2000),
  bullets: z.array(z.string().min(1).max(280)).min(2).max(5),
});

function hashStr(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

async function writeMemory(
  userId: string,
  source: "founder_profile" | "market_model",
  contentHash: string,
  payload: { summary: string; bullets: string[]; qa: unknown; fieldKeys: string[]; blockN: number },
) {
  const sourceKey = source;
  const { data: existing } = await supabaseAdmin
    .from("attendee_founder_memory")
    .select("id, content_hash, summary, bullets")
    .eq("user_id", userId)
    .eq("source", source)
    .eq("source_key", sourceKey)
    .is("superseded_at", null)
    .maybeSingle();

  if (existing && existing.content_hash === contentHash && existing.summary) {
    return { cached: true, summary: existing.summary, bullets: (existing.bullets as string[]) ?? [] };
  }
  if (existing) {
    await supabaseAdmin
      .from("attendee_founder_memory")
      .update({ superseded_at: new Date().toISOString() })
      .eq("id", existing.id);
  }
  const { error } = await supabaseAdmin.from("attendee_founder_memory").insert({
    user_id: userId,
    source,
    source_key: sourceKey,
    block_n: payload.blockN,
    field_keys: payload.fieldKeys,
    qa: payload.qa as never,
    summary: payload.summary,
    bullets: payload.bullets,
    model: "google/gemini-3-flash-preview",
    content_hash: contentHash,
  });
  if (error) throw new Error(error.message);
  return { cached: false, summary: payload.summary, bullets: payload.bullets };
}

export const summarizeFounderProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: prof, error } = await supabaseAdmin
      .from("attendee_founder_profile" as never)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!prof) throw new Error("No founder profile yet");

    const p = prof as Record<string, unknown>;
    const extracted = (p.extracted ?? {}) as ExtractedFounder;
    const qa = [
      { key: "headline", label: "Headline", answer: extracted.headline ?? "" },
      { key: "years_experience", label: "Years of experience", answer: String(extracted.years_experience ?? "") },
      { key: "roles", label: "Roles", answer: (extracted.roles ?? []).map((r) => `${r.title}${r.company ? ` @ ${r.company}` : ""}`).join("; ") },
      { key: "skills", label: "Skills", answer: (extracted.skills ?? []).join(", ") },
      { key: "industries", label: "Industries", answer: (extracted.industries ?? []).join(", ") },
      { key: "wins", label: "Notable wins", answer: (extracted.wins ?? []).join("; ") },
      { key: "right_person_reason", label: "Why they're the right person", answer: (p.right_person_reason as string) ?? "" },
      { key: "unfair_advantage", label: "Unfair advantage", answer: (p.unfair_advantage as string) ?? "" },
    ];
    const hash = hashStr(JSON.stringify(qa));

    const cached = await supabaseAdmin
      .from("attendee_founder_memory")
      .select("id, content_hash, summary, bullets")
      .eq("user_id", userId)
      .eq("source", "founder_profile")
      .is("superseded_at", null)
      .maybeSingle();
    if (cached.data?.content_hash === hash && cached.data.summary) {
      return { summary: cached.data.summary, bullets: (cached.data.bullets as string[]) ?? [], cached: true };
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
    const model = createLovableAiGatewayProvider(apiKey)("google/gemini-3-flash-preview");
    const prompt = [
      "You are an encouraging startup coach reflecting a founder's background back to them.",
      'Use second person ("you", "your startup"). Always say "startup", never "business". Do not invent facts.',
      "",
      "Founder details:",
      ...qa.map((q) => `- ${q.label}: ${q.answer || "(none)"}`),
      "",
      "Return:",
      "- summary: 3–5 sentence prose recap focused on the founder's edge for this startup.",
      "- bullets: 3–4 short bullets (≤ 18 words each) of the most useful facts for downstream AI deliverables.",
    ].join("\n");

    const { output } = await generateText({ model, output: Output.object({ schema: SummaryOutputSchema }), prompt });
    const out = output as { summary: string; bullets: string[] };
    return writeMemory(userId, "founder_profile", hash, {
      summary: out.summary,
      bullets: out.bullets,
      qa,
      fieldKeys: qa.map((q) => q.key),
      blockN: 4,
    });
  });

export const summarizeMarketProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: prof, error } = await supabaseAdmin
      .from("attendee_market_profile" as never)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!prof) throw new Error("No market profile yet");
    const p = prof as Record<string, unknown>;

    const qa = [
      { key: "archetype", label: "Business archetype", answer: ((p.archetype as string[]) ?? []).join(", ") },
      { key: "geography", label: "Where you'll operate", answer: (p.geography as string) ?? "" },
      { key: "industry", label: "Industry", answer: (p.industry as string) ?? "" },
      { key: "channels", label: "Primary channels", answer: ((p.channels as string[]) ?? []).join(", ") },
      { key: "customer_type", label: "Who pays", answer: (p.customer_type as string) ?? "" },
      { key: "market_note", label: "Market note", answer: (p.market_note as string) ?? "" },
    ];
    const hash = hashStr(JSON.stringify(qa));

    const cached = await supabaseAdmin
      .from("attendee_founder_memory")
      .select("id, content_hash, summary, bullets")
      .eq("user_id", userId)
      .eq("source", "market_model")
      .is("superseded_at", null)
      .maybeSingle();
    if (cached.data?.content_hash === hash && cached.data.summary) {
      return { summary: cached.data.summary, bullets: (cached.data.bullets as string[]) ?? [], cached: true };
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
    const model = createLovableAiGatewayProvider(apiKey)("google/gemini-3-flash-preview");
    const prompt = [
      "You are an encouraging startup coach recapping the market and model the founder just described.",
      'Use second person. Always say "startup", never "business". Do not invent facts.',
      "",
      "Market & model answers:",
      ...qa.map((q) => `- ${q.label}: ${q.answer || "(none)"}`),
      "",
      "Return:",
      "- summary: 3–5 sentence prose recap explaining what kind of startup this is and who it serves.",
      "- bullets: 3–4 short bullets (≤ 18 words each) of the most useful facts for downstream AI deliverables.",
    ].join("\n");

    const { output } = await generateText({ model, output: Output.object({ schema: SummaryOutputSchema }), prompt });
    const out = output as { summary: string; bullets: string[] };
    return writeMemory(userId, "market_model", hash, {
      summary: out.summary,
      bullets: out.bullets,
      qa,
      fieldKeys: qa.map((q) => q.key),
      blockN: 5,
    });
  });

// ===================== Resume upload signed URL =====================

const ResumeUploadInput = z.object({
  filename: z.string().trim().min(1).max(200),
  mime: z.string().trim().min(1).max(120),
});

export const createResumeUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ResumeUploadInput.parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const safe = data.filename.replace(/[^\w.\-]+/g, "_");
    const id = crypto.randomUUID();
    const path = `${userId}/founder/${id}-${safe}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("attendee-docs")
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, token: signed.token, signedUrl: signed.signedUrl };
  });

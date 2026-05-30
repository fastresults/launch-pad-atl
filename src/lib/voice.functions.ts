import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TranscribeInput = z.object({
  audio_base64: z.string().min(16).max(20 * 1024 * 1024),
  mime_type: z.string().min(3).max(100),
  context: z.string().max(1000).optional(),
});

// The AI SDK's openai-compatible adapter only accepts wav/mp3 audio parts,
// which MediaRecorder cannot produce in the browser. Call the Lovable AI
// Gateway directly so we can pass the recorded webm/opus (or mp4) audio to
// Gemini, which accepts these formats natively.
export const transcribeAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TranscribeInput.parse(i))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt =
      "You are a precise transcription engine. Output ONLY the spoken words verbatim in clean punctuation. " +
      "No preamble, no commentary, no quotation marks.";

    const userParts: Array<Record<string, unknown>> = [];
    if (data.context) {
      userParts.push({
        type: "text",
        text: `Context (for terminology only, do not include in transcript): ${data.context}`,
      });
    }
    userParts.push({ type: "text", text: "Transcribe this audio:" });
    userParts.push({
      type: "input_audio",
      input_audio: {
        data: data.audio_base64,
        format: data.mime_type.split(";")[0].replace(/^audio\//, ""),
      },
    });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userParts },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Transcription failed (${res.status}): ${body.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { text };
  });

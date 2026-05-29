import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const TranscribeInput = z.object({
  // base64-encoded audio bytes (without data: prefix)
  audio_base64: z.string().min(16).max(20 * 1024 * 1024),
  // mime, e.g. audio/webm;codecs=opus, audio/mp4, audio/mpeg, audio/wav
  mime_type: z.string().min(3).max(100),
  // optional priming context for better transcription accuracy
  context: z.string().max(1000).optional(),
});

export const transcribeAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TranscribeInput.parse(i))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-2.5-flash");

    // Decode base64 to Uint8Array (server-side)
    const binary = Uint8Array.from(Buffer.from(data.audio_base64, "base64"));

    const { text } = await generateText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a precise transcription engine. Output ONLY the spoken words verbatim in clean punctuation. " +
            "No preamble, no commentary, no quotation marks.",
        },
        {
          role: "user",
          content: [
            ...(data.context
              ? [{ type: "text" as const, text: `Context (for terminology only, do not include in transcript): ${data.context}` }]
              : []),
            { type: "text" as const, text: "Transcribe this audio:" },
            { type: "file" as const, mediaType: data.mime_type, data: binary },
          ],
        },
      ],
    });

    return { text: text.trim() };
  });

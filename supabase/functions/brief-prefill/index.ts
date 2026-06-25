// Brief prefill: ingests one or more uploaded documents/images/audio and
// returns AI-derived answers for the 10 Startup Brief QA fields.
//
// Strategy per file:
//  - txt/md/rtf  → decode (strip RTF control words)
//  - docx        → mammoth extractRawText
//  - pdf         → attach as Gemini `file` content block (Gemini reads PDFs natively)
//  - png/jpg     → attach as `image_url` content block
//  - audio       → transcribe via Lovable AI STT endpoint, then treat as text
//  - other       → reject with a clear per-file message
//
// One consolidated chat-completions call to Gemini returns a JSON object with
// the 10 brief field keys, each `{ answer, source_filename, source_snippet,
// confidence }`. The function never invents content; if a field isn't covered
// in the docs, the model returns empty `answer` and confidence "low".

import mammoth from "npm:mammoth@1.7.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const MAX_FILES = 5;
const MAX_BYTES = 20 * 1024 * 1024;

const BRIEF_FIELDS: { key: string; label: string }[] = [
  { key: "one_line_pitch", label: "In one sentence, what is the startup?" },
  { key: "origin_story", label: "Why are YOU starting this? (origin story)" },
  { key: "problem_statement", label: "What real problem are you solving?" },
  { key: "target_customer", label: "Who is the customer? Describe them vividly." },
  { key: "unique_insight", label: "What do you know that competitors don't?" },
  { key: "offer_description", label: "What's the first thing you'd sell?" },
  { key: "pricing_idea", label: "What's it worth — and what would you charge?" },
  { key: "business_model", label: "How does money flow? (one-time, subscription, retainer, …)" },
  { key: "inspiration_brands", label: "Brands you admire — and why?" },
  { key: "twelve_month_vision", label: "If 12 months from now this is working, what does it look like?" },
];

type ExtractResult =
  | { kind: "text"; filename: string; text: string }
  | { kind: "pdf"; filename: string; dataUrl: string }
  | { kind: "image"; filename: string; dataUrl: string }
  | { kind: "error"; filename: string; error: string };

const TEXT_MIMES = new Set([
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "application/rtf",
  "text/rtf",
]);
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PDF_MIME = "application/pdf";
const IMAGE_MIMES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const AUDIO_MIMES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/m4a",
]);

function stripRtf(text: string): string {
  return text
    .replace(/\\par[d]?/g, "\n")
    .replace(/\{\*?\\[^{}]+}|[{}]|\\[A-Za-z]+-?\d* ?/g, "")
    .replace(/\r/g, "")
    .trim();
}

function bytesToDataUrl(bytes: Uint8Array, mime: string): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

async function transcribeAudio(file: File): Promise<string> {
  const extMap: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/ogg": "ogg",
    "audio/m4a": "m4a",
  };
  const mime = (file.type || "audio/webm").split(";")[0];
  const ext = extMap[mime] ?? "webm";
  const upstream = new FormData();
  upstream.append("model", "openai/gpt-4o-mini-transcribe");
  upstream.append("file", file, `recording.${ext}`);
  const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
    body: upstream,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`STT ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  return (json?.text as string) ?? "";
}

async function extractOne(file: File): Promise<ExtractResult> {
  const mime = (file.type || "").split(";")[0].toLowerCase();
  const filename = file.name || "file";
  try {
    if (file.size > MAX_BYTES) {
      return { kind: "error", filename, error: `Too large (>${Math.round(MAX_BYTES / 1024 / 1024)} MB).` };
    }
    if (TEXT_MIMES.has(mime) || filename.toLowerCase().endsWith(".md") || filename.toLowerCase().endsWith(".txt")) {
      let text = await file.text();
      if (mime.includes("rtf") || filename.toLowerCase().endsWith(".rtf")) text = stripRtf(text);
      return { kind: "text", filename, text };
    }
    if (mime === DOCX_MIME || filename.toLowerCase().endsWith(".docx")) {
      const buf = new Uint8Array(await file.arrayBuffer());
      const { value } = await mammoth.extractRawText({ buffer: buf });
      return { kind: "text", filename, text: value };
    }
    if (mime === PDF_MIME || filename.toLowerCase().endsWith(".pdf")) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      return { kind: "pdf", filename, dataUrl: bytesToDataUrl(bytes, "application/pdf") };
    }
    if (IMAGE_MIMES.has(mime)) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      return { kind: "image", filename, dataUrl: bytesToDataUrl(bytes, mime) };
    }
    if (AUDIO_MIMES.has(mime)) {
      const text = await transcribeAudio(file);
      return { kind: "text", filename, text };
    }
    return { kind: "error", filename, error: `Unsupported file type: ${mime || "unknown"}.` };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { kind: "error", filename, error: message };
  }
}

function buildSystemPrompt(): string {
  const fieldList = BRIEF_FIELDS.map((f, i) => `  ${i + 1}. "${f.key}" — ${f.label}`).join("\n");
  return `You are helping a first-time founder pre-fill a 10-question Startup Brief from documents they've already written (decks, one-pagers, notes, voice memos).

Your job: read the sources and produce a draft answer for each of these 10 fields, in the founder's own voice:

${fieldList}

Rules:
- Write each answer the way the founder would say it out loud — natural, plain, 1-3 sentences.
- Use ONLY information present in the sources. NEVER invent facts, names, numbers, customers, or vision statements.
- If the sources don't clearly cover a field, return an empty "answer" string and confidence "low". Do not guess.
- For each answer, include a short "source_snippet" (a verbatim phrase from the sources, ≤ 25 words) and the "source_filename" it came from.
- Return ONLY valid JSON matching this exact shape, no markdown, no commentary:

{
  "suggestions": {
    "one_line_pitch":     { "answer": "", "source_filename": "", "source_snippet": "", "confidence": "high" | "medium" | "low" },
    "origin_story":       { "answer": "", "source_filename": "", "source_snippet": "", "confidence": "high" | "medium" | "low" },
    "problem_statement":  { "answer": "", "source_filename": "", "source_snippet": "", "confidence": "high" | "medium" | "low" },
    "target_customer":    { "answer": "", "source_filename": "", "source_snippet": "", "confidence": "high" | "medium" | "low" },
    "unique_insight":     { "answer": "", "source_filename": "", "source_snippet": "", "confidence": "high" | "medium" | "low" },
    "offer_description":  { "answer": "", "source_filename": "", "source_snippet": "", "confidence": "high" | "medium" | "low" },
    "pricing_idea":       { "answer": "", "source_filename": "", "source_snippet": "", "confidence": "high" | "medium" | "low" },
    "business_model":     { "answer": "", "source_filename": "", "source_snippet": "", "confidence": "high" | "medium" | "low" },
    "inspiration_brands": { "answer": "", "source_filename": "", "source_snippet": "", "confidence": "high" | "medium" | "low" },
    "twelve_month_vision":{ "answer": "", "source_filename": "", "source_snippet": "", "confidence": "high" | "medium" | "low" }
  }
}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const inForm = await req.formData();
    const fileEntries = inForm.getAll("files").filter((f): f is File => f instanceof File);
    if (fileEntries.length === 0) {
      return new Response(JSON.stringify({ error: "No files uploaded." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (fileEntries.length > MAX_FILES) {
      return new Response(JSON.stringify({ error: `Max ${MAX_FILES} files per upload.` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = await Promise.all(fileEntries.map(extractOne));
    const warnings = extracted.filter((e): e is Extract<ExtractResult, { kind: "error" }> => e.kind === "error")
      .map((e) => `${e.filename}: ${e.error}`);
    const usable = extracted.filter((e) => e.kind !== "error") as Exclude<ExtractResult, { kind: "error" }>[];

    if (usable.length === 0) {
      return new Response(JSON.stringify({ error: "None of the uploaded files could be read.", warnings }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build a Gemini-flavored multimodal user content array.
    const content: any[] = [{
      type: "text",
      text: "Here are the founder's source documents. Use only what they contain to fill the 10 brief fields.",
    }];
    for (const r of usable) {
      if (r.kind === "text") {
        const trimmed = r.text.slice(0, 60_000);
        content.push({ type: "text", text: `--- FILE: ${r.filename} ---\n${trimmed}` });
      } else if (r.kind === "pdf") {
        content.push({ type: "text", text: `--- FILE: ${r.filename} (PDF attached) ---` });
        content.push({
          type: "file",
          file: { filename: r.filename, file_data: r.dataUrl },
        });
      } else if (r.kind === "image") {
        content.push({ type: "text", text: `--- FILE: ${r.filename} (image attached) ---` });
        content.push({ type: "image_url", image_url: { url: r.dataUrl } });
      }
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text().catch(() => "");
      return new Response(
        JSON.stringify({ error: `AI gateway ${aiRes.status}: ${txt.slice(0, 300)}`, warnings }),
        { status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    const suggestions: Record<string, { answer: string; source_filename: string; source_snippet: string; confidence: string }> = {};
    const incoming = parsed?.suggestions ?? parsed ?? {};
    for (const f of BRIEF_FIELDS) {
      const s = incoming?.[f.key] ?? {};
      suggestions[f.key] = {
        answer: typeof s.answer === "string" ? s.answer : "",
        source_filename: typeof s.source_filename === "string" ? s.source_filename : "",
        source_snippet: typeof s.source_snippet === "string" ? s.source_snippet : "",
        confidence: (["high", "medium", "low"].includes(s.confidence) ? s.confidence : "low") as string,
      };
    }

    return new Response(
      JSON.stringify({
        suggestions,
        sourceFiles: usable.map((u) => u.filename),
        warnings,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

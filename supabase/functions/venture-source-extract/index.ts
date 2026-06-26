// Extract text from one attendee_documents row and cache it back into
// `extracted_text`. Called by the front-end venture-sources helper right after
// an upload so every drop zone shares one source of truth.
//
// Supports PDF (via Gemini file attachment), DOCX (mammoth), TXT/MD/RTF
// (inline), and images PNG/JPG/WebP (via Gemini OCR). Audio is not handled
// here — those still go through brief-prefill / venture-transcribe.
import { createClient } from "npm:@supabase/supabase-js@2";
import mammoth from "npm:mammoth@1.7.2";
import { markSnapshotBrainDirty } from "../_shared/snapshot-brain.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const MAX_BYTES = 20 * 1024 * 1024;
const TEXT_EXT = new Set(["txt", "md", "markdown", "rtf"]);
const IMAGE_MIMES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

function stripRtf(s: string) {
  return s.replace(/\\par[d]?/g, "\n").replace(/\{\*?\\[^{}]+}|[{}]|\\[A-Za-z]+-?\d* ?/g, "").replace(/\r/g, "").trim();
}

function bytesToDataUrl(bytes: Uint8Array, mime: string) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return `data:${mime};base64,${btoa(binary)}`;
}

async function geminiTranscribe(content: any[]): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "Extract the readable text from the attached document or image, verbatim. Preserve paragraph breaks. Do not summarize. If the file contains tables, render them as plain text. Output only the extracted text — no preamble." },
        { role: "user", content },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Gateway ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return (j?.choices?.[0]?.message?.content ?? "").toString();
}

async function extract(bytes: Uint8Array, filename: string, mime: string): Promise<string> {
  const lower = filename.toLowerCase();
  const ext = lower.split(".").pop() ?? "";
  if (TEXT_EXT.has(ext) || mime.startsWith("text/")) {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return ext === "rtf" || mime.includes("rtf") ? stripRtf(text) : text.trim();
  }
  if (ext === "docx" || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const { value } = await mammoth.extractRawText({ buffer: bytes });
    return (value ?? "").trim();
  }
  if (ext === "pdf" || mime === "application/pdf") {
    return await geminiTranscribe([
      { type: "text", text: `Extract all readable text from this PDF (${filename}).` },
      { type: "file", file: { filename, file_data: bytesToDataUrl(bytes, "application/pdf") } },
    ]);
  }
  if (IMAGE_MIMES.has(mime) || ["png", "jpg", "jpeg", "webp"].includes(ext)) {
    const m = mime || (ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg");
    return await geminiTranscribe([
      { type: "text", text: `OCR all readable text from this image (${filename}).` },
      { type: "image_url", image_url: { url: bytesToDataUrl(bytes, m) } },
    ]);
  }
  throw new Error(`Unsupported file type: ${mime || ext || "unknown"}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { documentId } = await req.json();
    if (!documentId) return new Response(JSON.stringify({ error: "documentId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: doc, error: loadErr } = await admin
      .from("attendee_documents").select("*").eq("id", documentId).maybeSingle();
    if (loadErr || !doc) throw new Error(loadErr?.message ?? "Document not found");
    if (doc.user_id !== user.id) throw new Error("Forbidden");

    const { data: blob, error: dlErr } = await admin.storage.from("attendee-docs").download(doc.storage_path);
    if (dlErr || !blob) throw new Error(dlErr?.message ?? "Could not download file");
    const buf = new Uint8Array(await blob.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) throw new Error("File too large to extract");

    let text = "";
    let extractionError: string | null = null;
    try {
      text = await extract(buf, doc.original_name ?? "file", doc.mime_type ?? "");
    } catch (e) {
      extractionError = e instanceof Error ? e.message : String(e);
    }
    if (text.length > 200_000) text = text.slice(0, 200_000);

    await admin.from("attendee_documents").update({
      extracted_text: text || null,
      extracted_at: new Date().toISOString(),
      extraction_error: extractionError,
    }).eq("id", documentId);

    // New source material → brain is stale. Next AI call will recompute.
    if (doc.snapshot_id && text) {
      markSnapshotBrainDirty(admin, doc.snapshot_id).catch(() => {});
    }

    return new Response(JSON.stringify({ ok: true, charCount: text.length, error: extractionError }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

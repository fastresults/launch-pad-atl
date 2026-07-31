// Extract a founder profile from raw text, LinkedIn URL, and/or uploaded resume.
// Persists raw_text, linkedin_url, source_file_path, and extracted JSON into
// public.attendee_founder_profile for the calling user.
import { createClient } from "npm:@supabase/supabase-js@2";
import mammoth from "npm:mammoth@1.7.2";
import { resolveOwner } from "../_shared/impersonation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string" },
    years_experience: { type: "number" },
    roles: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" }, company: { type: "string" } },
        required: ["title"],
        additionalProperties: false,
      },
    },
    skills: { type: "array", items: { type: "string" } },
    industries: { type: "array", items: { type: "string" } },
    wins: { type: "array", items: { type: "string" } },
  },
  required: ["headline", "roles", "skills", "industries", "wins"],
  additionalProperties: false,
};

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
        { role: "system", content: "Extract the readable text from the attached document or image, verbatim. Preserve paragraph breaks. Do not summarize. Output only the extracted text — no preamble." },
        { role: "user", content },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Gateway ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return (j?.choices?.[0]?.message?.content ?? "").toString();
}

async function downloadResumeText(admin: any, path: string): Promise<string> {
  const { data, error } = await admin.storage.from("attendee-docs").download(path);
  if (error || !data) return "";
  try {
    const bytes = new Uint8Array(await data.arrayBuffer());
    const lower = path.toLowerCase();
    const ext = lower.split(".").pop() ?? "";
    const mime = (data as Blob).type ?? "";

    if (TEXT_EXT.has(ext) || mime.startsWith("text/")) {
      const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      return (ext === "rtf" || mime.includes("rtf") ? stripRtf(text) : text).trim();
    }
    if (ext === "docx" || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const { value } = await mammoth.extractRawText({ buffer: bytes });
      return (value ?? "").trim();
    }
    if (ext === "pdf" || mime === "application/pdf") {
      return (await geminiTranscribe([
        { type: "text", text: `Extract all readable text from this PDF resume.` },
        { type: "file", file: { filename: path.split("/").pop() ?? "resume.pdf", file_data: bytesToDataUrl(bytes, "application/pdf") } },
      ])).trim();
    }
    if (IMAGE_MIMES.has(mime) || ["png", "jpg", "jpeg", "webp"].includes(ext)) {
      const m = mime || (ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg");
      return (await geminiTranscribe([
        { type: "text", text: `OCR all readable text from this resume image.` },
        { type: "image_url", image_url: { url: bytesToDataUrl(bytes, m) } },
      ])).trim();
    }
    return "";
  } catch (e) {
    console.error("[founder-extract] resume extract failed", e);
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Impersonation: an admin may act on a member's behalf (validated server-side).
    const _own = await resolveOwner(req, user.id, userClient, corsHeaders);
    if (_own.error) return _own.error;
    const effectiveUserId = _own.userId;

    const body = await req.json().catch(() => ({}));
    const raw_text: string | null = body.raw_text ?? null;
    const linkedin_url: string | null = body.linkedin_url ?? null;
    const source: string = body.source ?? "manual";
    const source_file_path: string | null = body.source_file_path ?? null;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Build the text corpus for the LLM.
    let corpus = "";
    if (raw_text && raw_text.trim().length >= 20) {
      corpus += `PASTED BACKGROUND:\n${raw_text.trim()}\n\n`;
    }
    let extractedResumeText = "";
    if (source_file_path) {
      extractedResumeText = await downloadResumeText(admin, source_file_path);
      if (extractedResumeText && extractedResumeText.length > 80) {
        corpus += `RESUME (extracted text):\n${extractedResumeText.slice(0, 18000)}\n\n`;
      }
    }
    if (linkedin_url) {
      corpus += `LINKEDIN URL: ${linkedin_url}\n\n`;
    }

    let extracted: Record<string, unknown> = {};
    let note: string | null = null;

    if (corpus.trim().length < 40) {
      note = "Not enough background to extract — paste your bio or upload a resume.";
    } else {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You extract a founder profile as structured JSON. Be concise. Use the user's own words. Omit any field you can't ground in the text.",
            },
            {
              role: "user",
              content: `Extract a founder profile from the following sources. Return JSON matching the schema.\n\n${corpus}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: { name: "founder_profile", schema: EXTRACT_SCHEMA, strict: true },
          },
        }),
      });
      if (!aiRes.ok) {
        const errTxt = await aiRes.text();
        console.error("[founder-extract] AI error", aiRes.status, errTxt);
        if (aiRes.status === 429) note = "AI is rate-limited right now — try again in a moment.";
        else if (aiRes.status === 402 || aiRes.status === 403) note = "AI credit limit reached on this workspace.";
        else note = "Couldn't read your background — please try again.";
      } else {
        const j = await aiRes.json();
        const content = j?.choices?.[0]?.message?.content ?? "{}";
        try { extracted = JSON.parse(content); } catch { extracted = {}; }
      }
    }

    // Persist everything in a single upsert.
    const payload: Record<string, unknown> = {
      user_id: effectiveUserId,
      source,
      raw_text: raw_text ?? (extractedResumeText && extractedResumeText.length > 80 ? extractedResumeText.slice(0, 18000) : null),
      linkedin_url: linkedin_url ?? null,
      source_file_path: source_file_path ?? null,
    };
    if (extracted && Object.keys(extracted).length > 0) {
      payload.extracted = extracted;
      payload.extracted_at = new Date().toISOString();
    }

    const { error: upErr } = await admin
      .from("attendee_founder_profile")
      .upsert(payload, { onConflict: "user_id" });
    if (upErr) {
      console.error("[founder-extract] upsert error", upErr);
      return new Response(JSON.stringify({ error: upErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark all of the user's snapshots brain-dirty so any future AI run
    // rebuilds context with the freshly extracted founder facts.
    await admin
      .from("venture_snapshots")
      .update({ snapshot_brain_dirty: true })
      .eq("user_id", effectiveUserId);

    return new Response(JSON.stringify({ extracted, note }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[founder-extract] fatal", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

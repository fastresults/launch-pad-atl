// Ingest one `brain_materials` row into the founder's Second Brain.
//
// Three passes, AI-first:
//   1. Extract  — text inline, DOCX via mammoth, PDF/images via the gateway.
//   2. Understand — one structured call producing title/summary/key points/tags.
//   3. Index    — summary header chunk + full-text chunks embedded into
//                 founder_brain_memory with kind = 'material'.
//
// Only this material's memory rows are replaced, so adding a document next
// week never wipes or re-embeds the rest of the brain.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import mammoth from "npm:mammoth@1.7.2";
import { chunkText, embedTexts, toVectorLiteral } from "../_shared/brain-embed.ts";
import { aiFetch } from "../_shared/ai-fetch.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const MAX_TEXT = 200_000;
const EMBED_BATCH = 8;
const TEXT_EXT = new Set(["txt", "md", "markdown", "csv", "json", "log", "rtf", "html", "htm"]);
const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "webp", "gif"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function bytesToDataUrl(bytes: Uint8Array, mime: string) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return `data:${mime};base64,${btoa(binary)}`;
}

function stripRtf(s: string) {
  return s.replace(/\\par[d]?/g, "\n").replace(/\{\*?\\[^{}]+}|[{}]|\\[A-Za-z]+-?\d* ?/g, "").replace(/\r/g, "").trim();
}

function stripHtml(s: string) {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// deno-lint-ignore no-explicit-any
async function gatewayRead(content: any[]): Promise<string> {
  const res = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Lovable-API-Key": LOVABLE_API_KEY,
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Extract the readable text from the attached document or image, verbatim. Preserve paragraph breaks and headings. Do not summarize. Render tables as plain text. Output only the extracted text — no preamble.",
        },
        { role: "user", content },
      ],
    }),
  }, { timeoutMs: 120_000, retries: 1 });
  if (!res.ok) throw new Error(`Read failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return (j?.choices?.[0]?.message?.content ?? "").toString();
}

async function extractFromBytes(bytes: Uint8Array, filename: string, mime: string): Promise<string> {
  const lower = (filename || "").toLowerCase();
  const ext = lower.includes(".") ? lower.split(".").pop()! : "";
  if (TEXT_EXT.has(ext) || mime.startsWith("text/") || mime === "application/json") {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    if (ext === "rtf" || mime.includes("rtf")) return stripRtf(text);
    if (ext === "html" || ext === "htm" || mime.includes("html")) return stripHtml(text);
    return text.trim();
  }
  if (ext === "docx" || mime.includes("wordprocessingml")) {
    const { value } = await mammoth.extractRawText({ buffer: bytes });
    return (value ?? "").trim();
  }
  if (ext === "pdf" || mime === "application/pdf") {
    return await gatewayRead([
      { type: "text", text: `Extract all readable text from this PDF (${filename}).` },
      { type: "file", file: { filename: filename || "document.pdf", file_data: bytesToDataUrl(bytes, "application/pdf") } },
    ]);
  }
  if (IMAGE_EXT.has(ext) || mime.startsWith("image/")) {
    const m = mime && mime.startsWith("image/")
      ? mime
      : ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    return await gatewayRead([
      { type: "text", text: `OCR all readable text from this image (${filename}). Describe any charts or diagrams in words after the text.` },
      { type: "image_url", image_url: { url: bytesToDataUrl(bytes, m) } },
    ]);
  }
  // Decks and spreadsheets: hand the raw file to the gateway and let it read.
  return await gatewayRead([
    { type: "text", text: `Extract all readable text and tabular content from this file (${filename}).` },
    { type: "file", file: { filename: filename || "document", file_data: bytesToDataUrl(bytes, mime || "application/octet-stream") } },
  ]);
}

type Understanding = {
  title: string;
  summary: string;
  key_points: string[];
  tags: string[];
  doc_kind: string;
};

async function understand(text: string, fallbackTitle: string): Promise<Understanding> {
  const res = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Lovable-API-Key": LOVABLE_API_KEY,
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-5.6-sol",
      reasoning_effort: "none",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You read a founder's business document and file it into their Second Brain. Reply with JSON only, shaped: " +
            '{"title": string, "summary": string, "key_points": string[], "tags": string[], "doc_kind": string}. ' +
            "title: under 8 words, human, specific to this document. summary: one sentence, under 30 words, plain English. " +
            "key_points: 3 to 6 short bullets carrying the facts a founder would want recalled later (numbers, dates, names, terms). " +
            "tags: 2 to 5 lowercase single-word or hyphenated topics such as pricing, legal, competitor, brand, operations. " +
            "doc_kind: a short label such as contract, pitch deck, financials, research, notes, invoice, marketing.",
        },
        { role: "user", content: text.slice(0, 60_000) },
      ],
    }),
  }, { timeoutMs: 90_000, retries: 1 });
  if (!res.ok) throw new Error(`Understand failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  const raw = (j?.choices?.[0]?.message?.content ?? "{}").toString();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) { try { parsed = JSON.parse(m[0]); } catch { /* noop */ } }
  }
  const arr = (v: unknown) =>
    Array.isArray(v) ? v.map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 8) : [];
  return {
    title: String(parsed.title ?? "").trim().slice(0, 120) || fallbackTitle,
    summary: String(parsed.summary ?? "").trim().slice(0, 400),
    key_points: arr(parsed.key_points),
    tags: arr(parsed.tags).map((t) => t.toLowerCase().replace(/\s+/g, "-")).slice(0, 5),
    doc_kind: String(parsed.doc_kind ?? "").trim().slice(0, 40) || "document",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) return json({ error: "Missing auth" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: ures } = await userClient.auth.getUser();
    const userId = ures?.user?.id;
    if (!userId) return json({ error: "Not signed in" }, 401);

    const body = await req.json().catch(() => ({}));
    const materialId = typeof body?.materialId === "string" ? body.materialId : "";
    if (!materialId) return json({ error: "materialId required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: material } = await admin
      .from("brain_materials")
      .select("*")
      .eq("id", materialId)
      .maybeSingle();
    if (!material) return json({ error: "Material not found" }, 404);
    if (material.user_id !== userId) {
      const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: userId });
      if (!isAdmin) return json({ error: "Forbidden" }, 403);
    }

    // deno-lint-ignore no-explicit-any
    const anyRuntime = (globalThis as any).EdgeRuntime;
    const work = runIngest(admin, material);
    if (anyRuntime?.waitUntil) anyRuntime.waitUntil(work);
    else work.catch((e) => console.error("brain-material-ingest background failed", e));

    return json({ materialId, status: "processing" }, 202);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

// deno-lint-ignore no-explicit-any
async function runIngest(admin: any, material: any) {
  const id = material.id as string;
  const touch = async (patch: Record<string, unknown>) => {
    const { error } = await admin.from("brain_materials").update(patch).eq("id", id);
    if (error) console.error("material update failed", error.message);
  };

  try {
    await touch({ status: "reading", error_message: null });

    // ---- 1. Extract -------------------------------------------------------
    let text = "";
    if (material.source_type === "link" && material.source_url) {
      const res = await fetch(material.source_url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; StartupLabsBrain/1.0)" },
      });
      if (!res.ok) throw new Error(`Could not fetch link (${res.status})`);
      const ct = res.headers.get("content-type") ?? "";
      const raw = await res.text();
      text = ct.includes("html") || /^\s*</.test(raw) ? stripHtml(raw) : raw.trim();
    } else {
      const { data: blob, error: dlErr } = await admin.storage
        .from(material.storage_bucket || "attendee-docs")
        .download(material.storage_path);
      if (dlErr || !blob) throw new Error(dlErr?.message ?? "Could not download file");
      const bytes = new Uint8Array(await blob.arrayBuffer());
      text = await extractFromBytes(bytes, material.title ?? "file", material.mime_type ?? "");
    }

    text = (text ?? "").trim();
    if (!text) throw new Error("No readable text found in this file");
    const truncated = text.length > MAX_TEXT;
    if (truncated) text = text.slice(0, MAX_TEXT);

    await touch({ status: "understanding", extracted_text: text });

    // ---- 2. Understand ----------------------------------------------------
    let read: Understanding;
    try {
      read = await understand(text, material.title ?? "Untitled material");
    } catch (e) {
      console.error("understand failed, continuing with raw text", e);
      read = {
        title: material.title ?? "Untitled material",
        summary: "",
        key_points: [],
        tags: [],
        doc_kind: "document",
      };
    }

    await touch({
      status: "indexing",
      title: read.title,
      summary: read.summary || null,
      key_points: read.key_points,
      tags: read.tags,
      doc_kind: read.doc_kind,
    });

    // ---- 3. Index ---------------------------------------------------------
    // Replace only this material's chunks.
    await admin.from("founder_brain_memory").delete().eq("kind", "material").eq("source_ref", id);

    const header = [
      `Material: ${read.title}`,
      read.doc_kind ? `Type: ${read.doc_kind}` : "",
      read.summary ? `Summary: ${read.summary}` : "",
      read.key_points.length ? `Key points:\n${read.key_points.map((p) => `- ${p}`).join("\n")}` : "",
      read.tags.length ? `Tags: ${read.tags.join(", ")}` : "",
    ].filter(Boolean).join("\n");

    const pieces = [header, ...chunkText(text)].filter((p) => p && p.trim().length > 0);

    let embedded = 0;
    for (let i = 0; i < pieces.length; i += EMBED_BATCH) {
      const batch = pieces.slice(i, i + EMBED_BATCH);
      const vectors = await embedTexts(batch);
      const rows = batch.map((content, k) => ({
        user_id: material.user_id,
        snapshot_id: material.snapshot_id,
        kind: "material",
        source_ref: id,
        title: read.title,
        content,
        embedding: toVectorLiteral(vectors[k]),
        metadata: {
          material_id: id,
          doc_kind: read.doc_kind,
          tags: read.tags,
          chunk: i + k,
          is_summary: i + k === 0,
        },
      }));
      const { error } = await admin.from("founder_brain_memory").insert(rows);
      if (error) throw new Error(error.message);
      embedded += rows.length;
    }

    await touch({
      status: "ready",
      chunk_count: embedded,
      error_message: truncated ? "Very long file — only the first 200,000 characters were indexed." : null,
    });
  } catch (e) {
    console.error("brain-material-ingest failed", e);
    await touch({ status: "failed", error_message: e instanceof Error ? e.message : String(e) });
  }
}

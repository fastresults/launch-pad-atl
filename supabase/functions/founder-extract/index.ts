// Extract a founder profile from raw text, LinkedIn URL, and/or uploaded resume.
// Persists raw_text, linkedin_url, source_file_path, and extracted JSON into
// public.attendee_founder_profile for the calling user.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

async function downloadResumeText(admin: any, path: string): Promise<string> {
  const { data, error } = await admin.storage.from("attendee-docs").download(path);
  if (error || !data) return "";
  // Best-effort: read PDF/DOCX as text. Real text extraction varies; for PDF we
  // fall back to raw bytes-as-utf8 which usually yields readable strings for
  // text-based PDFs. Users with scanned PDFs should paste text instead.
  try {
    const buf = new Uint8Array(await data.arrayBuffer());
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const txt = decoder.decode(buf);
    // Strip binary noise; keep printable ASCII + common whitespace.
    return txt.replace(/[^\x09\x0A\x0D\x20-\x7E]+/g, " ").replace(/\s{2,}/g, " ").trim();
  } catch {
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
    if (source_file_path) {
      const resumeText = await downloadResumeText(admin, source_file_path);
      if (resumeText && resumeText.length > 80) {
        corpus += `RESUME (extracted text):\n${resumeText.slice(0, 18000)}\n\n`;
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
      user_id: user.id,
      source,
      raw_text: raw_text ?? null,
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

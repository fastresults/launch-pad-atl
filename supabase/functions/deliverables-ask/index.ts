// Deliverables AI ask: retrieves relevant chunks from the user's venture_documents
// using keyword scoring (RLS-scoped via JWT), then synthesizes an answer with citations.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const STOP = new Set([
  "the","a","an","and","or","but","of","to","in","on","for","with","is","are","be",
  "this","that","it","as","by","at","from","my","our","we","us","you","your","what",
  "how","why","when","which","who","do","does","i","me","about","into","over","using",
]);

function tokenize(s: string): string[] {
  return (s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function chunkText(text: string, size = 900, overlap = 150): string[] {
  if (!text) return [];
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    out.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });

    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const question: string = (body?.question ?? "").toString().trim();
    const snapshotId: string | undefined = body?.snapshot_id || undefined;
    if (!question) {
      return new Response(JSON.stringify({ error: "Missing question" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load user's snapshots
    const snapQ = supabase
      .from("venture_snapshots")
      .select("id, company_name")
      .eq("user_id", userRes.user.id);
    const { data: snaps } = snapshotId ? await snapQ.eq("id", snapshotId) : await snapQ;
    const snapIds = (snaps ?? []).map((s) => s.id);
    if (snapIds.length === 0) {
      return new Response(
        JSON.stringify({ answer: "No deliverables found.", citations: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const snapNameById = new Map((snaps ?? []).map((s) => [s.id, s.company_name]));

    const { data: docs } = await supabase
      .from("venture_documents")
      .select("id, snapshot_id, document_type, content, updated_at")
      .in("snapshot_id", snapIds)
      .eq("status", "complete");

    const { data: types } = await supabase
      .from("venture_document_types")
      .select("type, name, category");
    const typeMap = new Map((types ?? []).map((t) => [t.type, t]));

    // Keyword score chunks
    const qTokens = tokenize(question);
    const qSet = new Set(qTokens);
    type Scored = {
      docId: string;
      snapshotId: string;
      docType: string;
      docName: string;
      category: string;
      chunkIndex: number;
      text: string;
      score: number;
    };
    const scored: Scored[] = [];
    for (const d of docs ?? []) {
      if (!d.content) continue;
      const meta = typeMap.get(d.document_type);
      const chunks = chunkText(d.content);
      chunks.forEach((c, idx) => {
        const toks = tokenize(c);
        let s = 0;
        for (const t of toks) if (qSet.has(t)) s += 1;
        // boost if doc name/type matches
        const nameToks = tokenize(meta?.name ?? d.document_type);
        for (const t of nameToks) if (qSet.has(t)) s += 2;
        if (s > 0) {
          scored.push({
            docId: d.id,
            snapshotId: d.snapshot_id,
            docType: d.document_type,
            docName: meta?.name ?? d.document_type,
            category: meta?.category ?? "",
            chunkIndex: idx,
            text: c,
            score: s,
          });
        }
      });
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 8);

    if (top.length === 0) {
      return new Response(
        JSON.stringify({
          answer:
            "I couldn't find anything in your deliverables that matches that question. Try rephrasing or pick a suggested prompt.",
          citations: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sourcesBlock = top
      .map(
        (s, i) =>
          `[${i + 1}] ${s.docName} (${snapNameById.get(s.snapshotId) ?? "venture"})\n${s.text}`,
      )
      .join("\n\n---\n\n");

    const system = `You are a founder's research assistant. Answer the user's question using ONLY the numbered sources below. Cite sources inline as [1], [2], etc. If the sources don't contain the answer, say so plainly. Keep the answer under 220 words, use short paragraphs or a tight bullet list, and stay specific to this founder's venture.`;

    const userMsg = `QUESTION:\n${question}\n\nSOURCES:\n${sourcesBlock}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return new Response(
        JSON.stringify({ error: `AI gateway: ${aiRes.status}`, detail: txt }),
        { status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiRes.json();
    const answer: string = aiJson?.choices?.[0]?.message?.content ?? "";

    const citations = top.map((s, i) => ({
      index: i + 1,
      document_id: s.docId,
      snapshot_id: s.snapshotId,
      document_name: s.docName,
      category: s.category,
      snippet: s.text.slice(0, 280),
    }));

    return new Response(JSON.stringify({ answer, citations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

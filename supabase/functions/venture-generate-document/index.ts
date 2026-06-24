// Founders Hub — generate one venture document.
// Loads the snapshot + document_type spec + any dependency docs, asks the
// Lovable AI Gateway to produce markdown, scores it, and persists the row.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

export async function generateOne(supabase: any, snapshotId: string, documentType: string) {
  const [{ data: snap }, { data: type }] = await Promise.all([
    supabase.from("venture_snapshots").select("*").eq("id", snapshotId).maybeSingle(),
    supabase.from("venture_document_types").select("*").eq("type", documentType).maybeSingle(),
  ]);
  if (!snap) throw new Error("Snapshot not found");
  if (!type) throw new Error(`Unknown document type: ${documentType}`);

  // Mark as generating
  await supabase.from("venture_documents").upsert({
    snapshot_id: snapshotId,
    document_type: documentType,
    status: "generating",
  }, { onConflict: "snapshot_id,document_type" });

  // Load dependency docs for context
  const deps: string[] = type.dependencies ?? [];
  let depContext = "";
  if (deps.length) {
    const { data: depDocs } = await supabase
      .from("venture_documents")
      .select("document_type, content")
      .eq("snapshot_id", snapshotId)
      .in("document_type", deps);
    depContext = (depDocs ?? [])
      .filter((d: any) => d.content)
      .map((d: any) => `## ${d.document_type}\n${d.content}`)
      .join("\n\n---\n\n");
  }

  const systemPrompt = `You are an AI venture analyst writing investor-grade documents.
Produce a single document in clean Markdown. Use ## headings, short paragraphs, and bullet lists.
Be specific, plausible, and actionable. Never use filler like "TBD" or "[insert ...]".
Target ~600-900 words unless the doc type is brief.

After the markdown, on a final line, output exactly:
QUALITY_SCORE: <0-100 integer reflecting completeness, specificity, and investor-readiness>`;

  const userPrompt = [
    `# Document to produce: ${type.name}`,
    `Description: ${type.description}`,
    `Category: ${type.category}`,
    `\n## Venture brief (extracted_data)\n${JSON.stringify(snap.extracted_data ?? {}, null, 2)}`,
    snap.business_concept ? `\n## Founder's raw concept\n${snap.business_concept}` : "",
    depContext ? `\n## Upstream documents you should build on\n${depContext}` : "",
  ].filter(Boolean).join("\n\n");

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!aiRes.ok) {
    const txt = await aiRes.text();
    await supabase.from("venture_documents").update({ status: "failed" })
      .eq("snapshot_id", snapshotId).eq("document_type", documentType);
    await supabase.from("venture_generation_failures").insert({
      snapshot_id: snapshotId, document_type: documentType, error: `Gateway ${aiRes.status}: ${txt.slice(0, 300)}`,
    });
    throw new Error(`Gateway ${aiRes.status}`);
  }

  const aiJson = await aiRes.json();
  let raw = aiJson.choices?.[0]?.message?.content ?? "";

  // Extract quality score line
  let quality = 75;
  const qm = raw.match(/QUALITY_SCORE:\s*(\d{1,3})/i);
  if (qm) {
    quality = Math.max(0, Math.min(100, parseInt(qm[1], 10)));
    raw = raw.replace(/QUALITY_SCORE:\s*\d{1,3}\s*$/i, "").trim();
  }

  const wordCount = raw.split(/\s+/).filter(Boolean).length;

  // Read existing for version history
  const { data: existing } = await supabase
    .from("venture_documents")
    .select("version, content, content_version_history")
    .eq("snapshot_id", snapshotId)
    .eq("document_type", documentType)
    .maybeSingle();

  const nextVersion = existing?.content ? (existing.version ?? 1) + 1 : 1;
  const history = Array.isArray(existing?.content_version_history) ? existing.content_version_history : [];
  if (existing?.content) {
    history.unshift({ version: existing.version ?? 1, content: existing.content, archived_at: new Date().toISOString() });
  }

  await supabase.from("venture_documents").upsert({
    snapshot_id: snapshotId,
    document_type: documentType,
    status: "complete",
    content: raw,
    word_count: wordCount,
    quality_score: quality,
    version: nextVersion,
    content_version_history: history.slice(0, 10),
  }, { onConflict: "snapshot_id,document_type" });

  return { wordCount, quality };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { snapshotId, documentType } = await req.json();
    if (!snapshotId || !documentType) {
      return new Response(JSON.stringify({ error: "snapshotId and documentType required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const result = await generateOne(supabase, snapshotId, documentType);
    return new Response(JSON.stringify({ ok: true, ...result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// Snapshot Brain: a one-time compressed venture summary that every later
// deliverable reuses instead of rebuilding context from scratch.
//
// Computed by calling the gateway once with structured output, persisted to
// venture_snapshots.snapshot_brain. Refreshed only when source materials or
// research brief change (caller decides — we just expose the function).

import type { VentureBrain } from "./venture-context.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const BRAIN_SYSTEM = `You are a venture analyst. Compress everything we know about this startup into a tight JSON object that downstream document generators will reuse.

Output ONLY valid JSON matching this schema (no prose, no markdown, no fences):
{
  "identity": { "company_name": string, "founder": string, "one_liner": string },
  "problem": string,            // 1-2 sentences
  "solution": string,           // 1-2 sentences
  "customer": string,           // who they serve, specifically
  "business_model_summary": string,  // how they make money, 1-2 sentences
  "market_facts": string[],     // 4-8 concrete, verifiable facts about the market
  "differentiators": string[],  // 3-5 reasons they win vs. status quo
  "known_numbers": object,      // any numbers the founder has confirmed (pricing, costs, revenue, runway, headcount)
  "banned_assumptions": string[] // things downstream docs MUST NOT invent (e.g. "do not assume hiring", "do not assume VC funding")
}

Rules:
- Every value is grounded in the supplied context. NEVER invent numbers.
- Keep total output under 1500 characters.
- Use plain English. No buzzwords, no TBD, no placeholders.`;

export async function computeSnapshotBrain(supabase: any, snapshotId: string): Promise<VentureBrain> {
  const { data: snap } = await supabase
    .from("venture_snapshots")
    .select("*")
    .eq("id", snapshotId)
    .maybeSingle();
  if (!snap) throw new Error("Snapshot not found");

  const sm = snap.source_materials ?? {};
  const docText = Array.isArray(sm.documents)
    ? sm.documents.map((d: any, i: number) => `### Doc ${i + 1}: ${d.filename ?? ""}\n${String(d.text ?? "").slice(0, 4000)}`).join("\n\n")
    : "";
  const urlText = Array.isArray(sm.urls)
    ? sm.urls.map((u: any, i: number) => `### URL ${i + 1}: ${u.url ?? ""}\n${String(u.text ?? "").slice(0, 3000)}`).join("\n\n")
    : "";

  const userPrompt = [
    `# Snapshot facts`,
    `Company: ${snap.company_name ?? ""}`,
    `Founder: ${snap.founder_name ?? ""}`,
    `Industry: ${snap.industry ?? ""}${snap.sub_industry ? ` / ${snap.sub_industry}` : ""}`,
    `Track: ${snap.track ?? "lifestyle"}`,
    `Location: ${[snap.city, snap.region, snap.country].filter(Boolean).join(", ")} (scope: ${snap.market_scope ?? "local"})`,
    snap.concept_summary ? `Concept: ${snap.concept_summary}` : "",
    snap.value_proposition ? `Value prop: ${snap.value_proposition}` : "",
    snap.differentiation_statement ? `Differentiation: ${snap.differentiation_statement}` : "",
    snap.business_concept ? `\n## Founder's raw concept\n${snap.business_concept}` : "",
    snap.extracted_data ? `\n## Extracted brief\n${JSON.stringify(snap.extracted_data).slice(0, 6000)}` : "",
    snap.research_brief ? `\n## Research brief\n${JSON.stringify(snap.research_brief).slice(0, 10000)}` : "",
    docText ? `\n## Founder-uploaded documents\n${docText}` : "",
    urlText ? `\n## Founder-supplied URLs\n${urlText}` : "",
  ].filter(Boolean).join("\n\n");

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: BRAIN_SYSTEM },
        { role: "user", content: userPrompt.slice(0, 60_000) },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!aiRes.ok) {
    const txt = await aiRes.text();
    throw new Error(`Gateway ${aiRes.status}: ${txt.slice(0, 300)}`);
  }
  const json = await aiRes.json();
  const content = json.choices?.[0]?.message?.content ?? "{}";
  let brain: VentureBrain;
  try {
    brain = JSON.parse(content);
  } catch {
    // Salvage: strip code fences and retry
    const cleaned = String(content).replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    brain = JSON.parse(cleaned);
  }
  brain.generated_at = new Date().toISOString();

  await supabase
    .from("venture_snapshots")
    .update({ snapshot_brain: brain, snapshot_brain_updated_at: brain.generated_at })
    .eq("id", snapshotId);

  return brain;
}

/**
 * Lazy variant: returns the cached brain on the snapshot if present, else
 * computes & persists one. Safe to call from any generator.
 */
export async function ensureSnapshotBrain(supabase: any, snapshotId: string): Promise<VentureBrain | null> {
  const { data: snap } = await supabase
    .from("venture_snapshots")
    .select("snapshot_brain")
    .eq("id", snapshotId)
    .maybeSingle();
  if (snap?.snapshot_brain) return snap.snapshot_brain as VentureBrain;
  try {
    return await computeSnapshotBrain(supabase, snapshotId);
  } catch (e) {
    console.error("ensureSnapshotBrain failed", e);
    return null;
  }
}

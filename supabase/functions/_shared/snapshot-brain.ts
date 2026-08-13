// Snapshot Brain: a one-time compressed venture summary that every later
// deliverable reuses instead of rebuilding context from scratch.
//
// Computed by calling the gateway once with structured output, persisted to
// venture_snapshots.snapshot_brain. Refreshed whenever upstream data changes
// (new uploaded source, new intake writeback, concept refine, etc.) — set
// `snapshot_brain_dirty=true` from those code paths and ensureSnapshotBrain
// will recompute on next demand.

import { compactPreamble, loadVentureContext, renderSources, type VentureBrain } from "./venture-context.ts";
import { loadCorpusDigest } from "./brain-corpus.ts";
import { aiFetch } from "./ai-fetch.ts";

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
  // Build input from the same canonical context every generator uses, so the
  // brain stays in lockstep with what the rest of the pipeline reasons over.
  const ctx = await loadVentureContext(supabase, snapshotId);

  // Everything the founder put in their Second Brain (uploaded materials,
  // notes, extracted sources) so the compressed brain — and therefore every
  // downstream generator — reflects the latest corpus.
  const corpus = await loadCorpusDigest(supabase, ctx.userId, snapshotId);

  const userPrompt = [
    compactPreamble(ctx),
    ctx.snap.business_concept ? `\n## Founder's raw concept\n${ctx.snap.business_concept}` : "",
    corpus ? `\n## Founder's Second Brain corpus (authoritative)\n${corpus}` : "",
    ctx.sources.documents.length || ctx.sources.urls.length
      ? `\n## Founder-supplied source materials\n${renderSources(ctx, 4000)}`
      : "",
  ].filter(Boolean).join("\n\n");

  // Brain is a small, structured task — use flash-lite for ~5x cost savings.
  const aiRes = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-lite",
      messages: [
        { role: "system", content: BRAIN_SYSTEM },
        { role: "user", content: userPrompt.slice(0, 40_000) },
      ],
      response_format: { type: "json_object" },
    }),
  }, { timeoutMs: 60_000 });

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
    const cleaned = String(content).replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    brain = JSON.parse(cleaned);
  }
  brain.generated_at = new Date().toISOString();

  // Compliance rules are operator-set legal facts, never model output. Carry
  // them across every rebuild so a refresh can't silently drop a legal lock.
  const { data: prior } = await supabase
    .from("venture_snapshots")
    .select("snapshot_brain")
    .eq("id", snapshotId)
    .maybeSingle();
  const priorRules = (prior?.snapshot_brain as VentureBrain | null)?.compliance_rules;
  if (Array.isArray(priorRules) && priorRules.length) brain.compliance_rules = priorRules;

  // Persist and clear the dirty flag in one round-trip.
  await supabase
    .from("venture_snapshots")
    .update({
      snapshot_brain: brain,
      snapshot_brain_updated_at: brain.generated_at,
      snapshot_brain_dirty: false,
    })
    .eq("id", snapshotId);


  return brain;
}

/**
 * Lazy variant: returns the cached brain on the snapshot when present AND
 * clean. Recomputes when missing or when snapshot_brain_dirty=true (set by
 * the source-extract / intake-writeback / concept-refine paths).
 */
export async function ensureSnapshotBrain(supabase: any, snapshotId: string): Promise<VentureBrain | null> {
  const { data: snap } = await supabase
    .from("venture_snapshots")
    .select("snapshot_brain, snapshot_brain_dirty")
    .eq("id", snapshotId)
    .maybeSingle();
  if (snap?.snapshot_brain && !snap?.snapshot_brain_dirty) {
    return snap.snapshot_brain as VentureBrain;
  }
  try {
    return await computeSnapshotBrain(supabase, snapshotId);
  } catch (e) {
    console.error("ensureSnapshotBrain failed", e);
    return (snap?.snapshot_brain as VentureBrain) ?? null;
  }
}

/**
 * Mark the snapshot brain as stale. Fire-and-forget from any code path that
 * mutates upstream source data (new uploaded document, scraped URL, intake
 * writeback, concept refine). Cheap (single UPDATE) and idempotent.
 */
export async function markSnapshotBrainDirty(supabase: any, snapshotId: string): Promise<void> {
  if (!snapshotId) return;
  try {
    await supabase
      .from("venture_snapshots")
      .update({ snapshot_brain_dirty: true })
      .eq("id", snapshotId);
  } catch (e) {
    console.warn("markSnapshotBrainDirty failed", e);
  }
}

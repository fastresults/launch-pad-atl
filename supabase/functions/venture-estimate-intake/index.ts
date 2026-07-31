// AI estimator for IntakeGatewayDialog. Given a deliverable's intake schema +
// current user values, returns best-guess values for empty fields grounded in
// the venture's canonical context (brief, profile, source materials, brain).
//
// Input: { snapshot_id, deliverable_type, schema, current_values }
// Output: { estimates: Record<string, any>, notes?: string }

import { createClient } from "npm:@supabase/supabase-js@2";
import { jsonResponse, requireSnapshotOwner, requireUser } from "../_shared/auth.ts";
import { aiFetch } from "../_shared/ai-fetch.ts";
import { compactPreamble, loadVentureContext, renderSources } from "../_shared/venture-context.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (Array.isArray(v)) return v.length === 0;
  return String(v).trim().length === 0;
}

function schemaDigest(schema: any, currentValues: Record<string, any>) {
  const fields = Array.isArray(schema?.fields) ? schema.fields : [];
  return fields.map((f: any) => ({
    id: f.id,
    label: f.label,
    type: f.type,
    required: !!f.required,
    help: f.help ?? undefined,
    options: f.options ?? undefined,
    columns: f.columns
      ? f.columns.map((c: any) => ({ id: c.id, label: c.label, type: c.type }))
      : undefined,
    current: currentValues?.[f.id],
    empty: isEmpty(currentValues?.[f.id]),
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = await requireUser(req, corsHeaders);
    if (auth.error) return auth.error;

    const body = await req.json();
    const snapshotId = String(body?.snapshot_id ?? "");
    const deliverableType = String(body?.deliverable_type ?? "deliverable");
    const schema = body?.schema ?? {};
    const currentValues = (body?.current_values ?? {}) as Record<string, any>;

    if (!snapshotId) return jsonResponse({ error: "snapshot_id required" }, 400, corsHeaders);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const own = await requireSnapshotOwner(supabase, snapshotId, auth.userId!, corsHeaders);
    if (own.error) return own.error;

    const ctx = await loadVentureContext(supabase, snapshotId);
    const preamble = compactPreamble(ctx);
    const sourcesBlock = renderSources(ctx, 2500);
    const digest = schemaDigest(schema, currentValues);
    const emptyIds = digest.filter((d: any) => d.empty).map((d: any) => d.id);

    if (emptyIds.length === 0) {
      return jsonResponse({ estimates: {}, notes: "All fields already filled." }, 200, corsHeaders);
    }

    const system = `You are a startup financial/business analyst helping a novice founder fill out an intake form for the "${deliverableType}" deliverable. You must produce realistic, conservative best-guess values for the EMPTY fields only, grounded in the venture's known context. Never overwrite fields the user already filled. When uncertain, prefer industry-typical small-business values. Output ONLY valid JSON, no prose.`;

    const userPrompt = `${preamble}

${sourcesBlock ? `## Source materials (founder-supplied)\n${sourcesBlock}\n` : ""}

## Intake schema (with current values)
${JSON.stringify(digest, null, 2)}

## Task
Return JSON: { "estimates": { "<field_id>": <value>, ... }, "notes": "<1-sentence summary of assumptions>" }

Rules:
- ONLY include keys for these empty field ids: ${JSON.stringify(emptyIds)}
- Use the field's "type" to format values:
  - text/textarea → short string (1-3 sentences max)
  - number/currency/percent → plain number, no symbols, no commas
  - select → must be one of "options"
  - rows → array of objects matching "columns" (3-5 rows max, realistic line items)
- Be specific to this venture's industry, stage, and known financials. Avoid generic placeholders.
- Round currency to clean numbers (e.g. 5000, 12500).`;

    const aiRes = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      const msg =
        aiRes.status === 429
          ? "AI is rate-limited. Try again in a moment."
          : aiRes.status === 402
            ? "Workspace AI credits are exhausted."
            : "AI estimate failed.";
      return jsonResponse({ error: msg, detail: txt.slice(0, 300) }, aiRes.status, corsHeaders);
    }

    const json = await aiRes.json();
    const raw = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { estimates?: Record<string, any>; notes?: string } = {};
    try { parsed = JSON.parse(raw); } catch { /* ignore */ }

    // Filter to empty-field ids only, just in case the model strayed.
    const allowed = new Set(emptyIds);
    const estimates: Record<string, any> = {};
    for (const [k, v] of Object.entries(parsed.estimates ?? {})) {
      if (allowed.has(k)) estimates[k] = v;
    }

    return jsonResponse({ estimates, notes: parsed.notes ?? null }, 200, corsHeaders);
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Unknown error" },
      500,
      corsHeaders,
    );
  }
});

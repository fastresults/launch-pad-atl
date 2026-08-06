// Derive intake answers for a gated asset from the venture's finished assets.
//
// Some deliverables (budget pro-forma, staffing plan, etc.) declare an
// intake_schema — a short form the founder fills in. Bulk runs used to drop
// every one of those assets, so a founder with 60 finished assets would press
// "Generate remaining" and watch the job complete without writing anything.
//
// By the time those assets are the only thing left, the numbers already exist
// in the work on file: pricing, unit economics, the financial model, the
// hiring plan, the tool stack. This module reads that work and fills the form
// with concrete, defensible values, flagged as inferred so the founder can
// correct them.

import { aiFetch } from "./ai-fetch.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

// Assets that most often carry the numbers an intake form asks for.
const SIGNAL_TYPES = [
  "offer_and_pricing",
  "pricing_strategy",
  "unit_economics",
  "financial_model",
  "revenue_model",
  "cost_structure",
  "business_model_canvas",
  "operations_plan",
  "hiring_plan",
  "org_and_roles",
  "tool_stack",
  "go_to_market_plan",
  "launch_plan",
  "executive_summary",
];

type Field = {
  id: string;
  label?: string;
  type?: string;
  help?: string;
  required?: boolean;
  options?: string[];
  default?: any;
  columns?: { id: string; label?: string; type?: string }[];
};

function fieldSpec(f: Field): string {
  const bits = [
    `- ${f.id} (${f.type ?? "text"}${f.required ? ", required" : ""}): ${f.label ?? f.id}`,
  ];
  if (f.help) bits.push(`  note: ${f.help}`);
  if (f.options?.length) bits.push(`  one of: ${f.options.join(" | ")}`);
  if (f.columns?.length) {
    bits.push(
      `  array of objects with keys: ${f.columns.map((c) => `${c.id} (${c.type ?? "text"})`).join(", ")}`,
    );
  }
  return bits.join("\n");
}

function coerce(field: Field, value: any): any {
  if (value === undefined || value === null) return value;
  const t = field.type ?? "text";
  if (t === "currency" || t === "number" || t === "percent") {
    const n = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  if (t === "rows") return Array.isArray(value) ? value : [];
  if (t === "select") {
    if (!field.options?.length) return String(value);
    const hit = field.options.find((o) => o.toLowerCase() === String(value).trim().toLowerCase());
    return hit ?? field.default ?? field.options[0];
  }
  return typeof value === "string" ? value : String(value);
}

export type DerivedIntake = {
  answers: Record<string, any>;
  basis: Record<string, string>;
};

/**
 * Infer answers for `intakeSchema` from the venture's completed assets.
 * Returns null when there isn't enough material or the model call fails, so
 * the caller can record a real blocked_reason instead of silently skipping.
 */
export async function deriveIntakeAnswers(
  supabase: any,
  snapshotId: string,
  snap: any,
  documentType: string,
  documentName: string,
  intakeSchema: any,
): Promise<DerivedIntake | null> {
  const fields: Field[] = Array.isArray(intakeSchema?.fields) ? intakeSchema.fields : [];
  if (!fields.length) return null;

  const { data: docs } = await supabase
    .from("venture_documents")
    .select("document_type, content")
    .eq("snapshot_id", snapshotId)
    .eq("status", "complete");

  const byType = new Map<string, string>();
  for (const d of docs ?? []) {
    if (typeof d?.content === "string" && d.content.trim()) byType.set(d.document_type, d.content);
  }
  if (!byType.size) return null;

  const picked: string[] = [];
  for (const t of SIGNAL_TYPES) {
    const c = byType.get(t);
    if (c) picked.push(`### ${t}\n${c.slice(0, 4000)}`);
  }
  for (const [t, c] of byType) {
    if (picked.length >= 10) break;
    if (!SIGNAL_TYPES.includes(t)) picked.push(`### ${t}\n${c.slice(0, 1500)}`);
  }
  if (!picked.length) return null;

  const sys = `You fill in a founder's intake form for the deliverable "${documentName}" by reading the venture's own finished assets.

Rules:
- Answer EVERY field. No nulls, no "TBD", no placeholders.
- Ground each value in the assets below. Where the assets don't state a number, infer a realistic one from what they do state (pricing, market, stage, cost structure) and keep it conservative.
- Currency and number fields must be plain numbers (no symbols, no commas). Percent fields are numbers like 30, not 0.3.
- Select fields must use one of the listed options verbatim.
- "rows" fields are arrays of objects using exactly the listed column keys. Return an empty array only when the venture genuinely has none.

Return JSON only, in this shape:
{ "answers": { "<field id>": <value>, ... }, "basis": { "<field id>": "one short sentence naming the asset or reasoning behind it" } }`;

  const user = `Venture: ${snap?.company_name ?? "Unnamed venture"}
Industry: ${snap?.industry ?? "—"}
Concept: ${(snap?.concept_summary ?? snap?.business_concept ?? "").slice(0, 1500)}

## Fields to fill
${fields.map(fieldSpec).join("\n")}

## Finished assets to infer from
${picked.join("\n\n")}`;

  let parsed: any;
  try {
    const res = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    }, { timeoutMs: 120_000, retries: 1 });
    if (!res.ok) {
      console.warn(`intake derive gateway ${res.status} for ${documentType}`);
      return null;
    }
    const json = await res.json();
    parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "");
  } catch (e) {
    console.warn(`intake derive failed for ${documentType}`, e);
    return null;
  }

  const rawAnswers = parsed?.answers ?? parsed;
  if (!rawAnswers || typeof rawAnswers !== "object") return null;

  const answers: Record<string, any> = {};
  for (const f of fields) {
    const v = coerce(f, rawAnswers[f.id]);
    if (v !== undefined && v !== null && v !== "") answers[f.id] = v;
    else if (f.default !== undefined) answers[f.id] = f.default;
  }

  // Every required field must land, otherwise the asset would generate on air.
  const missing = fields.filter((f) => f.required && answers[f.id] === undefined);
  if (missing.length) {
    console.warn(`intake derive incomplete for ${documentType}: ${missing.map((m) => m.id).join(", ")}`);
    return null;
  }

  const basis: Record<string, string> = {};
  if (parsed?.basis && typeof parsed.basis === "object") {
    for (const f of fields) {
      const b = parsed.basis[f.id];
      if (typeof b === "string" && b.trim()) basis[f.id] = b.trim();
    }
  }

  await supabase.from("venture_documents").upsert({
    snapshot_id: snapshotId,
    document_type: documentType,
    intake_answers: answers,
    intake_source: "derived",
  }, { onConflict: "snapshot_id,document_type" });

  return { answers, basis };
}

/** Prompt block telling the writer these inputs were inferred, not confirmed. */
export function derivedIntakeBlock(derived: DerivedIntake, fields: Field[]): string {
  const labelFor = (id: string) => fields.find((f) => f.id === id)?.label ?? id;
  const lines = Object.entries(derived.answers).map(([id, v]) => {
    const val = Array.isArray(v) ? `${v.length} item(s)` : String(v);
    const why = derived.basis[id] ? ` — ${derived.basis[id]}` : "";
    return `- ${labelFor(id)}: ${val}${why}`;
  });
  return `\n## Inputs (inferred from the founder's existing assets — not confirmed by them)
${lines.join("\n")}

Open the asset with a short "Assumptions used" note listing these inputs and where each came from, and tell the founder they can correct any of them and regenerate. Then write the asset normally using these values.`;
}

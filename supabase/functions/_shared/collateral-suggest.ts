// AI gap-fill for the collateral text inventory.
//
// The "Confirm your details" form should arrive already filled in. Structured
// records (profile, snapshot, brand kit) cover a handful of fields; everything
// else — website, tagline, entity line, payment terms, social handle — is
// usually sitting in prose the founder already wrote: their business brief and
// their finished assets. This reads that prose and proposes values, each with a
// one-line basis so the founder knows where it came from.

import { aiFetch } from "./ai-fetch.ts";
import { FIELD_SPECS, normalizeField, type ContactDetails, type FieldKey } from "./collateral-fields.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

/** Fields worth inferring. Names/emails are personal — never invented. */
const SUGGESTABLE: FieldKey[] = [
  "company",
  "tagline",
  "person_title",
  "website",
  "social",
  "address_city",
  "address_state",
  "legal_entity",
  "payment_terms",
  "voice",
];

/** Assets most likely to state contact-ish facts. */
const SIGNAL_TYPES = [
  "executive_summary",
  "offer_and_pricing",
  "pricing_strategy",
  "go_to_market_plan",
  "launch_plan",
  "brand_positioning",
  "website_prd",
  "legal_structure",
  "formation_checklist",
  "operations_plan",
];

export type Suggestion = { value: string; basis: string };
export type Suggestions = Partial<Record<FieldKey, Suggestion>>;

function tidy(s: unknown) {
  return String(s ?? "").trim();
}

export async function suggestDetails(
  admin: any,
  snapshotId: string,
  vctx: any,
  seeded: ContactDetails,
): Promise<Suggestions> {
  if (!LOVABLE_API_KEY) return {};

  const gaps = SUGGESTABLE.filter((k) => !tidy(seeded[k]));
  if (!gaps.length) return {};

  const { data: docs } = await admin
    .from("venture_documents")
    .select("document_type, content")
    .eq("snapshot_id", snapshotId)
    .eq("status", "complete")
    .limit(120);

  const byType = new Map<string, string>();
  for (const d of docs ?? []) {
    if (typeof d?.content === "string" && d.content.trim()) byType.set(d.document_type, d.content);
  }

  const picked: string[] = [];
  for (const t of SIGNAL_TYPES) {
    const c = byType.get(t);
    if (c) picked.push(`### ${t}\n${c.slice(0, 3500)}`);
  }
  for (const [t, c] of byType) {
    if (picked.length >= 8) break;
    if (!SIGNAL_TYPES.includes(t)) picked.push(`### ${t}\n${c.slice(0, 1200)}`);
  }

  const snap = vctx?.snap ?? {};
  const brief = vctx?.brief ?? {};
  const briefText = JSON.stringify(brief ?? {}).slice(0, 6000);
  if (!picked.length && briefText.length < 40) return {};

  const specLines = gaps.map((k) => {
    const spec = FIELD_SPECS.find((f) => f.key === k);
    return `- ${k}: ${spec?.label ?? k} — ${spec?.help ?? ""}`.trim();
  });

  const sys = `You fill gaps in a founder's print-collateral text inventory by reading their own material.

Rules:
- Only answer a field when the material actually supports it. Omit a field entirely rather than inventing one.
- Never invent an email address, phone number, street address, tax ID, or a domain that is not stated in the material.
- "website" must be a bare domain (no https://, no trailing slash) and only if it appears in the material.
- "tagline" must be under 60 characters. "person_title" should be short and concrete.
- "voice" is 1-2 sentences describing how the brand sounds.
- Keep every value in the founder's own words where possible.

Return JSON only:
{ "fields": { "<key>": { "value": "<string>", "basis": "<short sentence naming where it came from>" } } }`;

  const user = `Venture: ${tidy(snap.company_name) || "Unnamed venture"}
Industry: ${tidy(snap.industry) || "—"}
Location: ${[tidy(snap.city), tidy(snap.region)].filter(Boolean).join(", ") || "—"}
Concept: ${tidy(snap.concept_summary || snap.value_proposition).slice(0, 1200)}

## Fields still blank
${specLines.join("\n")}

## Business brief (raw)
${briefText}

## Finished assets
${picked.join("\n\n") || "(none yet)"}`;

  let parsed: any;
  try {
    const res = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "none",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    }, { timeoutMs: 120_000, retries: 1 });
    if (!res.ok) {
      console.warn(`[collateral-suggest] gateway ${res.status}`);
      return {};
    }
    const json = await res.json();
    parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "");
  } catch (e) {
    console.warn("[collateral-suggest] failed", e);
    return {};
  }

  const raw = parsed?.fields ?? parsed ?? {};
  const out: Suggestions = {};
  for (const key of gaps) {
    const entry = raw?.[key];
    const value = normalizeField(key, tidy(typeof entry === "string" ? entry : entry?.value));
    if (!value) continue;
    if (key === "tagline" && value.length > 80) continue;
    out[key] = {
      value,
      basis: tidy(typeof entry === "object" ? entry?.basis : "") || "inferred from your own material",
    };
  }
  return out;
}

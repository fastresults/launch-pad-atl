// Cheap product-vs-service classifier. Runs once at the top of deep research
// and persists to venture_snapshots.sourcing_profile. Every downstream step
// (sourcing research, doc generation, hub UI) gates on
// sourcing_profile.is_physical_product.

import { aiFetch } from "./ai-fetch.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

export type SourcingProfile = {
  is_physical_product: boolean;
  product_form: "consumable" | "apparel" | "electronics" | "food" | "cosmetic" | "hardware" | "other" | "none";
  sourcing_mode: "private_label" | "manufacture" | "wholesale" | "dropship" | "handmade" | "print_on_demand" | "unknown" | "none";
  regulatory_flags: string[]; // e.g. ["FDA","FCC","CPSC","prop65"]
  rationale: string; // one-sentence explanation
  classified_at: string;
};

const SYSTEM = `You classify whether a startup requires sourcing or manufacturing.
Return ONLY a JSON object matching this schema (no prose, no fences):
{
  "is_physical_product": boolean,
  "product_form": "consumable" | "apparel" | "electronics" | "food" | "cosmetic" | "hardware" | "other" | "none",
  "sourcing_mode": "private_label" | "manufacture" | "wholesale" | "dropship" | "handmade" | "print_on_demand" | "unknown" | "none",
  "regulatory_flags": string[],
  "rationale": string
}

Rules:
- is_physical_product=true only when the venture SELLS or SHIPS a tangible good the founder must source, make, or stock. Software, SaaS, apps, services, agencies, coaching, courses, marketplaces, and events are NOT physical products.
- Restaurants, cafés, bakeries, food trucks, salons, and studios are NOT physical products for this classifier (they buy ingredients/supplies locally — no supplier-discovery research needed).
- Set product_form and sourcing_mode to "none" when is_physical_product=false.
- regulatory_flags: pick from ["FDA","USDA","FCC","CPSC","prop65","FTC_labeling","cosmetic_INCI","childrens_product","medical_device","alcohol_TTB","supplement_DSHEA"] — include only ones that clearly apply, empty array otherwise.
- rationale: one sentence, plain English, grounded in the concept.`;

export async function classifySourcing(input: {
  concept: string;
  industry?: string;
  sub_industry?: string;
  track?: string;
}): Promise<SourcingProfile> {
  const fallback: SourcingProfile = {
    is_physical_product: false,
    product_form: "none",
    sourcing_mode: "none",
    regulatory_flags: [],
    rationale: "Classifier unavailable; defaulted to non-physical.",
    classified_at: new Date().toISOString(),
  };

  try {
    const res = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              `Concept: ${input.concept || "[none]"}`,
              input.industry ? `Industry: ${input.industry}` : "",
              input.sub_industry ? `Sub-industry: ${input.sub_industry}` : "",
              input.track ? `Track: ${input.track}` : "",
            ].filter(Boolean).join("\n"),
          },
        ],
        response_format: { type: "json_object" },
      }),
    }, { timeoutMs: 30_000 });

    if (!res.ok) return fallback;
    const json = await res.json();
    const raw = (json.choices?.[0]?.message?.content ?? "").trim();
    const cleaned = raw.replace(/^```(?:json)?\s*|\s*```$/g, "");
    const parsed = JSON.parse(cleaned);
    return {
      is_physical_product: parsed.is_physical_product === true,
      product_form: parsed.product_form ?? "none",
      sourcing_mode: parsed.sourcing_mode ?? "none",
      regulatory_flags: Array.isArray(parsed.regulatory_flags) ? parsed.regulatory_flags.slice(0, 8) : [],
      rationale: typeof parsed.rationale === "string" ? parsed.rationale.slice(0, 400) : "",
      classified_at: new Date().toISOString(),
    };
  } catch (e) {
    console.warn("classifySourcing failed", e);
    return fallback;
  }
}

// Convenience — compact block ready to paste into any downstream doc prompt.
// Returns "" when there's no sourcing signal so callers can `.filter(Boolean)`.
export function renderSourcingBlock(
  profile: SourcingProfile | null | undefined,
  sourcing: any /* research_brief.sourcing */,
): string {
  if (!profile?.is_physical_product) return "";
  const lines: string[] = ["## Sourcing context (physical product — treat as authoritative)"];
  lines.push(`- Product form: ${profile.product_form} · Sourcing mode: ${profile.sourcing_mode}`);
  if (profile.regulatory_flags?.length) {
    lines.push(`- Regulatory flags: ${profile.regulatory_flags.join(", ")}`);
  }
  if (sourcing && typeof sourcing === "object") {
    if (sourcing.moq_range) lines.push(`- MOQ range: ${sourcing.moq_range}`);
    if (sourcing.unit_cost_range) lines.push(`- Unit cost range: ${sourcing.unit_cost_range}`);
    if (sourcing.lead_time_days) lines.push(`- Lead time (days): ${sourcing.lead_time_days}`);
    if (sourcing.landed_cost_pct) lines.push(`- Landed-cost markup vs unit cost: ${sourcing.landed_cost_pct}`);
    if (Array.isArray(sourcing.suppliers) && sourcing.suppliers.length) {
      lines.push(`- Suppliers under review: ${sourcing.suppliers.slice(0, 6).map((s: any) => s.name ?? s.url ?? "").filter(Boolean).join("; ")}`);
    }
    if (Array.isArray(sourcing.regulatory) && sourcing.regulatory.length) {
      lines.push(`- Regulatory notes: ${sourcing.regulatory.slice(0, 5).join(" · ")}`);
    }
    if (Array.isArray(sourcing.materials) && sourcing.materials.length) {
      lines.push(`- Materials: ${sourcing.materials.slice(0, 5).join(" · ")}`);
    }
  }
  return lines.join("\n");
}

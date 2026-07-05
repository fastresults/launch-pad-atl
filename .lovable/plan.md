## Add "Sourcing & Manufacturing" deep-research track

### What exists today
- `venture-deep-research` already runs before generation and branches on `track` — `ecommerce_dtc` lens mentions COGS, MOQ, supplier sourcing at a paragraph level, but there's no dedicated sourcing research step, no persisted supplier data, no downstream document that consumes it.
- `venture-bulk-generate` + `venture-generate-document` create assets from `research_brief` + `extracted_data`. No sourcing fields.
- Firecrawl + Perplexity are already wired as secrets, so no new connectors needed.

### Recommended approach (three layers)

**1. Gate on product-vs-service classification (cheap, deterministic)**
- Add a `sourcing_profile` derived during concept synthesis with fields: `is_physical_product` (bool), `product_form` (`consumable | apparel | electronics | food | cosmetic | hardware | other`), `sourcing_mode` (`private_label | manufacture | wholesale | dropship | handmade | unknown`), `regulatory_flags` (FDA, FCC, CPSC, prop65, etc.).
- Source: `venture-synthesize-concept` prompt gets a small structured-output extension (Zod schema, no bounds — see gateway rules). If unknown, default `is_physical_product=false` and skip layer 2.

**2. Sourcing deep-research step (only when `is_physical_product=true`)**
- New step inside `venture-deep-research/index.ts` (`step: "sourcing"`), runs after competitor scrape, before synthesis. Persists to `research_artifacts` like every other step so retries are idempotent.
- Inputs: concept + `sourcing_profile`.
- Data collection, in order:
  a. **Supplier discovery** — Firecrawl `/search` across Alibaba, Made-in-China, IndiaMART, ThomasNet, Faire (wholesale), Maker's Row (US mfg), Printful/Printify (POD) — pick 2-3 based on `sourcing_mode`. Time-boxed with per-source caps.
  b. **Benchmarks** — Perplexity `sonar` calls for: typical MOQ, unit cost range, lead time, tooling/mold cost (if applicable), Incoterms norms, freight ballpark, landed-cost rule of thumb.
  c. **Regulatory** — Perplexity `sonar` filtered to `.gov` domains for the `regulatory_flags` list (labeling, testing, certifications).
  d. **Materials** — for `manufacture` mode only, one Perplexity pass on raw-material spot prices / index sources.
- Output artifact `sourcing_brief` merged into `research_brief` under a new `sourcing` key: `{ suppliers[], moq_range, unit_cost_range, lead_time_days, landed_cost_pct, regulatory[], materials[], citations[] }`.

**3. Wire sourcing into generation & auto-gen**
- Extend `_shared/deliverable-prompts.ts` for the docs that already exist but currently ignore sourcing:
  - `financial_model`, `pricing_offer_sheet`, `operating_plan`, `fulfillment_sop`, `go_to_market_plan`, `legal_structure_brief`, `insurance_starter` — inject a `SOURCING CONTEXT` block from `research_brief.sourcing` when present.
- Add **two new asset types** (auto-generated when `is_physical_product=true`, hidden otherwise):
  - `supplier_shortlist` — 5–10 evaluated suppliers with pros/cons, MOQ, lead time, contact URL, first-outreach message.
  - `bom_and_landed_cost` — bill of materials, unit cost stack, landed-cost model with sensitivities, break-even units at current price.
- Register both in `framework-deliverables.ts` under Operations, and add to the 14-day plan on Day 6 or Day 12 (Operations days) via `LAUNCH_14DAY_PLAN.assetKeys`.

### Auto-generation trigger points
- **On concept save** → classifier writes `sourcing_profile`.
- **On "Run deep research"** → sourcing step runs iff physical product; adds 30-90s and ~3-6 gateway calls; guarded by per-snapshot artifact cache so re-runs are free.
- **On bulk-generate** → the two new assets appear in the queue only when the flag is on; existing assets automatically pick up sourcing context via prompt injection with zero user action.
- **In watchdog** → no change; standard retry path applies.

### Cost / latency guardrails
- Cap: 6 Firecrawl calls + 4 Perplexity calls per sourcing pass, ~$0.15–$0.30 credits.
- Skip the whole step if `sourcing_profile.is_physical_product !== true` — services/software founders see zero change.
- Reuse existing `updateProgress` stages so the hub progress UI updates automatically.

### Files touched
- `supabase/functions/venture-synthesize-concept/index.ts` — add classifier output.
- `supabase/functions/venture-deep-research/index.ts` — new `runSourcingStep()`, artifact write, synthesis merge.
- `supabase/functions/_shared/deliverable-prompts.ts` — sourcing context injection + 2 new prompt templates.
- `src/lib/framework-deliverables.ts` — register 2 new asset types, gate visibility on flag.
- `src/lib/launch-14day-plan.ts` — add keys to Day 6 / Day 12.
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — hide the 2 new tiles when flag is off (no other UI change required).
- No schema migration required — everything rides in existing `research_artifacts` / `research_brief` / `extracted_data` JSONB.

### Decisions I need from you
1. **Scope now vs. later**: build all three layers, or ship layer 1+2 first (classifier + research) and add the 2 new asset types in a follow-up?
2. **Supplier surfaces**: OK with the default set (Alibaba, Made-in-China, IndiaMART, ThomasNet, Faire, Maker's Row, Printful/Printify), or restrict to US/nearshore only?
3. **Regulatory depth**: light (bullet list of likely certifications) or heavy (per-cert steps, timelines, cost)?
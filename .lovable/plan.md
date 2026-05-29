## Goal

Surface four deliverables as their own named lines wherever pricing, planning, positioning, and operations show up — in the homepage walkout grid, the `/register` value grid, and the Stage curriculum:

1. **Competitor + value-based pricing**
2. **Business plan with pro formas**
3. **Competitive advantage brief** (the "secret sauce" pulled out of competitive research)
4. **Sourcing & staffing plan** (new — how to source raw goods/services and staff talent, whether you sell a product or a service)

Naming used consistently across surfaces:
- "Competitor + value-based pricing"
- "Business plan with pro formas"
- "Competitive advantage brief"
- "Sourcing & staffing plan"

## Changes

### 1. `src/lib/value-grid.ts`

**Stage 1 (Form)** — insert after the Funding model row:
```
{ stageN: 1, stageLabel: "Form", deliverable: "Business plan with pro formas — narrative plan plus 12-month P&L, cash flow, and break-even pro forma a bank or investor will accept", marketCostMin: 900, marketCostMax: 2500, diyHoursMin: 8, diyHoursMax: 14 }
```

**Stage 2 (Customer)** — add after the existing competitive research row:
```
{ stageN: 2, stageLabel: "Customer", deliverable: "Competitive advantage brief — your 'secret sauce' distilled from research + competitor scan into a positioning line you can defend", marketCostMin: 300, marketCostMax: 300, diyHoursMin: 3, diyHoursMax: 3 }
```

**Stage 3 (Offer)** — split the existing single row:
Replace:
```
{ stageN: 3, stageLabel: "Offer", deliverable: "One-sentence offer + scope of work + pricing sheet", 560 / 560 / 6 / 6 }
```
with:
```
{ stageN: 3, stageLabel: "Offer", deliverable: "One-sentence offer + first-version scope of work", 300 / 300 / 3 / 3 }
{ stageN: 3, stageLabel: "Offer", deliverable: "Competitor + value-based pricing — competitor price scan, value/cost-plus anchors, margin & break-even", 350 / 350 / 3.5 / 3.5 }
```

**Stage 4 (Build)** — insert after the Operations & workflow row:
```
{ stageN: 4, stageLabel: "Build", deliverable: "Sourcing & staffing plan — where to source raw goods, services, and talent (suppliers, contractors, hires) with named candidates and a first-call list", marketCostMin: 400, marketCostMax: 900, diyHoursMin: 4, diyHoursMax: 8 }
```

### 2. `src/routes/index.tsx` — `WALKOUT_PHASES`

**Phase 1 (Foundation)** — add after "Competitive research pack":
```
{ name: "Competitive advantage brief", desc: "Your 'secret sauce' — the one defensible thing you do better, pulled from the research and competitor scan and written in a sentence you can use on the website, in pitches, and in DMs." }
```

**Phase 2 (Offer & build)**
- Replace `Pricing sheet + break-even number` with:
```
{ name: "Competitor + value-based pricing", desc: "Your price set against a 3-competitor price scan and the value to your customer, with real costs, margin, and the exact number of sales to break even." }
```
- Add after "Funding model & 12-month runway":
```
{ name: "Business plan with pro formas", desc: "A short narrative plan plus a 12-month P&L, cash flow, and break-even pro forma — formatted the way banks, the SBA, and investors expect." }
```
- Add after "Operations & workflow":
```
{ name: "Sourcing & staffing plan", desc: "Where to source raw goods, services, and talent — whether you sell a product or a service — with named suppliers, contractors, or hires and a first-call list." }
```

### 3. `src/lib/curriculum-data.ts`

**Stage 1 (Form)** — funding task
- Extend task title: `"Funding model, business plan with pro formas, pitch deck & fundraising kit"`
- Add `walkOut` bullet: `"Business plan with pro formas: short narrative plan + 12-month P&L, cash flow, and break-even pro forma"`
- Add `details` bullet: `"Build a 12-month P&L, cash flow, and break-even pro forma alongside the narrative plan"`
- Extend `takeHome` to mention business plan with pro formas

**Stage 2 (Customer)** — competitor task
- Add `walkOut`: `"Competitive advantage brief: your defensible 'secret sauce' written in one sentence, sourced from the research + competitor scan"`
- Add `details` bullet: `"Distill the research + competitor weaknesses into one defensible advantage and write it as a one-sentence positioning line"`
- Update Stage 2 `takeHome` to mention the advantage brief alongside the research pack

**Stage 3 (Offer)** — pricing task
- Rename task title to `"Set price using competitor + value benchmarks"`
- Replace `walkOut` bullet `"Pricing sheet with real cost per sale, break-even number, and payment terms"` with `"Competitor + value-based pricing: 3-competitor price scan, value & cost-plus anchors, real cost per sale, break-even number, and payment terms"`
- Update `takeHome`: "your price backed into from your real costs" → "your price set from a 3-competitor scan, value to the customer, and your real costs"
- Update `covers` entry `"Pricing & break-even"` → `"Competitor + value-based pricing"`
- Task deliverable: `"Your pricing sheet built from a 3-competitor price scan and the value to your customer, with real cost per sale, margin, break-even, and payment terms."`
- Add first `details` bullet: `"Scan 3 named competitors and capture their public prices and what's included"` (keep existing "value, cost-plus, competitor anchors" bullet second)
- Task `takeaway`: `"Your pricing sheet — anchored to competitors and customer value — plus exact break-even number and payment terms."`

**Stage 4 (Build)** — add sourcing & staffing
- Add `walkOut` bullet: `"Sourcing & staffing plan: named suppliers, contractors, or hires for raw goods, services, and talent — with a first-call list"`
- Extend the Operations & workflow task `details` (or the closest existing build task) with a bullet: `"Identify named sources for raw goods, services, and talent — suppliers, contractors, and any first hires — and capture them as a first-call list"`
- Extend Stage 4 `takeHome` to mention "sourcing for goods, services, and talent" alongside the existing operations language

## Out of scope

- No changes to seat pricing (`PRICING`), tier copy, schedule times, `/schedule` layout, or `Go-to-market` wording.
- No new tasks or stages; no reordering of stages.
- `VALUE_TOTALS` recomputes automatically from `VALUE_ROWS`.
- No changes to imports, components, or styling.

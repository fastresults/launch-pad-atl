
## What changed

You've handed me the real $97 framework: **5 pillars, 20 documents, ~107 minutes of generation time**, run inside the published 8:45–11:30 AM ET window. That replaces the current 25-deliverable / 7-stage / 8:00 AM–4:30 PM model the dashboard inherited.

### The 20-document framework (from your screenshot)

| Pillar | Subtitle | Documents (time) |
|---|---|---|
| **Foundation** — *Who you are and where you play* | Concept Brief (2m), Executive Summary (3m), Value Proposition (4m), Market Sizing (5m), Competitive Landscape (6m) — **20m** |
| **Strategy** — *How you win and grow* | Business Plan (10m), Go-to-Market (7m), Pricing Strategy (5m), Customer Acquisition (6m), Partnership Strategy (4m) — **32m** |
| **Operations** — *What you build and who builds it* | Product Roadmap (5m), Team Structure (4m), Operations Plan (6m), Technology Stack (5m) — **20m** |
| **Finance** — *The numbers that matter* | Financial Model (8m), Funding Strategy (5m), Investor Memo (7m), Exit Strategy (4m) — **24m** |
| **Governance** — *Risk, oversight, and readiness* | Risk Assessment (5m), Board Presentation (6m) — **11m** |

Total doc-generation budget: **107 min**. Workshop window: 165 min. Overhead for check-in + break + close: 30 min. Buffer: 28 min for live coaching while the AI runs.

### Morning schedule (replaces the fictional 7-stage day)

```text
 8:45–9:00  Check-in           Coffee, share idea in one line
 9:00–9:25  Foundation         5 docs — concept → competitive landscape
 9:25–10:00 Strategy           5 docs — plan, GTM, pricing, acquisition, partners
10:00–10:10 Refreshment break
10:10–10:35 Operations         4 docs — roadmap, team, ops, tech
10:35–11:05 Finance            4 docs — model, funding, memo, exit
11:05–11:20 Governance         2 docs — risk, board deck
11:20–11:30 Close              Walk-out review of all 20 deliverables
```

## Plan

### 1. Replace the workflow manifest — `src/lib/workflow.ts`

- Rewrite `STAGES` as the 5 pillars (`foundation`, `strategy`, `operations`, `finance`, `governance`) plus the existing `brief` (n=0) for intake.
- Rewrite `WORKFLOW` as the 20 deliverables above, each with `key`, `label`, `short`, `stageN` (1–5), `stageLabel`, `estMinutes`, and an `intake` array on docs that need founder input (e.g. Concept Brief, Market Sizing, Pricing, Funding Strategy).
- Keep the `WorkflowDeliverable` / `IntakeField` types and `WORKFLOW_BY_KEY` / `stageOf` helpers — they're consumed by `dashboard/workflow.tsx` and the AI pipeline.

### 2. Database — `deliverable_types` table

The DB is the source of truth for prompts/deps and currently holds the old 25 keys. New migration to:

- Soft-deactivate old keys (`UPDATE deliverable_types SET active = false WHERE key NOT IN (<new 20>)`) so existing rows in `attendee_deliverables` keep rendering.
- Upsert the 20 new keys with: `label`, `description`, `stage_label`, `stage_n`, `sort_order`, `tier_required='founders'`, `default_model='google/gemini-2.5-flash'`, `depends_on_keys` (e.g. Executive Summary depends on Concept Brief; Investor Memo depends on Financial Model + Business Plan), `produces_context_key`, `requires_context_keys`, `output_kind='document'`, `user_can_trigger=true`, `auto_runnable=true`.

I'll surface the migration via the migration tool so you can approve before it runs. No table schema changes — `deliverable_types` already has every column we need.

### 3. Fix the schedule source — `src/lib/workshop-mode.ts`

Rewrite `SCHEDULE_BLOCKS` to the 7-block morning above (minute offsets from 8:45 AM = 0), set `WORKSHOP_END_MIN = 170`, and replace `FRIENDLY_STAGE` with a 5-entry pillar map. This automatically fixes `RoomClock` and `getWorkshopMode()` which feed the dashboard layout.

### 4. Rewrite `/dashboard/day` — `src/routes/_authenticated/dashboard/day.tsx`

Drive every value from the corrected sources so it can't drift:

- **Header card:** `cohort.dateLabel`, `EVENT.timeLabel` (`8:45 AM – 11:30 AM ET`), `EVENT.durationLabel`, venue, calendar + directions buttons.
- **Hero strip:** "$97 · 20 documents · 5 strategic pillars · one morning" with sub-line explaining the AI generates while you coach.
- **5 pillar cards** (bento grid mirroring your screenshot, using semantic tokens — no hardcoded pastels): pillar name, one-line subtitle, list of its documents with minute badge, and a per-pillar total. Pulled from `WORKFLOW` grouped by `stageN`.
- **Morning block-by-block timeline:** rendered from the new `SCHEDULE_BLOCKS`, time + duration + pillar chip + friendly subtitle.
- **What to bring:** laptop + charger, government ID, your idea (rough is fine). Remove the on-the-spot debit-card filing line — Foundation/Strategy/Finance documents include the LLC packet path but filing happens from home.
- **CTAs:** primary "Prep my brief" → `/dashboard/brief`; secondary "See the full 20-document workflow" → `/dashboard/workflow`.

### 5. Audit consumers of the renamed stages

`/dashboard/workflow`, `/dashboard/workflow.$key`, `/dashboard/hub`, `attendee_deliverables` UI, admin attendee views, and `curriculum-data.ts` (the marketing `STAGES`) all reference the old 7-stage model. For this turn I'll update only what `/dashboard/day` and the workflow manifest need; the marketing curriculum + admin views are a follow-up — flag at the end with a one-line list so you can decide what's next.

### Files touched this turn

- `src/lib/workflow.ts` — rewrite manifest
- `src/lib/workshop-mode.ts` — rewrite schedule blocks + friendly stage map
- `src/routes/_authenticated/dashboard/day.tsx` — full rewrite
- New migration: upsert 20 new `deliverable_types`, deactivate old keys

### Open question

The screenshot is the canonical list, but **dependency chains** drive the AI multi-doc pipeline order. My defaults: Executive Summary ← Concept Brief; Value Prop ← Concept Brief; Market Sizing ← Concept Brief; Competitive Landscape ← Market Sizing; Business Plan ← all of Foundation; GTM ← Business Plan + Competitive Landscape; Pricing ← Value Prop + Market Sizing; Customer Acquisition ← GTM; Partnerships ← GTM; Roadmap ← Business Plan; Team ← Roadmap; Ops Plan ← Roadmap; Tech Stack ← Roadmap; Financial Model ← Pricing + Roadmap + Team; Funding Strategy ← Financial Model; Investor Memo ← Business Plan + Financial Model; Exit Strategy ← Investor Memo; Risk Assessment ← all prior; Board Deck ← all prior. Tell me if any of those are wrong before I write the migration.

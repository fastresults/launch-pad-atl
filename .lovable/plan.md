## Recommendation: where this belongs in the workflow

This is a **Finance-pillar deliverable** (Stage 4), sibling to the existing `financial_model`. The two cleanest options:

- **A — New deliverable `budget_pro_forma` (recommended).** Keeps `financial_model` as the strategic 3-yr P&L narrative. Adds a tactical, numbers-first artifact: 12-month operating budget + 3-yr pro forma (P&L, cash flow, headcount, capex). It's the doc founders actually take to a lender, accountant, or board.
- **B — Convert `financial_model` itself to gateway-driven.** Simpler catalog, but loses the strategic narrative version and changes existing UX for users who've already generated it.

I recommend **A**. It also lets us introduce a small, reusable **"input gateway"** pattern (one schema field on `deliverable_types`) that other future deliverables can opt into without bespoke modals.

## Categorization

Add row in `deliverable_types`:

- `key`: `budget_pro_forma`
- `label`: Budget & Pro Forma
- `description`: 12-month operating budget plus 3-year pro forma (P&L, cash flow, headcount, capex) grounded in your assumptions.
- `stage_label` / `stage_n`: Finance / 4
- `sort_order`: 404 (after investor_memo, before risk_assessment)
- `tier_required`: founders
- `output_kind`: document
- `default_model`: `google/gemini-2.5-pro` (heavier numeric reasoning)
- `requires_context_keys` / `depends_on_keys`: `{pricing_strategy, financial_model}` (soft — gateway answers fill any gaps)
- `produces_context_key`: `budget_pro_forma`
- `user_can_trigger`: true
- `auto_runnable`: **false** (cannot run in bulk — gateway answers are required)
- **New column `intake_schema jsonb`** holding the gateway question definitions (see Technical section). Nullable; `null` = no gateway, current behavior.

## UX flow

1. In the Hub document list, the "Generate" button for any doc with a non-null `intake_schema` opens an **Intake Gateway modal** instead of generating immediately.
2. Modal renders the questions from `intake_schema` (text, number, currency, select, multiselect, textarea). Each field shows help text and an example. Required fields gate the submit button.
3. A **"Talk it through"** mic button (reusing `RewriteFeedbackDialog`'s recorder + `venture-transcribe`) populates a free-form "Anything else we should know?" textarea.
4. **Save & Generate** persists answers on the snapshot, then calls `venture-generate-document` with the answers in the body. A small "Edit assumptions" link on the rendered doc reopens the gateway pre-filled for regeneration.

### Budget & Pro Forma — initial question set

Numbers up front, free-form context at the end:

1. Starting cash on hand today (currency, required)
2. Expected founder/owner monthly draw (currency, required)
3. Planned hires in next 12 months — role, start month, salary (repeatable rows)
4. Recurring monthly fixed costs — name, amount (repeatable rows; pre-seed rent, software, insurance, accounting)
5. Major one-time costs in next 12 months — name, month, amount (repeatable rows; equipment, build-out, legal)
6. Primary revenue model (select: subscription, transactional, services, marketplace, ads, mixed)
7. Average price point and expected unit cost / COGS % (number + percent)
8. Realistic month-1 revenue and month-12 revenue target (currency + currency)
9. Funding already committed or expected, with timing (repeatable rows)
10. Fiscal year start month (select, default January)
11. Free-form: anything unusual about your cost structure, seasonality, or revenue timing (textarea + mic)

Quick-tag chips to seed the textarea: `Seasonal business`, `Long sales cycle`, `Inventory-heavy`, `Regulated industry`, `Grant-funded`.

## Document output shape

`venture-generate-document` adds a `budget_pro_forma` system prompt that produces:

- `## Executive Summary` — narrative read of runway, break-even month, peak cash need, top 3 sensitivities.
- `## Key Assumptions` — table echoing the gateway answers so the founder can audit them.
- `## 12-Month Operating Budget` — markdown table, months as columns, line items as rows (revenue, COGS, gross profit, payroll, fixed costs, one-time, EBITDA, cash in/out, ending cash).
- `## 3-Year Pro Forma` — annual P&L table + cash flow summary.
- `## Headcount Plan` — month-by-month FTE and fully-loaded cost.
- `## Sensitivity Scenarios` — base / downside / upside on revenue ramp and CAC.
- `## Funding Gap & Recommendation` — when cash dips, how much to raise, when.

Same no-citations / no-footnotes rules as other docs. Deep Assessment button works the same as today, with the assumptions table forwarded as extra context.

## Technical changes (summary)

1. **Migration**: add `intake_schema jsonb` column to `deliverable_types`; insert `budget_pro_forma` row with its `intake_schema` JSON; add `intake_answers jsonb` column to `venture_documents` so we persist the inputs alongside the generated doc.
2. **Edge function `venture-generate-document/index.ts`**: read `intake_answers` from request body, store on the document row, render answers into the prompt for any doc type; add a dedicated `budget_pro_forma` system prompt that enforces the tables above.
3. **Client `foundersHub.functions.ts`**: extend `generateDocument` to accept `intakeAnswers`.
4. **New component `src/components/hub/IntakeGatewayDialog.tsx`**: renders fields from `intake_schema`, supports number / currency / select / multiselect / textarea / repeatable rows; reuses the recorder + `venture-transcribe` from `RewriteFeedbackDialog`. Returns `{ answers, freeform }` on submit.
4. **Hub route `hub.$snapshotId.tsx`**: when a doc has `intake_schema`, route the Generate / Regenerate click through `IntakeGatewayDialog` before calling `generateDocument`. Pre-fill from saved `intake_answers` on regen.
5. **Bulk generate**: `venture-bulk-generate` skips any deliverable where `auto_runnable=false` (already its rule); no behavior change for other docs.
6. **DocumentViewer**: add an "Edit assumptions" affordance next to "Regenerate" that opens the gateway pre-filled, only when `intake_schema` is present.

## Out of scope

- Building a spreadsheet/CSV export of the budget (can be a follow-up; markdown tables work today and copy cleanly to Sheets/Excel).
- Changing existing `financial_model` behavior.
- Adding intake gateways to any other deliverable in this pass (the framework is reusable; we'll opt others in later as needed).

## Verification

- Migration runs; new row visible in workflow catalog under Finance.
- Clicking Generate on Budget & Pro Forma opens the modal; required fields block submit; mic dictation appends to the free-form box.
- Submit triggers generation; doc shows Executive Summary + monthly budget table + 3-yr pro forma + sensitivity scenarios + funding gap, with no citations or footnotes.
- Regenerate reopens modal pre-filled with stored answers; edits flow into the new version.
- Bulk generation does not attempt this doc; copy / .md / .docx / Print already include any Deep Assessment per the prior change.

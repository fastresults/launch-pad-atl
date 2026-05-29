## Goal

Make sure every item in the homepage "What you walk out with" grid (`WALKOUT_PHASES` in `src/routes/index.tsx`) has a corresponding row in the `/register` value grid (`VALUE_ROWS` in `src/lib/value-grid.ts`). The recent additions to the homepage are not yet represented there.

## Gap analysis

Already covered in `VALUE_ROWS` (no change needed):
- GA LLC filing packet, EIN, legal kit, bank/license/sales-tax checklist
- ICP + 25-name prospect list, outreach script
- One-sentence offer + pricing, delivery map, free-app stack, first deliverable + QA
- Logo/brand, website, Stripe + GA4 + business email
- Headline/value props/pitch, business card + flyer, 6 posts + 60s video
- 30/60/90 launch plan + outreach, day-of timeline + CRM + KPIs

Missing or under-specified in `VALUE_ROWS`:
1. **Competitive research pack** — current row says "Outreach script + 3-competitor positioning grid"; missing customer quotes and "what makes you different" summary
2. **Operations & workflow** (3 SOPs + weekly operating rhythm) — not present
3. **Funding model & 12-month runway** — not present
4. **Investor-ready pitch deck** (10 slides) — not present
5. **Fundraising kit** (raise summary, funder outreach, grants/microloans/SBA path) — not present
6. **Marketing & communications** (audience, channels, messaging pillars, 30-day calendar) — partially in the "6 posts + 30-day plan" row; deliverable text should reflect the full plan
7. **Go-to-market** (target segment, channel mix, week-by-week tactics, KPIs) — partially in the "30/60/90 launch plan" row; deliverable text should reflect GTM framing

## Change — `src/lib/value-grid.ts`

Update `VALUE_ROWS` as follows. Keep the existing row order; new rows are inserted at the end of their stage block so the grid still groups by stage.

**Edit existing rows (tighten wording to match homepage):**
- Stage 2 row 19: change deliverable to `"Competitive research pack — 3 competitors on offer/price/positioning, customer quotes, and a 'what makes you different' one-pager"`. Keep market cost ($225) and hours (3) — scope is tightened wording, not new work.
- Stage 6 row 32: change deliverable to `"Marketing & communications — audience, channels, messaging pillars, 30-day content calendar, 6 posts + 60s video script"`. Keep numbers.
- Stage 7 row 34: change deliverable to `"Go-to-market — target segment, channel mix, week-by-week tactics, 30/60/90 plan, 25-name list + 10 outreach drafts"`. Keep numbers.

**Insert new rows** (with realistic market-rate and DIY-hour estimates consistent with neighbors):
- Stage 4 (Build): `{ stageN: 4, stageLabel: "Build", deliverable: "Operations & workflow — 3 SOPs (intake, fulfillment, onboarding) + 1-page weekly operating rhythm", marketCostMin: 450, marketCostMax: 900, diyHoursMin: 5, diyHoursMax: 8 }`
- Stage 1 (Form), placed at end of stage-1 block: `{ stageN: 1, stageLabel: "Form", deliverable: "Funding model & 12-month runway — costs, margin, break-even, monthly cash plan", marketCostMin: 600, marketCostMax: 1500, diyHoursMin: 6, diyHoursMax: 10 }`
- Stage 1 (Form): `{ stageN: 1, stageLabel: "Form", deliverable: "Investor-ready pitch deck — 10 slides in your brand", marketCostMin: 750, marketCostMax: 2500, diyHoursMin: 6, diyHoursMax: 12 }`
- Stage 1 (Form): `{ stageN: 1, stageLabel: "Form", deliverable: "Fundraising kit — 1-page raise summary, funder outreach plan + email template, grants/microloans/SBA path", marketCostMin: 400, marketCostMax: 1200, diyHoursMin: 4, diyHoursMax: 8 }`

`VALUE_TOTALS` recomputes automatically from `VALUE_ROWS`, and `TotalsBar` / `ValueGrid` consume those rows directly, so no component changes are needed.

## Out of scope

- No changes to `WALKOUT_PHASES`, homepage layout, `/schedule`, or `curriculum-data.ts`.
- No changes to `PRICING`, tier copy, register form, or styling.
- No new `postWorkshop` notes for the inserted rows (existing rows mix presence/absence; matching that pattern).

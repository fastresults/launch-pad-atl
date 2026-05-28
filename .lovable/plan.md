# Value Justification Grid + Registration Page

Build a single, conversion-focused page that proves the workshop's value line-by-line, then closes with tiered pricing and the existing registration form.

## Page structure (rebuild `/register`)

1. **Hero** — "Walk in with an idea. Walk out with a business." + cohort date + seats-left framing.
2. **The Value Grid** (centerpiece — see below).
3. **Totals bar** — *Market value: ~$X,XXX · Time to DIY: ~XX weeks · Your price today: from $679*.
4. **Pricing tier cards** — Founders ($679, first 7) vs Cohort ($997, next 13).
5. **Registration form** (existing form, unchanged logic, plus tier-interest field).
6. **FAQ / guarantee strip**.

## The Value Grid — conservative estimates (pulled back ~25% on cost and time)

One row per deliverable, grouped by stage. Columns: Stage · Deliverable · Typical market cost · DIY time · Included.

| Stage | Deliverable | Market cost | DIY time |
|---|---|---|---|
| 1. Form | GA LLC filing packet (Articles pre-filled) | $225–$600 | 3–6 hrs |
| 1. Form | EIN issued | $0–$185 | 1–1.5 hrs |
| 1. Form | Terms / Privacy / Service Agreement | $300–$1,125 | 4.5–7.5 hrs |
| 1. Form | Bank + license + sales-tax checklist | $110 | 2 hrs |
| 2. Customer | 1-page ICP + 25-name prospect list | $375 | 4.5 hrs |
| 2. Customer | Outreach script + 3-competitor grid | $225 | 3 hrs |
| 3. Offer | One-sentence offer + scope + pricing sheet | $560 | 6 hrs |
| 4. Build | Sale-to-delivery workflow map | $300 | 3.5 hrs |
| 4. Build | First customer's deliverable + 5-pt QA checklist | $375 | 4.5 hrs |
| 5. Brand | Logo + 4-color palette + font pairing | $375–$1,875 | 7.5–15 hrs |
| 5. Brand | Complete website built (4 pages, branded, written, SEO-set) | $1,500–$4,500 | 15–30 hrs |
| 5. Brand | Stripe/Square + GA4 + business email | $225 | 3 hrs |
| 6. Marketing | Headline, 3 value props, 30-sec pitch | $300 | 3.5 hrs |
| 6. Marketing | Business card + flyer print files | $185 | 3 hrs |
| 6. Marketing | 6 social posts + 60-sec video script + 30-day plan | $450 | 6 hrs |
| 7. Launch | 30/60/90 plan + 25-name launch list + 10 drafts | $375 | 4.5 hrs |
| 7. Launch | Day-of timeline + CRM + 3 KPIs | $225 | 2 hrs |

**Totals row (highlighted):** Market value ≈ **$6,130–$11,440** · DIY time ≈ **76–106 hours** · **Your price: $679 (first 7) / $997 (cohort).**

Data lives in `src/lib/value-grid.ts` (typed array with `marketCostMin`, `marketCostMax`, `diyHoursMin`, `diyHoursMax` per row). Home page and schedule page untouched.

## Pricing tier cards (side-by-side)

- **Founders Seat — $679** · "First 7 to register" · badge: "X of 7 left" · all deliverables.
- **Cohort Seat — $997** · "Next 13 seats" · all deliverables.

Both cards list: 8-hour build day, lunch, all 17 deliverables above, take-home packet, 30-day follow-up. CTA scrolls to the form.

Pricing is **display-only** in this plan — no Stripe/checkout. Add a `tier_interest` field (enum: `founders` / `cohort`) to the registration form so we capture intent.

## Visual style

- Dark theme, consistent with `/` and `/schedule`.
- Grid: alternating row tint by stage, sticky header on scroll; mobile = accordion per stage.
- Totals row: gradient background using existing `--gradient-brand` tokens.
- Founders card: gradient border. Cohort card: muted variant.
- Icons: `Check` for included, `Clock` for DIY time, `DollarSign` for market cost (lucide-react).

## Files to touch

- **New:** `src/lib/value-grid.ts`
- **New:** `src/components/value/ValueGrid.tsx`, `PricingTiers.tsx`, `TotalsBar.tsx`
- **Edit:** `src/routes/register.tsx` — insert hero, grid, totals, pricing tiers above the existing form; add `tier_interest` select
- **Edit:** `src/lib/registrations.functions.ts` + Zod schema — accept optional `tier_interest`
- **Migration:** `alter table workshop_registrations add column tier_interest text`
- **Edit:** `src/components/site/Header.tsx` — primary CTA "Reserve seat — from $679"

## Out of scope (ask if you want any of these)

- Actual payment collection / Stripe checkout
- Live seat-count from the database (the "X left" badge will be a static prop for now)
- Changes to `/` or `/schedule`

Confirm and I'll build it.

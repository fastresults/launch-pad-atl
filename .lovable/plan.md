## Goal

Remove all agency service pricing (and fixed timelines) from the Services page and replace with a clear "book a discovery call → bespoke quote" framing. Workshop pricing ($197/$297/$397) stays — those are fixed-price products, not bespoke engagements.

## Scope

Two files:
- `src/lib/agency-services.ts`
- `src/routes/services.tsx`

Everything else (workshops, schedule, hub, etc.) is untouched.

## Changes

### 1. `src/lib/agency-services.ts`

- Keep the `priceLabel` and `timelineLabel` fields on the types (avoid ripple typing changes), but replace every value across all 8 individual services and all 3 tracks (Launch / Growth / Operate) with neutral, scope-based copy:
  - `priceLabel` → `"Scoped to your startup"` (or per-item variants like `"Scoped per engagement"`, `"Scoped monthly retainer"` for the ongoing one)
  - `timelineLabel` → `"Timeline set in discovery"` (or `"Ongoing — cadence set in discovery"` for retainers)
- No structural changes; downstream renderers keep working.

### 2. `src/routes/services.tsx`

- **Service cards (line ~131):** keep the `priceLabel` slot rendering, now showing "Scoped to your startup"; CTA remains "Book a scoping call".
- **Track cards (lines ~219–221, incl. the screenshot's `FROM $4,875 / $2,925/mo / $5,200` + `4–6 weeks / Ongoing / 30-day sprint`):** replace the price+timeline row with a single line: *"Bespoke scope — priced after a 20-min discovery call"*. Sub-line: track cadence descriptor (e.g., "Sprint engagement", "Monthly retainer", "30-day sprint") kept as qualitative, not a price anchor.
- **"Fixed price, fixed scope, fixed clock" reassurance block (~line 254):** rewrite to reinforce the new promise — *"Fixed scope and fixed clock, set together in discovery. Flat fee, no T&M, no surprise invoices."*
- **"$50K elsewhere" line (~341):** soften to *"The same operators who'd cost a multiple elsewhere — at Atlanta rates, scoped honestly to what you actually need."* (drops the dollar anchor.)
- **Workshop credit-back paragraph (~372):** keep workshop $197/$297/$397 (fixed products). Reword the credit-back sentence to: *"If you hire us for any bespoke engagement after, your workshop fee is credited back against the scope."* (removes the `$1,000` threshold anchor.)
- **DIY workshop cross-sell line (~137):** keep as-is — still references workshop price, which stays.
- **Hero + "Start with a workshop — from $197" CTAs:** keep. Workshops remain the fixed-price entry point.

### Out of scope

- Workshop pricing everywhere it appears.
- Contact form, calendar link, `/contact` route wiring — the "Book a scoping call" buttons already point at the discovery flow.
- No copy changes to schedule, hub, or curriculum pages.

## Open question

Confirm: keep the workshop fixed prices ($197 / $297 / $397 and the credit-back mechanic) visible, and only strip the agency-service and track pricing? That's what this plan assumes.

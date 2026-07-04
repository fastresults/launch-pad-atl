## Goal
Flatten all 8 workshops on `/build` and `/build/:slug` to a single `$197` price.

## Files & edits

**`src/lib/build-workshops.ts`**
1. Set `priceLabel: "$197"` on all 8 workshop entries (currently a mix of $197 / $297 / $397 at lines 93, 192, 291, 391, 491, 591, 691, 791).
2. Update every `faq: makeCommonFaq("$…")` call to `makeCommonFaq("$197")` (lines 284, 384, 584, 684, 784, 885 — the two already at $197 stay $197).
3. Collapse `workshopPriceForRetailCents()` so every branch returns `{ cents: 19_700, label: "$197" }`. Keeps the tier-drift dev warning happy without ripping out the helper (still called by other code paths).

**`src/routes/build.tsx` (hero copy)**
- Existing line: "Each half-day workshop — **from $197** — …". Change "from $197" → "$197 each" so it reads correctly now that pricing is flat.

No other route/component/type changes. The `Workshop · $197` chip on each card and the `Reserve your seat — $197` CTA on each detail page will update automatically from the data change.

## Out of scope
- Agency service pricing in `agency-services.ts` (unchanged).
- Payments/checkout wiring.
# Why the business card ignored "Stacked · Colour"

## What actually happened

The logs from that run say it plainly:

```text
[collateral mark] business_card/front asked stacked_reversed (auto) → stacked/inverse
[collateral mark] business_card/back  asked primary          (auto) → horizontal/colour
```

`(auto)` means the generator never received a choice at all — it fell back to its own
recommendation for both slots. The selection was made in the UI, but it was dropped in
transit.

## The cause

The two sides of the handoff disagree on the shape of the payload.

- The card sends the per-slot map directly:
  `markChoice["business_card"] = { front: {form,tone}, back: {form,tone} }`
- The edge function reads it with `slotChoices()`, which only understands two shapes:
  a wrapped `{ slots: { front: … } }`, or a single legacy `{ form, tone }` cell.

A bare `{ front, back }` map matches neither, so `slotChoices()` returns an empty object,
`hasPicks` is false, and the run is handed `markPicks: null`. Every slot then takes the
recommendation — which reverses the front mark for the dark colour field and puts the
horizontal mark in the small back corner. That is exactly the output on screen.

Two knock-on effects come from the same bug: nothing is written back to
`collateral_mark_choice` (the saved map is built from the empty `markPicks`), so the
choice does not survive a reload, and the "Mark: …" badge reports the auto pick rather
than what was asked for.

## The fix

1. Teach `slotChoices()` to accept a bare per-slot map: if the object has no `slots` key
   and no top-level `form`, treat each key that matches a known slot id for that kind as a
   slot entry. This makes the current client correct and keeps both older shapes working.
2. Send the canonical shape from the client as well — wrap the per-kind value as
   `{ slots: … }` in `generateCollateral` — so the two sides agree going forward and the
   loose reading is only a compatibility path.
3. Persist correctly: with picks resolving, the existing write to
   `collateral_mark_choice` records `{ slots, used }` per kind, and hydration on reload
   already reads that shape.
4. Regression tests in `src/lib/brand/__tests__/collateral-marks.test.ts`: a bare
   `{ front, back }` map resolves to both slots; unknown keys are ignored; the wrapped and
   legacy-flat shapes still resolve as they do today.
5. Redeploy `venture-collateral`, then regenerate the business card and confirm the log
   reads `asked stacked … (explicit)` for front and back, with no `(auto)`.

## Technical notes

- Files: `supabase/functions/_shared/collateral-marks.ts` and its client mirror
  `src/lib/brand/collateral-marks.ts` (identical change), `src/lib/collateral.functions.ts`
  (payload shape), test file above.
- No database migration; the `collateral_mark_choice` column and its format are unchanged.
- The front slot sits on a dark colour field, so an explicit `Stacked · Colour` may still
  be recoloured by the contrast guard if the colour artwork fails legibility on that
  ground. When that happens the card already shows a "Recoloured for contrast" badge —
  that path is a legibility repair, not the silent override seen here.

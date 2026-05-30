## Goal

On the free cohort home page, replace the brief 7-card "What you walk out with at 4:30 PM" bullet grid (screenshot 1) with the full deliverable-by-deliverable table used elsewhere in the app (screenshot 2 — the `ValueGrid` component showing every line item with stage, market cost, DIY time, and an "Included" check).

## Scope

Only the free-cohort variant of `src/components/home/HomeSelection.tsx`. No changes to the paid cohort page, the registration page, or to `ValueGrid` itself.

## Changes

`src/components/home/HomeSelection.tsx` → `WhatYouWalkOut` section (around lines 206–233):

1. Keep the section wrapper, eyebrow ("WHAT YOU WALK OUT WITH AT 4:30 PM"), and the headline "Not a course. Not coaching. A built startup."
2. Remove the 7-item `DELIVERABLES` array and the 2-column card grid that renders it.
3. In its place, render `<ValueGrid />` (imported from `@/components/value/ValueGrid`), which already shows the full stage-by-stage table with market cost, DIY hours, and an "Included" check for every deliverable — matching screenshot 2.
4. Keep the closing piecemeal-value paragraph ("If you bought these piecemeal…") below the table so the value framing still lands.
5. Delete the now-unused `DELIVERABLES` constant.

## Notes

- `ValueGrid` already pulls from `src/lib/value-grid.ts`, so the table stays in sync with the rest of the site automatically — no data duplication.
- Width: bump the section's `max-w-6xl` if the table needs more room; otherwise leave as-is since `ValueGrid` handles its own internal layout.
- No copy changes elsewhere on the page.

## Goal
Make the "What you actually walk out with" value grid on `/register` partially collapsed by default — show the first 5 rows, then a click-to-expand control reveals the rest (and the totals row).

## Changes

**`src/components/value/ValueGrid.tsx`** (only file touched)

1. Add `useState` with `expanded = false`.
2. Compute a flat ordered list of `VALUE_ROWS` (already in stage order) and slice the first 5 as the "preview" set. Determine which stages those 5 rows belong to so stage grouping/tints still render correctly in the collapsed state.
3. Desktop table:
   - When collapsed, render only rows whose index < 5. Suppress any stage group that has no visible rows.
   - Hide the totals (`bg-hero-gradient`) row when collapsed.
   - Below the last visible row (still inside the bordered card), render a full-width expand control:
     - Label: "Show all 22 deliverables" (count derived from `VALUE_ROWS.length`) with a `ChevronDown` icon.
     - Subtext: "+ market cost & DIY time totals".
     - Soft gradient fade overlay above the button so the cut-off feels intentional.
   - When expanded, render all rows + totals as today, and swap the control to "Show less" with `ChevronUp`.
4. Mobile cards: mirror the same logic — show first 5 deliverable cards across stages, hide the mobile totals block, same expand/collapse button at the bottom.
5. Button is a real `<button>` with `aria-expanded` and `aria-controls` pointing at the rows container id for a11y. Smooth: no animation library needed; rely on conditional render. (If we want a reveal animation later, we can add `max-h` transition — not in scope.)
6. Import `ChevronDown`, `ChevronUp` from `lucide-react`. No other files, no data changes, no prop changes — `ValueGrid` stays a zero-prop component so `register.tsx` is untouched.

## Out of scope
- No changes to `value-grid.ts` data, totals math, `TotalsBar`, pricing, or any other route.
- No change to which 5 rows show (just the first 5 in current order). If you want a specific curated 5, say which and I'll hardcode the selection instead.

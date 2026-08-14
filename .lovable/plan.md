# Why the logo drop panel is missing on those Content Studio controls

## What is actually happening

The logo picker exists in Content Studio, but only on **individual ad rows** (`ContentStudio.tsx` lines 1068 and 1074 render `LogoPlacementMenu` next to Generate / Regenerate for each ad that already has a planned post row visible).

The controls in your screenshot are **batch controls**, and none of them were wired to a picker:

- `Add & generate` (a week with planned posts but no ads yet) — the chevron beside it is the accordion expand/collapse toggle, not a logo menu.
- `Generate week (n)` / `Regenerate week (n)`
- `Regenerate all (n)` in the section header
- `Plan Week 5`

So when a week has not been generated yet there is no per-ad row to hang a picker on, and the batch run falls back to AI auto-selection with no way for the admin to set the mark first. That is the gap versus Social Studio and Brand Collateral, where batch actions carry their own picker.

## The fix: batch-level mark defaults with a resolution chain

1. **New placement keys** in `src/lib/brand/collateral-marks.ts`:
   - `contentWeekKey(week, aspect)` → `content:week:<n>:<aspect>`
   - `contentAllKey(aspect)` → `content:all:<aspect>`
2. **Resolution order** in `studioChoiceFor` (exact wins, broad is fallback): per-ad key → week key → all key → legacy surface kind → null. Manual picks stay immutable in the worker exactly as today.
3. **Attach `LogoPlacementMenu`** as a split-button companion to:
   - each week row's `Add & generate` / `Generate week` / `Regenerate week` control
   - the section header's `Regenerate all`
   - the `Plan Week 5` card (applies to the ads produced from the planned posts)
4. **Inheritance display:** when an ad has no exact pick of its own, its row picker shows the inherited week/all value labelled "Inherited — <slot>", so the admin can see where the choice came from and override per ad.
5. **Batch runs pass the resolved pick per task** (`placementKey` + `markPick`) so `venture-content-ad` enforces the manual selection and still fails loudly with `LOGO_SELECTION_INVARIANT_FAILED` when a manual pick cannot be placed legibly.

## Audit sweep for the same gap elsewhere

Same check applied to every batch action so this does not resurface:

- Social Studio: `Generate all` / kit-task batch runs and Launch cards
- Brand Collateral: `Regenerate all` and multi-page pieces
- Style previews: "generate all directions"

Any batch control without a picker gets the same week/all-level default treatment.

## Technical notes

- Storage stays in `venture_brand_kits.studio_mark_choice` via the existing atomic `mutate_studio_mark_choice` RPC — batch keys are just additional entries, no migration needed.
- Regression tests extended in `src/lib/brand/__tests__/collateral-marks.test.ts` to cover the new keys and the inheritance chain.

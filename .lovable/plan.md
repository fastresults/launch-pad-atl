# Add the startup-ideas slider to the free-cohort homepage

## Problem

The main homepage (`src/routes/index.tsx`) renders a `TheArtOfThePossible` section — the slider/grid of startup concepts driven by `BUSINESS_IDEAS` + `BUSINESS_CATEGORIES`. The free-cohort variant (`src/components/home/HomeSelection.tsx`, shown when `home_variant === "selection"`) is missing that section entirely.

Right now `TheArtOfThePossible` is defined as a local function inside `index.tsx` (line 777), so it cannot be reused from `HomeSelection`.

## Plan

1. **Extract the component** into a shared file: `src/components/home/ArtOfThePossible.tsx`.
   - Move the `TheArtOfThePossible` function and any tiny local helpers it uses (category pills, idea card, etc.) out of `index.tsx`.
   - Export it as a named component: `export function ArtOfThePossible()`.
   - Keep all existing copy, styling, filtering behavior, and `BUSINESS_IDEAS` / `BUSINESS_CATEGORIES` imports intact — no visual or behavioral changes.

2. **Update `src/routes/index.tsx`** to import and render `<ArtOfThePossible />` in the same slot where `<TheArtOfThePossible />` is rendered today (line 54). Remove the now-duplicate local definition.

3. **Add the section to `src/components/home/HomeSelection.tsx`** so the free-cohort homepage shows the same slider. Insertion point: between `WhatYouWalkOut` and `WhoWereLookingFor` — after founders see what they'll walk out with, they get inspiration for the kind of startup they could pitch in their application.
   ```
   <WhatYouWalkOut />
   <ArtOfThePossible />   ← new
   <WhoWereLookingFor />
   ```

4. **Verify** by loading both variants in preview:
   - Default homepage: section still renders unchanged.
   - Free-cohort homepage (`home_variant = "selection"`): slider now appears in the new slot.

## Out of scope

- No copy edits to the slider itself.
- No changes to `BUSINESS_IDEAS` data.
- No changes to other sections on either homepage.

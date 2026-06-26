## Goal
On `/dashboard/workflow`, add a per-category "Open deck" entry that the facilitator can launch — but only once the previous category is fully generated (and the deck itself exists). This paces the facilitator through the schedule one stage at a time.

## Gating rule
For each stage group rendered in `workflow.tsx`:
- **Unlocked when** every prior stage's triggerable items are `generated === true` AND a deck exists for that stage in `STAGE_DECKS` (`available === true`).
- The very first stage (Foundation) is unlocked by default.
- Bonus stages don't block downstream unlocks.

## UI changes (workflow.tsx only)
Inside the existing `stages.map(...)` section header:
1. Compute `unlockedDeckSlugs` once per render:
   - Walk `stages` in order, track `allPriorGenerated` boolean.
   - A stage's deck is unlockable if `allPriorGenerated && deck.available`.
   - After processing, AND the current stage's own completion into `allPriorGenerated` for the next iteration.
2. Next to the stage `<h2>`, render a deck control:
   - **Unlocked + available** → `<Button asChild>` linking to `/workshop/{slug}` labeled "Open facilitator deck" with a `Presentation` icon.
   - **Locked (prior incomplete)** → disabled button "Deck unlocks when {previous stage name} is complete" with a `Lock` icon.
   - **Coming soon (no slides yet)** → disabled "Deck coming soon" badge.
3. Add a small helper line under the stage label: "Facilitator: walk the room through this deck before generating."

## Technical notes
- Map stage label → deck slug using the same `slugify` helper already in `registry.ts` (export it, or duplicate the 1-liner in `workflow.tsx`).
- Source of truth for deck availability stays `STAGE_DECKS` from `@/components/workshop-slides/registry`.
- Completion check uses the same `triggerable` filter already in the file (`user_can_trigger !== false`) scoped to that stage's items.
- No DB, no backend, no edge function changes. Pure frontend.

## Files touched
- `src/routes/_authenticated/dashboard/workflow.tsx` — add imports, gating logic, deck button in stage header.
- `src/components/workshop-slides/registry.ts` — export `slugify` (tiny).

## Out of scope
- Authoring new decks (Foundation only for now, others stay locked behind "Deck coming soon" until built — matches existing day.tsx behavior).
- Changing generation/unlock logic for deliverables themselves.
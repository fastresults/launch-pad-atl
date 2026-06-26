## Goals
1. Open facilitator decks in a modal dialog instead of navigating to `/workshop/{slug}`.
2. Add a "Generate this category" button next to "Open facilitator deck" that runs every still-missing deliverable in that stage.

## 1. Deck-in-modal

New component `src/components/workshop-slides/DeckDialog.tsx`:
- `<Dialog>` with a near-full-screen content panel (`max-w-[95vw] h-[90vh] p-0`).
- Renders the existing `SlideDeck` (or `ScaledSlide` driver) inside.
- Reuses keyboard nav (←/→/Space/Esc) — Esc closes the dialog via Radix's built-in handler.
- Title bar with deck title + close button; the slide canvas owns the rest.

In `workflow.tsx`:
- Replace the `<Link to={/workshop/{slug}}>` button with a stateful trigger that sets `openDeckSlug`.
- Render `<DeckDialog slug={openDeckSlug} onOpenChange={...} />` once at the bottom of the page.
- Keep the `/workshop/:stage` route intact for direct/fullscreen access (no removal).

## 2. Per-category "Generate this category" button

New helper in `src/lib/userPipeline.functions.ts` (or inline in workflow.tsx using existing `runMyDeliverable`):
- Simplest path: in `workflow.tsx`, add a `runCategory` mutation that iterates the stage's triggerable, ungenerated items and calls `runMyDeliverable({ data: { key, runUpstream: true } })` sequentially.
- Track a `runningCategoryStage: number | null` state so only that section's button shows the spinner; other categories stay interactive.
- On finish, toast "Category ready" and invalidate `["my"]`.

UI placement (in the stage header flex row already added):
- Order: `[Generate this category]` `[Open facilitator deck]`.
- Button states:
  - Idle, items remaining → "Generate this category (N)" with `Play` icon.
  - Running → "Generating…" with spinner, disabled.
  - All done → "Category complete" with `CheckCircle2`, disabled, `variant="ghost"`.
  - Brief not ready → disabled with tooltip "Finish your Startup Brief first".

## Files touched
- `src/components/workshop-slides/DeckDialog.tsx` (new)
- `src/routes/_authenticated/dashboard/workflow.tsx` (state + dialog mount + per-category button + sequential runner)

## Out of scope
- Changing the existing `/workshop/:stage` route, deck gating logic, or bulk "Run remaining" button at the top.
- Authoring new decks (still only Foundation is available).
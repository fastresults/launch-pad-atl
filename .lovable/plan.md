# Inline Style Guide preview in Review step

## Problem
After "Generate brand style guide" runs, the result (`kit.guide_markdown`) is saved silently. The Review step only shows a small "Style guide locked — N words" pill, with no way to read the guide without exporting it. The user wants the full preview to appear in the action-bar area shown in the screenshot (right above Regenerate / Save to My Files / Close).

## Plan

### 1. Add an inline Style Guide preview panel in `StepReview` (src/components/hub/brand-wizard/BrandWizard.tsx)
Replace the current single-line "Style guide locked" emerald pill (lines 831–835) with a full preview card that renders only when `kit?.guide_markdown` exists:

- Header row: title "Brand Style Guide", word count, locked timestamp, plus a "Collapse / Expand" toggle (default expanded after generation, collapsed on revisit) and a "Copy markdown" icon button.
- Body: scrollable container (`max-h-[460px] overflow-y-auto`) rendering `kit.guide_markdown` through the existing `RichMarkdown` component (`src/components/markdown/RichMarkdown.tsx`) so headings, tables, color hex callouts, and lists match the rest of the app.
- Apply the locked typography to the preview wrapper (`fontFamily` heading/body from `kit.typography`) so the guide previews in the chosen fonts.
- Light-mode safe surface: `bg-card border-emerald-500/30` with `text-foreground` (no hardcoded greens on text — follow the project contrast rule).

### 2. Auto-scroll + toast on first generation
In the existing `lock.mutate` success path, after the kit refetches:
- Set local `previewOpen` state to `true`.
- Scroll the new preview card into view (`ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })`).
- Keep the existing success toast.

### 3. Keep action bar unchanged
The Regenerate / Save to My Files / Close buttons stay exactly where they are — the preview simply renders directly above them, so the buttons act on the visible guide (matching the screenshot's UI region).

### 4. Empty state
When no guide exists yet, show a muted helper card in the same slot: "Generate the style guide to preview it here." This keeps the layout stable so users understand where the output will appear before clicking Generate.

## Files touched
- `src/components/hub/brand-wizard/BrandWizard.tsx` — replace the locked-pill block in `StepReview` with the new preview panel; add `previewOpen` state + scroll ref; wire success handler.

No backend, schema, or other component changes required — `guide_markdown` is already persisted and `RichMarkdown` already supports the content shape.

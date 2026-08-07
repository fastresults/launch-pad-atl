# Fix modal scrolling so every part of a dialog is reachable

## What's wrong today

Audit of the dialog system found three distinct failure modes.

**1. The base dialog has no height ceiling.** `src/components/ui/dialog.tsx` renders `DialogContent` with `fixed top-1/2 ... translate-y-[-50%]` and no `max-height` and no `overflow`. When a dialog is taller than the window, it grows off both the top and bottom edges — and because the top edge is above the viewport, the user can't scroll to it at all. 19 dialogs in the app currently pass no `max-h` of their own, including the confirm dialog, media dialogs, file preview, hero-image regenerate, slot inspector, and the landing/access modals.

**2. Asset preview clips its sidebar.** `AssetPreviewDialog` uses `p-0 overflow-hidden` with a two-column grid. The right rail holds the caption panel, palette, QA readouts, headline/logo editors and the download/regenerate buttons — far more than a screen's worth — but neither the dialog nor the rail scrolls, so everything below the caption copy buttons is unreachable (visible in the screenshot: the panel simply runs past the bottom edge). The image column also has no independent scroll.

**3. Inner panes scroll, outer shell doesn't (or vice versa).** Dialogs that do set `max-h` mostly pair it with `overflow-hidden` and rely on an inner scroller (`DaySprintDeckDialog`, `BrandWizard`, `DocumentViewer`, `FounderRoadmapDialog`, `RegenerateAssetDialog`). Those are structurally right, but the header/footer rows aren't pinned consistently, so on short viewports the footer action row can be pushed out of reach.

## The fix

**Make the shell safe by default.** Add a viewport-relative height cap and vertical scrolling to the shared `DialogContent`: cap at roughly `calc(100dvh - 2rem)` and allow `overflow-y-auto` with `overscroll-contain`. Use `dvh` so mobile browser chrome doesn't steal the bottom. Any dialog that opts into its own layout (passing `overflow-hidden` or an explicit height) keeps working because the className it passes wins in the merge. Keep the close button pinned inside the visible area.

**Give the asset preview real scroll regions.** Restructure it as a fixed-height flex column: pinned header, then the two-column body where the image pane and the sidebar each scroll on their own, then keep the download/regenerate/delete actions pinned at the bottom of the sidebar rather than at the end of a long scroll. On narrow screens the grid collapses to one column and the whole body scrolls as a single region.

**Standardise the structured dialogs.** For the deck, wizard, document viewer, roadmap and regenerate dialogs, confirm the pattern is: `flex flex-col` shell with a capped height, `shrink-0` header, `flex-1 min-h-0 overflow-y-auto` body, `shrink-0` footer. The `min-h-0` is the piece most often missing and is what causes a flex child to refuse to scroll.

**Sweep the unbounded dialogs.** The 19 dialogs with no height class inherit the new default cap and need no per-file change; spot-check the content-heavy ones (media hub, file preview, hero regenerate, slot inspector, idea snapshot, landing modals) to make sure nothing relied on the old unbounded behaviour.

## Verification

Drive the preview at a short viewport (about 1280x700) and at mobile width, open the asset preview from Content Studio plus the confirm, regenerate, document viewer and brand wizard dialogs, and confirm in each that the header stays visible, the body scrolls, and the bottom action row is clickable.

## Technical notes

- Files: `src/components/ui/dialog.tsx` (default cap + scroll), `src/components/hub/social/AssetPreviewDialog.tsx` (flex restructure, dual scroll panes, pinned actions), and targeted `min-h-0` / `shrink-0` corrections in `DaySprintDeckDialog.tsx`, `brand-wizard/BrandWizard.tsx`, `DocumentViewer.tsx`, `FounderRoadmapDialog.tsx`, `social/RegenerateAssetDialog.tsx`.
- Presentation-only: no data fetching, edge function or schema changes.

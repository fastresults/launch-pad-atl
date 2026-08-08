# Shared link — mobile continuity audit and fix

Mobile only. Desktop layout and behavior stay exactly as they are.

## What the audit found

Confirmed in `src/routes/v.$token.tsx`:

1. **The next button disappears on the two sections readers land on first.** The prev/next block is rendered with `hidden={brainActive || timelineActive}`. The launch timeline is pinned near the top of the contents, so a reader who starts there scrolls to the bottom and finds nothing — a dead end. Same for the Second Brain pane.
2. **No sense of position.** Nothing tells the reader they are on asset 4 of 62, or which category they are in beyond a small kicker at the top that scrolls away.
3. **The section kicker is easy to miss** — 11px uppercase text above the title, no indication that a new category has started.
4. **Category boundaries are invisible.** Walking Next silently crosses from Foundation into Strategy with no marker.
5. **Swipe exists but is undiscoverable** — no hint that swiping walks the set.
6. **The bottom bar has no forward motion.** Contents / Ask / Share are all lateral actions; the primary "keep reading" action is buried at the end of a long scroll.
7. **Sheet accessibility warning** — the contents and brain sheets have no `SheetTitle`, which trips a console a11y warning.

## What to build (mobile only)

1. **Always-on next.** Remove the `hidden` condition on phones so prev/next renders under every section, including the launch timeline and the Second Brain sheet close-out. On the last asset, Next becomes "You've reached the end · Back to contents".
2. **Persistent Next in the bottom bar.** Change the mobile bar to four cells: Contents · Ask · Share · **Next** (accented, with the next asset's short title beneath). It always advances one asset, so forward motion is one thumb tap away no matter where the reader is in the scroll.
3. **Reading progress rail.** A 2px accent progress line under the sticky masthead showing position through the full asset list, plus a compact "4 / 62 · Foundation" chip in the condensed masthead.
4. **Category handoffs the reader can't miss** — this is where people are getting lost (Executive summary → Foundation → Strategy → Operations → Marketing):
   - **Category name always visible.** The section label moves into the sticky masthead chip so it never scrolls away; it changes color/animates briefly when the category changes.
   - **Interstitial chapter card.** Crossing into a new category renders a full-width card at the top of the pane: category name, one-line description, "Asset 1 of 9", and a horizontal chip row of that category's assets for direct jumping.
   - **End-of-category handoff.** The last asset in a category ends with a distinct card instead of a plain Next: "Foundation complete — 6 of 6. Up next: Strategy (9 assets)" with a large primary "Start Strategy" button and a secondary "Back to contents".
   - **Category stepper.** A slim horizontal scroller of all categories pinned under the masthead, current one highlighted, tap to jump to that category's first asset — so the reader always sees where they are in the overall arc.
   - The Second Brain and launch timeline are treated as their own pinned entries in this sequence, so leaving them lands the reader at the start of the first real category rather than nowhere.

5. **Stronger prev/next block.** Full-width stacked buttons on mobile (not two cramped 46% columns), each showing category + asset title, minimum 56px tall, Next visually primary.
6. **Swipe hint.** One-time subtle "Swipe or tap Next" cue on the first asset view, dismissed permanently via localStorage.
7. **Contents sheet continuity.** Highlight the current asset, and mark already-viewed assets with a subtle dot so the reader can see how far through they are.
8. **Fix the a11y warning** by adding visually hidden `SheetTitle` to both mobile sheets.

## Technical notes

- All changes are presentation-level in `src/routes/v.$token.tsx`, `src/components/share/ShareSidebar.tsx` (sheet variant only), and a small new `src/components/share/MobileReaderBar.tsx`.
- Ordering uses the existing flattened `items` array, so the sequence matches the contents tree exactly; the Second Brain stays out of the sequence but its sheet gets a "Back to <current asset>" close action.
- Viewed-asset tracking is local component state plus `sessionStorage`, keyed by share token — no backend, payload, or edge function changes.
- Every mobile branch is gated on `useIsMobile()`, so the desktop reading experience is untouched.

## Build order

1. Always-on prev/next + full-width stacked buttons + end-of-set state.
2. Four-cell bottom bar with persistent Next and next-title label.
3. Progress rail, position chip, category transition marker.
4. Contents sheet viewed-state, swipe hint, sheet titles.

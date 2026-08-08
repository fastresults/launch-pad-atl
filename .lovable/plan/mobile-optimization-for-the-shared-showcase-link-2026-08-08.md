# Mobile optimization for the shared showcase link

Short answer: not really. The share page (`/v/:token`) is responsive in the loose sense — it uses a few breakpoint tweaks and swaps the left sidebar for a hamburger sheet — but it was designed desktop-first. On a phone today:

- The masthead stacks logo, title, one-liner, "Visit website" and the menu button into one flex row, so the title truncates hard and buttons crowd.
- Navigation is a hamburger in the top-left corner — the least thumb-reachable spot on a phone.
- A floating "Ask this venture" pill sits over the reading text bottom-right.
- Body typography, tables and images use the desktop scale; wide tables and long URLs can overflow.
- Second Brain and the mind map render in the same pane with no full-screen sheet, no safe-area insets, and the mind map loads even on tiny screens.
- The timeline canvas is the one place with an explicit mobile branch (`VentureTimeline` uses `useIsMobile`).

## What to build

1. **Compact sticky masthead** — single line: logo, venture name, asset count. One-liner collapses to two lines with a "more" tap. Shrinks on scroll (reuse existing `condensed` state).
2. **Bottom action bar** (mobile only) — three thumb-reachable controls: Contents, Ask, Share/Visit site. Removes the floating pill and the top-left hamburger on mobile.
3. **Contents bottom sheet** — replaces the left-side sheet: search pinned at top, collapsible categories, active asset highlighted, closes and scrolls the reading pane to top on select.
4. **Reading pane typography** — larger base size and line height, generous paragraph spacing, edge-to-edge rounded images, horizontally scrollable tables with an edge fade, wrapped code and long URLs.
5. **Prev/next** — large tap targets pinned above the bottom bar; optional horizontal swipe between assets.
6. **Second Brain as a full-screen sheet** — single-column chat, sticky composer above the keyboard, `dvh` sizing, safe-area insets, thumb-sized voice button.
7. **Mind map fallback** — lazy-load the map bundle; below ~420px default to a grouped cluster list with the graph one tap away.
8. **Polish** — 44px minimum tap targets, no horizontal page scroll at 320px, native share sheet for copy-link when available.

## Technical notes

- Drive a distinct mobile branch in `src/routes/v.$token.tsx` with `useIsMobile()` rather than CSS-only hiding, so the desktop layout is untouched.
- `ShareSidebar.tsx` gains a `variant="sheet"` rendering used by the bottom sheet.
- `ShareSection.tsx` and `MarkdownProse.tsx` get mobile type/spacing scales and table scroll-fade.
- `ShareBrain.tsx` renders inside a `Sheet` at `100dvh` with `env(safe-area-inset-*)` padding on mobile.
- `ShareMindMap.tsx` becomes a lazy import with a cluster-list fallback.
- No backend, payload, or edge-function changes — presentation only.

## Build order

1. Masthead + bottom action bar + contents sheet.
2. Reading pane typography and overflow fixes.
3. Second Brain sheet + mind map lazy/fallback.
4. Swipe, native share, safe-area polish.

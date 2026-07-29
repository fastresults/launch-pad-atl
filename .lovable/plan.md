## Problem

In the admin console, long unbroken content (like the venture descriptions on Founders Hub) pushes the whole page wider than the browser window, so the sidebar and header get shoved off-screen and the page scrolls sideways.

Confirmed cause: the admin content area (`SidebarInset` in `src/components/ui/sidebar.tsx`, line 320) is a flex child with `w-full flex-1` but no `min-w-0`. Flex children default to `min-width: auto`, so they refuse to shrink below their content width — any wide child (long text, tables, code) expands the entire layout instead of being clipped or wrapped.

Secondary: on `/admin/hub`, each row's description uses `truncate` but the row is a `flex ... justify-between` whose text column can still grow; without a shrink constraint on the row it inherits the same blowout.

## Changes

1. `src/components/ui/sidebar.tsx` — add `min-w-0` (and `overflow-x-hidden` on the inset) so the content column can shrink to the available width. This is the single fix that resolves the blowout for every admin page, not just Founders Hub.

2. `src/routes/_authenticated/_admin.tsx` — add `min-w-0 overflow-x-auto` to the `<main>` wrapper so genuinely wide content (tables) scrolls inside the panel rather than breaking the page frame.

3. `src/routes/_authenticated/_admin/admin.hub.tsx` — make each row robust: `min-w-0` + `flex-1` on the text column, `shrink-0` on the "View attendee" link, and keep the description to a single truncated line. Also stack to two lines on narrow screens.

## Verification

Load `/admin/hub` and a wide table page (`/admin/members`, `/admin/registrations`) at 1386px and at ~900px, confirm no horizontal page scrollbar and the sidebar stays anchored.

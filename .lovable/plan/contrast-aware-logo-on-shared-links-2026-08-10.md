# Contrast-aware logo on shared links

## What's wrong

The showcase page always renders one logo URL: `/functions/v1/brand-logo/{snapshotId}`, which serves the **primary mark** with no regard for the surface behind it. The share page is a dark theme, so a navy-on-transparent mark (TAP) disappears into the background — exactly what the screenshot shows. The same URL is also reused for the "At a glance" hero, the sidebar, mobile masthead, and the PDF/Word exports, where the page is **white** and the opposite variant is needed.

The brand kit already stores reversed marks (`variants.mono`, `variants.knockout`, `horizontal`, `stacked`) — nothing reads them here.

## The fix

Build the contrast decision **server-side, once**, so every current and future share link (and every export) gets it for free.

### 1. Make the logo endpoint surface-aware

`brand-logo/{snapshotId}` gains an optional surface: `.../brand-logo/{id}/auto?on=dark` (and `on=light`). The function:

1. Measures the primary mark's own ink luminance (average non-transparent pixel / SVG fill sampling) using the shared WCAG helpers in `_shared/color-spaces.ts`.
2. Computes contrast of that ink against the requested surface.
3. If contrast is adequate, serves the primary mark unchanged.
4. If not, prefers a stored reversed variant in this order — `knockout` (for dark), `mono` (for light), `horizontal`/`stacked` as last resorts — and re-checks contrast on the candidate.
5. If no stored variant clears the bar and the file is SVG, it inverts the ink deterministically (recolour fills/strokes to white on dark, near-black on light) — the same technique already used by `collateral-svg.ts`.
6. If the file is a raster that can't be tinted, it composites the mark on a small rounded contrast plate instead of shipping an invisible mark.

Results are cached by `(snapshotId, variant, surface)` via existing `Cache-Control` headers.

### 2. Ship both surfaces in the share payload

`venture-share` returns `logoUrl` (unchanged, back-compatible) plus `logoUrlOnDark` and `logoUrlOnLight`, along with a `logoInk: "light" | "dark"` hint so clients can style plates and borders correctly.

### 3. Use the right one everywhere on the reader

- `src/routes/v.$token.tsx` — desktop masthead, mobile masthead, and the "At a glance" hero card all use the dark-surface URL (the showcase is dark-scoped).
- `ShareSidebar` / `MobileReader` — dark-surface URL.
- `src/lib/share-export.ts` — PDF and DOCX cover pages are white, so they use the light-surface URL.
- Any card that renders on a light-inverted surface picks by that card's own background token, not a global assumption.

### 4. Make it apply to existing links

No migration needed: the decision happens at request time from the existing brand-kit rows, so already-shared links pick up correct logos on the next page load.

## Technical notes

- Files touched: `supabase/functions/brand-logo/index.ts`, `supabase/functions/venture-share/index.ts`, `supabase/functions/_shared/color-spaces.ts` (small helper for measuring an image's dominant ink), `src/lib/venture-share.functions.ts` (payload type), `src/routes/v.$token.tsx`, `src/components/share/ShareSidebar.tsx`, `src/components/share/MobileReader.tsx`, `src/lib/share-export.ts`.
- Contrast floor: 3.0 for a logo mark against its surface (same bar the collateral quality gate uses at 2.4, tightened here because the mark stands alone).
- Unit tests for the ink-measurement and variant-choice helpers go next to `color-spaces.test.ts`.
- No schema change, no regeneration of assets required.

---

# Part 2 — Superseded assets are still showing up

The second screenshot shows the same page twice: `guidelines-1-cover` **and** `guidelines-1-cover-preview`, `guidelines-2-logo` **and** `guidelines-2-logo-preview`. A regeneration wrote the new files but the run it replaced was never swept, so the showcase lists stale twins of every page (and inflates the "61 assets" count).

## Fix

1. **Sweep on every regeneration, not just some.** Extend the `sweepKind` behaviour already in `venture-collateral` so it also applies to preview/derivative rows: after a successful run, any row for that kind whose `run_id` is not the current run is deleted from the table **and** its storage object removed. Same treatment applied to the other regenerators that write paired files (brand guidelines pages, social covers, ads, logo variants).
2. **One canonical row per page.** Where a page legitimately has a print file and a screen preview, they belong to a single row (`path` + `preview_path`), not two rows. A one-off repair pass collapses existing `*-preview` duplicates into their parent and deletes the orphans.
3. **Share payload de-dupes defensively.** `venture-share` filters out any item whose key ends in `-preview` when its parent exists, so already-generated ventures look right immediately, before the repair runs.

# Part 3 — Delete and regenerate from the shareable link

The share reader is the place founders actually review their assets, so the actions belong there too — for the **owner only**.

- When the viewer is signed in and owns (or admin-impersonates) the venture, each item card and each image tile in the showcase gets a discreet overflow menu with **Regenerate** and **Delete**, next to the existing export menu.
- Public/anonymous viewers see nothing new — the menu never renders and the endpoints reject non-owners.
- **Regenerate** calls the same edge function the hub uses for that asset kind and, per the existing "regenerate means replace" rule, deletes the superseded file and row before writing the new one.
- **Delete** removes the row and its storage object, then invalidates the share payload so the item disappears from the table of contents and the asset count.
- Ownership is verified server-side in `venture-share` (a new `action: "owner-context"` returning `canManage`), never inferred in the browser.

## Technical notes for Parts 2–3

- Files touched: `supabase/functions/venture-collateral/index.ts` (sweep widening + duplicate repair), `supabase/functions/venture-share/index.ts` (de-dupe + owner context), `src/routes/v.$token.tsx`, `src/components/share/ShareSection.tsx`, `src/components/share/ImagePreviewDialog.tsx` (owner action menu), `src/lib/venture-share.functions.ts`.
- Reuses `_shared/replace-asset.ts` for storage+row removal so deletion behaves identically wherever it is triggered.

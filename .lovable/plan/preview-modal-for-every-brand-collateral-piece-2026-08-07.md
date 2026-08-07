# Preview modal for every brand collateral piece

Right now the collateral library only shows a 64px thumbnail and raw SVG/PNG/HTML links that open in a new browser tab. Every piece — business card, letterhead, envelope, notecard, email signature, invoice, proposal, presentation master, brand guidelines — gets a proper in-app preview modal instead.

## What the user gets

- Click a collateral card (or its thumbnail) to open a large preview modal.
- Multi-page kinds page through inside the modal: business card front/back, presentation's 4 masters, the 10 guideline pages, invoice/proposal pages. Arrow keys and prev/next buttons, with a page counter and thumbnail strip.
- Each page renders large on a neutral checkerboard/paper backdrop so light artwork stays readable, with the true pixel dimensions shown.
- Footer actions per page: Download PNG, Download SVG, Copy link, and for the email signature a "Copy HTML" button plus a rendered HTML preview tab.
- Header actions for the whole kind: Regenerate (with spinner, refreshes the modal in place) and Clear this kind.
- Kinds with nothing generated yet still open, showing an empty state with a Generate button.

## Technical notes

- New component `src/components/hub/brand/CollateralPreviewDialog.tsx`, built on the shared `Dialog` primitives, following the pinned-header / scrollable-body / sticky-footer pattern already used by `src/components/hub/social/AssetPreviewDialog.tsx`.
  - Props: `open`, `onOpenChange`, `kind` meta (label/note), `files` (the `byKind[kind]` array), `busy`, `onRegenerate`, `onClear`.
  - Groups files into "pages" by matching base name so the SVG master, the `-preview` PNG and the HTML variant of the same page collapse into one entry; the PNG is what renders, the SVG/HTML hang off the download row.
  - `image/svg+xml` with no PNG sibling falls back to rendering the SVG in an `<img>`; `text/html` renders in a sandboxed iframe.
  - Keyboard: Left/Right paging, Escape closes (Dialog default).
- `src/components/hub/brand/BrandCollateral.tsx`
  - Each tile becomes a keyboard-accessible button that opens the dialog for that kind; existing inline Regenerate stays.
  - Replace the raw file links with a single "Preview" affordance plus the file-count badge, so the tile stops sprouting a variable row of SVG/PNG/HTML links (the ragged layout in the screenshot).
  - Holds `openKind` state and passes the matching files plus the existing `gen`/`wipe` mutations into the dialog.
- No edge function, schema, or generation-pipeline changes — this is presentation only, reading the same signed URLs `listCollateral` already returns.

# Visual indicators in the showcase contents list

Right now the left index is text-only, except for a bare number on gallery rows. A visitor scanning the list can't tell which entries open with a logo set, ad creatives, cover art, or a brand board. This adds a small, quiet media cue to every row that has visuals — in both the desktop rail and the mobile contents sheet.

## What the visitor sees

- Rows whose preview contains pictures get a small image glyph at the right edge, followed by the count when there is more than one (for example, an image icon then "9").
- The glyph varies by what the row actually holds, so the cue carries meaning:
  - Image set (logos, collateral, ads, social posts): images icon + count.
  - Single hero picture on a written asset: single image icon, no count.
  - Brand board: a tiny three-dot palette swatch using the venture's own colors.
  - Launch timeline: route icon (already pinned at the top).
- Category headers show the same glyph next to the item count when any child has visuals, so a collapsed "BRAND" row still reads as picture-heavy.
- The cue is muted by default and brightens on hover and on the active row. Never a badge, never colored chrome — it should read as a quiet mark, not a label.
- Rows already read keep their existing "seen" dot; the media glyph and seen dot sit together without crowding (glyph first, dot last).
- Icons are decorative with an accessible title (for example, "9 images") so screen readers get the same information.

## Technical notes

- All the data needed is already on `ShareItem` in `src/lib/venture-share.functions.ts`: `kind`, `images[]`, `heroImageUrl`, `brandBoard`. No backend, edge function, or payload change.
- Add a small helper in `src/components/share/ShareSidebar.tsx` (or a sibling `share-media-hint.ts`) that maps an item to `{ icon, count, kind }`, then render it in the existing row where the gallery count is emitted today, replacing that ad-hoc count block.
- Section headers derive their glyph by scanning their items with the same helper.
- Sizing: 12–14px icon in the rail, 14–16px in the sheet variant so it stays legible at thumb scale; use `text-muted-foreground/60`, `text-foreground/80` when active. Semantic tokens only.
- Palette swatch renders three rounded dots from `brandBoard` colors with a neutral fallback when colors are missing.

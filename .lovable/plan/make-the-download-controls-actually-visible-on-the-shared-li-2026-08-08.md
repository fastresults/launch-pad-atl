# Make the download controls actually visible on the shared link

The export controls exist and work, but they read as invisible: the per-section control is a 36px grey outline icon at 60% opacity pinned to the far right edge of the section header, and the masthead "Export everything" is a low-contrast outline button that sits past the "Visit website" button, off the right edge of most screens at this zoom. Nothing about either says "download".

## What changes

**Per-section control (desktop)**
- Replace the ghost icon with a labelled pill: download glyph + "Download" text, always at full opacity, accent-tinted border and text (same treatment as "Visit website" in the sidebar) so it reads as an action, not a decoration.
- Move it out of the far-right edge: it sits directly under the section title/subtitle block, left-aligned with the body text, so it is inside the reading column and impossible to scroll past.
- On hover it brightens; the menu (Word / PDF / Google Drive) is unchanged.

**Masthead "Export everything"**
- Promote to a solid, accent-filled button with a visible download icon and the label "Download all", placed before "Visit website" so it never falls off the right edge.
- On mobile it stays a 44px icon button but gains the accent-filled treatment so it stops disappearing into the header.

**Mobile per-section**
- Add a "Download this asset" row to the mobile section, directly above the prev/next block, full-width and thumb-reachable, matching the existing mobile button styling.

**Timeline section**
- Same labelled pill, placed with the timeline's own controls instead of floating alone above it.

## Technical notes

- `src/components/share/SectionExportMenu.tsx`: drop the `md:opacity-60` dimming, add a `variant="pill"` (icon + label, accent border) and `variant="primary"` (filled) alongside the existing icon/button variants; all colours from existing tokens (`primary`, `primary-foreground`, `border`).
- `src/components/share/ShareSection.tsx`: render `exportSlot` below the header block rather than as a right-aligned header sibling; add a mobile-only full-width slot above the body-end.
- `src/routes/v.$token.tsx`: swap the masthead instances to the filled variant and reorder before "Visit website"; pass the pill variant for the per-section slot.

No changes to export logic, file generation, or the Drive flow.

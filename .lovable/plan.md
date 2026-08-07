# Brand Studio — visual and UX overhaul

## What's wrong today

Looking at the expanded Brand Studio panel:

- **The identity preview is broken.** The saved logo renders in a fixed square tile with `object-cover`, so the lockup gets cropped mid-word ("Anderson El… Residences I"). Half the panel's height is a white box with a clipped mark and dead space to the right.
- **The palette reads as debug output.** Ten pill chips labelled with raw token names (`bg`, `fg`, `onAccent`, `onSecondary`) wrap across two lines at 10px. Nothing tells the founder these are their brand colours or which ones actually matter.
- **Boxes inside boxes.** The panel body is a card, the collateral block is another card inside it, and every deliverable is a third card — three nested borders with no visual hierarchy between them.
- **The value isn't stated.** There's no "here's what you get" moment. The founder expands the card and lands on token chips and a clipped logo, not on "15 print-ready files, your identity, ready to hand to a printer."
- **Deliverable rows are ragged.** Label, count badge, "Print-checked" badge and note all compete on one line; long labels truncate to "Business …" and "Letter…"; the Preview/Regenerate buttons sit at different vertical positions per card because the note text wraps differently.

## What we'll build

### 1. A real identity header
Replace the token chips + cropped logo with a proper brand summary band:

- **Logo plate** — the mark on a neutral plate, `object-contain`, sized to the lockup's aspect ratio rather than a forced square. Wide lockups get a wide plate; no cropping, ever.
- **Palette strip** — colours as a contiguous swatch bar (not pills), grouped into *Core* (primary, secondary, accent) and *Surface* (bg, fg, muted, border) with the `on*` pairs shown as a small contrast dot on their parent swatch instead of separate chips. Click still opens the editor; a hover tooltip shows the token name and hex.
- **Type specimen** — instead of two font names, render the actual heading and body faces at real size ("Aa" specimen + the venture name set in the heading face).

### 2. A value banner for collateral
Above the deliverable grid, one clear statement of what the founder is getting: file count, what's print-ready, and the single next action. States:

- **Not locked** — "Lock your brand kit to unlock 15 print-ready files" with the wizard CTA.
- **Locked, nothing generated** — the value pitch + one primary "Generate all" button.
- **Generated** — "15 files · print-checked" with Download ZIP as the primary action and Clear demoted into an overflow menu.

Details verification becomes an inline status line in this banner rather than a competing button.

### 3. Deliverable cards that line up
Rebuild each piece as a uniform card:

```text
┌──────────────────────────┐
│ [ 16:10 preview image ]  │  <- large thumbnail, object-contain
│ Business card            │  <- full label, no truncation
│ Front + back · 3.5×2in   │
│ ✓ Print-checked   5 files│
│ [Preview]      [Regen ⋯] │  <- pinned to card bottom
└──────────────────────────┘
```

- Fixed aspect preview at the top instead of a 64px square beside the text — the artwork is the product, so it gets the space.
- Full labels, status badges on their own row, action row pinned to the bottom so every card in a row is aligned.
- Empty pieces show a dashed placeholder with a single "Generate" affordance instead of a grey box icon.

### 4. Tier sections with breathing room
Essentials / Standard add-ons / Web & handoff get a proper section rule and a per-tier progress count ("3 of 5 generated"), replacing the current 10px all-caps label crammed above the grid.

### 5. Flatten the nesting
The collateral block loses its own card border and becomes a section within the Brand Studio panel, separated by a divider. Three border levels drop to one.

## Technical notes

- Files touched: `src/components/hub/BrandStudio.tsx`, `src/components/hub/brand/BrandCollateral.tsx`, `src/components/hub/brand/EditablePaletteSwatch.tsx`. New presentational components: `BrandIdentityHeader.tsx`, `CollateralPieceCard.tsx`.
- Presentation only — no changes to the generation pipeline, edge functions, database, `COLLATERAL_TIERS` data, or the preview/details dialogs. Same queries, same mutations, same handlers.
- All colour comes from existing semantic tokens; brand-kit hexes stay inline styles since they're user data, not theme.
- Logo aspect handled with natural image dimensions + `object-contain`, no fixed square.

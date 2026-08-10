# Collateral layout: stop guessing where text ends

## What's actually wrong in the three attachments

**Invoice and Proposal**

1. The FROM block collides with the table. The address line ("1375 Indian Trail Road · Norcross, GA 30093") is printed straight through the column header row and the table's top rule. The table's vertical position is a fixed guess — `tableTop = metaTop + 9 steps` — while the FROM/BILL TO blocks are wrapped text of unknown height (up to 6 lines). When the address wraps, the block grows past the guess and the table lands on top of it.
2. The title is struck through. The corner motif is drawn in the top-right corner, exactly where the right-aligned "INVOICE" / "PROPOSAL" title sits. Two elements own the same coordinates, so the motif rule reads as a strikethrough.
3. Empty rows are printed under a proposal that only has 5 scope items — a fixed 7-row table regardless of content.
4. The address is set as one long unwrapped run instead of wrapping inside its column.

**Presentation content slide (the numbered cards)**

5. The "01 / 02 / 03" number, the card headline, and the body copy overlap each other. The number, headline and body are placed at fixed offsets (2.2, 4.2 and 5.9 steps from the card top) that were tuned for one type scale. The headline auto-shrinks to fit the card width but nothing below it moves, and the body starts before the headline's descenders end.
6. Card height is a fixed 42% of the slide, so three short points leave two-thirds of each card empty — the dead grey space in the screenshot.

**The common root cause**

Every template positions elements with hardcoded multiples of the type step. The typesetter already measures and returns the real consumed height of a wrapped block (`{ svg, height, size, lines }`), but every call site throws that away and uses `.svg` only. Single lines return no metrics at all, and they silently shrink to fit — so the caller never knows how tall the thing it just drew actually is. Layout is therefore an assumption, and any venture whose content is longer than the tuning content breaks it.

## The fix: a measured flow, not a coordinate guess

### 1. Give the typesetter a cursor

Add a small `flow(x, startY, width)` helper next to `makeType`. It draws lines and blocks in sequence and tracks a live Y cursor using the real returned size and line count, plus an explicit gap between elements. `line()` starts returning `{ svg, size, height }` like `block()` already does, so a shrunk headline reports its true height.

Templates then read: number, gap, headline, gap, body — and the flow tells the template where the content ended.

### 2. Invoice / Proposal

- `tableTop` becomes `max(bottom of FROM block, bottom of BILL TO block) + one clear-space unit`, from measured heights, never a fixed step count.
- Row count becomes content-driven: scope items plus two spare rows for proposals, a fixed short grid for invoices, and the totals bar follows the last row.
- The address wraps inside its column instead of running as one line.
- The title and the corner motif get a shared exclusion zone: if the motif corner is the same corner as a title or header element, the motif is dropped for that page. Corner ornament never competes with type.
- If the measured content would push the table past its minimum height, the meta type steps down one notch rather than colliding.

### 3. Presentation content cards

- The number / headline / body stack flows through the cursor with proper optical gaps (headline gap ≈ 0.6× headline size, body gap ≈ 0.5×).
- Card height is derived from the tallest measured stack of the three cards, clamped to the slide's safe area, so all three cards match and none is two-thirds empty.
- Body copy line budget is computed from the space actually left in the card.

### 4. A collision check that fails the build, not the founder

The QC pass already inspects page metrics for logo problems. Extend it to record the drawn bounding box of every text and ornament element and flag any overlap between two non-transparent boxes, plus any element crossing the page's safe margin. A page that fails overlap QC regenerates at a stepped-down type scale before it is ever written to storage, and the failure is reported in the generation log so it stops being something the founder discovers.

## Technical notes

- `supabase/functions/_shared/collateral-svg.ts` — `makeType` gains `line` metrics and a `flow` cursor; `docTemplate` and the `slide-3-content` page in `presentation` are re-laid out against measured heights; `motif` gains corner-occupancy awareness.
- `supabase/functions/_shared/collateral-specs.ts` — `PageMetrics` gains a `boxes` array (x, y, w, h, role) fed by the draw helpers.
- `supabase/functions/_shared/collateral-qc.ts` — new overlap and margin-bleed verdicts, wired into the existing retry.
- No schema or UI changes; regeneration of collateral is what surfaces the fix.

## Out of scope

Redesigning the invoice/proposal/deck art direction itself. This is a typesetting and collision fix — the same designs, correctly composed.

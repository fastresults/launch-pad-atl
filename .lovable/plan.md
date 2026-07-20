# Hero Redesign — Editorial Balance, Take 3

## What's wrong with the current hero (honest critique)

Looking at the screenshot as a hero designer would in a crit:

1. **The pull quote is stranded.** It sits ~600px below the "Designed for" list in the left column with nothing beside it — the right column ended at the price card, so the quote hangs in a sea of empty cream. That's not "asymmetric editorial," that's an orphan.
2. **Two disconnected objects on the right.** The cup floats above a rectangle that floats above a quote. Three stacked islands, no shared spine. A proper editorial right rail is *one* composed column.
3. **The cup broke the card's top edge, which read as an accident, not intent.** Without a frame or ground line, the cup looks like a sticker slapped on a receipt.
4. **The vertical quote (one word per line) below the fold** is a symptom, not the cause — it's what happens when a `border-l` blockquote gets squeezed into a 4-col rail. It reads as broken layout, not typography.
5. **The masthead steam wisp bleeds into the nav** — a nice idea executed in the wrong z-layer.
6. **Left column ends abruptly at "Designed for"** with no visual weight to counter the price card's mass on the right. The composition tips right.
7. **Two competing focal points at the same altitude** (headline + cup) with no connective tissue (no rule, no ground shadow, no aligned baseline). The eye ping-pongs.

## What "right" looks like

One composed left column that closes cleanly. One composed right column that reads as a single object (cup → price → CTA → quote, top to bottom, on a shared spine). Both columns land on the same bottom baseline. No orphaned elements below the fold.

## The plan

### Left column (7/12)
- Kicker, H1, deck, secondary paragraph — unchanged.
- **Move the Adam Anderson pull quote here**, rendered horizontally as a proper editorial callout under the deck (not one-word-per-line). Serif italic, ~20px, 2 lines max, hairline rule above, small caps attribution below.
- **"Designed for" list stays as the closer** — pushed to `mt-auto` so it anchors the bottom baseline.
- Result: left column has 4 stacked blocks (kicker → H1+deck → pull quote → designed-for) with real visual weight top to bottom.

### Right column (5/12) — one composed object
- **Cup sits *above* the card as an integrated cameo**, but with a soft radial cream vignette behind it so it reads as intentional, not floating. Ground it with a very subtle drop shadow beneath the saucer.
- Steam animation kept, but constrained inside the cameo zone (fix z-index so it never crosses the header).
- Price card: `$297` display, "Just one morning" caption, one-line promise, primary CTA, secondary link. **Nothing else.**
- Remove the below-card quote entirely (it moves to the left column).
- Card gets a warmer treatment: no hard shadow, cream fill on cream page separated only by a hairline + generous internal padding — very Kinfolk/Cereal magazine.

### Shared structure
- Grid: `lg:grid-cols-12`, left `col-span-7`, right `col-span-5`.
- Both columns `flex flex-col` with the closing element on `mt-auto` → shared bottom baseline, no dead air.
- Reduce section vertical padding from `py-14` to `py-10` on desktop; the composition should feel like a magazine spread, not a landing page with cushion.
- Fix masthead steam clipping by giving the hero `isolate` and lowering the steam SVG z-index below the sticky header.

### Copy — unchanged
All existing copy stays verbatim per the brief. This is purely a compositional and typographic fix.

## Files touched
- `src/components/home/HomeFramework.tsx` — `Hero()` function only.

Nothing else changes.

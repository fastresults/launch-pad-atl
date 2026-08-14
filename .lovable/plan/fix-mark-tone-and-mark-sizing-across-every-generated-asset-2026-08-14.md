# Fix mark tone and mark sizing across every generated asset

## What the evidence shows

The venture's stored logo set has all six cells, including a real **stacked colour** file and a separate **stacked inverse** file. So the chosen cell was found — no fallback happened. The problem is downstream of the choice.

Two separate defects:

**1. The colour mark is repainted flat, so it reads as the inverse/mono artwork.**
Every collateral template hands the renderer an ink colour, and the renderer tints *all* paths of the artwork to that one ink whenever an ink is supplied. On the business-card back the template passes a grey-black ink, so the French blue-and-red stacked mark is repainted as a single dark shape. Visually that is the inverse/mono mark, exactly what was reported — even though the logs and the card badge correctly say "Stacked · Colour".

Flattening should only ever happen as a **legibility repair** (mark would otherwise disappear on its ground), never as a default styling choice.

**2. The lockup is sized by a height band that assumes a horizontal lockup.**
Mark size comes from a fixed height band per piece, with the width derived from the artwork's aspect. A stacked lockup is roughly square or taller, so at the same "lockup height" it occupies far less optical area than the horizontal lockup the band was tuned for — the mark reads small and unbalanced on the card, and the surrounding clear space and colour field are then sized from that too-small box.

## The fix

### 1. Ink becomes a request, not a command

- Templates keep passing their preferred ink, but the renderer treats it as *permission to recolour only if needed*.
- Full-colour artwork stays full colour when it clears the contrast floor on its ground.
- Flattening happens only when: the artwork fails contrast on that ground, or the surface is an explicitly monochrome treatment (foil/emboss-style pieces, deck watermarks, tiny thumbnail strips).
- When the founder has explicitly picked a cell, that artwork's own colour is preserved unless legibility forces a repair — and the repair is recorded on the specimen so QC and the card badge can say "recoloured for contrast" instead of silently swapping the look.

### 2. One mark-placement authority, sized by optical area

- Size the mark by **optical area inside its slot**, not by height alone: the band converts to a target area, and stacked/square artwork gets the height it needs to match the presence a horizontal lockup would have.
- Recompute clear space, the colour field width, and the contact column from the corrected box, so the card layout rebalances rather than leaving dead space.
- Cap by the slot's width and the piece's legal maximum so print standards still hold.

### 3. Apply the same authority to all digital assets

The same placement/tone rules get used by every surface that draws the mark, not just print collateral:

- brand collateral (cards, letterhead, envelope, notecard, signature, invoice, proposal, deck, guidelines)
- social/content ads and campaign cards
- email signature
- website PRD specimens and share/showcase surfaces

Each of these currently calls the mark renderer with its own ink and its own size logic; they will all route through the shared function so a chosen cell looks the same everywhere.

### 4. Make the outcome visible

- Record on each rendered specimen: cell requested, cell used, whether tone was preserved or repaired, drawn width/height, and the band it was measured against.
- Surface it on the piece card: "Mark: Stacked · Colour" stays, plus "recoloured for contrast" only when that actually happened.
- Log one line per piece with the same facts, so a wrong-looking mark can be traced without guessing.

### 5. Regression coverage

- Colour cell chosen on a light ground → artwork keeps its brand colours.
- Colour cell chosen on a dark ground with no inverse supplied → repaired, and the repair is reported.
- Inverse cell chosen → inverse artwork, unchanged.
- Stacked lockup and horizontal lockup rendered into the same slot produce comparable optical area.
- Business-card front/back, letterhead, envelope, signature and a social ad all report the requested cell.

## Technical scope

- `supabase/functions/_shared/collateral-svg.ts` — `markAt()` ink policy (request vs. repair), `logoBlock`, all template call sites that hard-pass an ink.
- `supabase/functions/_shared/collateral-specs.ts` — `logoBox()` becomes area-aware with form-specific handling.
- `supabase/functions/_shared/content-ad-svg.ts`, `signature-compositor.ts`, `campaign-card.ts` — route through the shared mark placement.
- `supabase/functions/venture-collateral/index.ts` — carry the tone-preserved/repaired verdict into the response and logs.
- `src/components/hub/brand/CollateralPieceCard.tsx` — show the repair note next to the mark badge.
- Tests alongside `logo-ink.test.ts` / `brand-legibility.test.ts`.

## Verification

Regenerate the business card, letterhead, envelope and one social ad for this venture with **Stacked · Colour** selected, then confirm the rendered mark is the blue/red stacked artwork at a balanced size, and that the response reports `used: stacked/colour, repaired: false`.

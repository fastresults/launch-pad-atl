# Fix the collateral output: why the card looks blank, and the art direction pass

You're right — what came out is not a business card. I pulled the generated files and found three concrete faults, not a taste disagreement.

## What is actually wrong (verified from the generated files)

**1. The white slab is your logo's own background.**
The saved mark is a traced drawing made of 107 white paths — including a full background plate. The compositor strips background *rectangles* only, so the plate survives. It then paints the whole mark one ink colour, so plate and artwork both become white: a white box with an invisible logo inside it. On the letterhead the same plate turned grey. That is the box in both screenshots.

**2. Every line of type is being dropped from the images.**
Fonts are pulled from Google. The request meant to fetch a plain TTF now returns woff2 as well, and the rasteriser cannot read woff2 — so it silently renders no text at all. The generated card PNG contains the logo and one hairline and nothing else. The same missing-font problem also breaks text measurement, so line fitting is guesswork.

**3. Nothing on the card is art directed.**
The front is a centred logo on a flat field. The only text is your 106-character tagline, set as an all-caps micro-label and auto-shrunk to 8pt to make it fit — illegible even when fonts work. The archetype the AI picked (`luxury_serif`, ivory paper, rule cap) is stored but barely expressed.

## The fix

**Logo ink, done properly**
- Detect and remove background plates whether they are rects or paths (any shape covering ~the whole artboard in white/near-white), then re-check: if the mark still fills its box edge to edge, treat it as a plate-backed asset and use the transparent PNG variant instead.
- Never paint mark and plate the same colour: after knockout, verify the ink contrasts with the surface behind it, and fall back to the opposite ink if it doesn't.
- Add a guard so a mark that renders as a solid block fails loudly instead of shipping.

**Fonts that actually render**
- Accept whatever Google returns and convert/branch properly: request TTF explicitly, and when only woff2 comes back, decompress it to TTF before handing it to the rasteriser and the metrics reader.
- If no usable font file exists, do not silently render nothing — fall back to a bundled serif/sans pair so every piece always has real type.
- Verify after render: if a page's expected text lines are absent from the raster, the piece is marked failed rather than stored.

**Real art direction on the page**
- Business card front: asymmetric layout on the chosen grid — mark at optical top-left in its clear space, a rule cap motif, generous margins, and the primary field used as a deliberate colour block rather than a flat fill.
- Tagline discipline: a card carries a short descriptor (max ~45 characters). Long positioning statements get distilled by the copy pass to a descriptor line ("Residential elderly care, Georgia") or omitted — never shrunk to fit.
- Minimum type sizes are enforced: nothing below 7pt at print scale, and if a line cannot be set at its minimum it is cut, not miniaturised.
- Same treatment applied across letterhead, envelope, notecard, invoice, proposal and presentation so the set reads as one system.

**Proof before it ships**
- After generating, sample the rendered PNG: confirm ink coverage is in a sane range (not a blank field, not a solid block) and that the mark area contains more than one colour. A piece that fails the check is reported as failed with the reason instead of appearing in the library.

## Technical notes

- `_shared/logo-raster.ts` — extend `stripSvgBackground` to path-based plates; add a contrast-checked knockout helper.
- `_shared/collateral-svg.ts` — font loading: explicit TTF request plus woff2→TTF decompression, bundled fallback faces; `fitLine`/`fitBox` gain a hard `minSize` floor with drop-instead-of-shrink; `businessCard` and siblings reworked onto the archetype grid.
- `_shared/collateral-copy.ts` — add a card descriptor field (≤45 chars) derived from the venture.
- `venture-collateral/index.ts` — post-render pixel sanity check; failed pieces return in `failed[]` with a reason.

Order of work: fonts first (they make every piece visible), then logo ink, then layout and copy, then the sanity check.

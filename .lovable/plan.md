# Hero rebalance v3

## Moves (Hero in `src/components/home/HomeFramework.tsx`)

**Shrink the right column by ~30%**
- Grid: `lg:col-span-6 / lg:col-span-6` → `lg:col-span-8 / lg:col-span-4`.
- Card `max-w-[520px]` → `max-w-[360px]` (~30% narrower).
- Cup width `280px / lg:320px` → `200px / lg:224px` so it stays proportional to the narrower card; steam scales with it.
- Card negative-top translate reduced to match smaller cup (`-translate-y-20 lg:-translate-y-24`); card top padding reduced to `pt-24 lg:pt-28`.

**Move the pull quote from left → right, below the CTA/fine-print**
- Delete the `<figure>` block from the left column.
- Add it directly below the price card in the right column (outside the card, in the same column flex), so the reading order on the right is: cup → $297 → deck → Reserve → "Can't make it?" → quote.
- Quote styling stays: italic serif, `#8B7355`, left hairline (`border-l-2 border-[#C9B99A] pl-5`), Adam Anderson cap-attribution.
- Constrain quote to card width so the right column reads as one aligned stack.

**Rebalance the left column**
- With the quote gone, the left column ends on the "Designed for" grid. Push it to a shared bottom baseline with `mt-auto` on the "Designed for" wrapper so the four bullet items align with the bottom of the right-column quote.
- Keep the deck + secondary paragraphs at their current spacing; the extra breathing room now reads as intentional editorial air (larger headline column) rather than an empty band, because the bottom baselines match.

## Guardrails
- No copy changes.
- No palette changes.
- Verify at 1386 and 1851 CSS widths: right column is visibly ~30% narrower; quote lives under the CTA; both columns end within ~24px of each other.

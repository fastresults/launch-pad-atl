# Trim the Foundation homepage below the hero

When the Foundation Workshop is the selected chip on the homepage, the page below the hero drops four blocks and goes straight from the pain sections to the closing decision. All eight build workshops keep their full page unchanged.

## Sections removed (Foundation only)

- What you walk out with — the checklist plus the "your live page" card
- The morning, hour by hour — the four working blocks
- Two ways to get it — the live morning / self-paced course cards
- Read both columns honestly + What you're probably thinking — the fit columns and the objections row

## What stays for Foundation

- Hero and workshop chips
- The cost-of-circling section
- The pain section
- The closing decision block and CTA
- The sticky workshop bar with price and reserve link

## Technical notes

- `src/components/home/workshop/WorkshopStack.tsx` renders the shared stack. Gate the four blocks behind `workshop.slug !== FOUNDATION_SLUG` (imported from `src/lib/workshop-catalog.ts`), leaving `WorkshopCost`, `WorkshopPains`, and `WorkshopDecision` always rendered.
- No component files are deleted — the removed sections are still used by the other eight workshops.
- Verify the cross-fade keyed on `workshop.slug` still animates cleanly when switching between Foundation and a build workshop, and that no spacing/border double-lines appear where sections were dropped.

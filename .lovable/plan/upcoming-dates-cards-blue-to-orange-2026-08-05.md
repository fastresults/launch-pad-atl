# Upcoming dates cards: blue to orange

## What changes

On the "Upcoming dates" cards (the Wed, Aug 12 / Sep 9 / Oct 14 session cards on a workshop page):

- The small uppercase workshop title above each date ("CONVERT YOUR WEBSITE") changes from brand blue to brand orange.
- The "Reserve →" button text, its arrow, its border, and its soft background tint change from blue to the same orange.

Everything else on the card stays as-is: date, time, card background, borders, spacing, and layout. No other section of the page changes color.

## Technical notes

- Add a brand orange token in `src/public.css` alongside the existing `--sl-quote-gold`, e.g. `--sl-brand-orange: #e07a2f` (warm orange that reads clearly on the midnight-navy card), plus a matching low-opacity tint for the button background/border.
- In `src/components/home/workshop/WorkshopExtras.tsx` (`WorkshopDates`), swap the `text-primary` on the eyebrow line and the `text-primary` / `border-primary/30` / `bg-primary/10` / `hover:bg-primary/20` on the Reserve link for the new orange token via a small scoped class (no hardcoded Tailwind color utilities in the component).
- The "See all dates across every workshop" link above the grid stays blue unless you want it changed too.

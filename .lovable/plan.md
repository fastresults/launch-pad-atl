# Workshop icon in the hero chat box

## What changes

The typing text inside the hero chat box gets a small icon in front of it, matching the workshop selected in the chip rail above (compass for Foundation, and each build workshop's own icon for Brand, Website, Sales, CRM, Social, Content, AI ops, Accounting).

- The icon is brand orange, the same orange now used on the session date cards.
- It sits inline, left of the typing text, vertically centered, sized to match the text.
- It swaps instantly when a different workshop chip is selected.
- Once the visitor starts typing, the ghost line (icon + text) disappears as it does today, so the icon never overlaps real input.

## Technical notes

- `src/components/home/IdeaPrompt.tsx` already receives the active `workshop` object, which carries an `icon` (a Lucide component) from `src/lib/workshop-catalog.ts`. Render it inside the `.sl-prompt__ghost` block before the text span.
- Style with a new `.sl-prompt__ghost-icon` rule in `src/public.css` using the existing `--sl-brand-orange` token, `flex-shrink: 0`, and a size tied to the ghost text's font size.
- No new data, icon mapping, or props needed.

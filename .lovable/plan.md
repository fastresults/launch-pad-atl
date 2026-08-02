## Problem

At the bottom of the Atlanta snapshot modal, the actions are mixed types — one pill button plus two underlined text links — and they appear in two places (invite card + sticky bar) with different order and styling. It reads as clutter, not a choice.

## What to build

One consistent action set, three buttons, same shape (pill), ranked by visual weight and order:

1. **Learn more about the morning** — primary, filled accent pill, arrow-down icon
2. **Reserve my seat** — secondary, outlined glass pill, arrow-right icon
3. **Ask a question** — tertiary, quiet ghost pill (no border, muted text)

No underlined text links anywhere in the action area. Same three buttons, same order, in both the invite card and the sticky bottom bar (sticky bar keeps a compact size and stacks full-width on mobile).

## Technical notes

- `src/styles.css`: add `.hero-btn` base plus `.hero-btn-primary` / `.hero-btn-secondary` / `.hero-btn-ghost` variants beside the existing `.hero-cta` (keeps hero input CTA untouched). Primary uses the existing accent `#4C8CFF` treatment; secondary reuses the current glass style; ghost is transparent with muted foreground and a hover wash.
- `src/components/home/IdeaSnapshotModal.tsx`: replace both action clusters (invite card, lines ~359–379; sticky bar, lines ~392–409) with a shared local `ActionRow` component rendering the three buttons in the ranked order, so the two locations can never drift again.
- Sticky bar layout: left side keeps the date/venue/price line; right side holds the action row, wrapping to a full-width stack under `sm`.
- Verify with Playwright at 700px and 1025px viewport heights that all three buttons stay visible and aligned.

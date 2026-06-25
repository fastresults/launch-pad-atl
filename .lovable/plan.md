## Problem

In `ConceptStudio` → "Alternative angles", each idea card renders:

- **Why:** in `text-emerald-300/80`
- **Risks:** in `text-amber-300/80`

Those `*-300/80` tones were chosen for a dark surface, but the card (`bg-card`) renders on a near-white surface in the current Review/Hub context (see screenshot). The result: pale mint and pale yellow text on white — fails contrast and is hard to read. The same issue applies after "Use this" is pressed because the card stays in place.

## Fix

File: `src/components/hub/ConceptStudio.tsx` (lines 185–186, inside the `ideas.map` card).

Replace the single-tone classes with a label+body treatment that holds up on both light and dark surfaces:

- Wrap Why/Risks in a small two-line block with a subtle tinted background and a darker text token.
- Use semantic dual-tone classes so contrast works in light and dark modes:
  - Why: `bg-emerald-500/10 text-emerald-700 dark:text-emerald-300` with a bold "Why" label.
  - Risks: `bg-amber-500/10 text-amber-800 dark:text-amber-300` with a bold "Risks" label.
- Bump font size from `text-[11px]` to `text-xs` and add `leading-snug` for readability.
- Add a thin left border (`border-l-2 border-emerald-500/60` / `border-amber-500/60`) and `pl-2 py-1 rounded-r-md` so the rows read as callouts, not body copy.

Apply the same treatment to the Red-team findings list (lines 196–200) where `text-muted-foreground` evidence text also gets washed out — switch to plain `text-foreground/80` so it stays legible on the white card.

No logic, no copy, no layout changes beyond the inline styling of those two lines per card.

## Out of scope

- No changes to the "Use this" button behavior or the apply flow.
- No changes to the Alternative angles list structure, ordering, or data.
- No global token edits — fix is local to this component.

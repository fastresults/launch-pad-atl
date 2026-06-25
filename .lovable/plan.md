## Goal

Subtly mark sections **06 Brand**, **07 Marketing**, and **08 Social & Content** as **bonuses** — without changing the layout, the numbered-block format, the card grid, hover effects, or any deliverable copy.

## The change in one line

Add an optional `bonus?: boolean` flag to `FrameworkStage`, flip it `true` for stages 06/07/08, and render a small "BONUS" pill next to the stage name when the flag is on.

## Where it shows up

Inside the existing stage header in `HomeFramework.tsx` (the `<h3>` line that currently renders `{stage.name}`):

```text
[06]  Brand   [ ✦ BONUS ]
      An identity worth premium pricing — system, not stickers.
```

- Pill sits **inline, to the right of the stage name**, baseline-aligned with the h3.
- Style mirrors the existing hero accent pill (so it feels native to the page): rounded-full, `border-primary/40`, faint `bg-gradient-to-r from-primary/20 to-primary/5`, `text-white`, `text-[10px] md:text-xs`, `uppercase tracking-[0.18em]`, `px-2 py-0.5`, with a tiny `Sparkles` (size-3) icon.
- Numbered "06/07/08" gradient digit, card grid, icons, hover state, spacing — all unchanged.

The same pill also appears in the **register page** stage list (`RegisterFramework.tsx` already iterates `FRAMEWORK_STAGES`), so the bonus marker stays consistent across both surfaces.

## Optional copy nudge (small, low-risk)

Add one short sentence under the section's intro paragraph (line 135 area) to anchor *why* there are bonuses, without changing structure:

> "Six core categories plus three bonus tracks — Brand, Marketing, and Social & Content — included at no extra cost."

If you'd rather leave the intro paragraph exactly as it is and let the pills speak for themselves, say the word and I'll skip this line.

## What is NOT changing

- Section order, card counts (4/5/4/5/3/5/1/7), deliverable titles, icons, hover effects.
- The numbered "06/07/08" gradient digits — bonus stages keep their numbers.
- Visual styling of cards, grid, spacing, background.
- DB, edge functions, dashboard — untouched.

## Files touched

- `src/lib/framework-deliverables.ts` — add `bonus?: boolean` to `FrameworkStage`, set `bonus: true` on stages 06, 07, 08.
- `src/components/home/HomeFramework.tsx` — render the inline pill inside the stage header when `stage.bonus`; optional one-sentence copy add.
- `src/components/register/RegisterFramework.tsx` — render the same pill inline next to `stage.name` in the aside list.

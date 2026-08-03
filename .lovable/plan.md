## Current state
`src/components/home/FounderVideoWall.tsx` line 39 already reads:
`font-serif text-[12px] font-normal leading-tight text-foreground/50 md:text-[13px]`

So the size, weight, and opacity classes are applied. If it still looks large and bold in the preview, the cause is the serif display face itself (heavy default cut) rather than the utility classes.

## Change
Restyle the heading as a small, quiet label rather than a serif headline:

- Swap `font-serif` for the body sans stack (`font-sans`) so `font-normal` actually renders light.
- Size down to `text-[10px] md:text-[11px]`.
- Add `uppercase tracking-[0.18em]` so it reads as a section label at that size.
- Keep `font-normal` and `text-foreground/50`.

Resulting class list:
`font-sans text-[10px] font-normal uppercase tracking-[0.18em] leading-tight text-foreground/50 md:text-[11px]`

Nothing else in the section changes.

## Fix remaining public seat-count leak

**Found:** `src/routes/index.tsx` line 647 hard-codes the internal total ("Twenty seats") in a section headline:

> Twenty seats. One date. One door from idea to business.

Everywhere else on this section (and the rest of the public site) already shows the scaled public number via `EVENT.capacity` (which uses `toPublicSeats` in `src/lib/schedule-data.ts`).

## Change

In `src/routes/index.tsx` line 647, replace the hardcoded word "Twenty" with a dynamic value derived from `EVENT.capacity`, rendered as a word for headline style:

- Use `EVENT.capacity` (already in scope on this page — used at lines 150, 561, 846).
- Spell the number out (e.g. "Ten") so the headline keeps its current voice. Add a tiny helper `numberToWord(n)` local to this file covering the realistic range (1–20, fallback to digits) and capitalize at the headline.

Result:
> Ten seats. One date. One door from idea to business.

## Out of scope

- No changes to data, pricing, admin UI, or internal capacity.
- No other files touched — a grep for "Twenty"/"20 seats"/raw capacity strings on public routes returned only this one leak.

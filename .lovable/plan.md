## Goal
Each of the 34 deliverable rows in the homepage Framework section gets a hover tooltip with a ~40-word description that explains (a) what the deliverable actually is and (b) the concrete positive impact it gives the workshop attendee.

## Scope
- File: `src/lib/framework-deliverables.ts` — add a `tooltip: string` field to every item in `FRAMEWORK_STAGES[*].items`.
- File: `src/components/home/HomeFramework.tsx` — wrap each deliverable row in shadcn `Tooltip` (`TooltipProvider` once at the section root, `Tooltip` + `TooltipTrigger asChild` per row, `TooltipContent` with the copy).
- No DB, no edge function, no other surfaces touched. The dashboard reads its own copy from the DB, so this is homepage-only as requested.

## Copy approach
Tooltips are written specifically for a first-time Main Street founder attending the $197 workshop. Every tooltip:
- Opens with what the artifact *is* in plain language (no jargon).
- Closes with the *impact* — what it unlocks (clarity, a sale, a bank meeting, time saved, a hire, etc.).
- Target 38–42 words. Hard ceiling 45.

Examples (full set of 34 written during build):
- **Executive Summary** — "A one-page snapshot of your startup — what you do, who it's for, how you make money, and why now. Hand it to a banker, a partner, or a future hire and they'll get it in 60 seconds."
- **Vision & Mission** — "The north-star statement that keeps you and your team pointed the same direction when things get noisy. You'll stop chasing every shiny idea and start saying no to the work that doesn't move you forward."
- **Market Sizing / Market Analysis** — "A grounded read of how big your opportunity actually is in your city, your state, your category. You'll stop guessing whether the demand is real and start making spend, hiring, and pricing decisions with numbers behind them."
- (…32 more, one per deliverable, same pattern.)

## UI behavior
- Trigger: hovering the row (and keyboard focus for a11y). On touch, tap reveals.
- Position: `side="top"` with 6px offset; max width ~320px; use existing `TooltipContent` styling — no new tokens.
- Cursor: `cursor-help` on the row to signal interactivity.
- Delay: `delayDuration={150}` for snappy reveal.
- Wrap the whole section in a single `TooltipProvider` to avoid duplicate providers.

## Verification
Drive Playwright at 1280×1800 against `/`, hover three sample rows (Executive Summary, Go-to-Market Plan, Budget & Pro Forma), screenshot each, confirm tooltip text appears, is readable on the dark background, and doesn't overflow the viewport.

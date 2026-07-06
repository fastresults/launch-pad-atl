
## Goal

When a visitor hovers a card in the sliding startup-concepts scroller and the marquee pauses, a refined "AI briefing" popover fades in over the image — telling them who the ideal owner/operator is, why it's a smart move, and how much they could realistically make per year.

## Recommendation

Render the popover **inside the card** (anchored, not a global tooltip) so it appears smoothly over the image without breaking the marquee pause behavior or clipping at the row edges. Style it as a soft, blurred glass panel with a subtle primary-tinted border and a small "AI insight" chip — matches the existing Sparkles/`primary/15` language already used in `HomeBusinessIdeasScroller`.

## Content model (data)

The current `BusinessIdea` type has `offer`, `startupCost`, `incomePotential` (monthly), `firstCustomers`, `stageHint`. It's missing operator + rationale, and only carries monthly revenue.

Add two optional fields to `BusinessIdea` in `src/lib/business-ideas.ts`:

- `idealOperator: string` — one-line persona, e.g. *"Ex-service-industry pro who's great on the phone and wants a laptop business."*
- `whySmart: string` — one-line thesis, e.g. *"Trades lose ~30% of after-hours calls. You plug the leak for less than one missed job/mo."*

Annual income is **derived**, not stored: parse the existing `incomePotential` string ("$10k–$25k / mo", "$15k–$50k / season", "$3k–$15k / mo (after 6 mo)") with a small helper that:

- extracts the low/high numbers,
- multiplies by 12 for `/mo`, by 1 for `/season` or `/yr`,
- returns a formatted annual range like *"$120k–$300k / yr"*,
- preserves qualifiers like *"(after 6 mo)"* or *"(seasonal)"*.

Backfill `idealOperator` and `whySmart` for all 60+ ideas in the same file. Keep both lines tight (≤ ~110 chars) so the popover stays clean.

## Popover UX

In `src/components/home/HomeBusinessIdeasScroller.tsx`, update `IdeaCard`:

- Wrap card in `relative` (already is) and add a hover/focus-visible state.
- On `group-hover/idea` and `group-focus-within/idea`, fade in an absolutely-positioned overlay covering the **image area only** (not the title/offer footer), so the card's name stays anchored underneath.
- Overlay styling: `bg-background/70 backdrop-blur-md`, `border border-primary/30`, `rounded-t-xl` (matches card top), `p-4`, `text-xs`, subtle `shadow-lg shadow-primary/10`, entry transition `opacity + translate-y-1` over 200ms.
- Content layout:
  - Header row: `Sparkles` icon + tiny uppercase label "AI insight" in `primary`.
  - Three labeled blocks stacked with 8px gaps, each with a muted eyebrow and a foreground body line:
    - **Ideal operator** — `idea.idealOperator`
    - **Why it's smart** — `idea.whySmart`
    - **Annual potential** — derived annual range, with a `TrendingUp` icon; keeps the existing monthly chip in the top-right for quick scan.
- Accessibility: overlay is `aria-hidden` visual layer; add a visually hidden `<span>` inside the card containing the same three lines so screen readers get them without hover. Keyboard users: card becomes `tabIndex={0}` so `focus-within` reveals the overlay.
- Touch/mobile: hover doesn't exist. Show a small `Info` button in the top-left corner (below the category chip) on `sm:hidden` that toggles the overlay on tap; on `sm:` and up rely on hover.

## Marquee interaction

The row already pauses on `mouseenter`. Because the overlay lives inside the card and the card is inside the flex row, hovering the overlay keeps the row paused (same element tree) — no extra JS needed. Verify by hovering: card should hold still, overlay fades in, moving the mouse out resumes scroll and fades the overlay out.

## Files touched

- `src/lib/business-ideas.ts` — add `idealOperator` + `whySmart` to the type and to every entry; export a small `toAnnualRange(incomePotential: string): string` helper.
- `src/components/home/HomeBusinessIdeasScroller.tsx` — update `IdeaCard` with the popover overlay, mobile toggle, and a11y text; import the annual helper.

No other components consume `BusinessIdea` in a way that breaks with two new optional fields (verified: `HomeBusinessIdeasScroller` is the only reader).

## Verification

- Playwright: hover a card in the scroller → assert row's animation `paused`, overlay visible, "Annual potential" line present with `/ yr`. Move mouse away → overlay hidden, animation `running`.
- Spot-check three cards with different `incomePotential` shapes (`/mo`, `/season`, `/mo (after 6 mo)`) to confirm the annual formatter reads cleanly.
- Light + dark: overlay contrast passes against varied photo backgrounds thanks to `bg-background/70 backdrop-blur-md`.

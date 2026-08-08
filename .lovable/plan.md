# A sequential list view under the launch timeline

Right now the cadence is only readable as a horizontal track (desktop canvas) or a compact stepper (mobile). Below the canvas we add a proper, beautifully formatted **step list** — the same schedule read top to bottom, phase by phase — so a reader who doesn't want to pan a chart can still follow the whole plan in order.

Because both surfaces render the same `VentureTimeline` component, building it once makes it appear in the founder's venture dashboard and in the shared showcase link automatically.

## What it looks like

- Sits directly under the canvas, inside the same dark cadence panel, with a quiet heading: "Step by step" and a one-line count ("18 steps · idea to first cash in 14 weeks").
- Grouped by phase. Each phase gets a rule with its label, blurb, and its own date range.
- Each row: a numbered marker, the step title, the lane tint dot and lane name, start → done dates, duration in days, and an effort figure. Milestones appear as an inline emerald chip on the row that unlocks them.
- Rows expand in place to show "Why it's here", "Done when", "Can't start until", plus the existing actions — Open the asset, Ask the second brain, and (owner only) the ±1 week nudges.
- Selecting a row selects the same step on the canvas and vice versa; the active row is highlighted and scrolled into view. On a shared link that also updates the `#overview:timeline/<step-id>` hash, so list rows are deep-linkable.
- Rows with blackout overlap or an unavoidable wait carry a subtle amber note, matching the detail panel.
- Read-only mode (public showcase) drops the nudge controls; everything else is identical.
- Mobile keeps the existing stepper as the primary view; the list replaces it only where it is strictly better — the stepper is upgraded to share the new row styling so the two read as one design.

## Technical notes

- New `src/components/timeline/TimelineList.tsx` — presentational only. Props: `timeline`, `layout`, `scenario`, `selectedId`, `onSelect`, `onOpenAsset`, `onAsk`, `onNudge`, `readOnly`. Derives phase grouping and the milestone-by-step map from the existing `Layout` (no new scheduling logic).
- `src/components/timeline/VentureTimeline.tsx` — render `<TimelineList>` below the canvas block, wired to the same `selected` / `setSelected` state and the same handlers already passed to `TimelineStepPanel`. No prop-signature change, so `TimelineHubCard` and `ShareSection` need no edits.
- Row detail reuses the copy blocks from `TimelineStepPanel` — extract the small `Fact`/`Head` helpers into the list file or a shared `timeline-bits.tsx` so styling stays in one place.
- `TimelineMobile.tsx` — restyle rows to match the new list; behaviour unchanged.
- No database, edge function, or share-payload changes: the list renders from data already in the payload.

## Verification

Typecheck, run the existing scheduler tests, then check in the browser: the list appears under the canvas in the hub card and on a share link, phase grouping and dates match the bars, clicking a row selects the bar (and updates the hash on the share link), expanded actions open an asset and seed the second brain, and the nudge controls are absent on the public view.

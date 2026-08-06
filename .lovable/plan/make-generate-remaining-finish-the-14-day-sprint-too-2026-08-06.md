# Make "Generate remaining" finish the 14-day sprint too

Today the bulk run only looks at the flat list of asset types. The day-by-day sprint panel counts the same assets but grouped by day — so a run can report "done" while Day 4 sits at 2/3 and Day 11 at 2/3, and nothing in the UI pushes those last day-gaps to completion.

Verified on the current venture: exactly two assets are not complete — `presell_landing_prd` (Day 4) and `website_prd` (Day 11). Both rows carry `blocked_reason = "Lock your Brand Wizard to unlock this asset."` and `generation_attempts = 0`, so they were gated out before any AI call was ever made. Those two are precisely the missing day slots in the screenshot.

## What changes

1. **Sprint-aware completion pass.** After the main pass and retry sweep, the job walks all 14 days, finds any day whose required assets aren't all `complete`, and generates the missing ones with day context injected (day theme, objective, "done when", and the sibling assets already written for that day). So a missing asset is derived from the day's intent plus the 60 assets already on file — not from a cold prompt.
2. **Stale blocks are cleared, not respected.** A `blocked_reason` older than the run is treated as a candidate for retry: the run re-evaluates the gate (brand kit auto-derivation already exists), and only re-blocks if it still genuinely can't proceed. This is what keeps the two Brand-Wizard-gated assets from sitting at 0 attempts forever.
3. **Sprint gaps count toward the button.** "Generate remaining N docs" counts sprint-required assets that aren't complete, so the number the founder sees matches what the sprint panel shows.
4. **Per-day action in the sprint panel.** Each partial day tile gets a "Finish this day" action that runs just that day's missing assets.

## What the founder sees

- Pressing "Generate remaining 2 docs" now writes both, and the sprint moves 12/14 → 14/14 with no Brand Wizard detour.
- While the sprint pass runs, the progress line reads "Filling day gaps — Day 11: Ship the site + brand pack".
- Any day still short after all rounds shows why in plain language on that day's panel, with the one action that unblocks it.

## Technical detail

**`supabase/functions/_shared/launch-14day-plan.ts` (new)**
- Server-side copy of the day → `assetKeys` map (day number, theme, objective, doneWhen, category), mirroring `src/lib/launch-14day-plan.ts`. Single exported `LAUNCH_14DAY_PLAN`.

**`supabase/functions/venture-bulk-generate/index.ts`**
- New `sprintSweep(supabase, ctx, jobId, types, state)` runs after `retrySweep`, before the final job update. For each day: intersect `assetKeys` with active, non-skipped `types`; select rows not `complete`; regenerate with `mode: "full"` and an extra `dayBlock` prompt section (`Day N — theme / objective / done when / already written for this day: <sibling titles>`).
- `generateOne` gains an optional `dayContext` string appended to the preamble.
- Before the sprint pass, clear `blocked_reason` on any doc whose `blocked_reason` predates `job.started_at` so the gate is re-evaluated (brand auto-derivation then runs as it already does).
- Final status accounts for sprint gaps: `completed` only when no day has a missing required asset.
- Accepts `sprintOnly: true` and `days: number[]` in the request body for the per-day action.

**Client**
- `src/lib/foundersHub.functions.ts`: `bulkGenerate` passes `sprintOnly` / `days`.
- `src/components/hub/LaunchPlanner14Day.tsx`: new `onFinishDay(day)` prop; partial day panels render a "Finish this day" button wired to it.
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`: pass `onFinishDay` calling `bulk.mutate({ days: [n] })`; include sprint-missing keys in the `remaining` count used by the hero button label.

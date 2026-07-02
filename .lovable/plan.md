## Goal
On `/dashboard/workflow`, add a second progress track for **hero images** alongside the existing document progress, so the user can watch images fill in at their own pace.

## Where
`src/routes/_authenticated/dashboard/workflow.tsx` — the header card that today shows `generatedCount / triggerable.length` and the "Building your kit — X of Y" progress bar.

## Data
`attendee_deliverables` already stores `hero_image_path` and `hero_image_status` (`generating` | `ready` | `failed` | null) per key. Extend `getMyWorkflow` in `src/lib/userPipeline.functions.ts` to also select `hero_image_path, hero_image_status` and return, per item:
- `image_ready: boolean` (path present)
- `image_status: 'idle' | 'generating' | 'failed' | 'ready'`

No schema changes, no new edge functions.

## UI changes (workflow.tsx header)

Replace the single progress row with a stacked two-row mini-dashboard:

```text
Startup assets   [██████████░░░░]  18 / 34 ready
Hero images      [████░░░░░░░░░░]   7 / 18 painted   • 2 generating • 1 failed
```

- Documents bar: unchanged math (`generatedCount / triggerable.length`).
- Images bar denominator = number of items that already have generated content (only docs with content can have an image). Numerator = items with `image_ready`.
- Small inline chips: count of `generating` (spinner icon) and `failed` (retry-tone).
- Same visual polish as the current bar; reuse `<Progress />` with a muted variant for the image row.

Per-row card list (existing cards further down):
- Add a tiny image status dot next to the "Generated" badge: solid = ready, pulsing = generating, warning outline = failed. No extra buttons — clicking the card already leads to the detail page where images can be regenerated.

## Polling
The page already refetches workflow data periodically for doc status. Extend the same query to include the new image fields so both rows animate together. No new intervals.

## Out of scope
- No changes to how/when images generate (auto-kick lives in `workflow.$key.tsx`).
- No admin view changes.
- No new tables, functions, or storage.

## Files touched
- `src/lib/userPipeline.functions.ts` — extend select + returned item shape.
- `src/routes/_authenticated/dashboard/workflow.tsx` — second progress row + per-card image dot.
- `src/lib/workflow.ts` (only if the `WorkflowItem` type needs the two new fields).

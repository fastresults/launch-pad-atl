# Remove check-mark deliverable rows on /schedule

The selected element is the `t.deliverable` line that renders next to a `Check` icon for every task under each stage on the `/schedule` page. You want this row removed throughout the schedule.

## Change

**File:** `src/routes/schedule.tsx`

In the task loop (around lines 182–190), remove the entire `<div className="mt-0.5 flex flex-wrap...">` block that contains:
- the `Check` icon + `{t.deliverable}` span
- the `{t.tool}` pill

Result per task: title → bulleted `details` → take-home → follow-up. No check-mark deliverable line, no tool pill.

Also remove the now-unused `Check` import from the `lucide-react` import on line 7.

## Out of scope

- No changes to `curriculum-data.ts` (the `deliverable` and `tool` fields stay in the data — only their rendering on `/schedule` is removed).
- No changes to the homepage, value grid, or any other route.
- No layout/spacing redesign beyond removing that one row.

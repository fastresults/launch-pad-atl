# Your social posts are still there

Nothing was deleted. The database still holds every ad you generated for this venture:

```text
Week 1 — 3 posts, 13 ad images (regenerations included)
Week 2 — 3 posts, 3 ads
Week 3 — 3 posts, 3 ads
Week 4 — 3 posts, 3 ads
Week 5 — 3 posts, 3 ads
Week 6 — 3 posts, 3 ads
Week 7 — 3 posts, 0 ads (planned, never generated)
Total: 28 ad images across 21 planned posts
```

Loading the venture hub fresh right now renders Weeks 1–6 as "3/3 ads · done" and only Week 7 as "not started" — which matches the data. The screenshot shows Weeks 2–6 as "not started", so that browser tab is showing a stale snapshot of the Content Studio from earlier in the session (before those weeks were activated and generated). A hard refresh restores the full view.

Note: Weeks 1–8 were never all generated — Week 7 is planned but has no ads, and Week 8 has not been planned yet.

## Why the stale view is possible, and what to fix

The week rows decide "not started" from the saved `selected_weeks` list on the content progress record, not from whether ads actually exist. If that list is stale in the browser (or briefly fails to load), weeks that are fully generated collapse back to a "planned posts · not started" row and the artwork disappears from view even though it is safe in the database.

Changes to make this impossible:

1. **Ads win over the progress flag.** In the Content Studio week list, treat any week that has at least one generated ad as active, regardless of what `selected_weeks` says. A week only renders as "not started" when it genuinely has zero ads.
2. **Self-heal the saved list.** When generated ads exist for weeks missing from `selected_weeks`, merge those weeks back into the progress record so the state repairs itself instead of drifting again.
3. **Refetch on return.** Make the ads and progress queries refetch when the hub regains focus, so a tab left open for hours shows current state rather than a stale cache.

## Technical notes

- Files: `src/components/hub/ContentStudio.tsx` (the `isPending` check and week grouping), `src/lib/content-autopilot.functions.ts` (progress merge helper).
- No database migration and no changes to generation logic — this is display-state correctness only.

## Change
In `src/lib/build-workshop-schedule.ts`, change the drop-off cutoff from session **end** to session **start**. A session disappears the moment it begins, rather than when it finishes.

**One-line edit:**
```ts
// before
if (new Date(endISO).getTime() < now.getTime()) continue;
// after
if (new Date(startISO).getTime() <= now.getTime()) continue;
```

No UI, route, or type changes.
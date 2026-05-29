## Goal

Remove the "Done in the room / You finish at home" two-column block from every stage card on `/schedule`. The selected element on the page is that grid, and it repeats in every stage on the schedule.

## Change — `src/routes/schedule.tsx`

Delete the entire grid wrapper (lines ~170–203 in the current file):

```
<div className="mt-5 grid gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 md:grid-cols-2">
  <div>
    <div ...>Done in the room</div>
    <ul>{stage.walkOut.map(...)}</ul>
  </div>
  <div>
    <div ...>You finish at home</div>
    {stage.afterWorkshop.length > 0 ? <ul>...</ul> : <div>Nothing — this stage is done in the room.</div>}
  </div>
</div>
```

The `{stage && ( <> ... </> )}` fragment stays — only the first child grid is removed. The "X essential tasks" card immediately below (and everything after it) is unchanged.

The `Check` and `Clock` icon imports may become unused after this removal; if so, drop them from the lucide-react import line in the same edit to keep the build clean. Leave them if they're still referenced elsewhere in the file.

## Out of scope

- No changes to `curriculum-data.ts` — `walkOut` and `afterWorkshop` arrays stay (the homepage 4:30 PM card and other surfaces still use them).
- No changes to schedule times, stage ordering, the essential-tasks list, or any other section on `/schedule`.
- No edits to `src/routes/index.tsx`.

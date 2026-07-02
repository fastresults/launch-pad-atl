# Enable per-week generation in Content Studio (Step 4)

## Problem
Step 4 ("Build ad creatives") only renders weeks the user picked in Step 2. After generating Week 1 via the Step 1 shortcut, Weeks 2 and 3 are invisible — the user has no way to progressively generate additional weeks without going back to Step 2. This breaks the promise of a week-by-week creative plan.

## Fix (UI only, scoped to `src/components/hub/ContentStudio.tsx`)

Change Step 4 so **every** week present in the parsed calendar is shown, and unselected weeks appear as a lightweight "locked" card with an **Add & generate Week N** action.

### Step4BuildAds changes

1. Accept a new prop `onAddWeek: (week: number) => Promise<void>` from the parent. Parent implementation adds the week to `selectedWeeks`, persists it, and sets `autoRunWeek` to trigger generation — reusing the existing Step 1 shortcut path.

2. Compute the full week list from `posts` (not just `scoped`):
   - `allWeeks = unique(posts.map(p => p.week)).sort()`
   - For each week, determine if it is `active` (in `selectedWeeks`) or `pending` (not yet selected).

3. Render loop iterates over `allWeeks`:
   - **Active weeks** — render existing card exactly as today (tiles, Preview/Regenerate/Delete, per-week "Generate week" button).
   - **Pending weeks** — render a compact placeholder card:
     - Header: `Week N` badge + post count + secondary text "Not started".
     - Body: short line listing post hooks (truncated, muted).
     - Primary action: `Add & generate Week N` button. On click → `onAddWeek(w)`; button shows spinner while `autoRunWeek === w`.

4. Update the top summary line so the "X of Y ads ready" count keeps reflecting only active weeks, but add a small trailing note like `· N more week(s) available` when pending weeks exist.

### Parent (`ContentStudio` component) changes

- Add `onAddWeek` handler passed to `Step4BuildAds`:
  ```
  const nextWeeks = Array.from(new Set([...selectedWeeks, week])).sort();
  setSelectedWeeks(nextWeeks);
  setAutoRunWeek(week);
  await persist({ selected_weeks: nextWeeks, current_step: 4 });
  ```
- No changes to Steps 1/2/3/5 behavior. Step 2 still works for bulk multi-week selection up front; Step 4 now supports incremental additions.

### Notes / non-goals

- No backend, schema, or edge function changes.
- No changes to generation logic — reuses `runWeek` via the existing `autoRunWeek` effect.
- No layout/colors/spacing overhaul; visual style matches existing week cards (border, badge, muted text).
- Copy stays consistent with "startup" / "framework" project rules (n/a here — no such copy touched).

## Files touched
- `src/components/hub/ContentStudio.tsx` (only)

# Week-by-week accordion for Content Studio Step 4

## Problem
Step 4 stacks every week vertically as full cards. As weeks accumulate (ads for Week 1, pending Week 2, planning Week 3…) the page gets long and it's unclear where each week's ads live. Users want to focus on one week at a time.

## Fix (UI only, scoped to `src/components/hub/ContentStudio.tsx`)

Wrap the per-week blocks in a shadcn `Accordion` (`type="multiple"`, collapsible) so each week is a single row that expands to reveal its content. Same behavior for active and pending weeks; the "Plan Week N+1" affordance stays as a card outside the accordion at the bottom.

### Accordion structure

For every week in `allWeeks` (union of active + pending), render an `AccordionItem` keyed by week number:

- **Trigger row (always visible):**
  - Left: `Week N` badge, ads-ready pill (`3/3 ads` or `0/3 planned` for pending), status dot.
  - Right: quick action button (does not toggle the accordion; `onClick` stops propagation):
    - Active week with pending tasks → **Generate week** (same handler as today).
    - Active week fully done → subtle "Done" text, no button.
    - Pending week → **Add & generate Week N**.
  - Chevron on the far right for expand/collapse.

- **Content (rendered inside `AccordionContent`):**
  - Active week → existing 2-col ad tile grid (preview / regenerate / delete tiles unchanged).
  - Pending week → existing hooks preview list.

### Default open state
- Open the earliest week that has any incomplete ads (`w.ad == null`). If everything is done, open the last active week. Pending weeks stay collapsed.
- Store the open item ids in local state so the user can freely expand/collapse without losing position.

### Summary strip (kept)
- Header line "X of Y ads ready · aspects · direction · N more week(s) below" stays above the accordion so overall status is visible without expanding anything.

### Plan Week N+1 card
- Stays as-is directly beneath the accordion (highlighted dashed card + button). Not part of the accordion so it's always visible as the "keep going" affordance.

### Step 5
- No change now. If it starts feeling long later, we can apply the same accordion pattern; out of scope here.

## Non-goals
- No changes to generation logic, edge functions, data model, or Step 1/2/3/5.
- No visual redesign of the ad tiles themselves.
- No new dependencies; shadcn `accordion` primitive is already available in the project.

## Files touched
- `src/components/hub/ContentStudio.tsx` (Step 4 render only)

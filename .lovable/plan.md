# Refresh "Your workflow" copy + counts

## Why
`src/routes/_authenticated/dashboard/workflow.tsx` hardcodes **"20 documents, organized in 5 strategic pillars"** in the page subhead, and labels each section as **"Stage N"** with the older "pillar" framing. The real framework is now 35 deliverables across 8 categories (Foundation, Strategy, Operations, Finance, Governance + bonus Brand, Marketing, Social & Content), and the tone should match the founder-coach voice used on `/dashboard/day`.

## Scope
Frontend-only edit to `src/routes/_authenticated/dashboard/workflow.tsx`. No changes to data fetching (`getMyWorkflow`), backend, or `STAGES` definition. Counts come from the live data returned by `getMyWorkflow` so the subhead stays accurate even as the deliverable catalog evolves.

## Changes

1. **Subhead (line 44).** Replace the hardcoded "20 documents, organized in 5 strategic pillars…" with a dynamic sentence computed from `data?.items`:
   - `totalDeliverables = data?.items?.length ?? 0`
   - `totalCategories = unique stage_n values in data.items where stage_n >= 1`
   - Copy: "**{totalDeliverables} founder-ready deliverables across {totalCategories} categories.** Each one is generated from your Startup Brief and the deliverables that came before it, so the whole package stays in sync with your startup."
   - While `data` is still loading, render a softer fallback: "Your full deliverables package, generated from your Startup Brief and built in order so each piece feeds the next."

2. **Section eyebrow (line 64).** Change `Stage {stage.n}` → `Category {stage.n}` to match the language used on `/dashboard/day` and the homepage.

3. **Brief-not-ready banner (lines 51–56).** Light tone polish:
   - "Finish your Startup Brief first ({briefScore} / 10 answered) — your coach needs it before AI can generate deliverables that actually sound like your startup."

4. **Run-remaining button.** Keep the icon and behavior. Label tweak when idle: "Run remaining" stays, but tooltip/aria-label clarifies "Generate every deliverable that's still missing". (Visible label unchanged to avoid layout shift.)

5. **"Recent activity" heading.** No change.

## Out of scope
- No edits to `getMyWorkflow`, `STAGES`, deliverable prompts, or DB seed data — the workflow page reflects whatever the backend returns.
- No structural / layout changes; cards, grid, and buttons stay as-is.
- No changes to `/dashboard/workflow/$key` detail page.

## Technical notes
- Compute counts in the component body:
  ```ts
  const items = data?.items ?? [];
  const totalDeliverables = items.length;
  const totalCategories = new Set(items.filter(i => i.stage_n >= 1).map(i => i.stage_n)).size;
  ```
- Render the dynamic subhead only when `totalDeliverables > 0`; otherwise show the loading fallback copy.
- All other logic, queries, and mutations remain untouched.

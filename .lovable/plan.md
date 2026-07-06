
# Minimal Hub UI for Novice Users

## Problem

The current hub page (screenshot) stacks four competing surfaces on top of each other:

1. **02 · AI Toolkit** intro + big "Generate my AI Stack" panel
2. Full-width amber **"Concept changed since last generation"** banner
3. **03 · Your Asset Library** intro + Expand/Collapse all + info icon
4. A row of 8 **category chips** with "n/n ✓" counts (Foundation 8/8, Strategy 8/8, …)
5. Per-category header (Foundation) with: numbered token, compass icon, title, count "8/8", subtitle, progress bar, "Complete" badge, **Open facilitator deck**, **Regenerate this section**

A novice sees five progress signals for the same thing and four possible next actions. There is no single obvious next step.

## Recommendation: one primary action per section, everything else behind "Advanced"

Keep the guided philosophy from the last pass. Do not remove capabilities — demote them. Introduce a page-level `viewMode: "guided" | "advanced"` state (persisted in `localStorage` per user) with a small toggle in the page header. Default = **guided** for anyone whose sprint is not yet complete.

### Guided mode changes (default)

**AI Toolkit section (02)**
- Remove the section eyebrow + intro paragraph. The panel headline already says what it is.
- Collapse `AIStackPanel` to a single row: title on the left, one CTA on the right. Drop the descriptive sub-copy — move it into a tooltip on an `(i)` icon.
- After generation, the panel shrinks to a one-line "AI Stack ready · View" link. It stops competing for attention.

**Stale-concept banner**
- Replace the full-width amber block with a small inline chip next to the affected section title: `↻ 1 asset out of date · Rewrite`. Clicking it opens the same rewrite flow.
- Only show at the top of the page when >3 assets are stale.

**Asset Library section (03)**
- Remove the eyebrow "03 · Your asset library", the intro paragraph, and the info icon. Keep only an `<h2>Your assets</h2>`.
- **Remove the 8 category chip row entirely in guided mode.** It duplicates the category headers directly below and adds no new information. In advanced mode it returns as a jump-nav.
- Remove **Expand all / Collapse all** from guided mode. Auto-open only the next incomplete category; keep completed categories collapsed by default. Power users get the toggles back in advanced mode.

**Per-category header (Foundation, Strategy, …)**
- Keep: numbered token, title, one-line subtitle, single status pill (either `In progress 3/8`, `Complete`, or `Locked`).
- Remove the standalone progress bar — the "3/8" pill already conveys it. Bring the bar back only inside the expanded panel.
- Collapse the two right-side buttons into one **primary** action that changes with state:
  - not started → **Start**
  - in progress → **Continue**
  - complete → **Review**
- Move **Open facilitator deck** and **Regenerate this section** into a `⋯` overflow menu on the row. Novices never see them unless they look; power users still reach them in one click.

**Page header**
- Add a compact segmented control: `Guided · Advanced`. Persist choice in `localStorage` under `hub:viewMode:<snapshotId>`.

### Advanced mode

Restores today's behavior verbatim: intros, chips, Expand/Collapse all, dual buttons, full stale banner. Nothing is lost, just gated.

### Visual result for a novice

The screenshot area collapses from ~5 stacked blocks to:

```text
Your assets                              [Guided ▾]
────────────────────────────────────────────────
01  Foundation           Complete           Review  ⋯
02  Strategy             In progress 3/8    Continue ⋯
03  Operations           Locked             —
…
```

One eye path, one obvious next click per row.

## Technical Notes

- New state in `hub.$snapshotId.tsx`:
  ```ts
  const [viewMode, setViewMode] = useState<"guided" | "advanced">(() =>
    (localStorage.getItem(`hub:viewMode:${snapshotId}`) as any) ?? "guided"
  );
  ```
  Persist on change; pass `viewMode` down to `AIStackPanel`, category renderer, and the stale banner.
- `SectionIntro`: accept a `variant?: "full" | "minimal"` prop. In `minimal`, render only the `<h2>` (no eyebrow, no paragraph, no info icon).
- `AIStackPanel`: add `compact?: boolean`. In compact, single-row layout; hide description; move it into an accessible tooltip.
- Category row: extract the current two-button cluster into a small `<CategoryActions>` component that renders either the primary+overflow (guided) or the current dual buttons (advanced).
- Stale banner: extract logic; in guided render `<StaleChip count sectionKey />` inline in the relevant category header when `count <= 3`, otherwise fall back to the current banner.
- Category chip strip (`1. Foundation 8/8 …`): gate the JSX at line 1308–1326 behind `viewMode === "advanced"`.
- Expand-all / Collapse-all `SectionIntro` actions (lines 1282–1303): only pass `actions` when `viewMode === "advanced"`.

No backend, edge function, or data-model changes. All work is in:

- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`
- `src/components/hub/SectionIntro.tsx`
- `src/components/hub/AIStackPanel.tsx`
- one new `src/components/hub/CategoryActions.tsx`
- one new `src/components/hub/ViewModeToggle.tsx`

## Out of scope

- Founder Roadmap card (already redesigned last pass)
- LaunchPlanner14Day internals
- Copy rewrites beyond removing the two intro paragraphs shown above

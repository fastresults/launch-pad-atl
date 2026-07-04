# Featured, Collapsible Section Headers

## Goal
Elevate the four stage bands on the Hub (FOUNDATION, STRATEGY, OPERATIONS, FINANCE — and any others) from a small muted label into a clearly featured, branded header that the user can collapse/expand for fast navigation, with strong visual delineation between sections.

## What changes (visual + interaction)

Replace the current thin `<h4>` row (line 1253–1306 of `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`) with a **featured section header card** that becomes the top of each section band.

### 1. Featured header row
Each section renders as a bordered band with a header bar that includes:

- **Left cluster**
  - Chevron affordance (rotates on expand/collapse)
  - Stage number in a circular chip (`01`, `02`, `03`, `04`) tinted by stage color
  - Stage title in large sentence case (`Foundation`, not `FOUNDATION`) — display font, ~text-xl/2xl, tracking-tight
  - One-line stage tagline (e.g. Foundation → "Prove the idea is worth building")
- **Middle cluster**
  - Slim progress bar (done / total) with count `8 / 8`
  - Status pill: `Complete` (success), `In progress` (primary), `Locked` (muted), `Not started` (outline)
- **Right cluster** (existing actions, restyled)
  - `Open facilitator deck` / `Deck coming soon` / `Unlocks after …`
  - `Generate / Regenerate this section`
  - Overflow `…` menu on small screens so the header never wraps awkwardly

### 2. Delineation between sections
- Each section wrapped in a rounded-xl bordered container with subtle surface tint (`bg-card/40`) and a 1px left accent bar in the stage color.
- Vertical rhythm bumped from `space-y-3` to `space-y-6` between sections.
- Sticky mini-header: when a section is expanded and the user scrolls past its top, a condensed sticky bar (title + progress + collapse) pins to the top of the scroll container for context.

### 3. Collapse / expand
- Click anywhere on the header bar (except action buttons) toggles the section.
- Chevron rotates 0 ↔ 90deg, body animates height (Radix `Collapsible` from shadcn — already installed under `@/components/ui/collapsible`).
- Default open state:
  - Current active / next-up section: **expanded**
  - Completed sections: **collapsed** (with a compact summary strip: "8 assets ready · Last updated 2h ago")
  - Locked future sections: **collapsed**
- `Expand all` / `Collapse all` toggle placed once above the section list, next to the existing category stepper.
- Persist per-section open state per snapshot in `localStorage` under `hub:sectionOpen:<snapshotId>` so it survives navigation.
- Keyboard: header is a `<button>`; Space/Enter toggles; `aria-expanded` and `aria-controls` wired for screen readers.

### 4. Stage color + iconography
Add a small `STAGE_META` map (label, tagline, icon, accent hsl token) — reusing existing semantic tokens; no hardcoded colors.

| Stage | Icon | Accent token |
|---|---|---|
| Foundation | `Compass` | `--primary` |
| Strategy | `Target` | `--accent` |
| Brand | `Palette` | `--brand` (fallback `--primary`) |
| Marketing | `Megaphone` | `--accent` |
| Social & Content | `Share2` | `--primary` |
| Operations | `Settings2` | `--muted-foreground` |
| Finance | `LineChart` | `--status-success` |

Accent shows up as: the left border bar, the numeric chip background, and the progress-bar fill. All via CSS variables — no inline hex.

### 5. Micro-interactions
- Hover on collapsed header: subtle lift (`shadow-sm` → `shadow-md`), accent bar widens 2px → 3px.
- Newly-completed section auto-collapses 1.5s after the final asset in it finishes, with a brief success flash on the header (respects `prefers-reduced-motion`).
- Focus ring uses `ring-ring` token.

## Files to touch

- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`
  - Replace the header block inside the `categories.map` render (~lines 1252–1306).
  - Wrap each `<section>` body in `<Collapsible>` / `<CollapsibleContent>`.
  - Add `openSections` state + `localStorage` hydration keyed by `snapshotId`.
  - Add `Expand all` / `Collapse all` control near line 1225.
- `src/components/hub/SectionHeader.tsx` **(new)** — the featured header bar, presentational only; takes `{ index, cat, done, total, status, tagline, deck, onToggle, isOpen, actions }`.
- `src/lib/stage-meta.ts` **(new)** — `STAGE_META` map (label, tagline, icon, accent token).
- No DB, no edge functions, no changes to generation logic or the 14-day planner.

## Out of scope
- Reordering or renaming stages.
- Changes to the individual document cards inside each section.
- Changes to the AI Stack panel or the 14-Day Launch Planner.
- Any backend / prompt / data model changes.

## Acceptance checks
1. Each stage renders as a clearly bordered band with a large title, tagline, numeric chip, progress bar, and status pill.
2. Clicking a header collapses/expands its body with animation; state persists on reload.
3. Active section is open by default, completed sections collapsed with a summary strip.
4. `Expand all` / `Collapse all` works and updates persisted state.
5. Keyboard + screen-reader: header is focusable, Space/Enter toggles, `aria-expanded` reflects state.
6. No hardcoded color classes; all accents come from CSS tokens; light + dark themes both look correct.
7. Existing `Open facilitator deck` and `Generate/Regenerate this section` buttons keep working and stay reachable at all viewport widths.

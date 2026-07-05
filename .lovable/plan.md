## Goal
Make **Supplier Shortlist** and **BOM & Landed-Cost Model** always visible on the 14-Day Launch (Day 6 & Day 12) and elsewhere in the hub, tagged with a small "Physical products only" pill so digital/service founders can see and skip them instead of the cards being invisible.

## Changes

### 1. Remove the hard filter (`src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`)
- Delete the `SOURCING_ONLY_TYPES` / `isPhysical` filter block (lines 949-954) so `types` includes sourcing entries for every venture.
- Keep `isPhysical` derived from `snapshot.sourcing_profile?.is_physical_product` and pass it (plus the sourcing-key set) down to `LaunchPlanner14Day` and the category card renderer so they can badge instead of hide.

### 2. Add a "Physical products only" pill

**`src/components/hub/LaunchPlanner14Day.tsx`**
- Accept new props: `isPhysical: boolean`, `sourcingOnlyKeys: Set<string>` (defaults `{"supplier_shortlist","bom_and_landed_cost"}`).
- In the day-strip counters, count sourcing assets only when `isPhysical`; otherwise show `{done}/{nonSourcingTotal}` so the strip stays honest for digital founders.
- In the expanded day's asset list, always render sourcing rows. When `sourcingOnlyKeys.has(key)` add a small badge next to the title: `Physical products only` (muted amber/violet pill, `text-[10px] uppercase tracking-wide`, `bg-muted/60 text-muted-foreground border border-border/60 rounded-full px-2 py-0.5`).
- If `!isPhysical`, the row's Open button becomes secondary style with tooltip "Only needed if you're shipping a physical product" — still clickable so a founder who disagrees with the classifier can open it.

**Framework category cards (Operations section)**
- Same badge treatment applied where deliverable items are listed (`framework-deliverables.ts` items for Supplier Shortlist and BOM already have "For physical-product startups only" tooltip copy — surface a matching visible pill on the item chip).

### 3. Update day totals in the sprint header
- The "48/48 assets ready" summary at the top of the sprint should compute from the visible-and-required set: total = all deliverables minus sourcing when `!isPhysical`. Prevents the counter from perpetually reading "46/48" for digital ventures.

### 4. No backend / schema changes
- Classifier, `sourcing_profile` column, and edge functions stay as-is. This is purely a presentation change.

## Files touched
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — remove filter, pass `isPhysical` + `sourcingOnlyKeys` to LaunchPlanner, badge in framework category renderer.
- `src/components/hub/LaunchPlanner14Day.tsx` — always render sourcing rows, add badge, adjust counters.

## Verification
- Reload `/dashboard/hub/:id` on the current (non-physical) venture: Day 6 now lists 6 rows including "Supplier Shortlist" with a "Physical products only" pill; Day 12 lists BOM with the same pill. Counter reads `5/6` for Day 6 with sourcing marked optional (or the chosen counter rule).
- Toggle a snapshot's `sourcing_profile.is_physical_product` to true and confirm the pill disappears and the counter treats sourcing as required.
- `bunx tsgo --noEmit` clean.

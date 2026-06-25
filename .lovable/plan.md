
# Active / Favorited / Archived startups on the Hub library

## Goal
Let founders organize their paid-for startups into **Active**, **Favorited**, and **Archived** buckets on `/dashboard/hub`. Archive is reversible. Nothing is permanently deletable from the UI.

Also: rename the page heading from "Your ventures" → "Your startups" to match the project's Core memory rule ("startup", never "venture/business" in user-facing copy). Internal DB column names stay `venture_*`.

## UX

### Tabs across the top of the library
```text
[ Active (4) ]  [ ★ Favorites (2) ]  [ Archived (1) ]            [ + New startup ]
```
- **Active** (default) — everything not archived. Favorites pinned to the top with a star ring.
- **Favorites** — only starred startups.
- **Archived** — only archived ones, with a "Restore" affordance.

Empty states per tab:
- Active: existing empty state (already good).
- Favorites: "No favorites yet. Tap the ★ on any startup to keep it pinned here."
- Archived: "Nothing archived. Archive a startup to clear the noise — you can always restore it."

### Per-card actions (top-right of each card)
A small actions row replaces nothing — the card itself still navigates to the snapshot. Actions sit on their own click-stopping row:

- **★ / ★ outline** — toggle favorite (instant, optimistic, toast "Favorited" / "Removed from favorites")
- **⋯ menu** — opens a dropdown:
  - In Active/Favorites: **Archive** (with confirm dialog: "Archive this startup? You can restore it from the Archived tab. Your documents stay safe.")
  - In Archived: **Restore** (instant, toast "Restored to Active")

Favorited cards get a subtle amber outline + filled star icon so they read as "kept" at a glance.

### Deletion
**Not exposed in the UI.** The `deleteSnapshot` function stays in code for admin use but no button calls it. Copy on the archive confirm dialog reinforces "Your documents stay safe."

## Sorting
Inside each tab: favorites first (in Active tab only), then by `updated_at desc`. Add `Last updated 3d ago` to each card so users can see freshness.

## Data model changes

One backend migration:

```sql
ALTER TABLE public.venture_snapshots
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_venture_snapshots_user_status_fav
  ON public.venture_snapshots (user_id, status, is_favorite, updated_at DESC);
```

(No new tables → no new GRANTs needed. Existing RLS on `venture_snapshots` already scopes by `user_id`.)

## Backend / function changes

`src/lib/foundersHub.functions.ts`:
- Update `listSnapshots()` to accept `{ scope?: "active" | "favorites" | "archived" }` and filter accordingly:
  - `active` → `status != 'archived'`
  - `favorites` → `status != 'archived' AND is_favorite = true`
  - `archived` → `status = 'archived'`
- Add `setFavorite({ id, is_favorite })` updating just that column.
- Add `unarchiveSnapshot({ id })` setting status back to its prior step. Since we don't track the pre-archive status, restore to `"input"` won't work — instead restore to `"complete"` if any docs exist, else `"review"` if extracted_data exists, else `"enriching"`. Compute server-side from the row.
- Keep `archiveSnapshot` and `deleteSnapshot` as-is. `deleteSnapshot` is not called from the UI.
- Add an `is_favorite: boolean` field to the `VentureSnapshot` type.

## UI changes

`src/routes/_authenticated/dashboard/hub.index.tsx`:
- Add tab state (`useState<"active" | "favorites" | "archived">`), simple pill tab strip above the grid.
- Fetch with `useQuery` keyed by scope; counts come from three lightweight parallel queries (or a single fetch-all + client-side bucket — simpler, fewer round-trips, fine for typical user volume).
- Use a single fetch-all approach: `listSnapshots()` returns everything for the user, the page buckets in memory and renders the active tab. Counts on tabs come for free.
- `SnapshotCard` gets:
  - A favorite star button (top-right) and a `DropdownMenu` (⋯) with Archive / Restore.
  - Conditional styling for `is_favorite` (amber border tint).
  - `updated_at` relative time line.
- Use the existing shadcn `DropdownMenu` and `AlertDialog` (confirm-dialog) components.
- Rename "Your ventures" → "Your startups", "New venture" → "New startup", "+ New venture" empty-state CTA → "+ New startup". Page URL stays `/dashboard/hub`.

## What we are NOT doing
- No new "folders" or "tags" — just the three buckets the user asked for.
- No bulk select / multi-archive.
- No permanent delete in the UI.
- No changes to the snapshot detail page or generation flow.

## Files touched
- `src/routes/_authenticated/dashboard/hub.index.tsx` — tabs, card actions, copy.
- `src/lib/foundersHub.functions.ts` — `setFavorite`, `unarchiveSnapshot`, expand `VentureSnapshot` type, return all rows from `listSnapshots`.
- One Supabase migration adding `is_favorite` column + index.

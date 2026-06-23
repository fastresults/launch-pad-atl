# Site settings — fix save error + improve readability/usability

## Two problems in the screenshot

1. **The toggle is broken** — the red banner reads `new row violates row-level security policy for table "site_settings"`. The table only has a `SELECT` policy for admins; there is no `INSERT`/`UPDATE` policy, so the upsert from `updateSiteSetting` is rejected. The change I made earlier landed only because it went through a server-side data update, not the admin UI.
2. **Low-contrast UI** — washed-out lavender selection state on white, faint description text, no clear "Active" indicator, and the error banner text is nearly invisible. Both cards also look identical at a glance, so it's easy to mis-click.

## Plan

### 1. Fix RLS (migration)
Add admin write policies to `public.site_settings` so the toggle saves:

- `INSERT` policy: `with check (is_admin(auth.uid()))`
- `UPDATE` policy: `using (is_admin(auth.uid())) with check (is_admin(auth.uid()))`

No grants change (already in place); no schema change.

### 2. Redesign `admin.site.tsx` cards (frontend only)
Keep the same data model and `VariantCard` props. Rework the visuals:

- **Card header**
  - Larger card title (`text-xl`, tighter tracking).
  - Add a small **"Active: Original"** / **"Active: Free cohort"** chip next to the title so the current state is obvious without parsing radios.
  - Move the route label (`/`, `/register`) into a muted mono pill.
  - "Last updated" moves to the footer, smaller, with relative time ("2 minutes ago") plus a tooltip with the exact timestamp.
  - Replace the text "Preview" link with an outline button using the existing `Button` component so it matches the rest of the admin.

- **Option rows** (the two variants)
  - Use clear "selected" styling: solid 2px primary ring + `bg-primary/15` + a filled check icon in the corner. Unselected: `border-border` with hover `bg-muted/50`.
  - Add a small **icon/glyph** per variant (e.g. `Users` for Original, `Sparkles` for Selection) so the two cards aren't visually identical.
  - Bold the option label (`text-base font-semibold text-foreground`); raise description contrast (`text-muted-foreground` → `text-foreground/70`).
  - Add a 3-bullet feature list under each option so admins can tell them apart at a glance:
    - **Original**: "Paid monthly cohorts · Seat-tier pricing · Cohort picker"
    - **Selection — Free Cohort**: "Inaugural Atlanta cohort · 6 founders, free · July 23, 2026"
  - Disabled/saving state shows a spinner inline next to the label instead of greying the whole card out.

- **Confirmation on switch**
  - Because this changes the live homepage, wrap the click in the existing `ConfirmDialog` (`src/components/ui/confirm-dialog.tsx`) with copy: *"Switch homepage to 'Original'? This change goes live immediately."* Skip the dialog when the option is already active.
  - On success, fire a toast via the existing `sonner` setup ("Homepage set to Original") instead of relying only on the radio repainting.

- **Error banner**
  - Replace the bespoke red div with `<Alert variant="destructive">` so text/icon contrast is correct in both themes.
  - Map the RLS-violation message to a friendly line: *"You don't have permission to change site settings."* (still log the raw error to console).

- **Layout**
  - Keep the two-column grid on `md+`; on mobile, cards already stack.
  - Add a top-of-page note ("These changes are public the moment you save.") so admins aren't surprised.

### 3. Verify
- Reload `/admin/site` as super admin; click each option on both cards; confirm no RLS error, toast fires, "Active" chip updates, and the public `/` / `/register` pages reflect the change.

## Out of scope
- No changes to `HomeSelection.tsx`, the original homepage, or `RegisterSelection.tsx` content.
- No new settings keys, no new tables, no edits to other admin pages.
- No theme/token overhaul — only utility classes on this one page (plus the new RLS policies).

## Technical files touched
- New migration: add `INSERT` + `UPDATE` admin policies on `public.site_settings`.
- `src/routes/_authenticated/_admin/admin.site.tsx` — redesigned cards, confirm dialog, toast, friendly error mapping.

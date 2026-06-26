## Admin Toggle for Dashboard Navigation

Give admins a single, intuitive control panel to show/hide each item in the user dashboard sidebar (Today, Workshop day, Startup brief, Deliverables, Ventures, My files, Founder profile).

### 1. Storage (site_settings)
Add a single row in `site_settings` with key `dashboard_nav_visibility` whose value is a JSON map:
```
{ today: true, workshop: true, brief: true, deliverables: true, hub: true, files: true, profile: true }
```
- Defaults: all `true`.
- Read access: `authenticated` (so the sidebar can read it).
- Write access: admins only (via existing `has_role` policy pattern already used by `site_settings`).

No schema migration needed beyond inserting/upserting this row — `site_settings` already exists.

### 2. Admin UI — `src/routes/_authenticated/admin/settings.tsx`
Add a new card: **"Dashboard navigation"**.
- Renders the 7 nav items in the same order/icons as the live sidebar (mirroring the screenshot) so it's visually 1:1 with what the user sees.
- Each row: icon + label + short helper text + shadcn `Switch`.
- Sticky "Save changes" footer + per-toggle optimistic save with toast feedback.
- "Reset to defaults" button (all on).
- Guardrail: at least one item must stay enabled (prevents locking users out of the dashboard entirely). If admin tries to disable the last one, switch is blocked with a tooltip.

### 3. Sidebar consumption — `src/routes/_authenticated/dashboard.tsx` (and/or `AppSidebar`)
- Fetch `dashboard_nav_visibility` once on mount via a small `useDashboardNavVisibility()` hook (React Query, cached).
- Filter the nav items array by the visibility map before rendering.
- Admins themselves always see all items (with a small "Hidden for users" badge next to disabled ones) so they can still navigate and preview while configuring.
- If a user lands directly on a hidden route via URL, redirect to `/dashboard` (the Today page or first-enabled item).

### 4. Keys & mapping
Stable keys used everywhere (DB, hook, sidebar filter):
`today`, `workshop`, `brief`, `deliverables`, `hub`, `files`, `profile`.

### Technical notes
- Reuse existing `site_settings` get/set helpers (already used by the bulk-unlock toggle and business-ideas scroller toggle).
- Hook invalidates on save so the sidebar updates live without reload.
- No changes to route definitions — purely a presentation/guard layer.

## Goal

Make the Super Admin console feel like a purpose-built operations console: everything findable in under two seconds, grouped by the job being done rather than by the order features were built.

## What's wrong today

- The sidebar has 21 flat links across five groups (`src/lib/admin-nav.ts`). "Operations" alone holds 9 unrelated items — people, applications, bookings, inquiries, cohorts, review queue, Founders Hub.
- Social has 7 top-level links (setup wizard, intake, creative studio, profiles, compose, posts, analytics) sitting at the same visual weight as "Site settings."
- Two different items use the same Shield icon (Members, Users & roles), and "Members" vs "Attendees" vs "Users & roles" vs "Applications" are indistinguishable by label alone.
- The dashboard at `/admin` is a 648-line page that dumps applications and members tables together — no at-a-glance triage, no entry point to the rest of the console.
- The command palette exists (⌘K) but is unlabeled in the UI, has no keywords/aliases, and no actions — only navigation.

## The new structure

Five task-based sections, each with a one-line purpose. Social collapses from 7 links into 1 parent + submenu.

```text
HOME
  Dashboard              at-a-glance triage

PEOPLE                   who is in the program
  Members                accounts, access, status      [pending badge]
  Applications           inbound applicants            [pending badge]
  Attendees              workshop rosters + their work
  Inquiries              landing/contact messages      [new badge]

SCHEDULE                 what is happening when
  Registrations          workshop signups
  Private Tuesdays       1:1 bookings
  Cohorts                dates, capacity, venue

WORKSPACE                the work being produced
  Founders Hub
  Review queue                                         [pending badge]
  Facilitator decks
  Media library
  Video testimonials

MARKETING                (collapsible group, default closed)
  Social  ▸  Overview · Compose · Posts · Analytics
             Setup wizard · Brand intake · Creative Studio

SYSTEM
  Users & roles
  Site settings
  View public site  ↗
```

Rules applied:
- Each item gets a unique, semantically obvious icon (no duplicate Shield).
- Group labels carry a short subtitle on hover so "Members vs Attendees" is never a guess.
- Marketing/Social becomes a collapsible `SidebarGroup` with a nested submenu, so the default sidebar shows ~13 items instead of 21.
- Badges (pending counts) roll up to the group label when the group is collapsed, so nothing hides silently.
- Super-admin-only items keep the existing `super` filter and gain a subtle lock affordance so it's clear why a regular admin sees fewer items.

## Dashboard rebuild (`/admin`)

Turn `/admin` into a triage cockpit instead of a table dump:

1. **Needs you now** — a single row of action cards driven by the existing badge query: applications pending, members pending, inquiries new, review queue. Each card is one click into the filtered list. Zero-state reads "All clear."
2. **Next event** — the upcoming cohort/workshop with seat count, plus next scheduled Private Tuesday.
3. **Quick actions** — 4–6 buttons for the things a super admin actually does repeatedly (new post, add cohort, open latest application, site settings, landing-mode toggle status).
4. **Recent activity** — a compact combined feed (latest applications, registrations, inquiries) replacing the two large tables.

The existing full applications and members tables move to their dedicated pages (`/admin/applications`, `/admin/members`), which already exist — the dashboard stops duplicating them.

## Command palette upgrade

- Header trigger gets a visible "Search or jump to…" affordance instead of a bare icon.
- Every nav item gains `keywords` (e.g. Members → "users, access, approve, roster"), so searching "approve" finds the right page.
- Add an **Actions** group: toggle landing-only mode, exit impersonation, open public site, sign out.
- Recent pages section at the top of the palette.

## Small consistency fixes

- Sidebar footer keeps the impersonation exit banner but restyled to match the design tokens (currently hardcoded amber classes).
- Breadcrumbs reflect the new group names.
- All colors via semantic tokens — no hardcoded amber/white classes.

## Technical notes

- `src/lib/admin-nav.ts` — restructure the `AdminNavItem` type: new `group` union, optional `children` for nested items, `keywords: string[]`, optional `description`.
- `src/components/admin/AdminSidebar.tsx` — render collapsible groups via `Collapsible` + `SidebarMenuSub`, roll up badges, keep `collapsible="icon"` mini mode working.
- `src/components/admin/AdminCommandMenu.tsx` — flatten nested items for search, add actions group and keyword matching.
- `src/routes/_authenticated/_admin/admin.index.tsx` — rewrite as a composition of small new components under `src/components/admin/dashboard/` (`TriageCards`, `NextEventCard`, `QuickActions`, `ActivityFeed`), reusing `getAdminStats` and `getAdminBadges`. No backend or schema changes.
- Routes in `src/App.tsx` stay exactly as they are — this is navigation and presentation only, so no links break.

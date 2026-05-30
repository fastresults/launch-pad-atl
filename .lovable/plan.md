# Super-Admin Redesign: Sidebar Shell + Command Palette

## The problem

The current admin uses a single horizontal nav bar inside `_admin.tsx`. With 8 items it's already crowded; as Cohorts, Site settings, Review queue, Media, Users, and future modules (Emails, Payments, Analytics, Audit log, Integrations, Feature flags) get added, horizontal nav becomes unusable: items truncate, hierarchy disappears, and there's no room for status badges (pending reviews count, sold-out cohorts, etc.).

## Recommended treatment

A **persistent collapsible left sidebar** with grouped navigation, a top utility bar with breadcrumbs + global search, and a **⌘K command palette** for power-user jumps. This is the pattern used by Linear, Vercel, Stripe, Supabase, and Resend dashboards — it's the proven SaaS-admin standard because it:

- Scales linearly: 30+ items still browsable via groups and collapse
- Preserves hierarchy: sections (Operations, Content, People, System) communicate scope
- Frees vertical canvas: page headers, filters, and tables get more room
- Surfaces state: badges on nav items (e.g. "Review queue · 4") replace hidden notifications
- Works on every viewport: icon-rail collapse on tablet, sheet drawer on mobile

## Information architecture

Group the existing + planned items into 4 sections. Order reflects daily use frequency.

```
OVERVIEW
  ▸ Dashboard                /admin

OPERATIONS
  ▸ Registrations            /admin/registrations
  ▸ Attendees                /admin/attendees
  ▸ Review queue   [badge]   /admin/review        (super)
  ▸ Cohorts                  /admin/cohorts       (super)

CONTENT
  ▸ Site settings            /admin/site          (super)
  ▸ Media library            /admin/media         (super)

SYSTEM
  ▸ Users & roles            /admin/users         (super)
  ▸ View public site →       /
```

Future items slot cleanly: Emails/Audit log → System; Analytics → Overview; Feature flags → System.

## Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ ☰  Admin · Registrations                    ⌘K  🔔  avatar ▾ │ ← top bar (h-14)
├──────────┬───────────────────────────────────────────────────┤
│ LOGO     │                                                   │
│          │                                                   │
│ OVERVIEW │                                                   │
│  ▢ Dash  │           page content (full width)               │
│          │                                                   │
│ OPS      │                                                   │
│  ▢ Regs  │                                                   │
│  ▢ Att.  │                                                   │
│  ▢ Rev 4 │                                                   │
│  ▢ Coh.  │                                                   │
│          │                                                   │
│ CONTENT  │                                                   │
│  ▢ Site  │                                                   │
│  ▢ Media │                                                   │
│          │                                                   │
│ SYSTEM   │                                                   │
│  ▢ Users │                                                   │
│          │                                                   │
│ ─────    │                                                   │
│ ☾ theme  │                                                   │
│ ⎋ out    │                                                   │
└──────────┴───────────────────────────────────────────────────┘
```

- **Sidebar**: `w-60` expanded, `w-14` icon rail when collapsed. Persists via `SidebarProvider`.
- **Top bar**: sidebar trigger, breadcrumb (Admin › Section › Page), spacer, command palette button (`⌘K`), theme toggle, user menu (email, sign out).
- **Mobile (<768px)**: sidebar becomes a sheet drawer triggered by hamburger.

## Command palette (⌘K)

`cmdk`-based dialog with sections matching the sidebar IA, plus contextual actions:
- Jump to any admin page
- "Create cohort", "Open review queue", "Toggle homepage variant"
- Search attendees/registrations by email (later)

Replaces the need to add every shortcut to the visible nav.

## Visual / brand

- Sidebar uses `bg-sidebar` token, subtle right border (`border-sidebar-border`)
- Active item: filled pill (`bg-sidebar-accent`), 2px primary indicator on the left edge
- Group labels: `text-xs uppercase tracking-wider text-muted-foreground`
- Badges (review count, etc.): small `Badge variant="secondary"` aligned right
- Smooth 200ms collapse animation; no layout shift on hover

## Technical plan

1. **Add shadcn sidebar primitives** (already documented in the repo's knowledge file). Files: `src/components/ui/sidebar.tsx` (if not present, install via shadcn).
2. **Create `src/components/admin/AdminSidebar.tsx`** — the grouped nav with active-route highlighting via `useRouterState`, super-admin filtering via `useAuth().isSuperAdmin`, and badge slot per item (data fetched via lightweight server fn `getAdminBadges` returning `{ reviewPending: n }`).
3. **Create `src/components/admin/AdminTopbar.tsx`** — `SidebarTrigger`, breadcrumb derived from current pathname + NAV map, `CommandMenuButton`, `ThemeToggle`, user dropdown.
4. **Create `src/components/admin/AdminCommandMenu.tsx`** — `cmdk` dialog, opens on ⌘K / Ctrl+K, lists all nav targets + quick actions, navigates via `useNavigate`.
5. **Rewrite `src/routes/_authenticated/_admin.tsx`** to render `<SidebarProvider><AdminSidebar /><SidebarInset><AdminTopbar /><main><Outlet/></main></SidebarInset></SidebarProvider>`. Keeps `isAdmin` guard and `ThemeProvider` wrapper unchanged.
6. **Add `src/lib/admin-nav.ts`** — single source of truth for nav items (label, to, icon, group, super, badgeKey). Consumed by sidebar, breadcrumb, and command palette.
7. **Badges server fn** (`src/lib/admin-badges.functions.ts`) — `getAdminBadges` returns counts for review queue (and future: pending registrations, unread messages). Cached via TanStack Query, 30s stale.
8. **Expand max width**: drop `max-w-6xl` constraint inside admin so tables and grids use full width minus sidebar.
9. **Keyboard**: ⌘K opens palette, ⌘B toggles sidebar (built into shadcn sidebar).

## Files touched

- Edit: `src/routes/_authenticated/_admin.tsx`
- New: `src/components/admin/AdminSidebar.tsx`, `AdminTopbar.tsx`, `AdminCommandMenu.tsx`, `AdminBreadcrumb.tsx`
- New: `src/lib/admin-nav.ts`, `src/lib/admin-badges.functions.ts`
- Possibly new shadcn: `src/components/ui/sidebar.tsx`, `src/components/ui/command.tsx`, `src/components/ui/breadcrumb.tsx` (install if missing)

## Out of scope (future)

- Per-user nav favorites/pinning
- Saved filter views in the sidebar
- Inline notifications drawer
- Multi-workspace switcher (not needed at one-tenant scale)

## Sequence

Install shadcn sidebar/command/breadcrumb → admin-nav source of truth → sidebar + topbar components → command palette → swap `_admin.tsx` shell → wire badges fn → verify all 8 routes render correctly at desktop/tablet/mobile widths.

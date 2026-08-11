# Operationalize in the dashboard — parity with the shared link

Today the operating runway (and creative sign-off) is only reachable from the shared link's pinned "Operationalize" nav item, or by scrolling deep into a single venture page in the hub. The dashboard sidebar has no equivalent. This adds it.

## What changes

**1. New sidebar item: "Operationalize"**

Sits directly under "New venture" in the dashboard sidebar, with the same hammer icon used on the shared link, and a tooltip: the 90-day checklist you and your team work from — legal, money, CRM, demand, rhythm, plus creative sign-off.

Visible to the same audience as Ventures (Founders Hub access or admin), and controllable from Site settings like every other nav item.

**2. New page: `/dashboard/operations`**

The sidebar link can't jump straight to a runway because a runway belongs to one venture. So this page is a chooser:

- One row per venture the user can see (same list as Ventures), showing the venture name, how far the runway has come (done / total, with a thin progress bar), and the current phase.
- Clicking a row opens that venture's existing runway page at `/dashboard/hub/:id/operations` — no duplicate dashboard.
- If there is exactly one venture, go straight to its runway instead of showing a one-row list.
- Empty state points at "New venture".

**3. Clearer entry on the venture page**

The existing "Operating runway" card on a venture stays, but gets a second link to the Creative sign-off tab so both surfaces match the shared link's two tabs.

## Technical notes

- `src/routes/_authenticated/dashboard.tsx`: add the nav item (`key: "operations"`, icon `Hammer`, gated by `hubVisible`).
- `src/lib/site-settings.ts`: add `operations` to `DASHBOARD_NAV_KEYS` and the default visibility map (defaults to `true`).
- New route file `src/routes/_authenticated/dashboard/operations.tsx`, registered wherever the other `dashboard/*` routes are declared.
- Runway counts come from the existing `fetchOpsRunway` (`src/lib/ops.functions.ts`) with `{ kind: "hub", snapshotId }`, one query per venture via `useQueries`, cached. No new edge function, no schema change.
- Venture list reuses the same query the Ventures page uses.
- The per-venture runway page (`hub.$snapshotId.operations.tsx`) is unchanged apart from accepting a `?tab=signoff` query param so the venture card can deep-link to sign-off.

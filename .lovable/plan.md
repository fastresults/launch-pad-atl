# Admin-Managed Cohort Dates + Venues

Move cohort dates **and venues** out of the hardcoded `SEED` array in `src/lib/cohorts.ts` into a database table that super admins can edit. Most cohorts share the same default venue (IGNITE Center, Norcross GA); when a cohort uses a different city/address, the public UI calls it out clearly so users aren't confused.

## 1. Database

New table `public.cohorts`:

- `id text PK` (e.g. `"2026-07-15"`)
- `cohort_date date NOT NULL UNIQUE`
- `tz text NOT NULL CHECK (tz IN ('EDT','EST'))`
- `start_time time NOT NULL DEFAULT '08:00'`
- `end_time time NOT NULL DEFAULT '16:30'`
- `status text NOT NULL CHECK (status IN ('sold_out','filling','open')) DEFAULT 'open'`
- `seats_left int` (nullable)
- `venue_name text NOT NULL DEFAULT 'IGNITE Center at Greater Atlanta Christian School'`
- `venue_address text NOT NULL DEFAULT '1500 Indian Trail Lilburn Rd NW'`
- `venue_city text NOT NULL DEFAULT 'Norcross'`
- `venue_region text NOT NULL DEFAULT 'GA'`
- `venue_postal text NOT NULL DEFAULT '30093'`
- `sort_order int NOT NULL`
- `created_at`, `updated_at` + trigger

App-side constant `DEFAULT_VENUE` (matching the column defaults) is the source of truth for "is this cohort at the usual place?" — compare a row's venue fields against it to decide whether to render the "Different location" callout.

GRANTs + RLS:
- `GRANT SELECT ON public.cohorts TO anon, authenticated;`
- `GRANT ALL ON public.cohorts TO service_role;`
- Policies: public `SELECT`; `INSERT/UPDATE/DELETE` only when `has_role(auth.uid(), 'super_admin')`.

Seed 12 existing rows (Jun 2026 → May 2027) with the default venue.

`workshop_registrations.cohort_id` already exists — no change.

## 2. Server functions (`src/lib/cohorts.functions.ts`)

- `listCohorts()` — public read.
- `upsertCohort({ id?, cohort_date, tz, start_time, end_time, status, seats_left, venue_name, venue_address, venue_city, venue_region, venue_postal })` — `requireSupabaseAuth` + super-admin guard, Zod-validated.
- `deleteCohort({ id })` — same guard.

## 3. Refactor `src/lib/cohorts.ts`

- Keep `Cohort` type (extend with `venue` fields + computed `isDefaultVenue: boolean` and `venueLine: string`), label helpers, and Google Calendar / ICS builders.
- Calendar `location` field now derives from the cohort's own venue (not a hardcoded constant).
- Remove `SEED`/`COHORTS` constants. Export pure helpers `getNextAvailable(cohorts)` and `getCohortById(cohorts, id)`.
- Export `DEFAULT_VENUE` for client-side comparison.

## 4. Wire consumers to live data

- `src/lib/schedule-data.ts`: derive `EVENT` from the next-available DB cohort (including its venue).
- `src/components/value/CohortPicker.tsx`:
  - Accept `cohorts: Cohort[]` as a prop.
  - Each pill for a non-default-venue cohort gets a small "Different location" badge (e.g. amber dot + city name like "Atlanta, GA").
  - Below the picker's "Your cohort" row, show a compact venue line: city + short address. When `!isDefaultVenue`, wrap it in a prominent callout card (amber/warning accent, `MapPin` icon, copy: "Heads up — this cohort meets in {city}, not Norcross. {full address}").
- `src/routes/register.tsx`: loader calls `listCohorts()`; success card and Add-to-Calendar links use the selected cohort's venue.
- `src/routes/schedule.tsx` + other importers: switch to loader data; surface the same "Different location" treatment.

## 5. New admin page `/admin/cohorts` (super-admin only)

File: `src/routes/_authenticated/_admin/admin.cohorts.tsx`. Add `{ to: "/admin/cohorts", label: "Cohorts", super: true }` to `NAV`.

- Table: date, weekday, tz, times, status, seats, **venue (city — flagged if non-default)**, actions.
- Add/Edit dialog fields: date picker, tz, start/end time, status, seats-left, and a **Venue section** with: `venue_name`, `venue_address`, `venue_city`, `venue_region`, `venue_postal`. Include a "Use default venue" button that resets all five fields to `DEFAULT_VENUE`. A live preview line shows "Default venue ✓" or "Custom venue — will show callout to users".
- Mutations call `upsertCohort`/`deleteCohort` and invalidate the `["cohorts"]` query.
- Component-level guard: `if (!isSuperAdmin) return <Navigate to="/admin" replace />;`.

## 6. Out of scope

- Auto-deriving status from registration counts.
- Per-cohort pricing.
- Geocoding / embedded maps (we just render the address + a "Get directions" Google Maps link built from `encodeURIComponent(fullAddress)`).

## Open questions

1. Allow any weekday for `cohort_date`, or warn when not a Wednesday? **Default: allow any, no warning.**
2. For the "Different location" callout, is a city-level chip enough on the picker pill (full address only in the expanded detail), or should the full street address appear on the pill itself? **Default: city only on the pill, full address in the callout card.**


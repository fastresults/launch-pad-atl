## Goal
Generate a recurring 2026 workshop schedule per workshop, auto-drop dates that have already elapsed, and surface the upcoming dates in each card on `/build` and on each `/build/:slug` detail page.

## Cadence (through Dec 2026)

| Workshop | Slug | Day | Time (ET) |
|---|---|---|---|
| Build your brand | `brand-identity` | 2nd Tuesday, every month | 9:30–11:30 am |
| Convert your website | `website-that-converts` | 2nd Wednesday, every month | 9:30–11:30 am |
| Own your social presence | `social-presence` | 2nd Tuesday, **even months** (Feb, Apr, Jun, Aug, Oct, Dec) | 1:30–4:00 pm |
| Engineer your content | `content-engine` | 2nd Tuesday, **odd months** (Jan, Mar, May, Jul, Sep, Nov) | 1:30–4:00 pm |

Other workshops (AI OS, etc.) unchanged — no schedule shown.

## Files

**New: `src/lib/build-workshop-schedule.ts`**
- `type ScheduledSession = { dateISO: string; label: string; startTime: string; endTime: string; }`
- `getNthWeekdayOfMonth(year, month, weekday, n)` helper.
- `WORKSHOP_SCHEDULES: Record<slug, { weekday, nth, months, startTime, endTime, timezone }>` for the 4 slugs above.
- `getUpcomingSessions(slug, now = new Date(), limit = 6): ScheduledSession[]` — generates all 2026 (and remaining 2025) occurrences, filters `dateISO >= today (ET)`, returns first `limit`. Uses ET boundary so a same-day 9:30 am session still shows until it starts (compare against session end time, not midnight).
- Date labels formatted like `Tue, Feb 10, 2026 · 9:30–11:30 am ET`.

**Edit: `src/routes/build.tsx`**
- For each workshop card, if `getUpcomingSessions(w.slug).length > 0`, render a new block below the walk-outs list:
  - Heading: "Upcoming dates"
  - Show next 3 sessions as compact rows (calendar icon + date + time).
  - "+ N more" line if more remain.

**Edit: `src/routes/build.$slug.tsx`**
- New "Schedule" section after the hero / agenda, showing next 6 upcoming sessions as a list. Each row: date, time, "Reserve seat →" link to `/register?workshop=<slug>&date=<iso>`.
- If schedule empty (workshop with no cadence, or past Dec 2026), section is hidden.

## Auto-drop logic
- Pure client-side; `new Date()` at render time.
- No DB, no cron. When today passes the last 2026 date the sections simply render nothing.
- All time math done in America/New_York via `Intl.DateTimeFormat` for label rendering; underlying ISO stored as `YYYY-MM-DDTHH:mm:00-05:00` / `-04:00` computed with a small DST helper (US DST: 2nd Sun Mar → 1st Sun Nov).

## UI notes
- Reuse existing `Calendar` lucide icon already imported on the detail page.
- Cards on `/build` grow slightly; keep spacing consistent with the current border-top divider pattern.
- No copy uses "template" or "business" — say "workshop" and "startup" per project rules.

## Out of scope
- Cohort/capacity tracking, seat counts, or wiring these dates into the `cohorts` table.
- Registration flow changes beyond passing `date` as a query param.
- Time-zone selector; ET only for now.

## Open follow-ups (not blocking)
- Later: persist these as real `cohorts` rows so registration + calendar invites work end-to-end. Flag only — not part of this change.
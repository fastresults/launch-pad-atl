# Combined workshop calendar

A single public page showing every upcoming session across all nine workshops in one place, so a visitor can scan the next 90 days and reserve from one screen instead of hopping between workshop pages.

## The page: `/calendar`

Same cinematic public shell as the other public pages (`SiteHeader`, `public-surface`, `public-container`, blue-accented card system used on `/build/:slug`).

Structure:

1. **Header block** — eyebrow "Upcoming sessions · next 90 days", headline in the existing lead/emphasis pattern, one line of copy explaining that morning and afternoon sessions run in the same week so a founder can stack two in one trip.
2. **Filter chips** — "All" plus one chip per workshop, driven by the existing catalog. Client-side filter only; selection also readable from `?w=<slug>` so the chips can be linked to.
3. **Grouped list** — sessions grouped by month, then by day. Each day is a row showing the date, and inside it every session that day as a card: workshop title, time label, price, and a **Reserve** link to `/register?workshop=<slug>&date=<startISO>`.
4. **Same-day note** — when a day holds both an AM and a PM session, a small line under the day: "Two sessions this day — you can do both."
5. **Empty state** — if a filter yields nothing in the window, a short line pointing back to `/build`.

Foundation is included alongside the eight build workshops, using its own fixed date (Thu, Aug 20, 2026) rather than the recurring generator.

## Navigation

Add a "Calendar" link in the header next to Workshops, and a "See all dates" link from the `/build` index and from the homepage Upcoming Dates section.

## Technical notes

- New file `src/lib/workshop-calendar.ts`: `getAllUpcomingSessions(now, days)` merges `getUpcomingSessions()` across every slug in `WORKSHOP_SCHEDULES`, appends the Foundation session from the catalog when it is still in the future, sorts by start time, and returns entries carrying `{ slug, title, priceLabel, startISO, endISO, dateLabel, timeLabel }`. Grouping helper returns month → day → sessions.
- New route file `src/routes/calendar.tsx`, registered in `src/App.tsx` at `/calendar`.
- Presentation reuses `SectionShell` / `SectionEyebrow` / `SectionHeading` from `src/components/home/workshop/SectionChrome.tsx`; no new design tokens.
- Reads the same `BOOKING_CUTOFF_HOURS` / `SCHEDULE_HORIZON_DAYS` logic, so the calendar can never show a session the workshop pages hide.
- SEO: page title and meta description via `useDocumentTitle`, plus JSON-LD `Event` items for the listed sessions.
- No database or edge function work — the schedule is generated client-side.

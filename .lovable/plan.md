## Goal
Extend the auto-rolling 2026 schedule to the remaining 4 workshops, on Thursdays and Fridays, using the same 2nd-weekday-of-month pattern and the same AM/PM time blocks already in `src/lib/build-workshop-schedule.ts`. UI already renders whatever `getUpcomingSessions(slug)` returns, so no route changes needed.

## Cadence (through Dec 2026, all ET)

| Workshop | Slug | Day | Time |
|---|---|---|---|
| Run on AI | `ai-operating-system` | 2nd Thursday, every month | 9:30–11:30 am |
| Automate your revenue | `email-crm-automation` | 2nd Thursday, every month | 1:30–4:00 pm |
| Close more sales | `sales-systems` | 2nd Friday, every month | 9:30–11:30 am |
| Scaffold your business | `legal-financial-ops` | 2nd Friday, every month | 1:30–4:00 pm |

## Files

**Edit: `src/lib/build-workshop-schedule.ts`**
- Add 4 entries to `WORKSHOP_SCHEDULES` with weekday `4` (Thu) or `5` (Fri), `nth: 2`, no `months` filter (every month), reusing the existing `09:30/11:30` and `13:30/16:00` time pairs and their `timeLabel` strings.

That's it — no route, component, or type changes. Cards on `/build` and detail pages on `/build/:slug` already pull from `getUpcomingSessions`, so the new dates will appear automatically and past dates will drop off as they elapse.

## Out of scope
- Cohort/DB rows, registration wiring, or capacity tracking (same as prior plan).
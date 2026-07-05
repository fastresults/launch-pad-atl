## Change workshop date: Jul 23, 2026 → Aug 19, 2026

Audit found 5 references. All will be updated in a single copy sweep — no logic, schema, or component changes.

### Files to edit

1. **`src/lib/cohorts.ts`** (L238)
   - `cohort_date: "2026-07-23"` → `"2026-08-19"`
   - This is the `FALLBACK_COHORT` used by SSR/hydration. Cascades automatically to `EVENT`, `useEvent`, hero, schedule, ICS, Google Calendar link.

2. **`src/components/home/HomeFramework.tsx`** (L74)
   - `Thu, Jul 23, 2026` → `Wed, Aug 19, 2026` (see note below)

3. **`src/lib/chatbot-knowledge.ts`** (L110)
   - `Thursday, July 23, 2026` → `Wednesday, August 19, 2026`

4. **`supabase/functions/venture-chatbot/knowledge.ts`** (L51)
   - Same edit as #3.

5. **`src/routes/_authenticated/_admin/admin.applications.$id.tsx`** (L131)
   - Admin email template string: `July 23, 2026` → `August 19, 2026`.

### ⚠️ Weekday flag

Aug 19, 2026 is a **Wednesday**, not a Thursday. Current copy says "Thu". Two options:

- **A (default in plan):** Update copy to "Wed / Wednesday" to match the actual date.
- **B:** Keep the workshop on a Thursday → use **Thu, Aug 20, 2026** instead.

Please confirm A or B before I implement. Everything else is a mechanical string swap.

### Out of scope
- DB `cohorts` table rows (managed via admin UI, not code).
- Any per-cohort ICS filename/URL constants — all derived from `cohort_date`.
- `build-workshop-schedule.ts` (recurring monthly rules — unrelated to this cohort date).
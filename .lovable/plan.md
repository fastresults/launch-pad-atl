# Admin Routes — Forensic Report & Fix Plan

A full audit of every `/admin/*` route and its data-layer function uncovered one consistent root cause: **the UI was rewritten to expect rich envelopes (`{ items, counts }`, `{ application, notes, registration }`, `{ updated: {...} }`), but several data functions were simplified to return raw Supabase rows / arrays.** A second class of issue: several functions query tables that don't exist in the current schema (`members`, `member_*`, `media_items`), so they silently return empty even when the UI shape is right.

The crash in the screenshot (`/admin/site` → "Cannot read properties of undefined (reading 'length')") is one instance of this pattern — `getPublicSiteSettings()` returns a flat map with no `updated` key, but the route reads `data.updated.home_variant`.

## Findings by severity

### Severity 1 — Crashes the route
| Route | Cause |
|---|---|
| `admin.site.tsx` | `data.updated.home_variant` — `getPublicSiteSettings` has no `updated` key |
| `admin.applications.$id.tsx` | `notes.length` — `getApplication` returns raw row, no `notes`/`application`/`registration` |
| `admin.attendees.tsx` | `data.attendees.length` — `listAttendees` returns flat array and queries non-existent `members` |
| `admin.review.tsx` | `data.queue.length` — `listReviewQueue` returns flat array, queries non-existent `member_deliverable_runs` |
| `admin.attendees.$userId.deliverables.$key.tsx` | `revs.revisions.length` — `listDeliverableRevisions` returns flat array |

### Severity 2 — Silent: renders but wrong/empty or mutations no-op
- `admin.applications.$id.tsx`: `addApplicationNote` called with `{applicationId, body}`, function expects `{id, note}` → notes silently dropped.
- `admin.inquiries.index.tsx` / `admin.inquiries.$id.tsx`: `listInquiries` / `getInquiry` have no `unwrap()`, so `{data:{…}}` envelope is treated as the filter object → empty results, "Not found" pages.
- `admin.users.tsx`: `listUsersWithRoles` returns raw `user_roles` (no profile join, no `roles[]`), and `setUserRole` calls omit `action` so role changes do nothing.
- `admin.attendees.$userId.index.tsx` and `…workflow.tsx`: `getAttendeeDetail` / `adminGetUserWorkflow` / `adminRunForUser` lack `unwrap()` and target tables that don't exist.

### Severity 3 — Non-existent tables (silent empty)
`pipeline.functions.ts`, `userPipeline.functions.ts`, `media.functions.ts`, `attendee.functions.ts` reference: `members`, `member_deliverable_runs`, `member_deliverables`, `member_deliverable_revisions`, `member_workflow_steps`, `member_documents`, `member_goals`, `member_progress`, `media_items`. Correct tables in current schema: `profiles`, `ai_pipeline_runs`, `attendee_deliverables`, `deliverable_revisions`, `attendee_documents`, `attendee_goals`, `attendee_progress`, `media_assets`.

Also: `admin-badges.functions.ts` filters `founder_applications` by `status = "pending"` — not a valid status. Valid statuses: `applied`, `reviewing`, `shortlisted`, `selected`, `waitlisted`, `rejected`, `withdrawn`.

### Severity 4 — OK
`admin.applications.index.tsx`, `admin.registrations.tsx`, `admin.members.tsx`, `admin.cohorts.tsx`, `admin.media.tsx`. The dashboard (`admin.index.tsx`) is fine for the parts that use the corrected applications/members/registrations functions.

## Fix plan

The strategy is consistent across the board: **make functions return the envelope the UI expects, accept both wrapped and flat args via `unwrap()`, and point every query at a table that actually exists.**

### Phase 1 — Stop the crashes (Severity 1)
1. `src/lib/site-settings.functions.ts`: select `key, value, updated_at`; return `{ home_variant, register_variant, updated: { home_variant: <ts>, register_variant: <ts> } }`. As a belt-and-suspenders, also change route reads to `data?.updated?.home_variant ?? null`.
2. `src/lib/applications-admin.functions.ts` — `getApplication`: return `{ application, notes, registration }` (join `application_notes`; look up `workshop_registrations` by `converted_registration_id`).
3. `src/lib/pipeline.functions.ts`:
   - `listAttendees`: query `profiles` (+ optional `member_intakes` join); return `{ attendees, counts }`.
   - `listReviewQueue`: query `ai_pipeline_runs` (status `needs_review`); return `{ queue }`.
   - `listDeliverableRevisions`: query `deliverable_revisions`; return `{ revisions }`.

### Phase 2 — Restore broken interactions (Severity 2)
4. `src/lib/applications-admin.functions.ts` — `addApplicationNote`: accept `{id, body}`, insert into `application_notes` (not patch `admin_notes` on the application).
5. `src/lib/inquiries-admin.functions.ts`: add `unwrap()` to `listInquiries` and `getInquiry`; return `{ inquiries, counts }` and `{ inquiry, messages }` respectively.
6. `src/lib/admin.functions.ts` — `listUsersWithRoles`: join `profiles`, aggregate roles per user, return `{ users: [{ user_id, email, display_name, roles[] }] }`. `setUserRole`: add `unwrap()` and default `action: "add"` if omitted.
7. `src/lib/pipeline.functions.ts` — `getAttendeeDetail`: add `unwrap()`, query `profiles` + `attendee_documents` + `attendee_deliverables` + `ai_pipeline_runs`; return `{ attendee, profile, documents, deliverables, runs }`.
8. `src/lib/userPipeline.functions.ts` — `adminGetUserWorkflow`, `adminRunForUser`, `getMyWorkflow`, `runMyDeliverable`: add `unwrap()`, retarget to `ai_pipeline_runs` + `attendee_business_brief` + `attendee_filing_info` to compute `{ brief, filingPresent, items }`.
9. `admin.attendees.$userId.deliverables.$key.tsx` call sites: align param names with function signatures (`{ deliverableId }`, `{ id, content }`) — or update functions to accept the names already used. Pick the function-side change for consistency with the rest of the codebase.

### Phase 3 — Schema correctness & polish (Severity 3)
10. `src/lib/media.functions.ts`: `media_items` → `media_assets` everywhere.
11. `src/lib/attendee.functions.ts`: retarget `members → profiles`, `member_documents → attendee_documents`, `member_goals → attendee_goals`, `member_progress → attendee_progress`, `member_deliverables → attendee_deliverables`.
12. `src/lib/admin-badges.functions.ts`: change `.eq("status","pending")` for founder applications to `.in("status", ["applied","reviewing"])` (or whichever is the real "needs triage" set — confirm with you).

### Phase 4 — Safety net
13. The `AdminErrorBoundary` is already wrapping `<Outlet />` — keep it; the visible "Something went wrong" card in the screenshot proves it's working. After the fixes it should rarely trigger.
14. After implementing, walk every admin route once in the preview and confirm no boundary trips and lists populate.

## Open questions before I implement
- For Phase 3 step 12 (`founder_applications` "pending" badge): should that badge count `applied + reviewing`, or only `applied`?
- For Phase 2 step 4 (notes): the current `addApplicationNote` writes `admin_notes` as a free-text column on the application. The `application_notes` table exists with columns for individual notes. Do you want the **history table** (multiple notes per application, with author/timestamp) or keep the **single overwriting admin_notes string**? The route UI currently shows a notes *list*, which only works with the history table — recommended.

If you're good with the above, I'll implement Phase 1 → 4 in order and verify each route in the preview.

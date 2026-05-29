## Goal

Registered attendees complete intake (founder + business + financial profile, document uploads, goals, progress). Super admin runs an **AI-first deliverables pipeline** that ingests that data and sequentially produces every deliverable promised in the registration/pricing matrix. Each AI output lands in a **super-admin review queue first** — nothing reaches the attendee until super admin approves it, and approved deliverables can be **published immediately or scheduled for a future date/time**. Super admin can also edit/override any deliverable; overrides become the version the attendee sees.

## Database (new tables, RLS-protected)

1. **`attendee_profiles`** (1:1 with `auth.users`) — founder / business / financial fields, intake_completed_at
2. **`attendee_documents`** — kind, storage_path, original_name, size, mime
3. **`attendee_goals`** — 30/60/90 plan rows
4. **`attendee_progress`** — module/assignment tracking
5. **`deliverable_types`** — seeded catalog of every promised deliverable from the registration/pricing matrix (key, label, description, schema_version, default_model, prompt_template_id, sort_order, depends_on_keys[], tier_required)
6. **`attendee_deliverables`** — one row per (user × deliverable_type)
   - **review_status**: `draft` | `pending_review` | `approved` | `rejected` | `changes_requested`
   - **publish_status**: `unpublished` | `scheduled` | `published` | `unpublished_manual`
   - **publish_at** (timestamptz, nullable) — when scheduled
   - **published_at** (timestamptz, nullable) — when actually went live
   - **visible_to_user** (bool, computed/maintained: `publish_status='published'`)
   - **content_current** (jsonb): the version attendee sees once published
   - **content_ai** (jsonb): latest AI-generated version (kept for diff/revert)
   - **content_source**: `ai` | `admin_override`
   - admin_edited_at, admin_edited_by, ai_generated_at, approved_by, approved_at, reviewer_notes
7. **`deliverable_revisions`** — append-only audit log (who, when, source, before/after snapshot, action: generated|edited|approved|rejected|scheduled|published|unpublished|reverted)
8. **`ai_pipeline_runs`** — top-level pipeline execution per attendee (status, triggered_by, options)
9. **`ai_pipeline_steps`** — one row per deliverable produced inside a run (run_id, deliverable_type_key, status, model, input_snapshot, raw_output, error, depends_on_keys[]) — sequential/DAG execution, resumable

Storage bucket: **`attendee-docs`** (private), path `{user_id}/{doc_id}-{filename}`.

RLS (uses existing `is_admin()` / `has_role()`):
- Attendees: CRUD own profile/docs/goals/progress; SELECT own `attendee_deliverables` **only where `publish_status='published'` AND `published_at <= now()`**.
- Admins: SELECT all attendee tables and deliverables; INSERT pipeline runs.
- Super admin: full CRUD on `attendee_deliverables`, `deliverable_revisions`, `ai_pipeline_runs`, `deliverable_types`.

## AI-first deliverables pipeline

**Trigger** (super-admin only): "Run full pipeline" on an attendee, run one specific deliverable, or re-run a failed step.

**Engine** (`src/lib/pipeline.functions.ts`):
- `triggerPipeline({userId, deliverableKeys?, force?})` opens `ai_pipeline_runs`, materializes step rows in dependency order.
- Step executor uses **AI SDK** + Lovable AI Gateway provider helper with `Output.object` schemas per deliverable_type.
- Steps run sequentially and pass upstream outputs as context to downstream prompts (SWOT → roadmap; canvas → GTM plan, etc.).
- **Every completed step writes to `content_ai` and sets `review_status='pending_review'`, `publish_status='unpublished'`.** Nothing becomes visible to the attendee.
- `content_current` initialized to `content_ai` for review/editing convenience but gated by `publish_status`.
- Re-runs never overwrite `content_current` when `content_source='admin_override'` without explicit confirmation.
- Default model: `google/gemini-3-flash-preview`; long-form deliverables use `google/gemini-2.5-pro`.
- Streaming progress via realtime channel on `ai_pipeline_steps`.

## Review → Approve → Schedule → Publish workflow

**Review queue** (`/admin/review`) — central inbox of all `pending_review` deliverables across all attendees, sortable by attendee, type, age. Each row links to the detail view.

**Per-deliverable review screen** (super-admin only):
1. **View** AI version, current version, diff.
2. **Edit inline** — rich editor for prose (markdown), structured editor for typed fields. Save writes `content_current`, sets `content_source='admin_override'`, appends revision.
3. **Regenerate** this single deliverable (optionally use admin edits as guidance).
4. **Revert** to last AI version.
5. **Decision actions**:
   - **Approve & Publish now** → `review_status='approved'`, `publish_status='published'`, `published_at=now()`, `visible_to_user=true`.
   - **Approve & Schedule** → date/time picker (with timezone, defaults to admin's tz). Sets `review_status='approved'`, `publish_status='scheduled'`, `publish_at=<future>`. A scheduled worker flips it to `published` at the chosen time.
   - **Approve only (hold)** → `review_status='approved'`, `publish_status='unpublished'`. Can be scheduled or published later.
   - **Request changes** → `review_status='changes_requested'` + reviewer_notes (kept for audit; triggers no user-facing change).
   - **Reject** → `review_status='rejected'`, `publish_status='unpublished'`.
6. **Reschedule / Unpublish / Republish** at any time:
   - Reschedule: change `publish_at` while `publish_status='scheduled'`.
   - Unpublish a live deliverable: `publish_status='unpublished_manual'`, `visible_to_user=false` (attendee loses access immediately; revision logged).
   - Republish: back to `published`.
7. **Bulk actions** on the queue: approve-all / schedule-all (same time) / publish-all for a given attendee — useful right after a pipeline run finishes.

**Scheduled-publish worker** — TanStack server route `src/routes/api/public/hooks/publish-due-deliverables.ts` driven by `pg_cron` every minute:
- Selects `attendee_deliverables` where `publish_status='scheduled' AND publish_at <= now() AND review_status='approved'`.
- For each: sets `publish_status='published'`, `published_at=now()`, writes `deliverable_revisions` row (action='published', source='scheduler').
- Optional: emits realtime event so the attendee dashboard updates instantly.
- Auth via Supabase anon key in `apikey` header (canonical `/api/public/*` cron pattern).

Cron job seeded via `supabase--insert`:
```sql
select cron.schedule('publish-due-deliverables','* * * * *',
  $$ select net.http_post(
       url:='https://project--c8862b1b-6e2d-43fc-916e-3cbc978bcf87.lovable.app/api/public/hooks/publish-due-deliverables',
       headers:='{"Content-Type":"application/json","apikey":"<anon>"}'::jsonb,
       body:='{}'::jsonb) $$);
```

Attendee dashboard always reads `content_current` where `publish_status='published' AND published_at <= now()`. They never see drafts, pending, scheduled, or rejected items.

## Server functions

**Attendee** (`requireSupabaseAuth`)
- `getMyProfile`, `upsertMyProfile(section)`
- `listMyDocuments`, `createDocumentUploadUrl`, `finalizeDocument`, `deleteMyDocument`
- `listMyGoals`, `upsertGoal`, `deleteGoal`
- `getMyProgress`, `updateModuleProgress`
- `listMyDeliverables`, `getMyDeliverable(key)` — published-only

**Admin** (`assertAdmin`)
- `listAttendees`, `getAttendeeDetail(userId)`
- `listReviewQueue({status?, attendeeId?})`

**Super-admin** (`assertSuperAdmin`)
- `triggerPipeline({userId, deliverableKeys?, force?})`
- `regenerateDeliverable({userId, key, guidance?})`
- `updateDeliverableContent({userId, key, content})`
- `revertDeliverableToAi({userId, key})`
- `reviewDeliverable({userId, key, decision: 'approve'|'request_changes'|'reject', notes?})`
- `publishDeliverable({userId, key, when: 'now' | {scheduledAt: iso, timezone}})`
- `unpublishDeliverable({userId, key, reason?})`
- `rescheduleDeliverable({userId, key, scheduledAt, timezone})`
- `bulkPublish({userId, keys, when})`
- `listDeliverableRevisions`, `restoreRevision`
- `listPipelineRuns`, `getPipelineRun`

## Routes

**Attendee portal** (`_authenticated/`)
- `/dashboard` — intake %, goals snapshot, published deliverables count, next session
- `/dashboard/profile` — multi-step intake (Founder → Business → Financials), autosave
- `/dashboard/documents` — upload/list/delete
- `/dashboard/goals` — 30/60/90 editor
- `/dashboard/progress` — modules checklist
- `/dashboard/deliverables` — published list (with publish dates)
- `/dashboard/deliverables/$key` — typed renderer

**Admin** (`_authenticated/_admin/`)
- `/admin/attendees`, `/admin/attendees/$userId` — tabs: Profile · Documents · Goals · Progress · Deliverables · Pipeline Runs
- `/admin/review` (super-admin gated) — global review queue
- `/admin/attendees/$userId/deliverables/$key` (super-admin gated) — diff + editor + approve/schedule/publish controls + history
- `/admin/pipeline/$runId` — live progress

## Frontend

- TanStack Query + `useServerFn`.
- React-hook-form + zod; section autosave on intake.
- Direct-to-Supabase signed-URL uploads.
- Realtime on `attendee_deliverables` (attendee + admin views).
- Schedule picker: shadcn `Calendar` + time input + timezone select (Luxon for tz math).
- Diff UI: `react-diff-viewer-continued` for prose; custom side-by-side for structured fields.
- Markdown: `react-markdown` + `remark-gfm`.

## Security

- All super-admin actions enforced server-side via `assertSuperAdmin`.
- Attendee reads gated by both RLS (`publish_status='published' AND published_at<=now()`) and server-side filtering.
- Cron endpoint validates anon key, uses `supabaseAdmin` only for the flip.
- `deliverable_revisions` append-only (no DELETE policy) — full audit trail of every approval, schedule change, publish, and unpublish.
- Storage private; signed URLs only.

## Open items to confirm before build

1. **Deliverables catalog** — I'll seed `deliverable_types` from `PricingTiers` + `ValueGrid`. Share an explicit list if you want different/extended items.
2. **Tier gating** — all attendees get all deliverables by default (no gating). Confirm or override.
3. **Notifications** — email attendee when a deliverable publishes? Default: no.
4. **Default timezone for scheduling** — admin's browser tz by default. Workshop is Atlanta-based; want me to lock the picker to America/New_York?
5. **Cost guardrails** — cap pipeline runs per attendee per day? Default: no cap.

Confirm or override and I'll build.

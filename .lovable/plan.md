## What happened

Both features still exist — they're just on the wrong page for the current Workflow flow.

- **Rewrite with Feedback** lives in `src/components/hub/RewriteFeedbackDialog.tsx` and is wired into the Founders Hub document viewer at `/dashboard/hub/:snapshotId` (`hub.$snapshotId.tsx` line 863).
- **Deep Assessment (McKinsey-grade)** lives in `src/components/hub/DocumentViewer.tsx` (line 708, "Run deep assessment"), backed by the `venture-generate-assessment` edge function and the `deep_assessment*` columns on `venture_documents`.

The Workflow page you're using (`/dashboard/workflow` → `/dashboard/workflow/:key`, file `src/routes/_authenticated/dashboard/workflow.$key.tsx`) is a thinner viewer that reads from `attendee_deliverables` via `runMyDeliverable`. Its only action is a plain `Regenerate` button (line 100). No feedback gateway, no deep-assessment trigger — that's why it feels like both features disappeared.

## Plan: restore both on the Workflow detail page

### 1. Rewrite-with-Feedback gateway on `Regenerate`

In `workflow.$key.tsx`:
- Import `RewriteFeedbackDialog`.
- Replace the direct `run.mutate()` call on the Regenerate button (only when a deliverable already exists) with opening the dialog.
- On dialog submit, pass the feedback into `runMyDeliverable` via a new `feedback` field.
- First-time Generate (no prior deliverable) skips the dialog and runs immediately — same as Hub behavior.

Server side:
- Extend `runMyDeliverable` in `src/lib/userPipeline.functions.ts` to accept `{ key, runUpstream, feedback }`.
- Thread `feedback` into the deliverable-generation edge function used by the workflow pipeline (mirroring how `venture-generate-document` already ingests `rewrite_feedback`). One small prompt block: "Founder rewrite guidance (highest priority): …".

### 2. Deep Assessment trigger in the Workflow viewer

In `workflow.$key.tsx`, below the rendered article:
- Add a "Run deep assessment" panel (same UX as `DocumentViewer.tsx` lines ~700–760): button → loading → rendered markdown when complete, with quality score and generated-at timestamp.
- Reuse the existing `venture-generate-assessment` edge function. Because that function targets `venture_documents`, we add a thin server helper (or a new edge function `attendee-generate-assessment`) that runs the same McKinsey-grade prompt against the Workflow's `attendee_deliverables` row and stores the result on that row.

Schema change (one migration):
```sql
ALTER TABLE public.attendee_deliverables
  ADD COLUMN IF NOT EXISTS deep_assessment text,
  ADD COLUMN IF NOT EXISTS deep_assessment_status text,
  ADD COLUMN IF NOT EXISTS deep_assessment_quality_score int,
  ADD COLUMN IF NOT EXISTS deep_assessment_generated_at timestamptz;
```
No new RLS — existing row-owner policies cover the new columns.

### 3. Carry assessment into exports

Workflow detail currently has no Copy/Markdown/DOCX/PDF export (that lives only in `DocumentViewer`). Out of scope for this restoration — call it out and offer to port the export bar separately if you want parity with the Hub viewer.

### 4. Hub viewer

No changes — both features are already wired there. We're only restoring them on the Workflow path.

## Files touched

- `src/routes/_authenticated/dashboard/workflow.$key.tsx` — open RewriteFeedbackDialog on Regenerate; add Deep Assessment panel.
- `src/lib/userPipeline.functions.ts` — accept and forward `feedback`; add `runAttendeeAssessment`.
- `supabase/functions/<workflow-generate>/index.ts` — accept `feedback` and inject as guidance block.
- New edge function `attendee-generate-assessment` (or extend an existing one) — McKinsey-grade prompt against `attendee_deliverables`.
- One migration adding the four `deep_assessment*` columns to `attendee_deliverables`.

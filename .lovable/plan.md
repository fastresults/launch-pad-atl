# Deliver 25 Deliverables — Agentic Workflow (RLS-only, no new secrets)

Same plan as approved, with one change: **drop the `FILING_PII_KEY` encryption step.** Filing PII (SSN, DOB, address) is protected by strict RLS (owner + admin only) instead of `pgp_sym_encrypt`. No new secret required — uses only what's already configured.

## What changes vs. the prior plan

- `attendee_filing_info` stores `ssn`, `dob`, `address_*` as plain columns.
- RLS: only `auth.uid() = user_id` can SELECT/INSERT/UPDATE their own row; admins via `is_admin(auth.uid())`. No anon grant.
- `filing.functions.ts` reads/writes through `requireSupabaseAuth` (RLS-scoped) — never `supabaseAdmin` from user-facing paths.
- Admin filing reads happen in admin-only server fns that check `is_admin` before querying.
- No `pgcrypto`, no `FILING_PII_KEY`, no `add_secret` call.

Everything else from the approved plan stands:

1. **Migration** — create `attendee_business_brief`, `attendee_filing_info`, `attendee_stage_intake` (all RLS, owner+admin); extend `deliverable_types` with the 8 missing rows + `requires_context_keys`, `produces_context_key`, `output_kind`, `user_can_trigger`, `auto_runnable`.
2. **Workflow manifest** — `src/lib/workflow.ts` with the 25-deliverable dependency graph and context-key map.
3. **Server fns** — `brief.functions.ts`, `filing.functions.ts` (RLS only), `stageIntake.functions.ts`, `voice.functions.ts` (`transcribeAudio` via Lovable AI Gateway).
4. **Pipeline runner** — `pipeline.functions.ts`: `buildAttendeeContext`, `getMyWorkflow`, `attendeeTriggerDeliverable` (rate-limited 5 concurrent / 30/day), `runAttendeePipeline` (topological loop, pauses on `needs_input`), `attendeePublishDeliverable`. Uses AI SDK `Output` API for structured output.
5. **Voice UI** — `VoiceTextarea` / `VoiceInput` components (MediaRecorder → `transcribeAudio`).
6. **Dashboard routes** — `/dashboard/brief`, `/dashboard/filing`, `/dashboard/workflow`, `/dashboard/workflow.$key`.
7. **Admin mirror** — `/admin/attendees/$userId.workflow.tsx`; redirect `/dashboard/deliverables` → `/dashboard/workflow`.

## Out of scope

Real GA e-filing, IRS EIN submission, Stripe, domain purchase, real-time streaming transcription, at-rest field-level encryption (RLS is the sole PII guard).

## Security note on PII

RLS + the `is_admin` check is sufficient for this app's threat model. If you later want defense-in-depth encryption for SSN/DOB, we can add it as a follow-up — it would require generating and storing one encryption key at that time.

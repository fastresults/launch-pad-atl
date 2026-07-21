## Root cause

The global routing override in `src/lib/email/enqueue.ts` is correct — but the contact form never calls it. `submitInquiry()` and `contact.tsx` insert a row into `inquiries` and stop. No DB trigger, no edge function, no client-side enqueue. `email_send_log` has no rows after May 30, confirming nothing has been sent from any user-facing form in almost two months.

## Fix

### 1. Wire the contact form to enqueue both emails

In `src/lib/inquiries.functions.ts`, after a successful insert, call `enqueueTransactionalEmail` twice:

- `inquiry-received` → to `data.email` (user confirmation). Override redirects to `fastresults@gmail.com`.
- `inquiry-admin-notification` → to `fastresults@gmail.com` (admin ping). Override still applies; ends up at the same inbox with the `[→ fastresults@gmail.com]` prefix, which is fine.

Use idempotency keys `inquiry-received-<inquiry.id>` and `inquiry-admin-<inquiry.id>`. Return the inserted row from the insert (`.select().single()`) so we have the id.

Update `src/routes/contact.tsx` to await the new function (already does via `submitInquiry`) — no UI change.

### 2. Audit every other submit path and re-wire the ones that dropped their enqueue

Sweep `src/lib` and `src/routes` for direct `.insert(` on tables that used to trigger emails, matched against the 7 registered templates:

- `founder_applications` → should enqueue `application-received`
- `member_intakes` → should enqueue `member-intake-received` + `member-intake-admin-notification`
- `member-approved` → admin approval action
- `inquiry-reply` → admin reply action

For each, confirm whether the enqueue call is present. If missing, add it with an idempotency key derived from the row id. If already present, leave it.

### 3. Verify

- Submit the contact form once. Confirm two new `email_send_log` rows appear (`pending` → `sent`) with `recipient_email = fastresults@gmail.com` and `metadata.original_recipient` set to the form email and to the admin address respectively.
- Confirm the inbox at `fastresults@gmail.com` receives both, with the `[→ …]` subject prefix and the yellow dev-routing banner.
- Repeat for one founder application and one member intake if those forms are reachable in the current build.

### 4. Report

Post a short summary listing which forms were already wired, which I re-wired, and the email_send_log evidence for the contact-form test.

## Not doing

- Not touching the override itself — it's correct.
- Not adding a DB trigger to send emails; keeping the enqueue call in app code matches the existing pattern for the founder application and member intake flows.
- Not changing templates, subjects, or the auth-email-hook.

## Files

- `src/lib/inquiries.functions.ts` — add enqueue calls, return inserted id.
- `src/routes/contact.tsx` — no change expected (verify only).
- Any other `*.functions.ts` files found in step 2 that are missing their enqueue call.

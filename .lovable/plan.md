## Goal
Send the real `application-received` confirmation email (the one prospects get after submitting the free cohort application) to `fastresults@gmail.com` so you can see exactly what it looks like in an inbox.

## Approach
Add a tiny admin-only server function that enqueues the existing `application-received` template to an arbitrary recipient, then invoke it once for `fastresults@gmail.com`. No template changes, no form submission needed, no fake row in `founder_applications`.

## Steps
1. **Add `sendTestApplicationReceivedEmail` server function** in `src/lib/email/test-send.functions.ts`:
   - Protected by `requireSupabaseAuth` + admin role check (same pattern as other admin functions).
   - Accepts `{ recipientEmail, firstName? }`.
   - Calls the existing `enqueueTransactionalEmail` helper with `templateName: 'application-received'` and a unique idempotency key (`test-app-received-${Date.now()}`) so it won't dedupe against a real applicant.
2. **Invoke it once** via `stack_modern--invoke-server-function` (or a quick admin trigger) with `recipientEmail: "fastresults@gmail.com"`, `firstName: "Fast"`.
3. **Verify** in `email_send_log` that the row goes `pending` → `sent` within ~5–10s (the queue cron runs every 5s). Confirm in the Gmail inbox.

## Out of scope
- No changes to the template itself, the application form, or the queue infrastructure.
- The test function stays in the codebase as a reusable admin tool; if you'd rather I delete it after this one-off send, say so.

## Notes
- Suppression list is checked automatically — if `fastresults@gmail.com` was ever suppressed it will be skipped (I'll surface that in the response).
- Email will come from `noreply@notify.startuplabs.online`. Since the domain is new it may land in Spam/Promotions on the first send.

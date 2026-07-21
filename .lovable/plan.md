## Forensic email-delivery recovery plan

You are right: this needs to stop being patched from symptoms. The next pass should be treated as a production incident with proof at every step.

## Confirmed facts from this audit

- The sending domain is verified and the Lovable Cloud email setup reports healthy.
- The email log has no new rows since May 30, even though new contact inquiries were created today.
- Today’s contact submissions exist in the database, so the form insert works.
- The current browser-side email helper tries to do email infrastructure work directly from the app: suppression checks, unsubscribe-token creation, send-log inserts, rendering templates, and enqueueing.
- The database access rules for email infrastructure are service-only. That means the browser is not allowed to create unsubscribe tokens or send-log rows.
- The recent network trace already showed the exact failure pattern: inserting into `email_unsubscribe_tokens` was rejected by access rules, then the helper returned before queueing any email.
- There are no recent function logs for the app-email send path, which supports the conclusion that the send function was not being invoked.

## Root issue to fix

The system is currently trying to send app emails from the browser/client path. That is the wrong boundary. Email enqueueing must happen in a trusted backend function that has service-level access to the email queue, token table, suppression list, and send log.

The super-admin routing rule also needs to live at that backend boundary so every send path is forced to `fastresults@gmail.com`, regardless of which page or feature triggered it.

## Phase 1 — Instrument before changing behavior

1. Add a clear, single diagnostic trail for every email attempt:
   - triggering feature, such as contact form or member approval
   - template name
   - original intended recipient
   - final routed recipient
   - idempotency key
   - success/failure reason
2. Make the contact submission return or log the email attempt result during testing, instead of silently swallowing failures.
3. Remove “fire-and-forget” behavior until delivery is verified.

## Phase 2 — Move email enqueueing to the backend

1. Use the existing app-email function as the single send entry point.
2. Move suppression checks, unsubscribe token creation, rendering, logging, queue insertion, and routing override into the trusted backend function.
3. Keep the browser/client code simple:
   - insert or save the user action where appropriate
   - call the backend email function with `templateName`, `recipientEmail`, `templateData`, and `idempotencyKey`
4. Ensure the backend function always rewrites the final recipient to:

```text
fastresults@gmail.com
```

5. Preserve the intended recipient in:
   - subject prefix
   - visible email banner
   - send-log metadata

## Phase 3 — Fix all app email call sites, not just contact

Audit and wire every app email trigger through the same backend send path:

- contact inquiry confirmation
- contact inquiry admin notification
- founder application confirmation
- member intake confirmation
- member intake admin notification
- member approval email
- inquiry reply email
- any test-send/debug email path

No page should import the email template registry or directly touch email infrastructure tables.

## Phase 4 — Verify with hard evidence

Run one controlled contact-form test and verify all four layers:

1. UI shows the form submitted successfully.
2. Database contains the new inquiry row.
3. Email log contains new rows for both expected emails.
4. The latest status for each message becomes `sent`, with `recipient_email = fastresults@gmail.com` and metadata preserving the original intended recipient.

Then check backend function logs for the same message IDs.

## Phase 5 — Inbox verification and failure handling

1. Confirm whether the provider accepted the email.
2. If accepted but inbox does not receive it, check spam/promotions and suppression state for `fastresults@gmail.com`.
3. If rejected or dead-lettered, fix the exact provider/queue error instead of changing application code blindly.
4. Keep the diagnostic logs until the first successful end-to-end send is proven.

## Acceptance criteria

This is not complete until all of the following are true:

- A fresh contact-form submission creates the inquiry row.
- Two email attempts are logged for that submission.
- Both are routed to `fastresults@gmail.com`.
- Both reach `sent` status.
- The original intended recipient is visible in metadata and subject/body routing indicators.
- No browser-side code writes to email infrastructure tables.
- No email trigger silently swallows a failure during verification.

## Technical implementation notes

- The current client-side helper should be replaced or reduced to a backend-function invoker.
- The trusted backend send function should own the routing override and all queue/log/token operations.
- The email function must be redeployed after changes.
- Verification should use the email log and function logs before claiming success.
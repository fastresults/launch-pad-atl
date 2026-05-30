# Finish email setup + applicant confirmation email

DNS for `notify.startuplabs.online` is verified ✅ and the preview server route is now reachable. Time to finish activation and send actual confirmation emails when founders apply.

## What's already done
- Email domain verified
- Email queue tables + RPC wrappers migrated
- `process-email-queue` server route deployed on preview
- Email packages installed

## What this plan does

### 1. Activate the queue cron
Re-run email infrastructure setup so the pg_cron job + vault secret get provisioned now that the preview route responds. Drains the queue every 5s.

### 2. Scaffold transactional email infrastructure
Generate:
- `send-transactional-email` server route (`/lovable/email/transactional/send`)
- `preview-transactional-email` route (dashboard preview)
- `handle-email-unsubscribe` route + tokens
- `handle-email-suppression` route (bounce/complaint webhook)
- Template registry at `src/lib/email-templates/registry.ts`
- `sendTransactionalEmail` client helper at `src/lib/email/send.ts`

Sender: `notify@notify.startuplabs.online` (display from root: `notify@startuplabs.online` if enabled at setup).

### 3. Create the `application-received` template
React Email template, brand-styled (matches the site's dark/copper palette, white email body per email rules). Content:
- Subject: "We got your Atlanta Startup Sprint application"
- Greeting by first name
- Confirmation that the application landed
- Numbered "what happens next":
  1. Review by the selection team (typically within 5 business days)
  2. Email back with status (selected / waitlisted / not this cohort)
  3. If selected, instructions to confirm seat + next-step calendar
- No CTA button (acknowledgement only — per your earlier guidance)
- Footer signed from the Atlanta Startup Sprint team
- System-managed unsubscribe footer appended automatically

Register in `TEMPLATES` map.

### 4. Wire `submitFounderApplication` to send the email
In `src/lib/applications.functions.ts`, after the `founder_applications` insert succeeds:
- Call `sendTransactionalEmail` server-side (via internal route call using service role, since the form is public/unauthenticated)
- Pass `templateName: 'application-received'`, `recipientEmail`, `templateData: { firstName }`
- `idempotencyKey: \`application-confirm-${application.id}\`` so retries don't double-send
- Wrap in try/catch — email failure must NOT fail the application submission (already in DB)

### 5. Public unsubscribe page
Create `/unsubscribe` route that:
- Reads `?token=` from URL
- GETs `/email/unsubscribe?token=...` to validate
- Renders branded confirm button → POSTs to same endpoint
- Shows success / already-unsubscribed / invalid states

### 6. Publish reminder
Tell you to hit Publish so the live site's cron also activates against the prod database (preview cron handles preview DB).

## Files touched
- `src/lib/email-templates/application-received.tsx` (new)
- `src/lib/email-templates/registry.ts` (new — created by scaffold, then edited)
- `src/lib/email/send.ts` (new — created by scaffold)
- `src/lib/applications.functions.ts` (edit — add email trigger)
- `src/routes/unsubscribe.tsx` (new)
- `src/routes/lovable/email/transactional/*` (scaffolded)
- `src/routes/lovable/email/unsubscribe.ts` (scaffolded — public)
- `src/routes/lovable/email/suppression.ts` (scaffolded)

## Out of scope
- Selection / rejection / waitlist email templates (separate cohort once you've used Applications admin a bit and tell me the exact copy)
- Reminder emails to applicants
- Admin "Send custom email" tool

Ready to implement.
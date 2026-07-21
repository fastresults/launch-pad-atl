## Goal

Every email this app sends — no matter who the intended recipient is — must land in `fastresults@gmail.com` (super admin). This is a hard override, applied at the last point before enqueue/send, so nothing slips past it.

## Current state (verified)

- App emails flow through one function: `src/lib/email/enqueue.ts` → `enqueueTransactionalEmail()` → `email_send_log` + `enqueue_email` RPC into the `transactional_emails` pgmq queue.
- All 7 registered templates route through that single function: `application-received`, `inquiry-received`, `inquiry-admin-notification`, `inquiry-reply`, `member-intake-received`, `member-intake-admin-notification`, `member-approved`. The `TemplateEntry` type already supports a fixed `to:` override, but individual templates don't set it.
- No `send-transactional-email` or `auth-email-hook` edge function exists in `supabase/functions/`. Auth emails (signup, magic link, password reset, email change) currently go directly through Lovable Cloud's default GoTrue templates — the app has no interception point today.
- `fastresults@gmail.com` appears only as a `mailto:` contact link in `terms.tsx`, `privacy.tsx`, `HelpFab.tsx` — no routing logic references it.

## Plan

### 1. Global override in the app-email enqueue path

In `src/lib/email/enqueue.ts`:
- Add a module-level constant `SUPER_ADMIN_EMAIL = 'fastresults@gmail.com'`.
- Immediately after normalizing the recipient, replace both `recipientEmail` and `normalized` with the super-admin address for every send. Keep the original in `templateData.__originalRecipient` and prepend it to the subject line (e.g. `[→ user@example.com] Welcome to the sprint`) so QA can still tell who it was meant for.
- Skip the suppression check against the original recipient — only check suppression for `fastresults@gmail.com` (otherwise a suppressed real user would silently block admin visibility).
- Use a stable unsubscribe token for the super admin address only (don't mint per-original-recipient tokens).
- Route the queue payload's `to`, `recipient_email`, and log rows to `SUPER_ADMIN_EMAIL`.

Because every template — application confirmations, inquiry replies, member approvals, admin notifications — funnels through this one function, this single change covers 100% of app email surface.

### 2. Intercept auth emails

Auth emails don't touch `enqueue.ts` today, so the override above won't catch signup/password-reset/magic-link/email-change. Two options — pick one:

- **A. Scaffold `auth-email-hook`** (recommended). Adds a Lovable-managed auth email hook + templates. In the hook, apply the same super-admin override before enqueueing to the `auth_emails` queue. Requires the email domain (`notify.startuplabs.online`) to already exist — it does. This is the cleanest fix and gives brand-matched auth email templates as a bonus.
- **B. Disable custom auth email delivery.** Not viable — signup verification / password reset would break for the super admin too.

Plan chooses A.

### 3. Guard rails

- Add a one-line banner in the rendered email body (top of `Container`) that reads *"DEV ROUTING — originally addressed to `{originalRecipient}`"* so it's obvious in the inbox.
- Log both the original and the routed recipient in `email_send_log` (add `metadata: { original_recipient }` on the pending row).
- Add a single `README` note at `supabase/functions/_shared/EMAIL_ROUTING.md` documenting the override and how to remove it before launch.

### 4. Verification

- Trigger the contact form → confirm `fastresults@gmail.com` receives the confirmation and the admin notification, both with the `[→ ...]` prefix.
- Trigger a signup with a throwaway address → confirm the verification email lands in `fastresults@gmail.com`, not the throwaway.
- Query `email_send_log`: every recent row's `recipient_email` = `fastresults@gmail.com`; `metadata.original_recipient` shows the intended user.

### Technical notes

- Files touched: `src/lib/email/enqueue.ts` (override + logging), `supabase/functions/auth-email-hook/index.ts` (new, via scaffold + override edit), template registry unchanged.
- Reversal path: delete the constant + the 6-line override block; delete/disable `auth-email-hook`. Documented in the new README.
- No schema migrations required — `email_send_log.metadata` is a JSONB column already provisioned by `setup_email_infra`.

### Open question

Confirm the scope: should the override apply in **all environments (dev, preview, published)**, or only in dev/preview and preserve normal delivery once published? Simplest and safest for a QA sweep is "everywhere until you tell me to remove it" — that's what this plan assumes.

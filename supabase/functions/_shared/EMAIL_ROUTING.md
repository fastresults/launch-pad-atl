# Dev email routing override

**Status:** ACTIVE — every outgoing email (app + auth) is redirected to
`fastresults@gmail.com` regardless of the intended recipient. Real users
receive nothing.

## Where it lives

- **App emails:** `src/lib/email/enqueue.ts` — constant `SUPER_ADMIN_EMAIL`
  plus the override block at the top of `enqueueTransactionalEmail()`.
- **Auth emails:** `supabase/functions/auth-email-hook/index.ts` — the
  `to` address is rewritten to `SUPER_ADMIN_EMAIL` before enqueue.

## What each email looks like

- Subject line is prefixed with `[→ original@user.com]`.
- Body has a yellow "DEV ROUTING — originally addressed to …" banner at the top.
- `email_send_log.metadata.original_recipient` records the intended user;
  `recipient_email` on that same row is `fastresults@gmail.com`.

## How to remove before launch

1. Delete the `SUPER_ADMIN_EMAIL` constant and the override block in
   `src/lib/email/enqueue.ts` (restore original `recipientEmail` / `normalized`
   lines, drop the `__originalRecipient`, subject prefix, banner, and
   `metadata` fields).
2. Do the same in `supabase/functions/auth-email-hook/index.ts`.
3. Redeploy `auth-email-hook`.

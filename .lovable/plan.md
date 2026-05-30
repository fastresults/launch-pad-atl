# Inquiries System: Public form → Admin inbox → Email replies

End-to-end contact/inquiry system. Visitors submit a form, admins triage and reply via email from a dedicated dashboard section, with the full thread stored for context.

## 1. Public inquiry form

- New route `/contact` (also linked from footer + a "Questions?" CTA on the homepage).
- Fields: name, email, subject, message, optional phone. Honeypot + zod validation (length caps, email format).
- Submits via a TanStack server function → inserts into `inquiries` table.
- Sends a confirmation email to the submitter ("We got your message") using the existing email queue + a new `inquiry-received` template.
- Sends a notification email to admin(s) using a new `inquiry-admin-notification` template (links to the admin inbox detail page).
- Friendly success state ("We'll get back to you within 1 business day").

## 2. Database

New tables (migration):

- **`inquiries`** — `id`, `name`, `email`, `phone`, `subject`, `message`, `status` (`new` | `in_progress` | `replied` | `closed`), `assigned_to` (uuid, nullable), `created_at`, `updated_at`, `last_activity_at`.
- **`inquiry_messages`** — full thread: `id`, `inquiry_id`, `direction` (`inbound` | `outbound`), `author_id` (nullable), `author_name`, `body`, `created_at`.

RLS:
- `inquiries` / `inquiry_messages`: INSERT allowed for anon on `inquiries` only (for the form); SELECT/UPDATE restricted to admins via `is_admin(auth.uid())`.
- GRANTs to `anon` (INSERT inquiries only), `authenticated`, `service_role`.

The initial submission also seeds the first `inquiry_messages` row (`direction = 'inbound'`).

## 3. Admin inbox

New route group under existing admin layout:

- `/admin/inquiries` — list view with status filter chips (New / In progress / Replied / Closed / All), search by name/email/subject, unread badge in sidebar nav. Columns: From, Subject, Preview, Status, Received.
- `/admin/inquiries/$id` — detail view:
  - Header: contact info, status dropdown, assign-to-me button.
  - Threaded message list (inbound vs outbound bubbles, timestamps, author).
  - Reply composer at bottom (textarea + Send button).
  - "Mark as closed" action.

Dashboard tile on `/admin` showing count of new inquiries, linking to the inbox.

## 4. Admin reply flow

- "Send reply" calls a protected server function (`requireSupabaseAuth` + admin check) that:
  1. Inserts an `inquiry_messages` row (`direction = 'outbound'`).
  2. Updates the inquiry's `status` to `replied` and bumps `last_activity_at`.
  3. Enqueues an email via the existing `enqueueTransactionalEmail` using a new `inquiry-reply` template. The email's reply-to is set to a configured admin address so the visitor's reply lands in the admin's normal mailbox (Phase 1 — no inbound parsing).

A small note under the composer explains: "Replies from the visitor will arrive in your email; paste them back here to keep the thread complete." (Inbound email parsing is a Phase 2 enhancement.)

## 5. Email templates (React Email)

- `inquiry-received.tsx` — confirmation to submitter.
- `inquiry-admin-notification.tsx` — to admin, with deep link to the inquiry.
- `inquiry-reply.tsx` — admin's reply, branded, with unsubscribe-safe footer.

All registered in `src/lib/email-templates/registry.ts`.

## 6. Where the form is surfaced

- Footer link: "Contact".
- A "Have questions?" section near the bottom of the landing page linking to `/contact`.
- Header nav (optional, secondary link).

## Out of scope (Phase 2, called out for the user)

- Parsing inbound email replies back into the thread automatically (requires inbound email/webhook routing).
- File attachments on inquiries.
- Internal admin-only notes on a thread (easy follow-up if wanted).

## Technical notes

- All server logic uses `createServerFn` (no edge functions).
- Admin notification recipient: pulled from `site_settings` key `admin_notification_email`, falling back to the first super_admin's email. I'll seed `site_settings` with this key.
- Reuses existing email queue infra — no new cron or queue work.
- Realtime not required for v1; admin inbox polls every 30s via React Query `refetchInterval`.

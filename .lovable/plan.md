## What the logs show

I checked the actual backend records, not inbox assumptions:

- The landing-page inquiry was created at `18:00:55 UTC`.
- Two app emails were queued for that inquiry.
- The email log shows both reached final status `sent` to `fastresults@gmail.com`:
  - `inquiry-admin-notification`
  - `inquiry-received`
- The sender domain `notify.startuplabs.online` is verified.
- `fastresults@gmail.com` is not on the suppression list.
- No queue-worker failure logs matched the send attempt.

So I do **not** see a backend enqueue/process failure. However, I do see two product issues that can make this feel broken and confusing:

1. The landing page still renders the shared site header/footer, so users see priced navigation and old CTAs while landing-only mode is on.
2. The current inquiry helper treats email as “fire-and-forget” and swallows email enqueue failures. That means the form can show success even if admin-notification enqueue ever fails.

## Build plan

### 1. Remove top navigation from landing-only mode

Update `src/components/landing/LandingFramework.tsx` so the standalone landing page no longer renders:

- `SiteHeader`
- `SiteFooter`

This makes landing-only mode exactly what you described: just the landing page, no confusing pricing nav, no services/register links, no shared paid-site CTA.

### 2. Keep admin/settings reachable through the gate

Keep the current `LandingOnlyGate` behavior from the last fix:

- `/` and normal public routes show the standalone landing page when landing-only mode is ON.
- `/admin/*`, `/login`, and `/reset-password` remain reachable so you can turn landing-only mode back off.

### 3. Make landing interest emails admin-first and explicit

Update the landing modal submission path so it does not rely on the generic “customer confirmation + admin notification” behavior as an ambiguous side effect.

For landing free-launch interest:

- Save the inquiry row as it does now.
- Send the admin notification to `fastresults@gmail.com` as the primary required email.
- Keep the applicant confirmation routed through the existing global super-admin override only if the app-wide email rule still requires every outgoing email to route to the super admin.
- If the required admin notification fails to enqueue, surface an inline modal error instead of showing success.

This keeps the form honest: success means the response was saved and the admin email was accepted into the mail pipeline.

### 4. Preserve the existing full-site forms

Do not change the contact form or other full-site inquiry forms except where they use the shared helper safely. The goal is to make the landing free-launch flow reliable without breaking the rest of the website.

## Verification

After implementation:

- Load `/` with landing-only mode ON as super admin.
- Confirm there is no top navigation and no footer from the full site.
- Confirm there are no visible `$297`, `$397`, “Reserve seat”, workshop nav, service nav, or dashboard/admin links on the landing page body.
- Submit the landing modal.
- Confirm:
  - inquiry row is created,
  - admin email log row exists for `fastresults@gmail.com`,
  - final status becomes `sent` or a visible error appears if enqueue fails.

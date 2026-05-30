## Problem

The "Get in touch" link in the cohort application confirmation email isn't taking recipients to the contact form. The template currently hardcodes `https://startuplabs.online/contact`, but the link still isn't landing on `/contact` in delivered emails.

Likely causes (in order of probability):
1. The email the user received was sent **before** the recent template change — the older version didn't link to `/contact` at all.
2. The hardcoded production URL doesn't match the environment the email was sent from (preview vs. published vs. custom domain), so clicks land on a stale or wrong host.
3. No regression test confirmed the rendered email actually points to `/contact`.

## Plan

1. **Centralize the site URL** in the email templates.
   - Read `SITE_URL` from `process.env.SITE_URL` (server-side, set at send time inside the `application-received` template render path) with a safe fallback to `https://startuplabs.online`.
   - Build `CONTACT_URL` as `${SITE_URL}/contact`.
   - Apply the same pattern to any other template that links back to the marketing site (`inquiry-received`, `inquiry-reply` if applicable) so all outbound links stay consistent.

2. **Verify the link renders correctly** by previewing the `application-received` template via the email preview route and confirming the anchor `href` is `https://startuplabs.online/contact` (or the configured SITE_URL).

3. **Confirm `/contact` is reachable** on the published custom domain (`https://startuplabs.online/contact`) and on the Lovable-hosted URLs. The route exists (`src/routes/contact.tsx`) and now renders `SiteHeader` + form + `SiteFooter`, so a fresh publish should make it live everywhere.

4. **Trigger a real test application** after publishing, receive the email, and click "Get in touch" end-to-end to confirm it opens the contact form.

## Files to touch

- `src/lib/email-templates/application-received.tsx` — replace hardcoded `CONTACT_URL` with env-driven value.
- `src/lib/email-templates/inquiry-received.tsx`, `src/lib/email-templates/inquiry-reply.tsx` — same treatment if they link to the site.

## Note about old emails

Emails already delivered cannot be changed. The fix only affects emails sent **after** the next publish. If you're testing, submit a fresh application after publish.

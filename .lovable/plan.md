# End-of-showcase "next step" modal

When a viewer reaches the bottom of a client preview link (`/v/:token`), a single cinematic modal appears once, inviting them to move from draft to build — with Adam's direct line.

## What the viewer sees

- A wide modal (max ~880px) built as a two-panel composition:
  - Full-bleed background image: a founder's startup team in a warm, natural-light workspace, shot editorial-style, with Adam standing at the right of frame. The left ~55% is intentionally open, low-contrast space so the message sits cleanly over it.
  - A soft gradient scrim over the copy zone so the text stays legible regardless of theme.
- Copy (lightly polished for grammar, meaning unchanged):
  > **Your foundation is drafted. Now build it.**
  >
  > With your foundation draft in place, the next step is to carefully review every section, polish the creative treatments, and begin constructing and operationalizing your startup. This is where you take a hard look at your internal resources and your go-to-market actions.
  >
  > Alternatively, you can retain Adam and his team as your backfield in motion.
  >
  > For an operational consultation, contact Adam Anderson at **929-234-7355**.
- A short "Request a consultation" form beneath the copy: **Name**, **Email**, **Phone** (optional), and a one-line **What do you need help with?** field. Submit sends the request straight to Adam.
- Actions: primary `Request consultation` (submits the form), secondary `Call 929-234-7355` (tel: link), and `Keep reviewing` (closes).
- On success the form swaps to a short confirmation ("Adam will be in touch — or call 929-234-7355 now") instead of closing abruptly. Errors show inline with a retry.
- Appears once per viewer per share (remembered in local storage keyed by share token), only after they actually reach the bottom — not on a timer.
- Mobile: the image collapses to a top band with the copy and form beneath, full-height sheet, safe-area padding, and thumb-reachable buttons above the existing bottom nav.

## Technical details

- New asset generated into `src/assets/` (landscape ~1920x1080, JPG): editorial team-in-workspace photograph with Adam at right, deliberate negative space at left.
- New component `src/components/share/ShareOutroDialog.tsx` — shadcn `Dialog` on desktop, `Sheet` (side="bottom") on mobile via the existing `useIsMobile` hook, matching the patterns already used in `v.$token.tsx`. Form uses the existing shadcn `Input`/`Textarea`/`Button` primitives with zod validation (trimmed, name ≤100, valid email ≤255, phone ≤32, message ≤1000).
- Trigger in `src/routes/v.$token.tsx`: an `IntersectionObserver` on a sentinel div rendered after the last `ShareSection` in the reading pane; fires when it's been visible and the viewer has scrolled past ~90% of the document. Guarded by `localStorage` key `sl-share-outro:<token>` so it never nags twice.
- Mobile reader path (`MobileReader`) uses the same sentinel at the end of the last section so behaviour matches.

### Email delivery (Resend connector)

- Link the **Resend** connector to this project so the edge function can send through the Lovable connector gateway.
- New public edge function `supabase/functions/share-consult-request/index.ts` (runs signed-out, since showcase viewers aren't authenticated):
  - Validates the body with zod and requires the share `token`; looks the share up to attach the venture name and share URL to the email so Adam knows which showcase it came from.
  - Sends via the gateway (`https://connector-gateway.lovable.dev/resend/emails`) with `Authorization: Bearer LOVABLE_API_KEY` and `X-Connection-Api-Key: RESEND_API_KEY`.
  - `from` uses the project's verified sending domain; `to` is Adam's inbox; `reply_to` is the requester's email so he can reply directly.
  - Surfaces the provider status/body on failure so the modal can show a real error; CORS headers on every response.
- Client call from `src/lib/venture-share.functions.ts` (new `requestConsultation` helper) using the same direct `FUNCTIONS_BASE` fetch pattern the other public share calls use.
- No schema changes; the request is emailed, not stored (say the word if you'd also like it logged to a table).


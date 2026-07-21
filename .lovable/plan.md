
# 1:1 Tuesday Sessions with Adam — Integration Plan

A new offer alongside the scheduled Foundation Workshops: private 2-hour builds with Adam at the IGNITE Center, Tuesdays 9:30 AM–4:30 PM, $397. Founders pick a Tuesday + a 2-hour block, pay, and the slot is blocked automatically so no one else can book it.

## Assumptions (flag anything to change)

- **Slot grid per Tuesday** (3 slots, buffer between):
  - 9:30–11:30 AM
  - 12:00–2:00 PM
  - 2:30–4:30 PM
- **Location**: IGNITE Center at Greater Atlanta Christian School (in-person only for v1; remote comes later).
- **Price**: $397, paid at booking. Non-refundable, reschedulable up to 48 hours before.
- **Capacity**: one founder (or founder + 1 partner) per slot.
- **Blackout dates**: Adam can block Tuesdays or specific slots from admin (vacations, cohort weeks).
- **Payments**: use the existing Lovable Cloud payments integration (same rail as workshop registration). If that's not wired for one-off checkout yet, we'll enable it as part of this build.
- **Voice**: keep the warm "pull up a chair" tone — never "consultation." Frame as "a private morning (or afternoon) with Adam."

---

## 1. Messaging & positioning

New offer name: **"A Tuesday with Adam"** (working title — swap easily).

Positioning line: *"Can't wait for the next cohort? Book a private Tuesday with Adam at IGNITE and walk out with your startup built by dinner."*

Where it shows up:

- **Home hero area** — small third option under the primary workshop CTA: "Or book a private Tuesday →"
- **AccessModeDialog** (`src/components/home/AccessModeDialog.tsx`) — add a 4th card *or* replace the current 3-card layout with a 2×2 that includes "A Tuesday with Adam." Recommend 2×2 so the new option gets equal weight.
- **`/build` page** — a section above the cohort dates: "Prefer 1:1? Book a private Tuesday."
- **`/services`** — add as a distinct offering tier.
- **Header CTA** — no change; primary stays the workshop.
- **AskConcierge (chatbot knowledge)** — teach it about the new option, price, times, and how to book.
- **Confirmation + reminder emails** — new templates for booking, 48h reminder, and post-session follow-up.

## 2. UX flow

```text
Home / AccessModeDialog / /services
   │
   ▼
/private-tuesday   (new marketing + booking page)
   │  – Explains what happens in the 2 hours
   │  – Shows Adam's next 4–8 available Tuesday slots
   │  – "Reserve this slot" → checkout
   ▼
Checkout ($397, Lovable payments)
   │
   ▼
Success page + email
   │  – Adds ICS attachment / Google Calendar link
   │  – Intake form link (business, goals, what to bring)
   ▼
Admin sees booking in /admin/private-sessions
```

Slot picker UI: a simple week-strip (next 6 Tuesdays), each showing the 3 slots with `Available` / `Booked` / `Blocked` states. No live calendar embed — we render from our own tables so blocking is instant and race-safe.

## 3. Data model (new tables)

All in `public`, with the standard `GRANT` + RLS pattern already used across this project.

- **`private_session_slots`**
  - `id uuid pk`
  - `session_date date` (must be a Tuesday — enforced by trigger)
  - `start_time time` (one of the three canonical starts)
  - `end_time time`
  - `status text` — `available` | `blocked` | `booked`
  - `blocked_reason text` (admin note)
  - `created_at`, `updated_at`
  - Unique on `(session_date, start_time)`
- **`private_session_bookings`**
  - `id uuid pk`
  - `slot_id uuid fk → private_session_slots(id)` **unique** (one booking per slot — DB-level guarantee against double-booking)
  - `user_id uuid nullable` (link if signed in)
  - `name`, `email`, `phone`
  - `business_idea text`, `stage text`, `notes text`
  - `amount_cents int`, `payment_status text` (`pending` | `paid` | `refunded`)
  - `payment_ref text` (checkout session id)
  - `status text` (`pending_payment` | `confirmed` | `cancelled` | `completed`)
  - `confirmed_at`, `cancelled_at`, `created_at`, `updated_at`
- **`private_session_settings`** (single-row config)
  - Default slot times, price cents, buffer, weeks-ahead visible, contact email.

RLS:
- `slots`: `SELECT` open to `anon` + `authenticated` (needed to render availability); write only via security-definer RPCs or admin.
- `bookings`: `INSERT` allowed for anyone (guest checkout); `SELECT` limited to owner (`user_id = auth.uid()` or matching email token) and admins; admins full access.
- Booking creation goes through an RPC `reserve_private_session_slot(slot_id, ...)` that atomically flips slot to `booked` and inserts the booking — mirrors the existing `reserve_cohort_seat` pattern.

Auto-generation: a cron (or on-read fallback) ensures the next N Tuesdays' slots exist as `available` rows.

## 4. Payments

- Reuse the existing Lovable payments integration.
- Flow: create booking as `pending_payment` + reserve slot with a short TTL (e.g. 15 min hold); redirect to checkout; webhook confirms → mark `paid` + `confirmed`; on timeout/cancel → release slot back to `available`.
- Edge functions: `create-private-session-checkout`, `private-session-webhook`, `release-expired-holds` (cron every 5 min).

## 5. Admin

New admin page **`/admin/private-sessions`**:
- Calendar-style list of upcoming Tuesdays with slot status.
- Block/unblock individual slots or whole days (vacation).
- View booking details, mark completed, refund/cancel, resend confirmation.
- Export upcoming week to Adam's calendar (ICS download + optional Google Calendar sync later).

Add to `AdminSidebar` under a new "Bookings" section (alongside cohort registrations).

## 6. Emails (transactional)

New templates (follow the existing scaffold pattern):
- `private-session-confirmation` — receipt + ICS + intake link + directions to IGNITE.
- `private-session-reminder-48h` — cron 48h before start.
- `private-session-reminder-24h` — cron 24h before.
- `private-session-followup` — day after, asks for testimonial + offers next step.
- `private-session-cancelled` / `-rescheduled` — as needed.
- Admin notification to Adam on every new booking.

## 7. Routes & files to add

- `src/routes/private-tuesday.tsx` — public marketing + booking page.
- `src/components/private-tuesday/SlotPicker.tsx` — week strip + slot cards.
- `src/components/private-tuesday/BookingForm.tsx` — details + checkout handoff.
- `src/lib/private-sessions.functions.ts` — client data helpers (list slots, reserve, fetch booking).
- `src/routes/_authenticated/_admin/admin.private-sessions.tsx` — admin manager.
- `supabase/functions/create-private-session-checkout/index.ts`
- `supabase/functions/private-session-webhook/index.ts`
- `supabase/functions/release-expired-private-session-holds/index.ts`
- Migrations for the three tables + RPCs + cron jobs.

## 8. Edits to existing files (marketing surface)

- `src/components/home/AccessModeDialog.tsx` — add "A Tuesday with Adam" card.
- `src/components/home/HomeFramework.tsx` — small secondary CTA under primary reserve button.
- `src/routes/build.tsx` — "Prefer 1:1?" panel linking to `/private-tuesday`.
- `src/routes/services.tsx` — new tier row.
- `src/lib/chatbot-knowledge.ts` — teach AskConcierge the new offer.
- Footer link under "Ways to work with us."

## 9. Phased rollout

1. **Phase 1 — Data + admin (silent):** tables, RPCs, cron, admin page. Adam can seed/block slots.
2. **Phase 2 — Public booking page + payments:** `/private-tuesday`, checkout, confirmation email, ICS.
3. **Phase 3 — Marketing surface:** home dialog, `/build`, `/services`, footer, chatbot knowledge.
4. **Phase 4 — Reminders + follow-up + testimonial capture.**

## 10. Open questions before I build

1. Slot grid — do you want the 3-slot layout above (9:30/12:00/2:30), or a different cadence (e.g. 4 back-to-back 9:30/11:30/1:30/3:30 with 15-min buffers only)?
2. Reschedule / refund policy — 48h cutoff OK, or stricter/looser?
3. Public offer name — keep working title **"A Tuesday with Adam"**, or something else (e.g. "Private Tuesday Build," "One-on-One Tuesday")?
4. Should remote/Zoom variant ship in v1, or stay in-person only until we prove the format?

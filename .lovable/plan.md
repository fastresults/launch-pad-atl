## Problem

When someone reserves a Tuesday slot on `/private-tuesday`, the slot only stays blocked for a short 15-minute hold. If they don't complete payment in that window, `get_upcoming_private_session_slots()` flips it back to `available` and the public booking page hides `booked` slots entirely rather than showing them grayed out. There's also no admin action to confirm/release a specific reservation once it's held.

Result: reservations disappear, times reopen automatically, and admins can't lock a Tuesday from the reservation side.

## Goal

Once someone reserves a Tuesday slot, it stays visibly grayed out on the public page — permanently — unless an admin explicitly releases it. Admin gets clear controls to confirm, release, or cancel each reservation.

## Changes

### 1. Reservations persist (no auto-expire)

- `reserve_private_session_slot` RPC: stop setting `hold_expires_at`. Once a booking row is created the slot goes to `booked` and stays there.
- `get_upcoming_private_session_slots`: remove the "flip expired holds back to available" branch. Booked = booked.
- Existing rows with a stale `hold_expires_at` in the past get cleared in the same migration (leaving their current status alone).

### 2. Public page shows booked slots as grayed out (not hidden)

`src/routes/private-tuesday.tsx`:
- Remove the `if (s.status !== "available") continue;` filter so every slot in the day renders.
- Render `booked` and `blocked` slots as disabled chips with a muted background, strikethrough time, and a "Reserved" / "Unavailable" label. Non-clickable.
- `available` chips keep their current behavior.

### 3. Admin controls for reservations

`src/routes/_authenticated/_admin/admin.private-sessions.tsx` and `src/lib/private-sessions.functions.ts`:
- Bookings table gains per-row actions: **Confirm paid**, **Release slot** (frees the Tuesday back to available and cancels the booking), **Mark no-show**.
- Slot chips continue to support **Block / Open** for admin-initiated blocks, and now also show which booking (name + email) owns any `booked` slot with a "Release" shortcut.
- Add two new SECURITY DEFINER RPCs, admin-only:
  - `admin_release_private_session_booking(_booking_id uuid)` — cancels the booking and sets the slot back to `available`.
  - `admin_confirm_private_session_booking(_booking_id uuid, _payment_ref text)` — thin wrapper around the existing `confirm_private_session_booking` gated by `is_admin()` so admins can confirm offline payments.

### 4. Cleanup

- Drop the never-fires background job that would have expired holds (if any cron entry exists for it).
- Update copy on `/private-tuesday` empty state to say "That Tuesday is fully reserved" when a date has zero available slots but still has booked ones, instead of omitting the date.

## Out of scope

- Payment integration changes. The reservation still creates a `pending_payment` booking; only its lifecycle changes (no auto-release).
- Rescheduling flow. Admin release + user re-books is the path for now.

## Technical notes

- Migration order: (1) `CREATE OR REPLACE FUNCTION` for `reserve_private_session_slot` and `get_upcoming_private_session_slots`; (2) `CREATE OR REPLACE FUNCTION` for the two new admin RPCs; (3) `UPDATE private_session_slots SET hold_expires_at = NULL WHERE hold_expires_at IS NOT NULL;`. No table schema changes, no new GRANTs needed.
- Admin RPCs guard with `IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;`.
- Public page continues to call `listUpcomingPrivateSessionSlots()` — no client-side auth changes.

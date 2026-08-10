# Friendly "AI capacity" notice when token limits block a process

Today, when an AI process hits an out-of-credits or rate-limit wall, the user gets a red toast with technical wording ("AI credits are exhausted for this workspace"), and the wording differs per screen. There is no way for the user to tell us about it, and no record on our side.

This adds one branded, friendly interruption used everywhere, plus a one-click "Send notice" that reaches the team.

## What the user sees

When any AI action fails because of capacity (credits exhausted, workspace credit cap, or rate limit), a centered modal appears:

- StartupLabs logo at the top (existing `StartupLabsLogo` component).
- Headline: "This step needs more AI capacity"
- Body: friendly, non-technical — the process paused because additional AI tokens are required to finish it. Sending a notice alerts the team; issues like this are typically resolved by the next business day.
- Optional one-line note field ("Anything we should know?"), prefilled with which asset/step was blocked.
- Buttons: **Send notice** (primary) and **Not now**. After sending: a calm confirmation state ("Notice sent — we'll have this resolved by the next business day") with a **Try again** button that re-runs the original action when the caller provided one.
- If a notice for the same venture was already sent in the last 24h, the modal opens straight to the confirmation state ("You already sent a notice") instead of allowing duplicates.

Rate-limit (429) variant uses the same shell with softer copy ("We're briefly at capacity — try again in a minute") and no notice form.

## Where it fires

A single provider + hook so no screen has to reimplement it:

- `AiCapacityProvider` mounted once in `src/App.tsx`, exposing `useAiCapacityNotice()`.
- `src/lib/edge-errors.ts` gains `isCapacityError(err)` (detects `PAYMENT_REQUIRED`, `AI_CREDIT_LIMIT_REACHED`, HTTP 402, 403 + `credit_limit_reached`, 429).
- `toastEdgeError` is upgraded: if the error is a capacity error it opens the modal instead of showing a toast. Because nearly every AI screen already routes failures through `toastEdgeError`, this covers most of the app with no per-screen work.
- Screens that hand-roll their own 402 branch get switched to the shared path: `dashboard/deliverables.tsx`, `admin.social.setup.intake.tsx`, `admin.social.setup.creative.$assetType.tsx`, `admin.social.setup.$platform.tsx`, `admin.social.accounts.tsx`.
- Long-running background jobs (bulk generate, pipeline runs) that record a failed step with a capacity code surface the same modal when the UI polls and sees that code.

## Sending the notice

- New table `ai_capacity_notices`: user_id, venture/snapshot id (nullable), context label (e.g. "Website PRD", "Campaign week 4"), error code, user note, status (`open` / `resolved`), timestamps. RLS: users insert/select their own rows; admins select/update all. GRANTs for `authenticated` and `service_role`.
- New edge function `ai-capacity-notice`: validates the caller, rate-limits to one notice per user per 24h, inserts the row, and sends an internal alert email through the existing transactional email pipeline so the team sees it immediately.
- Admin visibility: a "AI capacity notices" list in the admin area with open/resolved toggle, so the team can clear them.

## Technical notes

- New: `src/components/system/AiCapacityDialog.tsx`, `src/components/system/AiCapacityProvider.tsx`, `src/lib/ai-capacity.ts` (error classification + notice client), `supabase/functions/ai-capacity-notice/index.ts`, one migration.
- Modified: `src/lib/edge-errors.ts`, `src/App.tsx`, the five screens listed above, admin nav + a new admin route.
- Modal uses the existing shadcn `dialog` and design tokens (no hardcoded colors), and is theme-safe in light and dark.
- Retry support is opt-in: callers can pass `{ retry: () => ... }` to `toastEdgeError`; without it the modal simply omits the Try again button.
- Copy avoids "tokens"/"credits" as user-facing jargon and never exposes internal billing details.

# Friendly "AI capacity" notice when token limits block a process

Today, when an AI process hits an out-of-credits or rate-limit wall, the user gets a red toast with technical wording ("AI credits are exhausted for this workspace"), and the wording differs per screen. There is no way for the user to tell us about it, and no record on our side.

This adds one branded, friendly interruption used everywhere, plus a one-click "Send notice" that reaches the team.

## What the user sees

When any AI action fails because of capacity (credits exhausted, workspace credit cap, or rate limit), a centered modal appears:

- StartupLabs logo at the top (existing `StartupLabsLogo` component).
- Headline: "This step needs more AI capacity"
- Body: friendly, non-technical — the process paused because additional AI tokens are required to finish it. Sending a notice alerts the team; issues like this are typically resolved by the next business day.
- **Which provider is at its limit** — a labeled row listing the affected AI provider(s) (OpenAI, Google, Anthropic, xAI, Perplexity, or "Lovable AI capacity" when the block is workspace-level rather than provider-level), each as a small chip with the provider name and the blocked capability ("image generation", "writing", "research"). If more than one is affected, all are listed.
- Optional one-line note field ("Anything we should know?"), prefilled with which asset/step was blocked.
- Buttons: **Send notice** (primary) and **Not now**. After sending: a calm confirmation state ("Notice sent — we'll have this resolved by the next business day") with a **Try again** button that re-runs the original action when the caller provided one.
- If a notice for the same venture was already sent in the last 24h, the modal opens straight to the confirmation state ("You already sent a notice") instead of allowing duplicates.

Rate-limit (429) variant uses the same shell with softer copy ("We're briefly at capacity — try again in a minute") and no notice form.

## Naming the provider that hit the limit

Provider attribution has to come from the server — the browser only sees a status code today, so the edge functions must say who blocked them.

- Shared helper `supabase/functions/_shared/capacity-error.ts` maps a failed AI call to `{ provider, providerLabel, capability, code }`. Provider is derived from the model id's vendor prefix (`openai/*` → OpenAI, `google/*` → Google, `anthropic/*` → Anthropic, `x-ai/*` → xAI) for gateway calls, and set explicitly for any direct third-party call (e.g. Perplexity in research/scrape paths). A workspace-level credit cap (`AI_CREDIT_LIMIT_REACHED`, no upstream provider) reports `provider: "lovable"` with the label "Lovable AI capacity".
- Every function that currently returns `PAYMENT_REQUIRED` / `AI_CREDIT_LIMIT_REACHED` / 429 (`venture-social-cover`, `venture-style-preview`, `venture-content-ad`, `venture-generate-document`, `venture-generate-roadmap`, `venture-post-caption`, `venture-parse-content-calendar`, `venture-hero-sweep`, `venture-synthesize-concept`, `venture-bulk-generate`, `workshop-hero-image-generate`, and the rest) returns those fields in the error body instead of a bare code.
- Bulk/multi-step runs can hit more than one provider in a single job, so the error body carries a `providers: [...]` array; the modal renders one chip per entry.
- The client parses these fields in `src/lib/ai-capacity.ts`. When a function has not yet been updated, or the body carries no provider, the modal falls back to "AI capacity" with no chip rather than guessing a vendor.
- The provider list is stored on the notice row and included in the internal alert email, so the team sees exactly which provider needs topping up.


## Where it fires

A single provider + hook so no screen has to reimplement it:

- `AiCapacityProvider` mounted once in `src/App.tsx`, exposing `useAiCapacityNotice()`.
- `src/lib/edge-errors.ts` gains `isCapacityError(err)` (detects `PAYMENT_REQUIRED`, `AI_CREDIT_LIMIT_REACHED`, HTTP 402, 403 + `credit_limit_reached`, 429).
- `toastEdgeError` is upgraded: if the error is a capacity error it opens the modal instead of showing a toast. Because nearly every AI screen already routes failures through `toastEdgeError`, this covers most of the app with no per-screen work.
- Screens that hand-roll their own 402 branch get switched to the shared path: `dashboard/deliverables.tsx`, `admin.social.setup.intake.tsx`, `admin.social.setup.creative.$assetType.tsx`, `admin.social.setup.$platform.tsx`, `admin.social.accounts.tsx`.
- Long-running background jobs (bulk generate, pipeline runs) that record a failed step with a capacity code surface the same modal when the UI polls and sees that code.

## Sending the notice

- New table `ai_capacity_notices`: user_id, venture/snapshot id (nullable), context label (e.g. "Website PRD", "Campaign week 4"), error code, `providers` (text array), user note, status (`open` / `resolved`), timestamps. RLS: users insert/select their own rows; admins select/update all. GRANTs for `authenticated` and `service_role`.
- New edge function `ai-capacity-notice`: validates the caller, rate-limits to one notice per user per 24h, inserts the row, and sends an internal alert email through the existing transactional email pipeline so the team sees it immediately. The email subject names the provider(s), e.g. "AI capacity — OpenAI, Google".
- Admin visibility: a "AI capacity notices" list in the admin area with open/resolved toggle and a provider column, so the team can see at a glance which provider needs topping up.

## Technical notes

- New: `src/components/system/AiCapacityDialog.tsx`, `src/components/system/AiCapacityProvider.tsx`, `src/lib/ai-capacity.ts` (error classification, provider parsing + notice client), `supabase/functions/_shared/capacity-error.ts`, `supabase/functions/ai-capacity-notice/index.ts`, one migration.
- Modified: `src/lib/edge-errors.ts`, `src/App.tsx`, the five screens listed above, the AI edge functions listed under provider attribution, admin nav + a new admin route.
- Modal uses the existing shadcn `dialog` and design tokens (no hardcoded colors), and is theme-safe in light and dark.
- Retry support is opt-in: callers can pass `{ retry: () => ... }` to `toastEdgeError`; without it the modal simply omits the Try again button.
- Copy avoids "tokens"/"credits" as user-facing jargon and never exposes internal billing details.

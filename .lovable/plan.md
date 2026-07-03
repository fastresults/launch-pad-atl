## Goal

Establish a global rule: **no native `window.confirm`, `window.alert`, or `window.prompt`** anywhere in the app. All confirmations, alerts, and prompts use in-app shadcn modals (`AlertDialog` / `Dialog`) so they're themed, accessible, and consistent — no more OS-chrome popups like the one on `/dashboard/brain`.

## Approach

1. **Add a reusable confirm helper** — `src/components/ui/confirm-dialog.tsx` exposing:
   - `<ConfirmDialog>` component (controlled), and
   - `useConfirm()` hook returning an async `confirm({ title, description, confirmText, cancelText, destructive })` that resolves to `boolean`.
   
   Backed by shadcn `AlertDialog`, mounted once via a provider in `src/App.tsx`. This lets us replace `if (window.confirm(...))` call sites with `if (await confirm({...}))` — minimal diff, same control flow.

2. **Add a reusable prompt helper** — same file, `usePrompt()` returning async `prompt({ title, description, label, placeholder, defaultValue, confirmText })` resolving to `string | null`. Backed by shadcn `Dialog` with an `Input`. Replaces the one `window.prompt` in `brain.tsx` (add-note).

3. **Replace every call site** found in the audit:

   Confirms (17):
   - `src/routes/_authenticated/dashboard/brain.tsx` (2: reset brain, clear chat)
   - `src/routes/_authenticated/dashboard/index.tsx` (1: `alert()` → toast, since it's informational, not confirm)
   - `src/routes/unsubscribe.tsx` (local `confirm()` function — leave, it's not the browser API; just verify)
   - `src/components/hub/social/SocialAutopilot.tsx` (2)
   - `src/components/hub/social/AssetPreviewDialog.tsx` (1)
   - `src/components/hub/ContentStudio.tsx` (2)
   - `src/components/hub/BrandStudio.tsx` (1)
   - `src/components/media/MediaHub.tsx` (1)
   - `src/routes/_authenticated/_admin/admin.social.accounts.tsx` (1)
   - `src/routes/_authenticated/_admin/admin.social.tsx` (1)
   - `src/routes/_authenticated/_admin/admin.social.posts.tsx` (1)
   - `src/routes/_authenticated/_admin/admin.social.setup.creative.$assetType.tsx` (1)
   - `src/routes/_authenticated/_admin/admin.testimonials.tsx` (1)
   - `src/routes/_authenticated/_admin/admin.cohorts.tsx` (1)
   - `src/routes/_authenticated/_admin/admin.decks.$slug.tsx` (1)

   Prompt (1):
   - `src/routes/_authenticated/dashboard/brain.tsx` (add note)

   Alert (1):
   - `src/routes/_authenticated/dashboard/index.tsx` "Instructor notified" → replace with `toast.success()` (already using sonner elsewhere).

4. **Lint guard** — add an ESLint rule `no-restricted-globals` (or `no-alert`) to eslint.config.js so future `alert`/`confirm`/`prompt` usage fails the build, enforcing the global rule.

## Technical details

- Provider pattern: `<ConfirmProvider>` renders a single `AlertDialog` and exposes an imperative `confirm()` via context; hook subscribes and returns a promise that resolves on OK/Cancel.
- Destructive variant styles the confirm button with `bg-destructive`.
- Prompt helper uses `Dialog` + `Input` + Enter-to-submit, Esc-to-cancel.
- All call sites become `async` where needed; most already are inside async mutation handlers.

## Out of scope

- Redesigning any existing in-app `AlertDialog` flows (e.g., archive/delete on hub cards) — they already comply.
- Toast/notification changes beyond the one `alert()` conversion in dashboard index.

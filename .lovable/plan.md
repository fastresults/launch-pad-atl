# Kill native browser dialogs

## Problem

`window.confirm` / `window.prompt` render as ugly system modals showing the raw `*.lovableproject.com` origin (see screenshot). They also break in embedded previews and ignore our theme. Five call sites today:

- `src/routes/_authenticated/_admin/admin.members.tsx`
  - Pause access — confirm + reason prompt
  - Reject — reason prompt
- `src/components/media/MediaHub.tsx`
  - New folder — name prompt
  - New collection — name prompt

## Plan

### 1. New reusable dialog: `ConfirmDialog`

`src/components/ui/confirm-dialog.tsx` — built on existing shadcn `AlertDialog`. Controlled `open` + `onOpenChange`. Props: `title`, `description`, `confirmLabel` (default "Confirm"), `cancelLabel` ("Cancel"), `variant` ("default" | "destructive"), optional `reasonLabel` + `reasonPlaceholder` (when set, renders a `Textarea` and passes the value to `onConfirm(reason)`), `loading` state to disable buttons while the mutation runs. One component covers both pure confirm and confirm+reason flows.

### 2. New reusable dialog: `PromptDialog`

Same file. Single text input (e.g. folder name). Props: `title`, `description?`, `inputLabel`, `placeholder`, `confirmLabel`, `required` (disables confirm when empty), `defaultValue?`. Calls `onConfirm(value)`.

Both dialogs auto-focus the input on open, submit on Enter, close on Cancel/Escape, and use theme tokens (no hardcoded colors). Destructive variant uses `bg-destructive`.

### 3. Wire into `admin.members.tsx`

Replace the three `window.*` calls. Add local state for which dialog is open + the target member row. Three dialog instances rendered once at the bottom of the page:

- **Pause access** — `ConfirmDialog` destructive, title "Pause {name}'s access?", description explains they'll see the paused-account screen until reinstated, with reason textarea (optional). Confirm → `pauseMember.mutate({ userId, reason })`.
- **Reject** — `ConfirmDialog` destructive, reason textarea (optional), confirm → `rejectMember.mutate(...)`.
- (Approve / Reinstate / Move-to-pending stay as direct mutations — no confirm needed; they're reversible.)

Show toast on success/error (already wired via existing `toast` import). Disable buttons while `isPending`.

### 4. Wire into `MediaHub.tsx`

Two `PromptDialog` instances for "New folder" and "New collection". State holds `{ kind: 'folder' | 'collection' | null }`. Required input, min length 1, max 80. Submit triggers existing create mutations.

### 5. Lint guard (optional, low-effort)

Add an ESLint rule note in `eslint.config.js` — `no-restricted-globals` for `confirm`, `prompt`, `alert` — so future regressions fail the build. Skip if it conflicts with existing config.

## Files

- new: `src/components/ui/confirm-dialog.tsx` (exports `ConfirmDialog` + `PromptDialog`)
- edit: `src/routes/_authenticated/_admin/admin.members.tsx`
- edit: `src/components/media/MediaHub.tsx`
- edit (optional): `eslint.config.js`

No server, schema, or auth changes.

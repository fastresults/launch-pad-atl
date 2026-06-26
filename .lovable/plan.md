# Guided category generation + password-gated "Generate all"

## Goal

Replace the single "Start writing" CTA with two activation paths on the snapshot hub:

1. **Default — guided, category by category.** Foundation first, then Strategy, Operations, Marketing, etc. The hero shows one prominent button per category that writes only that category's documents.
2. **Power — "Generate all 34"** behind a per-user unlock code. The code is set by super admin (one global default + an override per user) and unlocks bulk generation for that founder.

## UX

### Snapshot hero card
- Title: "Let's build your startup kit, one section at a time."
- Primary CTA: **"Generate Foundation (X docs)"** — the next incomplete category in canonical order (Foundation → Strategy → Operations → Marketing → Brand → Launch → …, matching the existing `category` order in `deliverable_types`).
- When a category finishes, the CTA advances to the next incomplete category. A small stepper row shows all categories with check / in-progress / locked states so the founder knows where they are.
- Secondary CTA: **"Generate all 34"** (ghost). Click opens an unlock dialog.

### Per-category sections
- Each category block gets its own header-level **"Generate this section"** button (so the founder can jump ahead or re-run a single category) in addition to per-doc Generate buttons that already exist.
- While a category run is active, that category's button shows progress (`3 of 5 in Foundation`) and other category buttons disable.

### "Generate all" unlock dialog
- Explains: "This writes all 34 documents in one go and uses significant credits. Enter your unlock code to continue."
- Single password input + Unlock button.
- On success: sets a session flag and runs the existing bulk path; remembers unlock for this snapshot so the user isn't re-prompted.
- On failure: inline error "That code didn't match. Contact your facilitator."

### Super admin settings (`/admin/settings`)
- New "Bulk generation unlock" section:
  - Global default code (single input).
  - Per-user override table: search a member, set/clear their personal code, "Reset to default", "Revoke" (forces re-prompt next time).
- Codes are stored hashed; admin UI only shows "Set" / "Not set" plus a "Reveal once" action after a fresh save.

## Technical notes

### Data
- New table `bulk_unlock_codes` (one row per user; `user_id`, `code_hash`, `code_salt`, `set_by`, `revoked_at`).
- New row in `site_settings`: `bulk_unlock_default_hash` + salt.
- New table `bulk_unlock_grants` (`user_id`, `snapshot_id`, `granted_at`) — records that this user already unlocked bulk for this snapshot so we skip re-prompting (cleared when admin revokes).

### Edge functions
- `venture-bulk-generate` accepts an optional `category` filter; when present it only enqueues `deliverable_types` whose `category` matches (respecting existing dependency layers within that category). No `category` ⇒ existing all-34 behavior, but the function now also requires either (a) an active `bulk_unlock_grants` row for this `(user, snapshot)` or (b) a `unlockCode` arg it verifies against the user's override or the global default before granting + running.
- New `bulk-unlock-verify` function: takes `{ snapshotId, code }`, verifies against per-user hash → falls back to global default hash, writes a `bulk_unlock_grants` row on success, returns `{ ok }`.
- New admin-only `bulk-unlock-admin` function: set/clear global default, set/clear per-user override, revoke grants. Authorized via `has_role(auth.uid(), 'admin')`.

### Client
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`:
  - Compute next incomplete category from `categories` memo + `completedKeys`.
  - Replace single hero primary with category-scoped primary + "Generate all" secondary.
  - Add `BulkUnlockDialog` component (`src/components/hub/BulkUnlockDialog.tsx`).
  - Pass `category` arg through `bulkGenerate` mutation; add `generateCategory(snapshotId, category)` wrapper in `foundersHub.functions.ts`.
  - Per-category header gets its own Generate button wired to the same path.
- `src/routes/_authenticated/_admin/admin.settings.tsx`: add "Bulk generation unlock" panel (global default + per-user table).

### Behavior details
- Codes hashed with `crypt(code, gen_salt('bf'))` (pgcrypto) so verification stays server-side.
- If no global default and no override is set, the "Generate all" button is hidden and the hero copy explains: "Ask your facilitator for an unlock code to generate everything at once."
- Founders who already finished a category see the stepper tick and the hero advances; if all categories are complete, hero shows the existing "Your startup kit is ready" state unchanged.
- Existing per-document Generate buttons remain untouched.

## Out of scope
- No changes to per-document content, prompts, deep assessment, or roadmap.
- No change to admin "Run for user" pipeline tools.

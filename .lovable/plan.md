## Add "Reset profile" button next to "Refresh from my brief"

### UI change (`src/routes/_authenticated/dashboard/profile.tsx`)
- Add a secondary `Button` (outline, with `RotateCcw` icon) labeled **"Reset profile"** placed to the left of the existing "Refresh from my brief" button in the header.
- Helper caption beneath: "Clears every field so you can start fresh."
- Clicking opens a shadcn `AlertDialog` confirming: *"This will blank out every field in your Profile & Intake. You can refresh from your brief anytime to rebuild it. Continue?"* with Cancel / Reset profile actions.

### Behavior
- On confirm, call `upsertMyProfile` with all founder/business/financial fields set to `null` plus `intake_completed_at: null`.
- Locally reset the three `useState` objects (`founder`, `business`, `financial`) to empty strings so the UI clears immediately.
- Invalidate the `["my","profile"]` query and toast "Profile reset — fields are blank."
- Also set `autoSyncTried = true` (already true after mount) to prevent the auto-sync effect from refilling fields right after reset.

### Scope
- Frontend-only. No DB migration, no schema change, no edge function. Existing `upsertMyProfile` already accepts arbitrary partial updates.

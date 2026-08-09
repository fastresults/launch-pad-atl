# Why "Regenerate website PRD" is greyed out

## What I verified

Your venture's brand kit is complete. The database row for this venture has:

- a palette and typography (both saved)
- one logo, saved from Logo Studio at 15:52 today, already flagged `primary: true`,
  with a durable `public_url` and horizontal / knockout lockups

So the brand *is* ready. The problem is entirely in the wizard's screen state.

## The cause

In the Brand Wizard's logo step, the list of logos is a local React state seeded **once**
when the step first mounts:

- The step opens before (or without) the saved mark in view, so the list starts empty.
- Logo Studio commits the mark and refreshes the brand-kit query — but nothing copies the
  refreshed kit back into that local list. It stays empty.
- The PRD button is disabled by "no selected mark", so it greys out even though the mark
  is saved and primary.
- A second effect overwrites the list with the current logo *run's* concept assets, which
  carry no `primary` flag — so even when the list is populated it can shadow the real
  committed mark.

That is also why the committed mark does not appear as the "Selected mark" chip in the
wizard, and why the Live Brand slot looks out of step with what Logo Studio just saved.

## The fix

1. **Keep the logo list in sync with the saved kit.** Derive the displayed logos from the
   brand-kit query rather than a one-time state snapshot, so a commit in Logo Studio (which
   already invalidates that query) immediately shows up in the wizard.
2. **Stop run concepts from replacing the committed mark.** Show in-progress run concepts
   as concepts; only a committed/uploaded kit logo counts as the selected mark. The
   `primary` flag wins, with the newest kit logo as fallback.
3. **Refresh on commit.** After Logo Studio's commit, the wizard re-reads the kit and
   updates the Selected-mark chip, the Live Brand preview slot, and the PRD button state
   without needing the modal to be closed and reopened.
4. **Never a silent grey button.** When it genuinely cannot run, the inline reason stays
   ("Save a mark from Logo Studio first" / "Choose your palette and typography first"),
   but a saved primary mark now clears it.

## Technical notes

- `src/components/hub/brand-wizard/BrandWizard.tsx` (`StepMoodboard`):
  - replace `useState(kit?.logos ?? [])` with a value derived from `kit.logos`, keeping a
    local override only for optimistic updates after upload/select.
  - scope the `runDirections` effect to a separate `concepts` list; do not let it write
    over kit logos.
  - `selectedLogo` = `kitLogos.find(l => l.primary) ?? kitLogos[0]`.
- No schema or edge-function change needed — the data is already correct in the brand kit.

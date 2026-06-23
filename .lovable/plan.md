# Site settings — one global hero switch

## What changes

Replace the two side-by-side cards with **one global control** that flips the hero variant for both the homepage (`/`) and the registration page (`/register`) at the same time. One source of truth, one switch, no ambiguity about what is live.

## How it works

- A single "Live hero variant" panel on `/admin/site` with two options: **Original** (paid cohorts) and **Selection — Free Cohort**.
- Picking an option writes BOTH `home_variant` and `register_variant` to the same value in one go (sequential calls inside one handler; if the second fails we roll the first back to its prior value so the two never disagree).
- A single "Active" badge at the top of the panel reflects the current live variant. Exactly one option can be selected.
- A confirm step appears before the switch ("Switch live hero to Selection — Free Cohort? This updates the homepage and /register immediately."); skipped when the user clicks the already-active option.
- Two small "Preview" links underneath — one for `/`, one for `/register` — so the admin can spot-check both pages after the change.
- Footer shows the most recent of the two `updated_at` timestamps as relative time.
- If the two DB rows are ever out of sync (legacy state), show a small inline notice: *"Homepage and registration are currently set to different variants. Pick one to sync them."* — no option appears pre-selected in that case.

## Error + feedback

- Sonner toast on success: *"Live hero set to Original"*.
- Destructive `Alert` on failure with the friendly RLS message already wired up.

## Files touched

- `src/routes/_authenticated/_admin/admin.site.tsx` — collapse the two `VariantCard`s into one `GlobalVariantPanel`; new handler that writes both keys; out-of-sync detection from the existing `data.home_variant` / `data.register_variant`.

No DB schema changes, no new settings keys, no edits to the public homepage or registration page. The two underlying settings stay so any future need to split them again is one-line.

## Out of scope

- Renaming the variants, editing hero copy, or changing what each variant renders.
- Removing the `register_variant` row from the DB.
- Any other admin page.

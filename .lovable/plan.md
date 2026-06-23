# Switch homepage hero to the "Original" variant

## What's happening today
The homepage (`/`) is driven by the `home_variant` row in the `site_settings` table. It is currently set to `selection`, which renders the inaugural-Atlanta free-cohort hero. The other option, `original`, renders the paid-monthly-cohorts hero with seat tiers and the cohort picker.

This switch is already exposed in the admin at `/admin/site` (the "Homepage (/)" card on `admin.site.tsx`) and writes through `updateSiteSetting` in `src/lib/site-settings.functions.ts`. No code change is needed — only a data change.

## Plan
1. Update the `home_variant` row in `site_settings` from `selection` → `original` (and bump `updated_at`).
2. Leave `register_variant` untouched (it is already `original`).
3. Verify by reloading `/` in the preview — the paid-cohort hero with `PricingTiers` / `CohortPicker` should render instead of the free-cohort selection hero.

## Out of scope
- No edits to `HomeSelection.tsx`, the original home component, or the admin toggle UI.
- No changes to the registration page variant.
- No copy edits inside either hero — only the variant flag flips.

## Follow-up option
If you'd rather flip it yourself (and confirm it looks right before committing to it), you can just open **Admin → Site settings → Homepage (/)** and click **Original**. Let me know which you prefer; otherwise I'll flip it via a data update on approval.

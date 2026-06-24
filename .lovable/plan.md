## Goal

Give admins a clear on/off switch for the homepage video-testimonial slider.

## Current state

The capability already exists but is buried:

- `TestimonialSliderSettings.enabled` is persisted in `site_settings` (key `testimonial_slider`).
- `src/components/home/VideoTestimonials.tsx` already returns `null` when `settings.enabled` is false, so the slider hides correctly when toggled off.
- `src/routes/_authenticated/_admin/admin.testimonials.tsx` already renders a `Switch` labeled "Show section on homepage" inside the Settings card — but it only saves when the admin clicks the "Save settings" button at the bottom of the form, which makes it feel like a buried form field rather than a real toggle.

So this is a UX upgrade, not new functionality.

## Plan

Edit only `src/routes/_authenticated/_admin/admin.testimonials.tsx`:

1. **Promote the on/off toggle out of the settings form** into its own prominent card at the top of the page (above "Slider settings"), titled something like **"Homepage slider"** with helper text "Show or hide the video testimonial slider on the public homepage."
2. **Make it save instantly** on toggle (call `saveSettings.mutate({ enabled: v })` directly in `onCheckedChange`) instead of requiring the Save button. Show a subtle "Saving…" / "On" / "Off" state next to the switch.
3. **Remove the duplicate `enabled` row** from the inner `SettingsForm` so there's a single source of truth.
4. Keep all other settings (heading, subheading, scroll speed, direction, show on mobile) in the existing Settings form behind the Save button — unchanged.

No DB changes, no changes to `VideoTestimonials.tsx`, no changes to `testimonials.functions.ts`.

## Acceptance

- Admin opens `/admin/testimonials` and sees a dedicated **Homepage slider: On/Off** switch at the top.
- Flipping it immediately hides/shows the slider on `/` (after the homepage query refetches — already handled by the existing `invalidateQueries(["testimonial_settings"])` in the save mutation).
- The rest of the settings form still works exactly as it does today.

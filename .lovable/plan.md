## Problem

`SiteHeader` hardcodes the top-right CTA as "Reserve seat — from $679" (desktop) and "Reserve" (mobile). When the admin switches the site to the **Selection — Free Cohort** variant via `/admin/site`, that price contradicts the free messaging.

## Fix

Make the header CTA aware of the current `home_variant` site setting and swap its label when the site is in free-cohort mode.

### Changes

1. **`src/components/site/Header.tsx`**
   - Fetch site settings using the existing `getPublicSiteSettings` server fn via `useServerFn` + `useQuery` (queryKey `["site-settings"]`, matching `admin.site.tsx` so cache is shared).
   - Derive `isFreeCohort = data?.home_variant === "selection"`.
   - Desktop CTA label: `isFreeCohort ? "Apply — free cohort" : "Reserve seat — from $679"`.
   - Mobile compact CTA label: `isFreeCohort ? "Apply" : "Reserve"`.
   - Mobile sheet full CTA label: `isFreeCohort ? "Apply — free cohort" : "Reserve seat — from $679"`.
   - While loading / on error, default to the paid label (safe fallback — current behavior).
   - Link `to="/register"` stays the same; only the label changes.

### Out of scope

- No change to `/register` page content, pricing data, or `register_variant` logic.
- No change to the gradient pill styling.
- Admin toggle UI is unchanged — this just consumes the existing setting.

## Goal

Produce a single markdown document at `/mnt/documents/landing-variants-spec.md` that another Lovable app can follow to implement the same two-variant system for `/` (Home) and `/register` — toggled from a Super Admin page — without reading this project's source.

## What the doc will cover

**1. Concept**
- Two public routes (`/` and `/register`) each have two variants: `original` (paid monthly cohorts, pricing tiers, cohort picker) and `selection` (inaugural free Atlanta cohort, application-only, 6 seats, July 23 2026, Founder's Discount for non-selected).
- A Super Admin page (`/admin/site`) switches each route's variant live with no redeploy. Selection is read by the public pages on every load.

**2. Data model**
- Table `public.site_settings` — key/value store. Keys used: `home_variant`, `register_variant`. Values: `"original" | "selection"`. Columns: `key text PK`, `value jsonb`, `updated_at timestamptz`, `updated_by uuid`.
- Grants + RLS: public read for the two variant keys; write restricted to `super_admin` role via `user_roles` + `has_role()` helper (the standard roles pattern).
- Default when row missing: `"original"`.

**3. Server functions** (TanStack Start `createServerFn`)
- `getPublicSiteSettings` (GET, unauthenticated) — returns `{ home_variant, register_variant, updated: {...} }` with defaults on error.
- `updateSiteSetting` (POST, requires auth + super_admin check) — Zod validates `{ key: "home_variant"|"register_variant", value: "original"|"selection" }`, upserts on `key`.

**4. Public route wiring**
- `/` (`src/routes/index.tsx`): `useQuery(["site-settings"], getPublicSiteSettings, { staleTime: 60_000 })`. If `data?.home_variant === "selection"` → render `<HomeSelection />`; else render the default Home composition.
- `/register` (`src/routes/register.tsx`): same pattern; renders `<RegisterSelection />` (application form posting to `submitFounderApplication`) or `<RegisterDefault />` (cohort picker + pricing tiers + `createRegistration`).
- Note the loading guard pattern (`if (isLoading) return null;`) to avoid flashing the wrong variant.

**5. Variant content reference**
- **Original Home**: hero with cohort date/seats, "Not a course" banner, "Walk in / walk out" grid, Art-of-the-possible, facilitator section, venue, bottom CTA. Hero CTA → `/register`.
- **Selection Home** (`HomeSelection.tsx`): hero (6 seats / 0 cost / Atlanta inaugural), "Why applying is the move" (chosen / not chosen / either way), "Why we're doing this", "What you walk out with" (ValueGrid, costs hidden), "Bring a card for the small stuff" (~$225 incidentals), criteria, timeline (apply by Jun 20 → decisions Jul 8 → workshop Jul 23 → 90-day follow-through), Founder's Discount panel (40% off, valid two cohorts), facilitator, bottom CTA → `/register`.
- **Original Register**: cohort picker (12 rolling monthly cohorts from `cohorts` table), `PricingTiers` (Founders vs Cohort seat with live availability + auto-roll when Founders sells out), value grid, full registration form (`createRegistration` → `workshop_registrations`).
- **Selection Register** (`RegisterSelection.tsx`): single-page application form. Fields: name, email, phone, about_you, about_startup, why_now, industry, stage, linkedin_url, can_attend (must be true), referral_source. Posts to `submitFounderApplication` → `founder_applications` table. Success card explains July 8 decision + Founder's Discount fallback.

**6. Super Admin toggle UI** (`/admin/site`)
- Two side-by-side cards (Home, Register). Each shows current variant, last-updated timestamp, "Preview" link to the public URL, and two radio-like option buttons (Original / Selection — Free Cohort) with short descriptions. Clicking calls `updateSiteSetting` then invalidates `["site-settings"]` query. Gated by super_admin role at both UI and server-fn level.

**7. Implementation checklist** (so another app can replicate end-to-end)
1. Add `site_settings` table + grants + RLS (super_admin write, public read of variant keys).
2. Add the two server functions.
3. Build the two Home variants and the two Register variants as separate components.
4. Wire the variant switch into the public routes with TanStack Query.
5. Add `/admin/site` page behind a super_admin route guard.
6. Confirm default behavior (no row → `original`).

**8. Gotchas**
- Cache: `staleTime: 60_000` means toggle takes up to a minute to propagate to already-open tabs unless they refocus. Document this; lower if instant flip is required.
- SSR: server fn is unauthenticated and safe to call during prerender. Do NOT put authenticated calls into public loaders.
- Loading flicker: return `null` (or a neutral skeleton) until `siteSettings` resolves to avoid showing Original then snapping to Selection.

## Deliverable

One file: `/mnt/documents/landing-variants-spec.md`, ~300–500 lines, with code snippets for the SQL migration, both server functions, the route-level variant switch, and the admin toggle component — copy-pasteable for another Lovable project.

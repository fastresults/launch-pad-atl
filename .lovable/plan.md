# A/B variants for Homepage & Registration (super-admin toggle)

Add a second "Selection / Free Cohort" variant for `/` and `/register`, switchable by super admins. The new variant pitches a free, invite-only workshop on **July 23, 2026** for **6 selected Atlanta founders**, with selections announced by **July 15, 2026** — no cohort picker, no payment.

## How the toggle works

- New table `public.site_settings` (key/value JSON) with two keys:
  - `home_variant`: `"original" | "selection"`
  - `register_variant`: `"original" | "selection"`
- Defaults: both `"original"`.
- A small SSR-safe server fn `getPublicSiteSettings()` (uses `supabaseAdmin`, read-only, no auth) returns the two variants.
- Each route (`/` and `/register`) calls it from the loader via `queryOptions` + `useSuspenseQuery` (matches existing TanStack pattern) and renders either `<HomeOriginal />` / `<HomeSelection />` or `<RegisterOriginal />` / `<RegisterSelection />`.
- Super-admin page at `/admin/site` lets super_admins flip each variant independently (radio group, single-click save). Uses an authed `updateSiteSetting` server fn gated by `has_role(uid, 'super_admin')`.

## Database (single migration)

```sql
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read site settings" ON public.site_settings FOR SELECT USING (true);
-- writes go through service_role only (super-admin server fn)
INSERT INTO public.site_settings(key, value) VALUES
  ('home_variant', '"original"'::jsonb),
  ('register_variant', '"original"'::jsonb);
```

## Files

**New**
- `src/lib/site-settings.functions.ts` — `getPublicSiteSettings()` (public read via `supabaseAdmin`), `updateSiteSetting({ key, value })` (super-admin gated).
- `src/routes/_authenticated/_admin/admin.site.tsx` — toggle UI: two cards, each with two radios ("Original" / "Selection — Free Cohort"), live save, last-updated stamp.
- `src/components/home/HomeOriginal.tsx` — extracted from current `src/routes/index.tsx` body (just moves the existing `HomePage` JSX + its local helpers to a component file; no design changes).
- `src/components/home/HomeSelection.tsx` — new landing for the selection variant (sections below).
- `src/components/register/RegisterOriginal.tsx` — extracted from current `src/routes/register.tsx` body.
- `src/components/register/RegisterSelection.tsx` — new short application form.
- `src/lib/applications.functions.ts` — `submitFounderApplication(...)` writing to `workshop_registrations` with `cohort_id = 'select-2026-07-23'`, `status='applied'`, `tier_interest='selection'`.

**Edit**
- `src/routes/index.tsx` — replace body with a thin switch: loader reads `home_variant`, component renders `HomeOriginal` or `HomeSelection`. Keep route-level `head()` but compute meta from variant.
- `src/routes/register.tsx` — same pattern using `register_variant`.
- `src/components/layout/Sidebar` (admin nav, wherever the admin menu lives — `src/routes/_authenticated/_admin.tsx`) — add "Site" link.
- `supabase/migrations/...site_settings.sql`

**No edits** to: cohorts, pricing, value-grid, existing admin pages.

## "Selection" homepage content outline (`HomeSelection.tsx`)

Reuses existing design tokens, Header/Footer, same hero shell — only the copy and CTAs change.

1. **Hero** — eyebrow: "Atlanta · Inaugural Cohort". Headline: "Six Atlanta founders. One day. Zero cost." Sub: "We're new to Atlanta. To launch right, we're hand-picking **six founders** to attend a **free** full-day build workshop on **July 23, 2026** at the IGNITE Center, Norcross GA." CTA: "Apply for a seat → /register". Secondary: "See what we'll build → #deliverables".
2. **Why we're doing this** — short trust block: new to the market, want six real launches as proof, full-tuition value (~$X) covered for selected founders.
3. **Walk in / walk out** — reuse the existing `WalkInWalkOut` section verbatim (import from a shared component file; refactor a tiny bit so both variants can share).
4. **What you walk out with** — reuse `ValueGrid` (deliverables) without the pricing TotalsBar.
5. **Who we're looking for** — 4 criteria cards: "Atlanta-based or relocating", "Idea or early traction", "Coachable & decisive", "Can commit a full day on July 23".
6. **Timeline** — "Applications close July 8 · Selections announced July 15 · Workshop July 23 · 90-day follow-through".
7. **Facilitator** — reuse `FacilitatorSection`.
8. **Venue** — reuse `VenueCard`.
9. **Bottom CTA** — "Six seats. Apply by July 8. → /register".

## "Selection" register page (`RegisterSelection.tsx`)

Application form, not a checkout. No cohort picker, no tier, no payment.

Fields:
- Full name, email, phone (optional).
- "Tell us about you" (textarea, 120–800 chars) — background, what you're working on now.
- "Tell us about your startup" (textarea, 120–1500 chars) — what it is, who it serves, what problem.
- Stage select (idea / early / existing).
- Industry select (reuse existing list).
- "Why this workshop, why now?" (textarea, 60–600 chars).
- Linkedin URL (optional).
- "I can attend in person on July 23, 2026 in Norcross, GA" — required checkbox.
- "How did you hear about us?" (optional).

Submit → `submitFounderApplication` which inserts into existing `workshop_registrations` with:
- `cohort_id = 'select-2026-07-23'` (insert this cohort row in the migration: status `'application'`, prices 0, seats 6/0)
- `tier_interest = 'selection'`, `assigned_tier = null`, `status = 'applied'`.
- Long-form answers stored in `business_idea` (combined) — schema unchanged.

Success card: "Application received. We'll email a decision by **July 15, 2026**." Includes what to expect next + a "Tell a friend" share line.

Add `cohort_id = 'select-2026-07-23'` cohort row in the same migration so existing FK-less reads still work and admin can see applicants on the existing Registrations page.

## Super-admin toggle UI (`/admin/site`)

```
┌─ Homepage ──────────────────────────────┐
│  ( ) Original                           │
│  (•) Selection — Free Cohort (Jul 23)   │
│  Last updated 2m ago by you             │
└─────────────────────────────────────────┘
┌─ Registration ──────────────────────────┐
│  ( ) Original                           │
│  (•) Selection — Application form       │
└─────────────────────────────────────────┘
```

Each radio change calls `updateSiteSetting` and invalidates the `["site-settings"]` query. Below each card, a "Preview in new tab" link opens `/` or `/register` so the admin can verify before announcing.

## Edge cases / safety

- `getPublicSiteSettings()` returns defaults if the table is empty or the row is missing — no broken site if migration hasn't run yet.
- Both variants share `SiteHeader` / `SiteFooter`, so global nav stays consistent.
- SEO: each variant supplies its own `<title>` / `og:` meta via `head()`.
- Existing paid cohorts and the admin "Cohorts" / "Registrations" pages are untouched. Switching variants doesn't change pricing, RLS, or any existing flow.
- The selection cohort row uses `price = 0` and a dedicated id so revenue reports aren't polluted.

## Sequence

1. Run the migration (creates table, seeds defaults, inserts `select-2026-07-23` cohort).
2. Add `site-settings.functions.ts` + `applications.functions.ts`.
3. Extract current pages into `HomeOriginal` / `RegisterOriginal` (pure move).
4. Build `HomeSelection` and `RegisterSelection`.
5. Wire variant switches in `/` and `/register` loaders.
6. Ship `/admin/site` toggle page + sidebar link.
7. Verify both variants render in dev and the toggle flips without redeploy.
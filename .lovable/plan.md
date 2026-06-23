
# Reposition to a $97 Strategic Framework Workshop

One offer, one price, one funnel. The workshop sells a **strategic framework** (positioning, ICP, offer, pricing, 90-day roadmap) for **$97**. Bigger work — done-for-you consulting and creative services — moves to a dedicated `/services` page that the site, the workshop session, and the post-purchase flow all point to.

## What changes for the visitor

- Homepage tells one story: $97, half-day-style strategic framework session, walk out with a clear plan, not a built business.
- Register page is a single $97 checkout. No tier picker, no founders/cohort split, no scarcity tiers.
- New `/services` page lists productized consulting and creative packages with prices and CTAs.
- Header gets a "Services" link. Footer + post-purchase confirmation both route attendees there.
- The "build a whole business in a day" promise (LLC packet, website, brand kit, legal docs, 25 deliverables) is gone from public copy. Those become services, not workshop deliverables.

## What the $97 workshop promises

Reframed deliverables — strategic only, no production work:

1. Positioning statement + competitive angle
2. Ideal Customer Profile (1 page)
3. Offer & pricing framework (value-based anchors, margin logic)
4. Revenue model + 12-month back-of-envelope economics
5. 90-day go-to-market roadmap with weekly milestones
6. Next-step decision tree: what to DIY, what to hire out, what we can do for you

Anything execution-heavy (filings, website, brand, legal docs, content production) is explicitly out of scope and pitched as a `/services` upgrade.

## New `/services` page

Productized packages, each with a fixed price band and a "Book a call" or "Start project" CTA:

- **Strategy Sprint** — 2-week 1:1 consulting to harden the framework into an executable plan.
- **Brand & Website Build** — logo, identity, 4-page site, copy, SEO.
- **Launch Kit** — LLC filing, EIN, legal templates, payment + analytics setup.
- **Marketing Engine** — 30-day content calendar, creative assets, outreach sequences.
- **Custom engagement** — contact form / call booking for anything bespoke.

Pricing values will be placeholders the user fills in before launch — the plan ships the structure, not the dollar amounts (I'll flag every `TODO_PRICE`).

## Files to add / change

### New
- `src/routes/services.tsx` — public Services page, registered in `src/App.tsx`.
- `src/components/services/ServicesHero.tsx`, `ServicePackageCard.tsx`, `ServicesCTA.tsx`.
- `src/components/home/HomeFramework.tsx` — the new single homepage (hero, framework promise, what's in / what's not, facilitator section reused, services teaser, FAQ, final CTA).
- `src/components/register/RegisterFramework.tsx` — single $97 checkout form (name, email, phone, business idea one-liner, cohort date picker, pay-now CTA). No tier picker, no `PricingTiers`, no `ValueGrid`.
- `src/lib/framework-deliverables.ts` — the six framework outputs above, used by home + register + services.

### Rewritten
- `src/routes/index.tsx` — render `<HomeFramework />` unconditionally. Remove the `site-settings` variant query and the `HomeSelection` / `HomeOriginal` branch.
- `src/routes/register.tsx` — render `<RegisterFramework />` unconditionally. Same variant cleanup.
- `src/components/site/Header.tsx` — add "Services" nav link.
- `src/components/site/Footer.tsx` — add "Services" to the link list.

### Deleted
- `src/components/home/HomeOriginal.tsx`, `HomeSelection.tsx`, `ArtOfThePossible.tsx` (workshop-day-flow piece, no longer relevant).
- `src/components/register/RegisterOriginal.tsx`, `RegisterSelection.tsx`.
- `src/components/value/PricingTiers.tsx`, `TotalsBar.tsx`, `ValueGrid.tsx`, `CohortPicker.tsx` (founders/cohort tier UI is gone).
- `src/lib/value-grid.ts` (the 25-deliverable / market-cost grid; replaced by the much smaller `framework-deliverables.ts`).
- `src/routes/_authenticated/_admin/admin.site.tsx` (variant toggle UI) — and remove its entry from `src/lib/admin-nav.ts`.

### Database (one migration, run after plan approval)
- Drop `site_settings` rows for `home_variant` and `register_variant` (no longer used). Keep the table if anything else uses it — quick check first; if empty, drop the table.
- `cohorts` table: set `founders_seats = 0`, `cohort_seats = <total seats>`, `founders_price_cents = 9700`, `cohort_price_cents = 9700` on existing rows so the single-tier reservation function keeps working without code changes. Rename is **not** done in this pass — column names stay `cohort_*` to avoid a destructive schema change. The single $97 price is sourced from `cohort_price_cents`.
- `workshop_registrations.assigned_tier` keeps existing values for historical rows; new rows always insert `assigned_tier = 'cohort'`.

### Untouched
- `reserve_cohort_seat` SQL function, `cohort-availability` logic, auth, attendee dashboard, admin attendee tools, email templates. All keep working — they just operate on a single-tier cohort now.

## Copy direction (high level)

- Hero: "Get the strategic framework to launch in 90 days — for $97."
- Sub: "Half-day working session with Adam Anderson. You leave with positioning, pricing, ICP, and a 90-day roadmap. When you're ready to build it, our team is here."
- What you get: 6-item framework list, each with a one-line description.
- What this is *not*: explicit "we don't build your website, file your LLC, or write your legal docs in this session — those are separate services" callout. Sets honest expectations and seeds the upsell.
- Services teaser block under that with 3 service cards + "See all services →" link.

## Out of scope for this pass

- Stripe checkout wiring for the new $97 price (existing payment flow assumes per-cohort pricing; this plan updates the *price* in the DB and the UI, not the payment integration). Flag if you want that included.
- Email template rewrites beyond a one-line copy nudge pointing to `/services`.
- Filling in real service package prices — placeholders shipped.

## Execution order

1. Migration: update `cohorts` pricing/seats, clean `site_settings`.
2. Build `framework-deliverables.ts`, `HomeFramework`, `RegisterFramework`, services components + route.
3. Wire `index.tsx`, `register.tsx`, `Header`, `Footer`, `App.tsx`, `admin-nav.ts`.
4. Delete obsolete files in one sweep.
5. Verify: `tsgo`, load `/`, `/register`, `/services`, `/admin` to confirm no broken imports.

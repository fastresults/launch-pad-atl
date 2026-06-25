## The problem

Right now `BriefCompleteScreen`'s primary CTA navigates to `/dashboard/hub`. For a brand-new founder this route shows an empty state ("Start your first startup") with a *New startup* button — so the CTA effectively goes nowhere useful. Tapping *New startup* then drops them into `/dashboard/hub/new`, a blank 4-step wizard that asks for company name, URL, concept, founder name/email, city/region/country, industry, sub-industry, track — **all things we either just collected in the brief or know from their profile**. The user is being asked to start over right after finishing onboarding. That's the dead end they're describing.

## The real next step

The brief already has: `one_line_pitch`, `problem_statement`, `offer_description`, `target_customer`, `unique_insight`, `business_model`, `pricing_idea`, `twelve_month_vision`, `inspiration_brands`. The user's profile/registration has: founder name, email, city, region, country, track (Main Street default). Together that's enough to walk into `/dashboard/hub/new` with the form **already filled in** and the user one click away from creating their first snapshot — which then auto-enriches and routes them into the snapshot view where deliverables actually generate.

## Plan

1. **Add brief → snapshot prefill helper** (`src/lib/brief-to-snapshot.ts`)
   - Pulls the user's `attendee_business_brief` row plus profile (founder name/email/city/region/country/track if available).
   - Maps:
     - `business_concept` ← `[one_line_pitch] + "\n\n" + [problem_statement] + "\n\n" + [offer_description]` (trimmed, only non-empty)
     - `differentiation_statement` ← `unique_insight`
     - `company_name` ← derived from `one_line_pitch` first 4–6 words, user-editable
     - `founder_name / email / city / region / country / track` ← profile
     - `industry` ← left blank for the user to pick (the one thing the brief doesn't capture cleanly), with a soft suggestion via the existing `guessIndustry()` from the concept text
   - Returns a plain object suitable for hub/new's form state.

2. **Update `hub.new.tsx` to accept prefill via router state / query param**
   - Read `location.state?.prefill` (or `?from=brief` triggering a fetch).
   - On mount, if prefill present: hydrate all form fields, jump straight to **Step 4 — Review** (or Step 3 with a single visible "Review your details" panel), and show a small banner: *"Pre-filled from your startup brief — edit anything that's off, then create."*

3. **Wire the CTA**
   - In `src/routes/_authenticated/dashboard/brief.tsx`, change `onGenerateFirst` from `navigate({ to: "/dashboard/hub" })` to `navigate("/dashboard/hub/new", { state: { prefill: await buildPrefillFromBrief() } })`.
   - Same treatment for *See all 34 deliverables* — that should go to `/dashboard/hub/new` too (the only way to see deliverables generate is to have a snapshot), OR to the framework page if we want a read-only preview. Recommend keeping it as a secondary "Preview the 34 deliverables" link to `/dashboard#framework` so we don't double up.

4. **Copy update on `BriefCompleteScreen`**
   - Subhead becomes: *"We'll open your Startup Snapshot with your brief already filled in — review it, then we generate."*
   - Button label stays: *Generate your first deliverable →*

5. **Verify end-to-end via Playwright**
   - Sign in with the injected session, complete-state brief, click the CTA, confirm hub/new lands on the Review step with `business_concept` populated and Create enabled.

## What this does NOT change

- No edits to the brief wizard itself, no schema changes, no edge function changes.
- The hub/new wizard still owns validation, enrichment, and snapshot creation — we're only pre-filling its inputs.
- Industry stays a user choice (brief doesn't capture it), with a soft suggestion so it's still one click.

## Files touched

- `src/lib/brief-to-snapshot.ts` (new)
- `src/routes/_authenticated/dashboard/brief.tsx` (CTA wiring)
- `src/routes/_authenticated/dashboard/hub.new.tsx` (consume prefill, jump to Review, banner)
- `src/components/brief/BriefCompleteScreen.tsx` (subhead copy)

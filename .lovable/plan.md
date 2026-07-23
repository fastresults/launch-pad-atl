## Goal

Repurpose the standalone landing page as a **free launch offer**: "We're setting up 3 Atlanta entrepreneurs in business — absolutely free — to launch Startup Labs. One morning, August 6, 2026." All price/CTA/date logic on the landing page becomes locally owned so it stays independent of the live site's paid workshops.

Scope is **landing page only** — `src/components/landing/*`. The homepage at `/` and the real workshop funnel are untouched.

## What changes

### 1. Local, self-contained content constants in `LandingFramework.tsx`

Stop importing shared money/date sources so nothing on the paid site can leak in:

- Remove imports of `WORKSHOP_PRICE_LABEL` and `useEvent()` inside the landing tree.
- Define local constants at the top of `LandingFramework.tsx`:
  - `LANDING_EVENT` — `{ dateLabel: "Thursday, August 6, 2026 · morning", venueName: "IGNITE Center at Greater Atlanta Christian School", venueCity: "Norcross", venueRegion: "GA", address, mapsUrl, mapsEmbedUrl }` (copy the current values from `useEvent()` so map + address stay right).
  - `LANDING_OFFER = { seats: 3, city: "Atlanta", applyByLabel: "July 30" }`.

### 2. Strip every money reference on the landing page

Rewrite affected copy so the offer reads as free. Specific edits inside `LandingFramework.tsx`:

- **Hero right column (~line 132–240):** replace the price card with a "Free launch offer" card — headline "3 seats. Zero cost.", subline "We're setting up 3 Atlanta entrepreneurs in business — absolutely free — to launch Startup Labs.", primary CTA button "Reserve your interest" (opens the new modal, does not link to `/register`), meta rows: date `August 6, 2026 · morning`, venue, "Apply by July 30 · team responds by July 30".
- **Remove the "Private Tuesday at IGNITE — $397" secondary link** entirely.
- **Line 263** — keep "A priced offer that takes money" wording (that describes what *the founder's* startup will do by lunch, not our price) but re-read once and soften if it now reads awkwardly next to the free framing.
- **Line 310** — drop "`{WORKSHOP_PRICE_LABEL} once. Yours to run with.`" → replace with "One morning with us. Yours to run with."
- **Line 388** — the "Everything pretty comes after the money starts" line describes the founder's revenue, not our price — keep as-is.
- **Line 414 section header + line 418** — change "What $197 gets you" to "What one morning gets you".
- **Line 446–456 workshop cards** — remove the `Workshop · $197` price chip on each card. Keep the title, promise, and link. (These cards stay because the user said "all the other blocks and sections on the landing page are fine".)
- **Bottom venue block (~line 582–650):** date and venue come from `LANDING_EVENT`; the two "Reserve a seat — $197" CTAs become "Reserve your interest" buttons that open the modal instead of linking to `/register`.

### 3. New `LandingInterestModal.tsx` (landing-scoped, self-contained)

New file `src/components/landing/LandingInterestModal.tsx`:

- Dialog built on `@/components/ui/dialog` to match existing marketing modals.
- Title: **"Reserve your interest"**.
- Subline: "We're setting up 3 Atlanta entrepreneurs in business, absolutely free, on August 6. Tell us about you — our evaluation team will get back to you by **July 30**."
- Fields: Full name, Email, Phone (optional), City, One-sentence business idea (textarea), "Why you? Why now?" (textarea).
- Submit action: writes a new inquiry via the existing `enqueueTransactionalEmail` + `inquiries` path already used by the contact form (`src/lib/inquiries.functions.ts`), tagged `source: "landing_free_launch"` and `subject: "Landing free-launch interest — <name>"`, so it flows into the same admin inbox and email routing without new infra.
- Success state: swap dialog body to a thank-you card — "You're in the evaluation pool. We'll email you by **July 30**." with a Close button.
- Error state: inline error, no toast noise.
- Fully controlled `open` / `onOpenChange` — `LandingFramework` owns the state (`const [interestOpen, setInterestOpen] = useState(false)`), and every landing CTA calls `setInterestOpen(true)` instead of navigating.

### 4. Header/nav on the landing page

The landing page currently renders through the same header. Since super-admin lockdown mode hides everything else, we do not need nav changes — but the header's own "Reserve seat — $…" CTA is defined outside the landing tree. To keep the landing page consistent while lockdown is on, `LandingOnlyGate` (or the landing route wrapper) can conditionally hide the marketing header/footer when landing-only mode is active, and `StandaloneLanding` renders its own minimal top strip (logo + "Reserve your interest" button).

Confirm this before build: **do you want the marketing header/footer hidden when landing-only mode is on**, or keep them visible? Default assumption in this plan: **hide them** so the free-launch page is the only thing on the screen and no `$197` chips slip through from the header.

### 5. What stays exactly as-is

- Hero coffee cup illustration, steam, layout, typography.
- All prose about outcomes (live page, priced offer, first customer, "Everything pretty comes after the money starts" — that's about the *founder's* revenue).
- Video testimonials, business-ideas scroller, access-mode dialog (all already landing-scoped from the previous fork).
- Homepage `/`, `/build`, `/register`, `/private-tuesday`, and every paid flow.
- No database migrations. No changes to shared `useEvent`, `WORKSHOP_PRICE_LABEL`, or `framework-deliverables`.

## Files touched

- `src/components/landing/LandingFramework.tsx` — local constants, price sweep, wire CTAs to modal.
- `src/components/landing/LandingInterestModal.tsx` — new.
- `src/components/site/LandingOnlyGate.tsx` (or `App.tsx`) — optional: hide marketing header/footer while landing-only is on (pending your answer above).

## Verification

- Grep `src/components/landing/` for `$`, `197`, `297`, `397`, `price`, `WORKSHOP_PRICE_LABEL`, `useEvent` — expect zero matches after the sweep.
- Open landing page, click every CTA — all open the interest modal, none navigate to `/register`.
- Submit the modal in the preview — confirm a row lands in `inquiries` and an email is queued to `fastresults@gmail.com`.
- Typecheck passes.

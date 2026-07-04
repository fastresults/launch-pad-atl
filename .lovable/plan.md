## Problem
`/register?workshop=<slug>&date=<iso>` currently renders the same generic "Strategic Foundation Workshop" hero and price aside regardless of which workshop the user clicked. The aside lists the 8-stage foundation deliverables — irrelevant for `website-that-converts`, `sales-systems`, `legal-financial-ops`, etc.

## Goal
Make `/register` fully context-aware to the `?workshop=<slug>` query param, for all 9 workshops (the 8 build workshops + the default Strategic Foundation workshop when the param is absent).

## Files & edits

**`src/components/register/RegisterFramework.tsx`** — one file, no new components.

1. **Read the query param** with `useSearchParams` (already using react-router).
   ```ts
   const [params] = useSearchParams();
   const workshopSlug = params.get("workshop");
   const preselectedDateIso = params.get("date");
   const buildWorkshop = workshopSlug ? getBuildWorkshop(workshopSlug) : undefined;
   ```

2. **Derive a `ctx` view-model** so the JSX stays clean:
   ```ts
   const ctx = buildWorkshop
     ? {
         eyebrow: `${buildWorkshop.title} · ${buildWorkshop.priceLabel}`,
         heroTitle: buildWorkshop.oneLiner,
         heroBlurb: buildWorkshop.subhead,
         asideTitle: buildWorkshop.title,
         asideBlurb: `Half-day working session with Adam Anderson. Live online — small cohort. Coffee optional.`,
         walkOuts: buildWorkshop.walkOuts,        // string[]
         priceLabel: buildWorkshop.priceLabel,    // "$197"
         priceCents: 19_700,
         footerLine: `${buildWorkshop.walkOuts.length} deliverables · built live with Adam · yours to keep.`,
       }
     : {
         eyebrow: `Strategic Foundation Workshop · ${WORKSHOP_PRICE_LABEL}`,
         heroTitle: <>Reserve your seat — <span className="text-gradient-brand">{WORKSHOP_PRICE_LABEL}.</span></>,
         heroBlurb: "Walk out with the strategic foundation for your startup: ...",
         asideTitle: "Strategic Foundation Workshop",
         asideBlurb: "Strategic Foundation Workshop — small cohort, working session with Adam Anderson. Coffee and light refreshments provided.",
         walkOuts: null,   // signals: render existing FRAMEWORK_STAGES tree instead
         priceLabel: WORKSHOP_PRICE_LABEL,
         priceCents: WORKSHOP_PRICE_CENTS,
         footerLine: `${TOTAL_DELIVERABLES} startup assets total · built live with Adam · yours to keep.`,
       };
   ```

3. **Hero section (lines 86–100):** replace hardcoded eyebrow / H1 / paragraph with `ctx.eyebrow`, `ctx.heroTitle`, `ctx.heroBlurb`.

4. **Price aside (lines 211–249):** replace hardcoded `$197`, blurb, and the `FRAMEWORK_STAGES.map(...)` block with:
   - `ctx.priceLabel` + "one-time"
   - `ctx.asideBlurb`
   - If `ctx.walkOuts` is an array → render simple check-list of `walkOuts.map(w => <li>...w</li>)`.
   - Else → keep the current `FRAMEWORK_STAGES` stage-by-stage block (Strategic Foundation only).
   - `ctx.footerLine` at the bottom.

5. **Submit CTA + price payload:** use `ctx.priceLabel` in the button label and `ctx.priceCents` when calling `createRegistration`. Also pass `workshop_slug: workshopSlug ?? "strategic-foundation"` into the registration payload (add a comment noting the column may need to be added later; if the current `createRegistration` schema rejects unknown fields, drop this line — flagged as an open item below).

6. **Preselect date** if `preselectedDateIso` matches a cohort's `startISO`, default the `cohort_id` to that cohort. Otherwise behavior is unchanged.

## What stays the same
- Form fields, validation, cohort dropdown source.
- `/register` with no query params renders exactly as it does today (Strategic Foundation).
- No changes to `build-workshops.ts`, routes, or DB schema in this pass.

## Out of scope
- Persisting `workshop_slug` server-side (needs a DB migration + edge-function update — separate change).
- Wiring these registrations to per-workshop cohort inventory. Today all workshops share the same cohort list; capacity per workshop is a separate roadmap item.
- Payments/Stripe wiring.

## Open follow-up
- If we want the admin CRM to know which of the 9 workshops a lead picked, add `workshop_slug text` to `workshop_registrations` and forward the field. Confirm before I do that migration.
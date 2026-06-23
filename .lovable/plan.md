## Goal

Carry the **"strategic foundation"** language consistently across all public-site copy. Today, three pages still call it a "framework," which weakens the positioning we just set on the home hero.

Copy-only changes. No new files, no layout shifts, no logic touched.

---

## Files to update

### 1. `src/components/site/Footer.tsx` (line 14)
- Replace `"Framework first. Build when ready."` with `"Foundation first. Build when ready."`

### 2. `src/routes/services.tsx`
- **Line 22** (hero sub-copy): replace `"founders who have the strategic framework"` with `"founders who have the strategic foundation"`.
- **Line 76** (CTA heading): replace `"Start with the {WORKSHOP_PRICE_LABEL} framework workshop."` with `"Start with the {WORKSHOP_PRICE_LABEL} Strategic Foundation Workshop."`
- **Line 86** (button): change `"Reserve a workshop seat"` to `"Reserve a foundation seat"` (or keep "workshop seat" if cleaner — flag during build; default to "foundation seat" for consistency with the new naming).

### 3. `src/components/home/HomeFramework.tsx`
- **Line 154** (InOutScope H2): rewrite `"{WORKSHOP_PRICE_LABEL} buys a framework. Not a built business."` → `"{WORKSHOP_PRICE_LABEL} buys the strategic foundation. Not a built business."`
- **Line 187**: `"have the framework first"` → `"have the foundation first"`.
- **Line 237** (Facilitator copy): `"a defensible strategic framework"` → `"a defensible strategic foundation"`.
- **Line 350** (BottomCTA): `"a working framework, and a 90-day roadmap"` → `"a working strategic foundation, and a 90-day roadmap"`; `"you keep the framework either way"` → `"you keep the foundation either way"`.

---

## Out of scope

- Internal identifiers stay as-is: `HomeFramework`, `RegisterFramework`, `FRAMEWORK_DELIVERABLES`, file name `framework-deliverables.ts`. Renaming them is a sweep across imports with no user-visible payoff.
- `/privacy`, `/terms`, `/facilitator`, `/dashboard/*`, admin, and email templates aren't touched — "workshop" is still correct there, and none of them reference "framework" in a way that conflicts with the new positioning.
- No pricing, schedule, or component structure changes.

---

## Technical notes

- All edits are single-line string swaps in JSX.
- The word "framework" only needs to leave **user-facing strings**. Imports like `@/lib/framework-deliverables` and the component name `Framework()` inside `HomeFramework.tsx` (line 102) stay.

## Goal

Raise the Foundation Workshop price from **$97** to **$197** everywhere it appears, including the one DB-bound write that records what each registrant paid.

## Source-of-truth change

`src/lib/framework-deliverables.ts`:

```ts
export const WORKSHOP_PRICE_CENTS = 9700;   // → 19700
export const WORKSHOP_PRICE_LABEL = "$97";  // → "$197"
```

Every page that imports `WORKSHOP_PRICE_LABEL` (hero, framework section, registration page, CTAs, sticky bar, closing block) updates automatically.

## Hard-coded "$97" / `9700` leaks to fix manually

1. `src/components/site/Header.tsx:27` — `const ctaFull = "Reserve seat — $97"` → use `WORKSHOP_PRICE_LABEL` (import from `@/lib/framework-deliverables`).
2. `src/components/home/HomeFramework.tsx:222` — code comment `{/* Act 2 — What $97 gets you */}` → `What $197 gets you` (cosmetic, but keeps grep clean).
3. `src/components/register/RegisterFramework.tsx:72` — `price_paid_cents: 9700` in the registration insert → `WORKSHOP_PRICE_CENTS` (so this can never drift again).

## What is NOT changing (and why)

- **Build Workshops** in `src/lib/build-workshops.ts` (the eight advanced half-day workshops priced at $197 / $297 / $397) — unrelated product line, already correct. The "from $197" copy on `/build`, `/services`, and the home Build section stays as-is.
- **Cohort pricing** in `src/lib/cohorts.ts` (`DEFAULT_PRICING.foundersPriceCents = 67900`, `cohortPriceCents = 99700`) and the matching DB columns / admin form — these are a separate cohort-tier concept, not the Foundation Workshop seat price. Untouched unless you say otherwise.
- **Existing rows in `registrations`** — historical `price_paid_cents = 9700` entries remain accurate (those founders did pay $97). Only new registrations will be recorded at 19,700.
- **No DB migration needed.** No Stripe / checkout code references $97.

## Verification after the edit

- `grep -rn "\$97\|9700" src supabase` should return zero hits outside historical migrations and the `cohorts` defaults (67900 / 99700).
- Spot-check: home hero pill area, hero subhead, both "Reserve a seat" CTAs, registration page price block, sticky header CTA, and `/services` + `/build` "from $197" lines (should still read $197 — unchanged).

## Files touched

- `src/lib/framework-deliverables.ts` (constant value + label)
- `src/components/site/Header.tsx` (replace hard-coded string)
- `src/components/home/HomeFramework.tsx` (one comment)
- `src/components/register/RegisterFramework.tsx` (use constant instead of literal 9700)

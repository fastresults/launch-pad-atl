
## Goal
Update the Strategic Foundation Workshop price from **$197 → $297** everywhere it appears. Leave the eight Build workshops (`brand-identity`, `website-that-converts`, etc.) untouched — they keep their own tiered pricing.

## Scope
The Strategic Foundation Workshop price is centralized in two constants used by `/`, `/register`, and the chatbot knowledge base. The eight Build workshops carry their own `priceLabel` in `src/lib/build-workshops.ts` and are NOT part of this change.

## Changes

**`src/lib/framework-deliverables.ts`**
- `WORKSHOP_PRICE_CENTS`: `19700` → `29700`
- `WORKSHOP_PRICE_LABEL`: `"$197"` → `"$297"`

That single edit cascades to:
- `HomeFramework.tsx` hero CTA — "Reserve your seat — $297"
- `RegisterFramework.tsx` eyebrow, submit CTA, and `price_paid_cents` on registration insert
- `chatbot-knowledge.ts` pricing line

## Out of scope
- `src/routes/build.tsx`, `src/routes/services.tsx`, `HomeFramework.tsx` Act 2 comment/blurb — these describe the eight Build workshops ("from $197", "$197, $297, or $397"), not the Strategic Foundation Workshop.
- `build-workshops.ts` per-workshop `priceLabel` values.
- No DB/schema changes; existing registration rows keep their historical `price_paid_cents`.

## Verification
- `rg "WORKSHOP_PRICE_LABEL|WORKSHOP_PRICE_CENTS"` to confirm all consumers pick up the new value.
- Load `/` and `/register` in preview; confirm CTA reads "$297" and register submit shows "$297".

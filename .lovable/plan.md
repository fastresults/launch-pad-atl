
# Tiered workshop pricing based on agency retail cost

Each of the 8 build-layer workshops gets its own price tied to the retail cost of the matching agency service. The original Strategic Foundation Workshop stays at $97 (it's the entry product, not tied to a build-layer service).

## Price mapping

Rules: 1–2K → $197 · 2–3K → $297 · 3–5K → $397

| # | Workshop | Agency retail | New workshop price |
|---|---|---|---|
| 1 | Brand identity | $2,900 | **$297** |
| 2 | A website that converts | $4,800 | **$397** |
| 3 | Social presence | $1,800 setup (+ $1,200/mo) | **$197** |
| 4 | A content engine | $2,400/mo | **$297** |
| 5 | AI as your operating system | $4,500 | **$397** |
| 6 | Email, CRM & automation | $3,200 | **$397** |
| 7 | Sales systems | $3,800 | **$397** |
| 8 | Legal, financial & ops | $1,200 | **$197** |

Foundation Workshop (homepage): **stays $97**.

Tier banding for monthly services uses the setup/first-month figure as the anchor (Social Presence → $1,800 setup, Content Engine → $2,400/mo treated as the 2–3K band).

## Data model changes

`src/lib/build-workshops.ts` — add per-workshop price to the `BuildWorkshop` type:

```ts
export type BuildWorkshop = {
  slug: string;
  // ...existing fields
  priceCents: number;    // e.g. 19700, 29700, 39700
  priceLabel: string;    // e.g. "$197", "$297", "$397"
  // ...
};
```

Populate `priceCents` + `priceLabel` for all 8 entries per the table above. Add a small helper:

```ts
export function workshopPriceForRetailCents(retailCents: number): { cents: number; label: string };
```

`src/lib/framework-deliverables.ts` — keep `WORKSHOP_PRICE_CENTS = 9700` and `WORKSHOP_PRICE_LABEL = "$97"` (now explicitly the **Foundation Workshop** price, used by the homepage hero, Honest Roadmap band, and Foundation CTAs only). No rename needed; just stop using it as the universal label everywhere else.

## Copy surfaces that change

Every place that hardcodes "$97" while talking about one of the 8 build-layer workshops gets updated to use the workshop-specific `priceLabel`. Places referring to the Foundation Workshop keep `$97`.

### `src/routes/build.tsx` (workshops index)
- Card chip: `Workshop · {WORKSHOP_PRICE_LABEL}` → `Workshop · {w.priceLabel}` (per-card).
- Hero subhead "half-day, {WORKSHOP_PRICE_LABEL} workshop" → restate as "from $197" since the index covers all 8.

### `src/routes/build.$slug.tsx` (individual workshop page)
- Hero chip + CTAs + agency upsell band: all `WORKSHOP_PRICE_LABEL` → `w.priceLabel`.
- "Other workshops" cards — show each one's own `priceLabel`.

### `src/lib/build-workshops.ts` — COMMON_FAQ
- "What's actually included for {WORKSHOP_PRICE_LABEL}?" — change to a parameterized FAQ generator so each workshop's FAQ shows its own price (e.g. "What's included for $297?").
- Credit-back FAQ stays generic ("the workshop fee credits toward any engagement over $1,000").

### `src/routes/services.tsx`
- Capability grid: each card's "Or learn the strategy first — {WORKSHOP_PRICE_LABEL} workshop →" → use that service's matching workshop price (looked up via slug).
- Hero CTA: "Start with a {WORKSHOP_PRICE_LABEL} workshop" → "Start with a workshop — from $197".
- Workshop band ("Try us for $97"): reframe to "Try us for as little as $197" (since the 8 build-layer workshops start at $197; the Foundation Workshop sits separately on the homepage).
- Credit-back copy: "the {WORKSHOP_PRICE_LABEL} is credited back" → "your workshop fee is credited back".
- Final CTA: same treatment as hero.

### `src/components/home/HomeFramework.tsx`
- Hero, Honest Roadmap, and Foundation CTAs: keep `$97` (Foundation Workshop is unchanged).
- Build-layer card chips: currently `Workshop · {WORKSHOP_PRICE_LABEL}` → switch to per-workshop `priceLabel` (looked up from `BUILD_WORKSHOPS` by capability match, which the cards already do).
- Section intro line "Each one is a half-day workshop for {WORKSHOP_PRICE_LABEL}" → "Each one is a half-day workshop, from $197".

### `src/components/register/RegisterFramework.tsx`, `src/routes/register.tsx`, any other surface
- Audit any remaining `WORKSHOP_PRICE_LABEL` usage. If the context is the Foundation Workshop, leave it. If the context is a build-layer workshop, switch to the per-workshop price (via the `?workshop=<slug>` query param if present).

## Files to modify

- `src/lib/build-workshops.ts` — add `priceCents` + `priceLabel` per workshop; parameterize the FAQ price.
- `src/routes/build.tsx` — per-card price chip, "from $197" hero.
- `src/routes/build.$slug.tsx` — every CTA + chip uses `w.priceLabel`.
- `src/routes/services.tsx` — per-service workshop price links, reframe banners to "from $197".
- `src/components/home/HomeFramework.tsx` — per-card chip uses workshop price, build-layer intro reframed.
- `src/components/register/RegisterFramework.tsx` — audit and update build-layer references; Foundation stays $97.

## Files NOT changed

- `src/lib/framework-deliverables.ts` — `WORKSHOP_PRICE_CENTS`/`WORKSHOP_PRICE_LABEL` remain the Foundation Workshop price.
- Stripe / payment integration — no checkout exists yet, so no plumbing changes needed.

## Not in scope

- Real payment flow per workshop (still goes through existing `/register?workshop=<slug>` — pricing is display-only for now).
- Repricing the Foundation Workshop.
- Repricing agency services or tracks.

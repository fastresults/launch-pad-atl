## What I audited

Three sources of truth feed pricing and copy across the site:

1. **`framework-deliverables.ts` → `BUILD_LAYER`** — the 8 capabilities on the homepage (titles + descriptions only, no prices).
2. **`agency-services.ts` → `AGENCY_SERVICES` + `AGENCY_TRACKS`** — the `/services` page (prices, deliverables, tracks).
3. **`build-workshops.ts` → `BUILD_WORKSHOPS[i].agencyService`** — the "Have us build it" upsell block on each `/build/[slug]` page (name + tagline + price + href).

The `BUILD_LAYER` titles match `AGENCY_SERVICES` capability names — that's already enforced by a dev-mode check. The drift is in the workshop pages' agency upsell block.

## Drift found (workshop "Have us build it" vs `/services`)

| Capability | `/services` price | `/build/[slug]` upsell shows | Status |
|---|---|---|---|
| Brand identity | **From $2,900** · "Brand identity" service | $2,900 · **"Brand & Website Build"** | name wrong (bundles website) |
| A website that converts | **From $4,800** · "Website that converts" | **$2,900** · "Brand & Website Build" | price + name wrong |
| Social presence | **From $1,800 setup + $1,200/mo** | **$2,100/mo** · "Marketing Engine" | price + name wrong |
| A content engine | **From $2,400/mo** | **$2,100/mo** · "Marketing Engine" | price + name wrong |
| AI as your operating system | From $4,500 · "AI Ops" | $4,500 · "AI Ops Sprint" | OK |
| Email, CRM, and automation | **From $3,200** | **$2,100/mo** · "Marketing Engine" | price + name wrong |
| Sales systems | From $3,800 · "Sales systems" | $3,800 · "Sales System Sprint" | OK |
| Legal, financial, ops | From $1,200 · "Legal/Fin/Ops" | $1,200 · **"Launch Kit"** | name wrong |

Workshop tier prices ($197 / $297 / $397) are correctly mapped to the `/services` retail prices via `workshopPriceForRetailCents()` — no drift there.

`SERVICE_PACKAGES` in `framework-deliverables.ts` is dead code (no importers). Three of the legacy package names ("Brand & Website Build", "Marketing Engine", "Launch Kit") leaked into the workshop upsell blocks and are the source of the drift.

## Tracks sanity check

After the 35% reduction:
- **Launch** ($4,875) bundles Brand $2,900 + Website $4,800 + Legal $1,200 = $8,900 retail → ~45% off as a bundle. Plausible.
- **Operate** ($5,200) bundles AI $4,500 + Sales $3,800 = $8,300 → ~37% off. Plausible.
- **Growth** ($2,925/mo) bundles Social ($1,800 setup + $1,200/mo) + Content ($2,400/mo) + Email ($3,200 setup). The track is monthly-only and undercuts the sum of the monthly components alone ($3,600/mo) — that's an aggressive "from" anchor and ignores the setup fees. Flag for confirmation, do not silently change.

## Fix plan

**Single principle:** `/services` (`AGENCY_SERVICES`) is the source of truth for retail price, service name, and CTA href. The workshop pages must read from it, not duplicate it.

### 1. `src/lib/build-workshops.ts` — kill the duplicated `agencyService` block
- Remove the inline `agencyService: { name, tagline, priceLabel, href }` from all 8 workshops.
- Replace the type field with `agencyServiceTagline: string` only (the one piece of copy that's workshop-specific and worth keeping — e.g. "Site, copy, payments, and analytics — shipped live in 2 weeks").
- Add a helper that resolves the rest from `AGENCY_SERVICES` by `slug`:
  ```ts
  // returns { name, priceLabel, href, tagline } for the slug
  getWorkshopAgencyOffer(slug)
  ```
  `name` = service capability title (e.g. "A website that converts" → display as "Done-for-you: A website that converts"), `priceLabel` = `AGENCY_SERVICES[i].priceLabel`, `href` = `AGENCY_SERVICES[i].ctaHref`, `tagline` from the workshop.

### 2. `src/routes/build.$slug.tsx` — consume the resolved offer
- Replace `w.agencyService.name / tagline / priceLabel / href` with the resolved object so price + name + link always match `/services`.
- No layout changes — same fields, just sourced from one place.

### 3. Rewrite the 8 `agencyServiceTagline` strings so they describe the matching service (not a legacy bundle)
Specifically these were misaligned:
- **Brand identity** → "Logo system, voice, and asset pack — shipped in 2 weeks." (drop "+ website")
- **Website that converts** → keep current "Site, copy, payments, and analytics — shipped live in 2 weeks."
- **Social presence** → "Two channels rebuilt, 30-day calendar shipped, posting cadence held."
- **Content engine** → "Pillars, SEO map, and 8 anchor pieces a month — repurposed everywhere."
- **AI OS** → keep current ("30 days, 10 workflows rewired around AI, documented").
- **Email, CRM, automation** → "CRM live, 3 sequences shipped, deliverability fixed — in 3 weeks."
- **Sales systems** → keep current.
- **Legal/financial/ops** → "LLC, EIN, contracts, books — done in 10 business days."

### 4. Add a dev-mode consistency check
Mirror the existing `AGENCY_SERVICES` ↔ `BUILD_LAYER` dev check: warn if any `BUILD_WORKSHOPS[i].slug` lacks a matching `AGENCY_SERVICES` entry, or if the workshop tier (`priceCents`) doesn't match `workshopPriceForRetailCents()` applied to the resolved retail price. This makes future drift impossible to ship silently.

### 5. Delete dead code
- Remove the unused `SERVICE_PACKAGES` export and `ServicePackage` type from `framework-deliverables.ts` (no importers). This is what seeded the legacy bundle names; deleting it removes the temptation to repeat the mistake.

## Out of scope (will ask before touching)

- Re-pricing any of the 8 services or 3 tracks. Specifically the **Growth Track $2,925/mo** anchor vs. the higher sum of its monthly components — flag only.
- Changing workshop tier prices ($197/$297/$397) — they map cleanly today.
- Visual / layout changes on any page.

## Acceptance

- Loading `/services`, the homepage, and any `/build/[slug]` shows the same price and the same service name for the same capability.
- Clicking "Have us build it" from a workshop lands on the matching `/contact?service=...` URL used by the `/services` card.
- Dev console warns on any future drift.

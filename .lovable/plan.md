# Reduce service prices by 35%

Apply -35% then round to the nearest $100 to all estimated service prices. Real, fixed prices (the $97 workshop) are left alone. Sample business-idea content in `business-ideas.ts` is illustrative founder examples, not our pricing — out of scope.

## Price changes

| Item | Old | -35% | Rounded |
|---|---|---|---|
| Strategy Sprint | $2,500 | $1,625 | **$1,600** |
| Brand & Website Build | $4,500 | $2,925 | **$2,900** |
| Launch Kit | $1,800 | $1,170 | **$1,200** |
| Marketing Engine | $3,200/mo | $2,080 | **$2,100/mo** |
| Workshop credit threshold | $1,500 | $975 | **$1,000** |

## Files

**`src/lib/framework-deliverables.ts`** — update `priceLabel` on all four `SERVICE_PACKAGES`:
- `"From $2,500"` → `"From $1,600"`
- `"From $4,500"` → `"From $2,900"`
- `"From $1,800"` → `"From $1,200"`
- `"From $3,200/mo"` → `"From $2,100/mo"`

**`src/routes/services.tsx`** (line 79) — update the credit copy:
- `"any engagement above $1,500"` → `"any engagement above $1,000"`

## Out of scope

- `WORKSHOP_PRICE_LABEL = "$97"` — actual ticket price, not an estimate.
- `src/lib/business-ideas.ts` — sample business ideas shown to founders (their hypothetical offers/income), not StartupLabs pricing.
- `src/lib/workflow.ts` placeholder `"$500–$1,500"` — example placeholder text in a founder-facing form field, not our pricing.

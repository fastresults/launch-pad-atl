## Fix

I incorrectly stripped pricing from the 8 individual agency service cards too. Only the 3 tracks (Launch / Growth / Operate) in the screenshot should be bespoke-priced.

## Changes

**`src/lib/agency-services.ts`** — revert `priceLabel` and `timelineLabel` on all 8 `AGENCY_SERVICES` entries to their original values:

| Service | priceLabel | timelineLabel |
|---|---|---|
| brand-identity | From $2,900 | 2 weeks |
| website-that-converts | From $4,800 | 2–3 weeks |
| social-presence | From $1,800 setup + $1,200/mo | Live in 2 weeks |
| content-engine | From $2,400/mo | Ongoing |
| ai-operating-system | From $4,500 | 30 days |
| email-crm-automation | From $3,200 | 3 weeks |
| sales-systems | From $3,800 | 30 days |
| legal-financial-ops | From $1,200 | 10 business days |

The 3 `AGENCY_TRACKS` entries (launch/growth/operate) stay bespoke — no change.

Nothing else edited. Workshops were never touched and remain $197/$297/$397.

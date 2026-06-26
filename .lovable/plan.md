## Goal
Remove "Established Small Business" (a stage, not a startup archetype) and replace it with **E-commerce / DTC Brand** — a true founder archetype that maps cleanly onto the 21 launch deliverables.

## Why
"Established Small Business" describes an *operating* business, which contradicts the platform's pre-launch positioning and produces deliverables that don't fit (the 21 docs are launch artifacts). Every other track is keyed by archetype; this one was keyed by stage, causing the confusion the user reported. E-commerce / DTC is a high-frequency founder type currently uncovered by Main Street (no storefront) or SaaS (no software).

## Changes

### `src/lib/tracks.ts`
1. Rename the `small_business` entry → `ecommerce_dtc`:
   - `key: "ecommerce_dtc"`
   - `label: "E-commerce / DTC Brand"`
   - `oneLiner: "Physical product, launching online-first"`
   - `description`: First-time founders launching a direct-to-consumer brand — apparel, beauty, food/beverage, home goods, accessories. Sold via own Shopify, Amazon, or marketplaces. Focus is product-market fit on a single hero SKU, first 1,000 customers, paid + organic content engine, repeat-purchase economics.
   - `tonePrompt`: Write as a DTC operator coaching a first-time brand founder. Lead with hero-SKU clarity, COGS / landed cost / contribution margin, MOQ and supplier risk, packaging and unboxing, paid-social creative testing (Meta + TikTok), Shopify funnel basics, email/SMS as the owned channel, repeat-purchase rate and LTV, fulfillment (3PL vs self-ship). Replace VC vocabulary with DTC realities — talk gross margin %, CAC by channel, AOV, contribution profit, blended ROAS, payback in orders. Skip ARR/NRR. Use concrete dollar figures and creator/UGC tactics they can execute solo.
2. Update `TrackKey` union: replace `"small_business"` with `"ecommerce_dtc"`.
3. Update `TRACK_SEEDS`:
   - New `ecommerce_dtc` array with launch-stage DTC exemplars: `allbirds.com`, `magicspoon.com`, `liquiddeath.com`, `oliveandjune.com`, `chamberlaincoffee.com`, `jollyranger`-type indie brands. Mix of categories (apparel, food, beverage, beauty), national market_scope, US-based.
4. Add legacy-key safety in `getTrack()`: if `key === "small_business"`, return the new `ecommerce_dtc` track so old snapshots still render. Optional: surface a small "legacy track migrated" badge — skip for now unless needed.

### Edge Functions that switch on track key
Replace any `small_business` branch with `ecommerce_dtc` and the new tone, in:
- `supabase/functions/venture-deep-research/index.ts`
- `supabase/functions/venture-synthesize-concept/index.ts`
- `supabase/functions/venture-generate-document/index.ts`
- `supabase/functions/venture-bulk-generate/index.ts`
- `supabase/functions/venture-generate-assessment/index.ts`
- `supabase/functions/venture-generate-roadmap/index.ts`
- `supabase/functions/dev-reverse-engineer-concept/index.ts`

If any branch references `small_business` literally, swap to `ecommerce_dtc`. The Main Street ("lifestyle") track remains unchanged and remains the "Most attendees" default.

### Frontend references
- `src/lib/brief-to-snapshot.ts`: route any prior "established / operating / revenue" classifier output away from `small_business` → `ecommerce_dtc` only when DTC/product signals are present, otherwise `lifestyle`.
- `src/routes/_authenticated/dashboard/hub.new.tsx`, `hub.$snapshotId.tsx`, `RegisterFramework.tsx`, `HomeFramework.tsx`, `services.tsx`, `business-ideas.ts`, `agency-services.ts`, `HomeBusinessIdeasScroller.tsx`: these read from `TRACKS` so they pick up automatically; spot-check for any hardcoded `small_business` strings or "Established Small Business" copy and update.

### Database
No migration. `venture_snapshots.track` is free-text. Legacy `small_business` rows continue working via the `getTrack()` fallback above.

## Out of scope
- No change to pricing, deliverable count, or Main Street's "Most attendees" treatment.
- No change to marketing-page hero copy beyond the track list.
- No new track beyond the replacement.

## Verification after build
- Open `/dashboard/hub/new`: track grid shows 7 tracks with E-commerce / DTC Brand in slot 2; Main Street still flagged "Most attendees".
- Pick E-commerce / DTC → submit → confirm snapshot stores `track: "ecommerce_dtc"` and the Hub detail page renders the new label and oneLiner.
- Hit one document generation to confirm the new `tonePrompt` is injected (spot-check function logs or a generated doc's voice).

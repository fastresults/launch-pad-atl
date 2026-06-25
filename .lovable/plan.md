# Main Street Startup track — first-class across the workflow

## Context

~80% of workshop attendees are **small main-street / entrepreneurial founders** — solo or small-team operators starting a real business (café, salon, trade, local service, small product/brand, indie e-commerce). They are *not* venture-track SaaS, *not* established small/medium businesses with existing books.

Today the closest track is `lifestyle` ("Lifestyle / Main Street"), but:
- The label "Lifestyle" undersells it and reads as "side hustle"
- It's buried in a 7-tile grid with no default
- Several document prompts (executive summary, budget pro-forma, roadmap, deep-research lens, McKinsey assessment) still default to investor/VC framing even when this track is picked
- Homepage, register flow, and Hub onboarding don't signal who this workshop is actually for

This plan promotes a sharpened **"Main Street Startup"** track to the primary ICP and propagates that framing end-to-end.

## What changes

### 1. Track definition (`src/lib/tracks.ts`)
- Rename `lifestyle` → label **"Main Street Startup"** (keep `key: "lifestyle"` so existing snapshots keep working — no DB migration needed)
- Rewrite `oneLiner`, `description`, and `tonePrompt` to reflect first-time main-street founders: cafés, salons, trades, local services, small brands, indie e-commerce. Focus on first $10k MRR / first 100 customers / opening week, not "revenue over scale"
- Reorder `TRACKS` so Main Street is **first**
- Sharpen `small_business` to mean *already-operating* SMBs (so the two don't overlap)
- Refresh `TRACK_SEEDS.lifestyle` with more on-brand main-street examples (independent coffee shop, local bakery, mobile detailer, indie skincare brand, neighborhood gym)

### 2. New-snapshot flow (`src/routes/_authenticated/dashboard/hub.new.tsx`)
- Default `track` state to `"lifestyle"` (pre-selected) instead of empty
- Add a small "Most attendees pick this" pill on the Main Street tile
- Update the "What's this?" helper copy to say the workshop is built for main-street founders by default; other tracks are available if you're building something different
- Keep all existing validation and behavior intact

### 3. Document generation (`supabase/functions/venture-generate-document/index.ts`)
- Update `TRACK_TONE.lifestyle` to mirror the new `tonePrompt`
- Modify the `executive_summary`, `business_plan`, `gtm_plan`, and `budget_pro_forma` system prompts so that when the track is `lifestyle`:
  - Replace "TAM/SAM/SOM" with "Local market size + realistic first-year customer count"
  - Replace "funding ask / instrument" with "Startup costs + working capital + simple funding options (savings, SBA microloan, friends-and-family, revenue-based)"
  - Replace "pitch deck"-style language with "one-page lender/partner summary"
- `budget_pro_forma` intake schema: add a Main-Street-specific branch (owner draw, single location, no headcount required, cash vs. card mix) when the track is `lifestyle`

### 4. Deep research lens (`supabase/functions/venture-deep-research/index.ts`)
- Update `TRACK_LENS.lifestyle` to emphasize: local foot-traffic / search demand, hyperlocal competitors within 5–10 mi, neighborhood demographics, local pricing benchmarks, permits/licenses, supplier options — instead of category-level competitive landscape

### 5. Founder Roadmap (`supabase/functions/venture-generate-roadmap/index.ts`)
- When track is `lifestyle`, swap "investor pitch chapter" for a **"First customers & first revenue"** chapter, and tune the 45-day sprint to opening-week / first-paying-customer milestones rather than fundraising milestones
- The "Field You're Entering" chapter focuses on hyperlocal competitors, not category leaders

### 6. McKinsey-grade assessment (`supabase/functions/venture-generate-assessment/index.ts`)
- Add a Main-Street lens: unit economics per transaction, breakeven covers/customers per day, neighborhood density, repeat-rate, word-of-mouth loops — replacing TAM modeling and venture-readiness scoring

### 7. Homepage signal (`src/components/home/HomeFramework.tsx`)
- Add a single subtle line in the hero eyebrow or proof strip: *"Built for main-street founders — cafés, salons, trades, local services, indie brands"* (does not change visual layout, just one copy line)

### 8. Sync `src/lib/tracks.ts` ↔ edge functions
- The `TRACK_TONE` and `TRACK_LENS` maps in edge functions are hand-mirrored. Update both anywhere `lifestyle` appears so the prompts stay in sync with the TS source of truth.

## Out of scope
- No database schema changes (the `track` column stays a free string, `lifestyle` key preserved)
- No changes to which 34 deliverables are produced — only the **framing** of each when the Main Street track is picked
- Pricing, registration, and admin remain untouched

## Technical notes
- All edge-function prompt changes are string edits; no new functions or tables
- All UI changes are in 2 files (`hub.new.tsx`, `HomeFramework.tsx`)
- The `TRACK_TONE` map in `venture-bulk-generate/index.ts` likely mirrors `venture-generate-document` — will update both

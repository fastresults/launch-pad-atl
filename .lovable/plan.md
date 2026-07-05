## Goal
Categorize every asset in the 14-day sprint into one of four **tracks** — Introduction, Education, Tracking, Action — surface the track on each row, and let the founder sort/group the day's assets by track.

## Track definitions
- **Introduction** — sets identity, positions the business, defines who/what/why (mission, personas, positioning, messaging).
- **Education** — teaches, plans, recommends, briefs; things you read and internalize (playbooks, briefs, plan docs, prompt library, framework).
- **Tracking** — measurement, pipelines, calendars, cadences, financial models — instruments you watch.
- **Action** — deploy/ship/execute; live setups, kits, tests, launches, integrations.

## Asset → Track map (all 48)

```text
Day 1  Lock the concept
  executive_summary                    Introduction
  vision_mission                       Introduction
  problem_solution                     Introduction
  ai_tool_stack_recommendation         Education

Day 2  Sharpen the offer
  value_proposition                    Introduction
  pricing_offer_sheet                  Action
  ai_prompt_library                    Education

Day 3  Name your buyers, load the CRM
  customer_personas                    Introduction
  first_50_warm_list                   Tracking
  crm_pipeline_starter                 Tracking

Day 4  Validate demand
  pre_sell_offer_test                  Action
  landing_page_waitlist_test           Action

Day 5  Pick your wedge
  competitive_positioning              Introduction
  market_analysis                      Education

Day 6  Turn on the sales machine
  go_to_market_plan                    Education
  sales_playbook                       Education
  outbound_dm_email_scripts            Action
  booking_calendar_setup               Action
  sales_call_recording_stack           Tracking
  supplier_shortlist                   Action

Day 7  Message + brand voice
  brand_messaging                      Introduction
  brand_messaging_house                Introduction
  brand_voice_tone_guide               Education
  brand_strategy_framework             Education

Day 8  Legal + entity
  legal_structure_brief                Education
  terms_privacy_refund_pack            Action
  insurance_starter                    Action

Day 9  Money infrastructure
  payments_checkout_setup              Action
  business_bank_books_starter          Action

Day 10 Domain, email, tracking
  domain_email_dns_checklist           Action
  analytics_pixel_setup                Tracking
  email_marketing_setup                Action

Day 11 Ship the site + brand pack
  website_prd                          Education
  visual_identity_brief                Introduction
  logo_brand_asset_pack                Action

Day 12 Ops, support bot, automations
  fulfillment_sop                      Education
  customer_support_starter             Action
  operating_plan                       Education
  ai_support_bot_setup                 Action
  automation_recipes_starter           Action
  bom_and_landed_cost                  Tracking

Day 13 Content + weekly rhythm
  launch_content_kit                   Action
  content_calendar_90day               Tracking
  social_media_audit_setup             Tracking
  founder_operating_cadence            Tracking

Day 14 Launch day + proof + growth loops
  paid_ads_starter_pack                Action
  reviews_testimonials_kit             Action
  financial_model                      Tracking
  ad_creative_pack                     Action
  referral_affiliate_starter           Action
```

Track totals across the sprint: **Introduction 11 · Education 11 · Tracking 10 · Action 16**.

## Changes

### 1. New file `src/lib/asset-tracks.ts`
- Export `type AssetTrack = "Introduction" | "Education" | "Tracking" | "Action"`.
- Export `ASSET_TRACK: Record<string, AssetTrack>` seeded with the 48-entry map above.
- Export `TRACK_META: Record<AssetTrack, { label, icon, dot, chip, order }>`:
  - Introduction — `Compass` icon, `bg-indigo-400`, chip `bg-indigo-500/10 text-indigo-300 border-indigo-400/30`, order 1
  - Education — `BookOpen` icon, `bg-primary`, chip `bg-primary/10 text-primary border-primary/30`, order 2
  - Tracking — `Activity` icon, `bg-amber-400`, chip `bg-amber-500/10 text-amber-300 border-amber-400/30`, order 3
  - Action — `Zap` icon, `bg-teal-400`, chip `bg-teal-500/10 text-teal-300 border-teal-400/30`, order 4
- Export helper `trackFor(key: string): AssetTrack` (defaults to `Action` if key is missing, logs a dev warning so future assets don't fall through the cracks).

### 2. `src/components/hub/LaunchPlanner14Day.tsx` — render track + add sort control
- Import `ASSET_TRACK`, `TRACK_META`, `trackFor`.
- Add a `sortMode` state: `"sequence" | "track"` (default `"sequence"`; persisted to `localStorage` under `hub:launch14:sortMode`).
- Above the asset list, add a compact segmented control on the right side of the day header row:
  ```
  Sort:  [ Sequence ] [ By track ]
  ```
  Small (`h-7 text-xs`), muted background, active segment uses `bg-primary text-primary-foreground`.
- Row rendering: after the asset title, render a small `TrackChip` (rounded-full, `text-[10px] uppercase tracking-wide`, icon + label, uses `TRACK_META[track].chip`). Chip sits on the same line as the title, right after the "Physical products only" pill when both apply.
- When `sortMode === "track"`:
  - Group the day's filtered `assetKeys` by track using `TRACK_META.order`.
  - Render each non-empty track as a subsection: a small header row with the track dot + label + count (`Introduction · 2`), then the row `<li>`s below it. Preserve the current row visuals (checkmark, name, subtitle, buttons).
  - Track-group headers are `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground` with a colored dot from `TRACK_META[track].dot`.
- When `sortMode === "sequence"`: current behavior, unchanged, chips still appear.

### 3. Framework category cards (`src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`)
- The framework-deliverables item list currently renders item titles with a tooltip only. Add the same `TrackChip` next to each item title (small, inline) so the classification is visible everywhere the asset is listed — not just inside the sprint. Look up via `trackFor(assetType)` using the mapping between framework item titles and deliverable keys already present in the render loop (search for the item.title → type resolver near the framework category renderer).

### 4. Optional (nice-to-have, include in same pass)
- Sprint header meta line: after `48/48 assets ready`, append a one-line track breakdown when hovered/tooltipped — e.g. `11 Intro · 11 Edu · 10 Track · 16 Action`. Cheap, informative, no layout impact.

## Files touched
- **New:** `src/lib/asset-tracks.ts`
- **Edit:** `src/components/hub/LaunchPlanner14Day.tsx` — track chips, sort control, grouped rendering.
- **Edit:** `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — chip on framework category item rows; optional sprint-header breakdown.

## Verification
- Load `/dashboard/hub/:id`; open Day 1 → each row shows a colored track chip (Executive Summary/Vision & Mission/Problem = Introduction; AI Tool Stack = Education).
- Toggle **Sort: By track** on Day 6 — three subgroups appear in order: Education (GTM Plan, Sales Playbook), Tracking (Sales Call Recording Stack), Action (Outbound Scripts, Booking & Calendar, Supplier Shortlist).
- Toggle back to Sequence — rows return to their original order.
- Refresh → sort preference persists.
- Framework category "Strategy" card now shows track chips beside item titles.
- `bunx tsgo --noEmit` clean.

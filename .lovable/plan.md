## What to build

A new **14-Day Launch Planner** card, mounted directly below `FounderRoadmapCard` on the Hub, that turns the abstract "14-day method" into a beautiful, interactive week-by-week visual — every day tile linking to the exact assets on the same page.

## Design (award-winning, but on-brand)

Two-week timeline card, dark-glass surface, aligned with the existing purple hero card so the two cards read as a set.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ 14-DAY LAUNCH METHOD           Progress: 8/14 days ready · 34/50 assets  │
│ From concept to first paying customer — one day at a time                │
│                                                                          │
│ WEEK 1 · FOUNDATION & VALIDATION                                         │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                             │
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │ │ 7 │   ← seven day tiles         │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                             │
│                                                                          │
│ WEEK 2 · BUILD, LAUNCH, SELL                                             │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                             │
│  │ 8 │ │ 9 │ │10 │ │11 │ │12 │ │13 │ │14 │                             │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                             │
│                                                                          │
│ ▼ Day 4 · Validate demand with a pre-sell                                │
│   Owner: Founder · Done when: first paid deposit or 5 LOIs               │
│   Assets you'll ship today:                                              │
│    ● Pre-Sell Offer & Waitlist Test    → Open (complete)                 │
│    ● Landing Page & Waitlist Test      → Open (complete)                 │
│    ○ Outbound DM & Email Scripts       → Generate                        │
└──────────────────────────────────────────────────────────────────────────┘
```

Interactions:
- Each day tile is a button. States: **complete** (all linked assets done → filled primary), **ready** (upstream deps met → outlined primary), **pending** (grey), **today** (ring + subtle pulse based on where in the 14-day arc the founder is, computed from snapshot.created_at or roadmap_generated_at).
- Clicking a tile expands the detail panel below (accordion, one open at a time). Detail panel lists 2–4 linked assets — each is a row with icon, title, status dot, and an action button.
- Asset-row action:
  - If complete → **Open** (calls `setViewerDoc(doc)` via a prop passed from the Hub route)
  - If pending → **Generate** (calls the per-doc generate mutation, same as the list below)
  - Secondary link → **Jump to card** which scrolls to the document row in the list below (`element.scrollIntoView({behavior:"smooth", block:"center"})` and briefly rings the row).
- Header stat: `X/14 days complete · Y/50 assets ready`.
- Empty/first-run state: same shell, but tiles are muted and the primary CTA on the card is `Start Day 1` → triggers Foundation generation.

Micro-visual polish:
- Tiles are 56×56 rounded-xl cards with day number top-left, a two-word theme underneath truncated with ellipsis on hover.
- Connecting hairline between Days 1–7 and 8–14 (dashed border-top through the row) to reinforce the "sprint" metaphor.
- Week label pills sit above each row.
- Category color-dot on each tile that mirrors the FRAMEWORK_STAGES color for the dominant deliverable of that day (Foundation purple, Strategy indigo, Operations teal, Finance amber, Governance slate, Marketing rose).

## Day → asset mapping (canonical, deterministic)

Hard-coded in a new `src/lib/launch-14day-plan.ts` — no LLM parsing required, so the visualization is always accurate. Draft mapping (mirrors the `launch_plan_14day` prompt's arc):

| Day | Theme | Linked asset keys |
|---|---|---|
| 1 | Lock the concept | `executive_summary`, `vision_mission`, `problem_solution` |
| 2 | Sharpen the offer | `value_proposition`, `pricing_offer_sheet` |
| 3 | Name buyers, build the list | `customer_personas`, `first_50_warm_list` |
| 4 | Validate demand | `pre_sell_offer_test`, `landing_page_waitlist_test` |
| 5 | Pick your wedge | `competitive_positioning`, `market_analysis` |
| 6 | Plan the sales motion | `go_to_market_plan`, `sales_playbook`, `outbound_dm_email_scripts` |
| 7 | Message + brand voice | `brand_messaging`, `brand_voice_tone`, `brand_strategy` |
| 8 | Legal & entity | `legal_structure_brief`, `terms_privacy_refund_pack`, `insurance_starter` |
| 9 | Money infrastructure | `payments_checkout_setup`, `business_bank_books_starter` |
| 10 | Domain, email, tracking | `domain_email_dns_checklist`, `analytics_pixel_setup` |
| 11 | Ship the site | `website_prd`, `visual_identity_brief` |
| 12 | Ops + support ready | `fulfillment_sop`, `customer_support_starter`, `operating_plan` |
| 13 | Content + launch kit | `launch_content_kit`, `90_day_content_calendar`, `social_media_setup` |
| 14 | Launch day + proof loop | `paid_ads_starter_pack`, `reviews_testimonials_kit`, `financial_model` |

If a mapped key doesn't exist in the venture's active `venture_document_types`, it's silently skipped so the planner never renders a broken link.

## Files

**New**
- `src/lib/launch-14day-plan.ts` — the 14-day mapping (day, theme, one-line objective, done-when, asset keys, dominant category).
- `src/components/hub/LaunchPlanner14Day.tsx` — the card component. Props: `docs`, `typeByKey`, `onOpenDoc(doc)`, `onGenerateDoc(key)`, `onScrollToDoc(key)`, `snapshotStartedAt`.

**Edited**
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`
  - Import and render `<LaunchPlanner14Day …/>` right after the `FounderRoadmapCard` line (~1137). Always visible once `completeCount > 0` (not gated on `heroDone`), because it *is* the roadmap for the still-in-progress founder too.
  - Wire `onOpenDoc` → `setViewerDoc`, `onGenerateDoc(key)` → existing per-doc generate mutation, `onScrollToDoc(key)` → `document.getElementById(\`doc-${key}\`)?.scrollIntoView(...)`.
  - Add `id={\`doc-${d.type}\`}` to the doc row wrapper in the list below.

No backend, no migration, no changes to the `launch_plan_14day` prompt. Purely a new presentational surface that composes existing docs.

## Verification

- Screenshot the Hub at three states — first-run (0/50), mid-sprint (34/50 as in the current preview), fully complete (50/50) — and confirm tile states, hotlinks, and category colors all read correctly.
- Click Day 4 → expand → click "Open Pre-Sell Offer" → confirm the `DocumentViewer` opens the correct doc.
- Click "Jump to card" on any asset row → confirm the list below scrolls the row into view.
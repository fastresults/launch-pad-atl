# 14-Day Launch Method — Asset Audit

Reviewed all 34 deliverables in `src/lib/framework-deliverables.ts` across Foundation, Strategy, Operations, Finance, Governance, Brand, Marketing, and Social & Content, plus the `BUILD_LAYER` execution pieces.

Verdict: the 34 assets teach founders how to **think** about a startup, but several concrete pieces required to actually **take money in 14 days** are missing or implied but not delivered. Below is what holds up, what's soft, and what to add.

## What already carries weight (keep as-is)
- **Foundation** — Exec Summary, Vision, Problem/Solution, Value Prop. Solid one-page story.
- **Strategy** — Market, Personas, Positioning, GTM, Messaging. Complete.
- **Brand (bonus)** — Strategy → Messaging → Visual → Voice → Guidelines. Complete system.
- **BUILD_LAYER** covers brand, website, social, content engine, AI ops, 16-email nurture, sales script, entity/contracts/books.

## Gaps that block a real 14-day launch

### 1. Foundation — missing the sprint itself
- **14-Day Launch Plan (day-by-day)** — the calendar that sequences the other 34 assets into 14 dated blocks with owner, output, and "definition of done." Without this, the method is a promise, not a plan.

### 2. Strategy — no path to the first buyer
- **First-50 Warm List** — named prospects with contact, angle, and ask. This is the difference between "we have a persona" and "we have a pipeline on day 3."
- **Pre-Sell Offer / Waitlist Test** — a 48-hour validation offer (deposit, LOI, or paid pilot) that proves demand *before* the site ships.

### 3. Operations — nothing on delivering the first sale
- **Fulfillment SOP** — how order #1 through #10 actually gets delivered, step by step, with time and cost per unit.
- **Customer Support Starter** — inbox, response SLA, canned replies, refund/return rules. Day-15 problems that must be answered on day 14.

### 4. Finance — the money can't actually move
- **Payments & Checkout Setup** — Stripe/Square account, tax, payout, receipts, one live checkout link. Today there's a Financial Model but no way to *collect*.
- **Business Bank + Bookkeeping Starter** — bank account opened, card issued, books tool connected, chart of accounts seeded.
- **Pricing Page & Offer Sheet** — packaged tiers, terms, what's included, what's not — the artifact the checkout link points at.

### 5. Governance — bankable ≠ transactable
- **Terms of Service, Privacy Policy, Refund Policy** — required by Stripe, app stores, and any B2B buyer's procurement. Legal Structure Brief covers entity, not customer-facing policy.
- **Insurance Starter** — GL/E&O quote and bind path; landlords, venues, and enterprise buyers ask on day one.
- **Contractor / 1099 Kit** — MSA, SOW, W-9, IP assignment. First hire is almost always a contractor.

### 6. Marketing — the site can ship but can't be measured or found
- **Domain, Email, DNS Checklist** — domain purchase, Google Workspace, SPF/DKIM/DMARC, support@ alias. The Website PRD assumes these exist.
- **Analytics & Pixel Setup** — GA4, Meta/TikTok pixel, conversion events, UTM convention. Without this, the paid ads starter has nothing to optimize against.
- **Landing Page / Waitlist Test** — a one-page offer test that runs *before* the full site, so paid ads and warm outreach have a destination on day 4, not day 12.

### 7. Social & Content — attention without proof
- **Reviews & Testimonials Capture Kit** — request templates, Google/Yelp/G2 links, video ask script, wall-of-love page. Traction dies without social proof by week two.
- **Outbound DM / Email Scripts** — cold-warm scripts tied to the First-50 list above. Content Calendar handles inbound; nothing today handles outbound.

## Recommended additions (12 new assets)

| # | Stage | New deliverable |
|---|-------|-----------------|
| 1 | Foundation | 14-Day Launch Plan (day-by-day) |
| 2 | Strategy | First-50 Warm List |
| 3 | Strategy | Pre-Sell Offer / Waitlist Test |
| 4 | Operations | Fulfillment SOP |
| 5 | Operations | Customer Support Starter |
| 6 | Finance | Payments & Checkout Setup |
| 7 | Finance | Business Bank + Bookkeeping Starter |
| 8 | Finance | Pricing Page & Offer Sheet |
| 9 | Governance | ToS / Privacy / Refund Policy Pack |
| 10 | Governance | Insurance Starter |
| 11 | Governance | Contractor / 1099 Kit |
| 12 | Marketing | Domain, Email, DNS Checklist |
| 13 | Marketing | Analytics & Pixel Setup |
| 14 | Marketing | Landing Page / Waitlist Test |
| 15 | Social & Content | Reviews & Testimonials Capture Kit |
| 16 | Social & Content | Outbound DM / Email Scripts |

(That's 16 candidate adds — cut, merge, or defer any you don't want promoted to the marketing framework.)

## Proposed next step
1. You approve the list (or edit it down).
2. I'll add the accepted items to `FRAMEWORK_STAGES` in `src/lib/framework-deliverables.ts` with icon, title, and the same tooltip voice as the existing 34.
3. Mirror the additions in `venture_document_types` migration + chatbot knowledge so the DB, dashboard, and bot stay in sync.
4. Update the homepage/register counts (currently derived from `TOTAL_DELIVERABLES`, so this is automatic) and any hard-coded "34" references — I'll grep and fix.

## Out of scope for this pass
- Redesigning stage order or renaming stages.
- Rewriting existing tooltips.
- Touching workshop pricing, session structure, or curriculum data.

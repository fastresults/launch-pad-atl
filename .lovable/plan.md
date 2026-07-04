# Integration Pass — Wire the 16 New Assets Into the Generation Pipeline

The 16 new asset rows exist in `venture_document_types`, but they will currently generate with the generic `BASE_SYSTEM_PROMPT` and a NULL `context_keys` slice. That produces generic advice instead of the paste-ready artifacts the existing 34 emit. This pass closes those gaps so the new assets behave like first-class citizens end-to-end.

## What's missing today

Traced through `supabase/functions/venture-generate-document/index.ts` and `venture-bulk-generate/index.ts`:

1. **No specialized prompt.** `_shared/deliverable-prompts.ts::SPECIALIZED_PROMPTS` has 15+ entries (one per legacy type). None of the 16 new types are keyed there, so each falls back to the base analyst prompt — long-form Markdown *about* the topic instead of the actual artifact (link, checklist, script, contract, policy).
2. **`context_keys` is NULL for the new rows.** The context slicer (`pickBrainSlice`) sends the full brain when keys are null, wasting tokens and producing off-topic output. The legacy 34 all have targeted keys.
3. **`model_tier` defaults to `'flash'` for every new row.** Fine for most, but the day-by-day sprint plan, pricing sheet, and payments setup should reason harder (`pro`), and list-shaped assets (First-50, DNS checklist) can drop to `'lite'` to save credits.
4. **Chatbot knowledge doesn't mention the new capabilities.** `src/lib/chatbot-knowledge.ts` and `supabase/functions/venture-chatbot/knowledge.ts` still describe the 34-asset framework and never mention payments, legal policy pack, outbound scripts, etc. — so the concierge can't route questions to them.
5. **No PRD-style bias toward paste-ready artifacts.** Existing prompts (website_prd, launch_content_kit, paid_ads_starter_pack) are explicit about deliverable *shape* — tables, fenced blocks, exact section headings. The new prompts must follow the same discipline.

## Rewrite direction: every new asset ships an AI-first artifact

Each specialized prompt will end with one **`## Paste-Ready`** block (fenced) containing the artifact a founder can literally copy into Stripe, DocuSign, their inbox, their site, or GA4. The markdown above the block is the *why*; the fenced block is the *thing*.

Artifact shapes per new type:

| Type | Paste-ready block |
|---|---|
| `launch_plan_14day` | Day 1–14 table (Date/Focus/Owner/Output/Done-when) + a Google Calendar-importable ICS-style outline |
| `first_50_warm_list` | 50-row Markdown table (Name/Company/Contact/Angle/Ask/Status) seeded from persona + market context |
| `pre_sell_offer_test` | Landing-page copy block + 3-email pre-sell sequence + deposit link script |
| `fulfillment_sop` | Numbered SOP + per-step time/cost table + handoff checklist |
| `customer_support_starter` | 8 canned reply templates + SLA table + refund decision tree |
| `payments_checkout_setup` | Stripe setup checklist + product/price JSON payload + checkout link CTA copy + tax/receipt config table |
| `business_bank_books_starter` | Chart of accounts (CSV block) + bank/tool comparison + first-week reconciliation SOP |
| `pricing_offer_sheet` | Tier table + one-page offer sheet Markdown + objection→response script |
| `terms_privacy_refund_pack` | Three fenced Markdown docs (ToS, Privacy, Refund) tuned to entity + offer, ready to paste to `/legal/*` |
| `insurance_starter` | Coverage recommendation table + carrier shortlist + COI request email template |
| `contractor_1099_kit` | MSA + SOW Markdown template + W-9 request email + IP-assignment clause block |
| `domain_email_dns_checklist` | Registrar/host recommendation + full DNS record table (A, MX, SPF, DKIM, DMARC) + verification steps |
| `analytics_pixel_setup` | GA4 event map table + pixel install snippet block + UTM naming convention + dashboard sketch |
| `landing_page_waitlist_test` | Full one-page Markdown site copy + form field spec + 2-email confirmation sequence |
| `reviews_testimonials_kit` | Request email + SMS + DM templates + video-ask script + wall-of-love HTML snippet |
| `outbound_dm_email_scripts` | 3-touch email sequence + LinkedIn DM sequence + SMS follow-up, keyed to `first_50_warm_list` |

Every prompt inherits `OUTPUT_FOOTER` (no footnotes, `QUALITY_SCORE` trailer) and enforces "no TBD / no `[insert …]`" like the existing prompts.

## Files to change

1. **`supabase/functions/_shared/deliverable-prompts.ts`** — append 16 `SPECIALIZED_PROMPTS` entries in the shapes above.
2. **Migration (SQL via the migration tool)** — one migration that:
   - Sets `context_keys` per new type (existing brain keys: `identity`, `problem`, `solution`, `customer`, `business_model_summary`, `market_facts`, `differentiators`, `known_numbers`).
   - Sets `model_tier` per new type:
     - `pro`: `launch_plan_14day`, `pricing_offer_sheet`, `payments_checkout_setup`, `business_bank_books_starter`, `terms_privacy_refund_pack`
     - `lite`: `first_50_warm_list`, `domain_email_dns_checklist`, `customer_support_starter`, `reviews_testimonials_kit`
     - `flash` (default): the remaining seven.
3. **`src/lib/chatbot-knowledge.ts`** and **`supabase/functions/venture-chatbot/knowledge.ts`** — add a short section listing the new capabilities under the 14-Day Launch Method so the concierge routes questions ("do you help with Stripe setup?", "what about a privacy policy?") to the right asset instead of deflecting.
4. **Nothing else touched.** Homepage counts derive from `TOTAL_DELIVERABLES` (already 50). Image header pipeline (`venture-document-image`) reads from the catalog, so it will generate headers for new types on first request with no code change.

## Out of scope

- No changes to the base model gateway, brain schema, or existing 34 prompts.
- No new brain context keys (reuse the eight already produced by intake).
- No UI changes — new rows flow through the existing hub, dashboard, and bulk-generate flow.

## Verification

- `bunx tsgo --noEmit` on the edited TS files.
- Spot-generate 3 of the new types against a live venture (`launch_plan_14day`, `payments_checkout_setup`, `terms_privacy_refund_pack`) and confirm each returns a paste-ready fenced artifact plus a `QUALITY_SCORE` ≥ 70.

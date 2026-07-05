# Add "Pre-Sell Landing PRD" — Day 4 Marketing asset

Today Day 4 ships two Strategy-tinted assets (`pre_sell_offer_test`, `landing_page_waitlist_test`). Neither is a hand-off spec an AI website builder can consume the way `website_prd` is on Day 11. We'll add a third asset that plays that role for the Day-4 pre-sell page — a scoped-down PRD patterned after Website PRD, filed under Marketing, and mapped into the 14-Day planner.

## New asset

- **Key:** `presell_landing_prd`
- **Name:** "Pre-Sell Landing PRD (AI-builder prompt)"
- **Category:** Marketing
- **Track:** Education (matches `website_prd`)
- **Dependencies:** `value_proposition`, `customer_personas`, `pre_sell_offer_test`, `landing_page_waitlist_test`
- **Estimated minutes:** 6
- **Brand-kit required:** yes (so brand tokens flow in like Website PRD)
- **Purpose:** Turn the Day-4 pre-sell offer + landing copy + form spec into a single paste-ready PRD that Lovable / v0 / Bolt can scaffold into a live one-pager in one shot, at the same visual bar as the Day-11 Website PRD but scoped to a single conversion page.

## PRD output shape (mirrors `website_prd`, single-page scope)

1. Page objective + primary/secondary conversion
2. Audience & message match (persona → hook → proof)
3. Section blueprint (Hero, Proof, Problem, Solution, Offer, Objection handler, FAQ, Final CTA)
4. Copy deck per section (H1/H2, sub-copy, bullets, CTA labels, microcopy — no lorem)
5. Form spec (fields, validation, success/error states, redirect)
6. Confirmation email sequence (instant + Day-2 nudge)
7. Visual + motion direction (image briefs, palette + type tokens from brand kit, motion notes)
8. Analytics events (aligned with `analytics_pixel_setup` naming)
9. Accessibility + Lighthouse targets
10. **Paste-Ready Master Prompt** — single fenced block for Lovable/v0/Bolt (same convention as Website PRD Section 8, so `DocumentViewer`'s existing PRD extractor works unchanged)

## Files to change

**Backend**
- New migration `supabase/migrations/<ts>_add_presell_landing_prd.sql`: insert row into `venture_document_types` (Marketing, sort_order between 46 and 47, deps above, icon `LayoutTemplate`).
- `supabase/functions/_shared/deliverable-prompts.ts`: add `presell_landing_prd` prompt patterned after `website_prd` but page-scoped, grounded in the deps above.
- `supabase/functions/_shared/venture-context.ts`: add `presell_landing_prd` to `BRAND_KIT_REQUIRED_TYPES`.
- `supabase/functions/venture-chatbot/knowledge.ts`: mention the new asset under Day 4.

**Frontend**
- `src/lib/launch-14day-plan.ts`: add `"presell_landing_prd"` to Day 4 `assetKeys`.
- `src/lib/asset-tracks.ts`: map `presell_landing_prd: "Education"`.
- `src/lib/framework-deliverables.ts`: add tile under Marketing with tooltip.
- `src/lib/launch-14day-guidance.ts`: extend Day 4 `suggestedSchedule` to mention handing the PRD to the builder.
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`: add `presell_landing_prd` to the client-side `BRAND_KIT_REQUIRED_TYPES` set so the same Brand-Wizard gate + toast fires as for Website PRD.
- `src/lib/chatbot-knowledge.ts`: parallel copy update.

**No changes needed**
- `DocumentViewer.tsx`'s PRD-specific UI is keyed on `document_type === "website_prd"`. Since the Day-4 PRD is a different, simpler artifact, we leave that special-case alone — the new asset renders with the standard viewer. (If you'd rather it share the "Master Prompt" extractor + repair UI, say the word and I'll widen the check to a small set.)

## Verification

- Day 4 tile shows `3/3 ready` and time chip updates.
- Planner row for `presell_landing_prd` shows the Education track chip and the `⏱ 6m read` chip.
- Day Sprint Deck picks it up automatically (slides are generated from `assetKeys`).
- Generating the asset produces the 10-section markdown with a paste-ready fenced block.
- Brand Wizard gate blocks generation with the same toast as Website PRD when brand tokens are missing.

## Open question

Track = **Education** (spec/blueprint, like Website PRD). If you'd rather it read as **Action** (because Day 4 is a shipping day), I'll flip the track + time split — say which you prefer.

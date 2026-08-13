# Utah Claims Pros — honest answer, then a complete fee-compliance sweep

## Short answer

No. I am not certain, and I just found proof that the earlier scrub missed things. It corrected the prose but did not reach every surface a share-link visitor can read.

## What I verified just now (live scan of the share payload sources)

Confirmed clean:
- Zero `R590-190` citations remain in any of the venture's documents. The only remaining mentions are inside the venture brain's own guardrail text ("never cite R590-190"), which is correct.
- The payment-handling and 10-day rescission language is present and correct in the client-facing assets: insured named as payee, no endorsement of carrier checks, `31A-26-402(3)-(4)`, `R590-274-7(2)(a)`.
- The referral starter's Offer & Terms table and Terms & Conditions were properly rewritten to an uncompensated professional network.

Confirmed still wrong:
1. `referral_affiliate_starter` — the paste-ready outreach email still says: "we provide you with a **$500 referral incentive** as a token of our appreciation." This directly contradicts the corrected terms two sections above it. The scrub did not descend into fenced code blocks / paste-ready templates.
2. `pre_sell_offer_test` — a botched regex substitution produced the nonsense phrase "Utah's claim-handling rules under-scoping risks," and the offer promises "locked-in preferred contingency rates" before any loss or written per-claim contract exists.
3. `legal_structure_brief` — proposes a bonus pool paying contributors "a percentage of the contingency fees they help recover" (fee-splitting exposure with unlicensed persons), and describes the fee only as "capped by state law" without the actual Utah terms.
4. `value_proposition` and `website_prd` — still reference "Section 312," a citation that does not carry the meaning used.
5. `pricing_offer_sheet` — the 10% contingency and audit-fee credit are stated without the 72-hour policy-limits exception in `31A-26-402(2)`, so the fee promise reads as if it applies to every payment.

Not yet scanned (my count queries failed on column types): ops tasks, content-calendar posts, ad canvas copy, and collateral metadata. These render inside the share link and must be checked before anyone claims coverage.

## The fix

### 1. Full-surface inventory
Enumerate every field the `venture-share` function returns — documents, brand kit, collateral meta, social assets, content ads, calendar posts, ops tasks/updates, snapshot narrative fields, timeline and scene brief JSON — and scan all of them, including text inside fenced code blocks, tables, JSON string values and paste-ready templates.

### 2. Targeted rewrites (not regex)
Rewrite each flagged passage by hand so it is coherent, not word-swapped:
- Remove the `$500 referral incentive` email and replace it with a no-compensation thank-you version consistent with the terms already in that asset.
- Repair the garbled `pre_sell_offer_test` sentence; drop pre-loss "locked-in contingency rates" in favour of a stated rate disclosed in the per-claim written contract.
- Replace the fee-percentage bonus pool with salary/discretionary bonus language and a note that adjuster fees are not shared with unlicensed persons.
- Replace `Section 312` with the correct citation or plain-language description.
- Add the 72-hour policy-limits carve-out wherever a fee percentage is quoted.

### 3. A standing compliance linter
Add a shared checker that runs over generated content for this venture (and any venture carrying `compliance_rules`), flagging: banned rule numbers, referral/commission/gift-card payment language, "no fee unless / nothing unless" promises, adjuster check endorsement, and any fee percentage quoted without the policy-limits exception. Run it as a post-generation gate so a document cannot land in the share payload while it trips a rule, and expose the results in the Founders Hub generation health panel.

### 4. Verification report
Re-run the scan after the rewrites and produce a per-surface pass/fail table so "everything is corrected" is a checked claim rather than an assertion. Existing backups in `venture_document_scrub_backup` stay intact; new edits get their own backup pass first.

## Technical notes
- Scan surfaces: `venture_documents.content`, `venture_snapshots` (concept/value-prop/timeline/scene-brief JSON), `venture_ops_tasks`, `venture_ops_updates`, `venture_content_calendar_posts`, `venture_content_ads`, `venture_social_assets`, `venture_brand_collateral.meta`.
- Linter lives beside the existing compliance-lock logic in `supabase/functions/_shared/venture-context.ts`, called from the generation gates rather than a one-off migration.
- Content rewrites go through a backup-then-update migration, same pattern as the prior scrub.

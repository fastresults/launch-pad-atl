# Utah Claims Pros — regulatory scrub of every generated asset

Utah Claims Pros (Parowan, UT) has a complete asset set: 60 written assets, 55 collateral pieces, 9 ad creatives, 12 calendar posts, 4 social assets, 131 operating tasks, and 1 live shareable link. Several of those assets state fee and referral facts that do not match Utah law.

## What the audit already found

Confirmed by reading the generated content:

1. **Wrong rule cited.** Multiple assets (pre-sell landing PRD, pricing sheet, sales playbook) sell an "R590-190 compliance audit". The public adjuster rule is **R590-274**. R590-190 is a different rule entirely. This is the single most damaging error — it is printed on the pre-sell page, in the offer ladder, and in sales scripts.
2. **Referral network framed as paid.** The marketing plan and referral/affiliate starter build a partner engine around roofing contractors, brokers, and attorneys. Under R590-274-7(3)(b) the adjuster may not be **compensated** for referring an insured to an attorney, appraiser, umpire, contractor, repair firm, or salvage company. Inbound referrals are legal; paid outbound referrals are not, and the affiliate asset must be rewritten as an uncompensated professional-network play.
3. **Contingency copy is incomplete, not wrong.** The 10% anchor and the "no statutory cap" line are accurate under 31A-26-402(1). What is missing everywhere is the **72-hour policy-limits exception** (31A-26-402(2)) — if the carrier pays or commits in writing to policy limits within 72 hours of the loss being reported, only reasonable time-and-expense compensation may be charged, never a percentage.
4. **No rescission or disclosure language.** Nothing in the terms/privacy/refund pack, the pre-sell page copy, or the sales playbook carries the 10-day written rescission right (31A-26-311) or the required contract disclosures.
5. **Fee-for-service and payment-handling rules absent.** No asset states that fees require actual public adjusting services performed (R590-274-7(2)(g), (3)(e)), that every settlement draft names the insured as payee and carries the insured's signature, or that the adjuster never endorses a check for the insured (31A-26-402(3)-(4)).
6. **Conflict-of-interest claim is right but unsourced.** Brand messaging already says "we avoid restoration-linked revenue" — good, and it should cite R590-274-7(2)(a) as the reason rather than presenting it as a preference.

## The fix

### 1. One compliance source of truth
Create a Utah public-adjuster compliance fact sheet stored on the venture (as confirmed facts plus banned assumptions) holding the eight rules above with citations. Every corrective edit and every future regeneration reads from this one place, so the same error cannot come back through a re-run.

### 2. Scan every asset, not just the obvious ones
A scan pass over all written assets, collateral copy, ad creatives, calendar posts, social copy, operating tasks, and the shareable link payload, flagging:
- any citation of R590-190 or any rule number other than R590-274 / 31A-26-402 / 31A-26-311
- any percentage-fee promise stated without the 72-hour carve-out
- any language paying for, or offering value in exchange for, a referral
- any "no fee unless we win" style promise (permissible only with the fee-for-service and 72-hour qualifiers)
- any offer implying repair, restoration, or contractor participation

Each hit is reported with asset, location, and the rule it breaks.

### 3. Surgical corrections, not regeneration
Fix the flagged copy in place so the approved brand voice, imagery, and structure survive:
- Replace every "R590-190" with **R590-274**, and rename the offer to a "Utah R590-274 compliance audit".
- Pricing sheet and sales playbook: keep the 10% anchor and the accurate "Utah sets no statutory cap" line; add the 72-hour policy-limits exception, the fee-for-service rule, and the alternative structures Utah allows (hourly, flat, percentage of total insurer payment, other agreed method).
- Referral/affiliate starter and marketing plan: rewrite as an **uncompensated** professional network — education, co-hosted briefings, reciprocal visibility — with an explicit "we pay nothing, and accept nothing, for a referral" line.
- Terms/privacy/refund pack: add the contract disclosure block — WE REPRESENT THE INSURED ONLY, the 10-day written rescission right, the fee-for-service notice, the exact percentage or rate, and the Utah Insurance Department contact notice.
- Pre-sell landing PRD and its FAQ: correct the rule number and add plain-language answers covering fees, the 72-hour exception, rescission, and payment handling.
- Brand messaging: keep the independence claim, attribute it to R590-274-7(2)(a).
- Operating tasks: add the contract-disclosure and rescission-window steps to the client-onboarding lane.

### 4. Guardrail for future runs
Add the compliance facts to the venture's generation context as hard constraints, so any future document, ad, or post inherits the correct rule numbers and the required qualifiers instead of re-inventing them.

### 5. Verify
Re-run the scan until zero hits, then re-check the live shareable link so the corrected copy is what a client actually sees.

## Technical notes

- Corrections are applied to `venture_documents.content`, `venture_brand_collateral`, `venture_content_ads`, `venture_content_calendar_posts`, `venture_social_assets`, and `venture_ops_tasks` for snapshot `4968b647-e4f0-4460-b254-b9927c95cce4`, with the prior text kept in each row's version history.
- The fact sheet lands in the snapshot brain (`known_numbers` / `banned_assumptions`) and is surfaced to the deliverable prompts, the same channel already used to keep generated copy honest.
- No schema changes required.

## Not included

This is a copy-accuracy pass, not legal advice or a licensing review. Nothing here asserts the founder's license status, and the corrected copy will avoid making claims about it.

-- 1. Vague/incorrect "§312" -> verified conflict-of-interest rule
update public.venture_documents set content =
  replace(replace(replace(content,
    'Utah §312', 'Utah Admin Code R590-274-7(2)(a)'),
    'Utah law (§312)', 'Utah Admin Code R590-274-7(2)(a)'),
    '§312', 'R590-274-7(2)(a)'),
  updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4' and content like '%§312%';

-- 2. Remaining paid-referral mechanics
update public.venture_documents set content = replace(content,
  '| **Payout method** | Digital Gift Card (Visa/Amazon) or Check/ACH for professional partners. |',
  '| **Payout method** | None. No payment of any kind is made for a referral. |'),
  updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4';

update public.venture_documents set content = replace(content,
  '| **Payout timing** | Within 30 days of the referred client signing a service agreement. |',
  '| **Thank-you timing** | Within 5 days of the referred client signing a service agreement — a note and public credit, never compensation. |'),
  updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4';

update public.venture_documents set content = replace(content,
  '5. **Compliance:** All referrals must comply with Utah insurance regulations. We do not offer "kickbacks" on insurance premiums; rewards are for the introduction and procurement of consulting/adjusting services.',
  '5. **Compliance:** All referrals must comply with Utah insurance law. Utah Admin Code R590-274-7(3)(b) bars a public adjuster from being compensated in connection with referrals involving attorneys, appraisers, umpires, contractors, repair firms and salvage companies, and R590-274-7(2)(a) bars any participation or financial interest in reconstruction, repair or restoration work arising from a claim. Nothing of value is paid or accepted for a referral in either direction.'),
  updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4';

update public.venture_documents set content = replace(content,
  '6. **Payment:** Rewards are issued within 30 days of a signed contract.',
  '6. **No payment:** No reward, commission, discount or gift is issued at any point in this program.'),
  updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4';

update public.venture_documents set content = replace(content,
  '$0 - $250 / Partnership (or Referral Fee)',
  '$0 — no referral or partnership fee may be paid or accepted (R590-274-7(3)(b))'),
  updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4';

-- 3. Settlement funds never route through us
update public.venture_documents set content = replace(content,
  '"source": "Settlement Checks / Escrow",',
  '"source": "Client invoice paid after the insured-payee settlement draft clears",'),
  updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4';

-- 4. Utah compliance appendix on the client-facing and legal assets
update public.venture_documents set content = content || E'\n\n## Utah Fee & Conduct Compliance (required language)\n\nEvery fee quote, offer page, proposal and representation agreement carries the following, verbatim:\n\n- **We represent the insured only.** Utah Claims Pros is a licensed public adjuster acting solely for the policyholder.\n- **How we may be paid.** Utah permits an hourly fee, a flat rate, a percentage of the total amount the insurer pays to resolve the claim, or another agreed method of calculation (Utah Code 31A-26-402(1)). The exact rate or percentage is stated in the contract before any work begins. Utah sets no statutory cap on that percentage.\n- **72-hour policy-limits exception.** If the insurer pays, or commits in writing to pay, policy limits within 72 hours of the loss being reported, we may not charge a percentage. In that case we charge only reasonable compensation for time spent and expenses (Utah Code 31A-26-402(2)).\n- **Fee for service actually performed.** We do not collect contracted compensation without performing customary public adjusting services (R590-274-7(2)(g), (3)(e)).\n- **No referral compensation.** We are not paid, and we do not pay, for referring an insured to an attorney, appraiser, umpire, contractor, repair firm or salvage company (R590-274-7(3)(b)).\n- **No conflict of interest.** We do not participate directly or indirectly in reconstruction, repair or restoration, and we hold no financial interest in any firm that receives work from your claim (R590-274-7(2)(a)).\n- **Payment handling.** Every settlement draft names you as payee and carries your signature. We never endorse a check on your behalf (Utah Code 31A-26-402(3)-(4)).\n- **10-day right to rescind.** You may cancel this contract in writing within 10 days, unless an acceptable settlement has already been reached (Utah Code 31A-26-311).\n- **Questions or complaints.** Utah Insurance Department, 4315 S 2700 W, Suite 2300, Taylorsville, UT 84129 — (801) 957-9200 / (800) 439-3805, insurance.utah.gov.\n',
  updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4'
  and document_type in (
    'pricing_offer_sheet','sales_playbook','presell_landing_prd','website_prd',
    'terms_privacy_refund_pack','legal_structure_brief','brand_messaging_house',
    'marketing_plan','referral_affiliate_starter','pre_sell_offer_test','risk_register'
  )
  and content not like '%Utah Fee & Conduct Compliance%';

-- 1) Back up everything we are about to touch
insert into public.venture_document_scrub_backup (document_id, snapshot_id, document_type, content, reason)
select id, snapshot_id, document_type, content, 'utah fee-compliance sweep 2 (share surfaces)'
from public.venture_documents
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4'
  and content ~* '(\$500 referral incentive|under-scoping risks|preferred contingency rates|Performance-Based Bonus Pool|31A-26-312|Utah Admin Code Utah|standard 10%|funds clear)';

-- 2) Paid referral incentive still hiding in the paste-ready email
update public.venture_documents set content = replace(content,
'we provide you with a $500 referral incentive as a token of our appreciation. More importantly, we',
'we send you a personal thank-you note and public credit — never cash, a gift card, a discount or a commission, because a Utah public adjuster may not be compensated in connection with a referral (Utah Admin Code R590-274-7(3)(b)). More importantly, we'),
updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4' and content like '%$500 referral incentive%';

-- 3) Garbled regex artefact from the first scrub
update public.venture_documents set content = replace(content,
'flag potential Utah''s claim-handling rules under-scoping risks',
'flag potential under-scoping risks'), updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4'
  and content like '%Utah''s claim-handling rules under-scoping risks%';

update public.venture_documents set content = replace(content,
'Compliant with Utah Admin Code Utah''s claim-handling rules',
'Compliant with Utah Admin Code R590-274'), updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4'
  and content like '%Utah Admin Code Utah''s claim-handling rules%';

-- 4) Pre-loss locked-in contingency rates
update public.venture_documents set content = replace(content,
'**Founding Member Status:** Locked-in preferred contingency rates for any future public adjusting needs.',
'**Founding Member Status:** Priority scheduling and first call on any future claim. Fees are never pre-committed: every engagement is quoted in a written, per-claim contract that states the compensation and the Utah Insurance Department notice before any work begins (Utah Code 31A-26-402).'),
updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4'
  and content like '%Locked-in preferred contingency rates%';

-- 5) Bonus pool paid out of adjuster fees
update public.venture_documents set content = replace(content,
'This allows you to reward key contributors based on a percentage of the contingency fees they help recover, without diluting your control over the firm’s direction.',
'Fund it out of firm profit and tie it to documented milestones — files closed on schedule, audit accuracy, retainer renewals — never a share of adjuster fees. Public adjuster compensation is not split with unlicensed persons (Utah Code 31A-26-402, Utah Admin Code R590-274).'),
updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4'
  and content like '%percentage of the contingency fees they help recover%';

-- 6) Wrong statute for the contractor conflict-of-interest rule
update public.venture_documents set
  content = replace(replace(replace(content,
    'Utah Code §31A-26-312', 'Utah Admin Code R590-274-7(2)(a)'),
    'Utah Code 31A-26-312', 'Utah Admin Code R590-274-7(2)(a)'),
    '31A-26-312', 'R590-274-7(2)(a)'),
  updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4' and content like '%31A-26-312%';

update public.venture_documents set content = replace(content,
'Because it is illegal and presents a massive conflict of interest.',
'Because it is a conflict of interest Utah''s public adjuster rule does not allow.'),
updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4'
  and content like '%Because it is illegal and presents a massive conflict of interest.%';

-- 7) 72-hour policy-limits exception wherever a fee percentage is quoted
update public.venture_documents set content = replace(content,
'Our percentage is invoiced to you once the settlement funds clear.',
'Our percentage is invoiced to you once the settlement funds clear. No fee is charged on a policy-limits payment the carrier tenders within 72 hours of the loss being reported (Utah Code 31A-26-402(2)), and the rate, the Utah Insurance Department notice and your 10-day right to rescind appear in the written contract before any work begins.'),
updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4'
  and content like '%Our percentage is invoiced to you once the settlement funds clear.%';

update public.venture_documents set content = replace(content,
'All contingency fee agreements will be executed in writing prior to formal representation.',
'All fee agreements are executed in writing before representation begins, stating the rate, the Utah Insurance Department contact notice and the 10-day right to rescind. No fee is charged on a policy-limits payment the carrier tenders within 72 hours of the loss being reported (Utah Code 31A-26-402(2)).'),
updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4'
  and content like '%All contingency fee agreements will be executed in writing prior to formal representation.%';

-- 8) Generic ops task that contradicts the venture's no-compensation referral terms
update public.venture_ops_tasks
set how = array['Decide the thank-you — a note, public credit, or an introduction. No cash, gift card, discount or commission.',
                'Ask your happiest customer by name, not by broadcast.',
                'Make the introduction email easy to forward.'],
    updated_at = now()
where id = '1667f22d-7ae0-4d86-b32f-f44b363774fa';

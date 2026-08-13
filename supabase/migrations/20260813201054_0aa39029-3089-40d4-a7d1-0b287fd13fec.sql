
insert into public.venture_document_scrub_backup (document_id, snapshot_id, document_type, content, reason)
select id, snapshot_id, document_type, content, 'utah fee-compliance sweep 2b (garbled citations + fee FAQ)'
from public.venture_documents
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4'
  and (content like '%Utah Admin Code Utah''s claim-handling rules%'
    or content like '%Utah''s claim-handling rules under-scoping%'
    or content like '%statutory cap on public adjuster fees%');

update public.venture_documents set content = replace(content,
  'Utah Admin Code Utah''s claim-handling rules',
  'Utah''s unfair claim settlement practices rules'), updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4'
  and content like '%Utah Admin Code Utah''s claim-handling rules%';

update public.venture_documents set content = replace(content,
  'Utah''s claim-handling rules under-scoping',
  'under-scoping'), updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4'
  and content like '%Utah''s claim-handling rules under-scoping%';

update public.venture_documents set content = replace(content,
'*A1*: No. Utah has no statutory cap on public adjuster fees, allowing us to negotiate structures that make sense for large, complex commercial claims while ensuring we have the resources to fight major carriers.',
'*A1*: Utah does not set a fixed percentage cap, but it does set rules. Compensation must be stated in a written contract signed before work begins, along with the Utah Insurance Department contact notice and your 10-day right to rescind, and no fee may be charged on a policy-limits payment the carrier tenders within 72 hours of the loss being reported (Utah Code 31A-26-402). Within those rules we agree a structure that fits the size of the claim.'),
updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4'
  and content like '%Utah has no statutory cap on public adjuster fees%';

update public.venture_documents set content = replace(content,
'*A2*: Under our Claim Advocacy Contingency model, you only pay a percentage of the new money we recover. If our technical audits do not result in an increased settlement offer, you owe us nothing for the adjusting service.',
'*A2*: Under our Claim Advocacy model the fee is a percentage of the additional recovery, at the rate written into your contract before we start. If our technical audits do not increase the settlement offer, there is no advocacy fee. Retainer and audit engagements are billed separately and are described in their own written agreements, and no fee applies to a policy-limits payment the carrier tenders within 72 hours of the loss being reported (Utah Code 31A-26-402(2)).'),
updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4'
  and content like '%you owe us nothing for the adjusting service%';

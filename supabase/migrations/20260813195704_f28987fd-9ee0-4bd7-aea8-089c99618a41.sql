-- Utah Claims Pros regulatory scrub
update public.venture_snapshots
set snapshot_brain = coalesce(snapshot_brain, '{}'::jsonb) || jsonb_build_object(
  'compliance_rules', jsonb_build_array(
    'Utah public adjuster fees may be an hourly fee, a flat rate, a percentage of the total amount the insurer pays to resolve the claim, or another agreed method of calculation (Utah Code 31A-26-402(1)).',
    'Utah sets no maximum public adjuster fee percentage. Never state or imply a statutory cap.',
    'If the insurer pays or commits in writing to pay policy limits within 72 hours of the loss being reported, the adjuster may not take a percentage and may charge only reasonable compensation for time spent and expenses (Utah Code 31A-26-402(2)). Any percentage or contingency claim must carry this qualifier.',
    'A public adjuster may not be compensated for referring an insured to an attorney, appraiser, umpire, contractor, repair firm or salvage company (Utah Admin Code R590-274-7(3)(b)). No paid referral, affiliate, commission or gift-card program may involve those parties.',
    'A public adjuster may not collect contracted compensation without actually performing customary public adjusting services (R590-274-7(2)(g), (3)(e)). Never promise a fee tied to nothing but an outcome.',
    'Every settlement draft must name the insured as payee and carry the insured''s signature; the adjuster may never endorse a check on the insured''s behalf (31A-26-402(3)-(4)). Never describe escrow, split-payment or direct-to-adjuster settlement handling.',
    'The adjuster may not participate directly or indirectly in reconstruction, repair or restoration, or hold a financial interest in a firm that receives work from the claim (R590-274-7(2)(a)).',
    'The insured may cancel a public adjuster contract in writing within 10 days unless an acceptable settlement was already reached (Utah Code 31A-26-311). Every contract and offer page must state this.',
    'Every contract must disclose: "WE REPRESENT THE INSURED ONLY", the 10-day rescission notice, the fee-for-service notice, the exact percentage or rate, and the Utah Insurance Department contact notice.',
    'The governing public adjuster rule is Utah Admin Code R590-274. Never cite R590-190 or any other rule number that is not listed here.'
  ),
  'banned_assumptions', coalesce(snapshot_brain->'banned_assumptions', '[]'::jsonb) || jsonb_build_array(
    'Do not cite Utah Admin Code R590-190 or invent rule or statute numbers.',
    'Do not offer or imply paid referrals, affiliate commissions or gift cards to attorneys, appraisers, umpires, contractors, repair firms or salvage companies.',
    'Do not claim a Utah cap on public adjuster fees.',
    'Do not state a contingency or percentage fee without the 72-hour policy-limits exception.',
    'Do not describe taking payment via escrow, split settlement drafts, or endorsing a carrier check.',
    'Do not offer restoration, repair or reconstruction services, or a financial interest in a firm that does.'
  )
),
snapshot_brain_updated_at = now()
where id = '4968b647-e4f0-4460-b254-b9927c95cce4';

create table if not exists public.venture_document_scrub_backup (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null,
  snapshot_id uuid not null,
  document_type text,
  content text,
  reason text,
  created_at timestamptz not null default now()
);
grant select on public.venture_document_scrub_backup to authenticated;
grant all on public.venture_document_scrub_backup to service_role;
alter table public.venture_document_scrub_backup enable row level security;
drop policy if exists "Admins read scrub backups" on public.venture_document_scrub_backup;
create policy "Admins read scrub backups" on public.venture_document_scrub_backup
  for select to authenticated using (public.is_admin(auth.uid()));

insert into public.venture_document_scrub_backup (document_id, snapshot_id, document_type, content, reason)
select id, snapshot_id, document_type, content, 'utah-regulatory-scrub'
from public.venture_documents
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4' and content is not null;

update public.venture_documents set content =
  regexp_replace(
  regexp_replace(
  regexp_replace(
  regexp_replace(
  regexp_replace(
  regexp_replace(
  regexp_replace(
  regexp_replace(content,
    'R590-190 compliance', 'Utah claim-handling compliance', 'gi'),
    '(violations of|violation of)\s+(Utah\s+)?(Administrative\s+)?Rule\s+R590-190', E'\\1 Utah''s claim-handling rules', 'gi'),
    '(Utah\s+)?Administrative\s+Rule\s+R590-190', E'Utah''s claim-handling rules', 'gi'),
    'Utah\s+Rule\s+R590-190', E'Utah''s claim-handling rules', 'gi'),
    'Rule\s+R590-190', E'Utah''s claim-handling rules', 'gi'),
    'R590-190', E'Utah''s claim-handling rules', 'gi'),
    'Utah\s+Utah''s claim-handling rules', E'Utah''s claim-handling rules', 'g'),
    'the Utah''s claim-handling rules', E'Utah''s claim-handling rules', 'g'),
  updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4' and content ~* 'R590-190';

update public.venture_documents set content = replace(content,
  'No out-of-pocket fees unless we secure a financial recovery.',
  'No out-of-pocket fee: our advocacy fee is a percentage of what the carrier pays to resolve the claim. If the carrier pays or commits in writing to policy limits within 72 hours of the loss being reported, we bill only reasonable time and expenses instead of a percentage (Utah Code 31A-26-402(2)).'),
  updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4'
  and content like '%No out-of-pocket fees unless we secure a financial recovery.%';

update public.venture_documents set content = replace(content,
  'Contingency fees are paid via escrow or direct split-payment from the carrier settlement draft.',
  'Every settlement draft is issued naming you as payee and requires your signature; we never endorse a carrier check on your behalf (Utah Code 31A-26-402(3)-(4)). Our percentage is invoiced to you once the settlement funds clear.'),
  updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4';

update public.venture_documents set content = replace(content,
  '| **Referrer reward** | $500 Gift Card for qualified claim sign-up OR 5% of the Retainer''s first-year fee. |',
  '| **Referrer reward** | No cash, gift card or commission is paid for any referral. Utah public adjusters may not be compensated in connection with referrals involving attorneys, appraisers, umpires, contractors, repair firms or salvage companies (R590-274-7(3)(b)), and we apply that standard to every partner. Referrers receive public credit, a handwritten note, and a standing invitation to our quarterly resilience briefing. |'),
  updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4';

update public.venture_documents set content = replace(content,
  '3. **Rewards:** Referrers are eligible for a $500 incentive for catastrophic claim sign-ups or 5% of a signed retainer''s first-year value. ',
  '3. **No compensation:** This is an uncompensated professional network. No money, gift card, discount or commission is paid or received for a referral in either direction. Utah Admin Code R590-274-7(3)(b) bars a public adjuster from being compensated in connection with referrals involving attorneys, appraisers, umpires, contractors, repair firms and salvage companies, and R590-274-7(2)(a) bars any financial interest in a firm that gets work from a claim we handle. '),
  updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4';
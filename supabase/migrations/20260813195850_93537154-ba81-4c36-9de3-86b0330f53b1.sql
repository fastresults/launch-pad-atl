update public.venture_content_calendar_posts set body = replace(replace(replace(body,
  'Rule R590-190 requires more than just a guess', 'Utah''s claim-handling rules require more than a guess'),
  'misses Rule R590-190 compliance', 'misses what Utah''s claim-handling rules actually require'),
  'legal compliance under §312', 'compliance with Utah Admin Code R590-274-7(2)(a), which bars a public adjuster from any interest in the repair work'),
  updated_at = now()
where snapshot_id = '4968b647-e4f0-4460-b254-b9927c95cce4'
  and (body like '%R590-190%' or body like '%§312%');
UPDATE public.venture_brand_kits
SET contact_details = jsonb_set(contact_details, '{website}', to_jsonb(replace(contact_details->>'website', 'tfh.startuplabs.online', 'friendship.startuplabs.online')))
WHERE contact_details->>'website' ILIKE '%tfh.startuplabs.online%';

UPDATE public.venture_brand_kits
SET contact_details_suggested = replace(contact_details_suggested::text, 'tfh.startuplabs.online', 'friendship.startuplabs.online')::jsonb
WHERE contact_details_suggested::text ILIKE '%tfh.startuplabs.online%';

UPDATE public.venture_brand_kits
SET guide_markdown = replace(guide_markdown, 'tfh.startuplabs.online', 'friendship.startuplabs.online')
WHERE guide_markdown ILIKE '%tfh.startuplabs.online%';

UPDATE public.venture_documents
SET content = replace(content, 'tfh.startuplabs.online', 'friendship.startuplabs.online')
WHERE content ILIKE '%tfh.startuplabs.online%';

UPDATE public.venture_ops_tasks t
SET title = replace(t.title, 'tfh.startuplabs.online', 'friendship.startuplabs.online'),
    why = replace(t.why, 'tfh.startuplabs.online', 'friendship.startuplabs.online'),
    how = (SELECT array_agg(replace(x, 'tfh.startuplabs.online', 'friendship.startuplabs.online') ORDER BY ord) FROM unnest(t.how::text[]) WITH ORDINALITY AS u(x, ord)),
    done_when = replace(t.done_when, 'tfh.startuplabs.online', 'friendship.startuplabs.online')
WHERE to_jsonb(t)::text ILIKE '%tfh.startuplabs.online%';

UPDATE public.venture_content_calendar_posts
SET body = replace(body, 'tfh.startuplabs.online', 'friendship.startuplabs.online'),
    cta = replace(cta, 'tfh.startuplabs.online', 'friendship.startuplabs.online'),
    hook = replace(hook, 'tfh.startuplabs.online', 'friendship.startuplabs.online')
WHERE body ILIKE '%tfh.startuplabs.online%' OR cta ILIKE '%tfh.startuplabs.online%' OR hook ILIKE '%tfh.startuplabs.online%';
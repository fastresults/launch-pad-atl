UPDATE public.venture_document_types
SET name = 'Your operating tool stack, picked for you',
    description = 'Your named tool stack — the exact tools for your site, CRM, calendar, email, bookkeeping, analytics, support, ads, and reviews, chosen for this venture.'
WHERE type = 'ai_tool_stack_recommendation';

UPDATE public.venture_document_types
SET name = 'Support inbox and FAQ setup',
    description = 'A support inbox that never drops a message: routing, saved replies for your most common questions, and escalation rules so nothing sits unanswered.'
WHERE type = 'ai_support_bot_setup';

UPDATE public.venture_document_types
SET active = false
WHERE type = 'ai_prompt_library';
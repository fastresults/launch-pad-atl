ALTER TABLE public.venture_ops_tasks
  ADD COLUMN IF NOT EXISTS how text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS needs text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS minutes integer,
  ADD COLUMN IF NOT EXISTS snoozed_until timestamptz;

ALTER TABLE public.venture_ops_state
  ADD COLUMN IF NOT EXISTS intro_dismissed boolean NOT NULL DEFAULT false;
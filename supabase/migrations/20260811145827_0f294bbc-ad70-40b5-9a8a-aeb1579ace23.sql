ALTER TABLE public.venture_ops_tasks
  ADD COLUMN IF NOT EXISTS criticality text NOT NULL DEFAULT 'required_to_sell',
  ADD COLUMN IF NOT EXISTS unlocks text[] NOT NULL DEFAULT '{}'::text[];
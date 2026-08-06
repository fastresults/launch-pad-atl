ALTER TABLE public.venture_documents
  ADD COLUMN IF NOT EXISTS generation_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS blocked_reason text;

ALTER TABLE public.venture_generation_jobs
  ADD COLUMN IF NOT EXISTS retry_round integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retry_remaining integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resume_count integer NOT NULL DEFAULT 0;

ALTER TYPE venture_job_status ADD VALUE IF NOT EXISTS 'completed_with_blockers';
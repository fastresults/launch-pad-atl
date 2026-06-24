ALTER TABLE public.venture_snapshots
  ADD COLUMN IF NOT EXISTS concept_summary text,
  ADD COLUMN IF NOT EXISTS value_proposition text,
  ADD COLUMN IF NOT EXISTS concept_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS concept_locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS concept_iterations jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.venture_snapshots DROP CONSTRAINT IF EXISTS venture_snapshots_concept_status_check;
ALTER TABLE public.venture_snapshots
  ADD CONSTRAINT venture_snapshots_concept_status_check
  CHECK (concept_status IN ('draft','refining','locked'));
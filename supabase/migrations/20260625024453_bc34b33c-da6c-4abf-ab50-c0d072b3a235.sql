ALTER TABLE public.venture_snapshots
  ADD COLUMN IF NOT EXISTS roadmap_content text,
  ADD COLUMN IF NOT EXISTS roadmap_status text,
  ADD COLUMN IF NOT EXISTS roadmap_quality_score int,
  ADD COLUMN IF NOT EXISTS roadmap_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS roadmap_word_count int;
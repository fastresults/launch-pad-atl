ALTER TABLE public.attendee_deliverables
  ADD COLUMN IF NOT EXISTS deep_assessment text,
  ADD COLUMN IF NOT EXISTS deep_assessment_status text,
  ADD COLUMN IF NOT EXISTS deep_assessment_quality_score int,
  ADD COLUMN IF NOT EXISTS deep_assessment_generated_at timestamptz;
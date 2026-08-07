ALTER TABLE public.brand_logo_runs
  ADD COLUMN IF NOT EXISTS craft_spec jsonb,
  ADD COLUMN IF NOT EXISTS business_profile jsonb;

ALTER TABLE public.brand_logo_runs DROP CONSTRAINT IF EXISTS brand_logo_runs_status_check;
ALTER TABLE public.brand_logo_runs ADD CONSTRAINT brand_logo_runs_status_check CHECK (status = ANY (ARRAY[
  'queued','reading_context','developing_brief','developing_directions','rendering','reviewing',
  'completed','completed_with_review','failed','canceled']));

ALTER TABLE public.brand_logo_directions DROP CONSTRAINT IF EXISTS brand_logo_directions_current_stage_check;
ALTER TABLE public.brand_logo_directions ADD CONSTRAINT brand_logo_directions_current_stage_check CHECK (current_stage = ANY (ARRAY[
  'reference_read','business_read','concepting','render_concept','jury','ready','vectorize',
  'develop_vector','draw_vector','review_vector','revise_vector','publish_vector','complete']));

ALTER TABLE public.brand_logo_directions DROP CONSTRAINT IF EXISTS brand_logo_directions_status_check;
ALTER TABLE public.brand_logo_directions ADD CONSTRAINT brand_logo_directions_status_check CHECK (status = ANY (ARRAY[
  'queued','rendering_concept','judging','vectorizing','developing_vector','drawing','reviewing',
  'retry_wait','ready','needs_review','failed','canceled']));
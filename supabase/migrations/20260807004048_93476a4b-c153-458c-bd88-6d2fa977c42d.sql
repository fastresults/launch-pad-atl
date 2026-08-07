ALTER TABLE public.brand_logo_directions
  ADD COLUMN IF NOT EXISTS render_path text,
  ADD COLUMN IF NOT EXISTS render_provider text,
  ADD COLUMN IF NOT EXISTS render_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS render_job_id text,
  ADD COLUMN IF NOT EXISTS render_error text;
ALTER TABLE public.brand_logo_directions
  ADD COLUMN IF NOT EXISTS render_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS selected boolean NOT NULL DEFAULT false;
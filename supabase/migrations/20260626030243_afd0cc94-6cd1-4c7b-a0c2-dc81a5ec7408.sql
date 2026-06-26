ALTER TABLE public.attendee_deliverables
  ADD COLUMN IF NOT EXISTS hero_image_path text,
  ADD COLUMN IF NOT EXISTS hero_image_prompt text;
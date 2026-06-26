
ALTER TABLE public.venture_documents
  ADD COLUMN IF NOT EXISTS hero_image_status text,
  ADD COLUMN IF NOT EXISTS hero_image_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS hero_image_error text;

ALTER TABLE public.attendee_deliverables
  ADD COLUMN IF NOT EXISTS hero_image_status text,
  ADD COLUMN IF NOT EXISTS hero_image_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS hero_image_error text;

UPDATE public.venture_documents
   SET hero_image_status = 'ready'
 WHERE hero_image_path IS NOT NULL AND hero_image_status IS NULL;

UPDATE public.attendee_deliverables
   SET hero_image_status = 'ready'
 WHERE hero_image_path IS NOT NULL AND hero_image_status IS NULL;

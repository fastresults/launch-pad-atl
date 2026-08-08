ALTER TABLE public.venture_brand_kits
  ADD COLUMN IF NOT EXISTS contact_details_suggested jsonb,
  ADD COLUMN IF NOT EXISTS contact_suggested_at timestamptz;
ALTER TABLE public.venture_brand_kits
  ADD COLUMN IF NOT EXISTS contact_details jsonb,
  ADD COLUMN IF NOT EXISTS contact_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS art_direction jsonb;
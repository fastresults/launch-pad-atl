
CREATE TABLE public.social_brand_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asset_type TEXT NOT NULL,
  platform TEXT,
  aspect_ratio TEXT,
  width INTEGER,
  height INTEGER,
  storage_path TEXT NOT NULL,
  signed_url TEXT,
  signed_url_expires_at TIMESTAMPTZ,
  vibe TEXT,
  color_mood TEXT,
  prompt_used TEXT,
  model_used TEXT,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_social_brand_assets_user ON public.social_brand_assets(user_id);
CREATE INDEX idx_social_brand_assets_user_type ON public.social_brand_assets(user_id, asset_type);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_brand_assets TO authenticated;
GRANT ALL ON public.social_brand_assets TO service_role;

ALTER TABLE public.social_brand_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own brand assets"
  ON public.social_brand_assets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all brand assets"
  ON public.social_brand_assets FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_social_brand_assets_updated_at
  BEFORE UPDATE ON public.social_brand_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.social_setup_brand
  ADD COLUMN IF NOT EXISTS vibe TEXT,
  ADD COLUMN IF NOT EXISTS color_mood TEXT,
  ADD COLUMN IF NOT EXISTS brand_colors TEXT[];

ALTER TABLE public.social_setup_progress
  ADD COLUMN IF NOT EXISTS creative_ready BOOLEAN NOT NULL DEFAULT false;

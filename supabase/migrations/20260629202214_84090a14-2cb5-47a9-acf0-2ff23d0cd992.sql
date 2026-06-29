
CREATE TABLE public.venture_social_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  platform text NOT NULL,
  asset_kind text NOT NULL,
  art_direction text NOT NULL,
  storage_path text NOT NULL,
  signed_url text,
  signed_url_expires_at timestamptz,
  width int NOT NULL,
  height int NOT NULL,
  prompt_used text,
  model_used text,
  brand_kit_locked_at timestamptz,
  is_selected boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX venture_social_assets_snapshot_idx ON public.venture_social_assets (snapshot_id);
CREATE INDEX venture_social_assets_user_idx ON public.venture_social_assets (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venture_social_assets TO authenticated;
GRANT ALL ON public.venture_social_assets TO service_role;

ALTER TABLE public.venture_social_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founders read own social assets"
  ON public.venture_social_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Founders insert own social assets"
  ON public.venture_social_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Founders update own social assets"
  ON public.venture_social_assets FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Founders delete own social assets"
  ON public.venture_social_assets FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_venture_social_assets_updated_at
  BEFORE UPDATE ON public.venture_social_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

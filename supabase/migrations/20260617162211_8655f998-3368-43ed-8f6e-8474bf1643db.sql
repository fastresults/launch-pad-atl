CREATE TABLE public.social_setup_brand_package (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved')),
  intake_input jsonb NOT NULL DEFAULT '{}'::jsonb,
  identity jsonb NOT NULL DEFAULT '{}'::jsonb,
  per_platform_bios jsonb NOT NULL DEFAULT '{}'::jsonb,
  visual_direction jsonb NOT NULL DEFAULT '{}'::jsonb,
  launch_kit jsonb NOT NULL DEFAULT '{}'::jsonb,
  model_used text,
  tokens_used integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_setup_brand_package TO authenticated;
GRANT ALL ON public.social_setup_brand_package TO service_role;

ALTER TABLE public.social_setup_brand_package ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own brand package"
  ON public.social_setup_brand_package
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all brand packages"
  ON public.social_setup_brand_package
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_social_setup_brand_package_updated_at
  BEFORE UPDATE ON public.social_setup_brand_package
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.social_setup_progress
  ADD COLUMN IF NOT EXISTS brand_package_approved boolean NOT NULL DEFAULT false;

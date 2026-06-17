
CREATE TABLE public.social_setup_brand (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  handle text,
  short_bio text,
  long_bio text,
  website_url text,
  logo_url text,
  banner_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_setup_brand TO authenticated;
GRANT ALL ON public.social_setup_brand TO service_role;

ALTER TABLE public.social_setup_brand ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own brand select" ON public.social_setup_brand
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "own brand insert" ON public.social_setup_brand
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own brand update" ON public.social_setup_brand
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own brand delete" ON public.social_setup_brand
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_social_setup_brand_updated
  BEFORE UPDATE ON public.social_setup_brand
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.social_setup_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  account_created boolean NOT NULL DEFAULT false,
  email_verified boolean NOT NULL DEFAULT false,
  profile_completed boolean NOT NULL DEFAULT false,
  zernio_connected boolean NOT NULL DEFAULT false,
  skipped boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_setup_progress TO authenticated;
GRANT ALL ON public.social_setup_progress TO service_role;

ALTER TABLE public.social_setup_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own progress select" ON public.social_setup_progress
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "own progress insert" ON public.social_setup_progress
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own progress update" ON public.social_setup_progress
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own progress delete" ON public.social_setup_progress
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_social_setup_progress_updated
  BEFORE UPDATE ON public.social_setup_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

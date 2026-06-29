
CREATE TABLE public.venture_brand_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL UNIQUE REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  step int NOT NULL DEFAULT 1,
  dna jsonb NOT NULL DEFAULT '{}'::jsonb,
  palette jsonb,
  typography jsonb,
  moodboard jsonb NOT NULL DEFAULT '[]'::jsonb,
  logos jsonb NOT NULL DEFAULT '[]'::jsonb,
  voice jsonb,
  guide_markdown text,
  locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venture_brand_kits TO authenticated;
GRANT ALL ON public.venture_brand_kits TO service_role;

ALTER TABLE public.venture_brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own brand kits"
  ON public.venture_brand_kits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all brand kits"
  ON public.venture_brand_kits FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_venture_brand_kits_updated_at
  BEFORE UPDATE ON public.venture_brand_kits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

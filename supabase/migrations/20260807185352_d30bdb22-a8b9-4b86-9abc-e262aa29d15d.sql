CREATE TABLE IF NOT EXISTS public.venture_brand_collateral (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_id UUID NOT NULL,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  storage_path TEXT,
  mime_type TEXT NOT NULL DEFAULT 'image/png',
  width INTEGER,
  height INTEGER,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS venture_brand_collateral_unique
  ON public.venture_brand_collateral (snapshot_id, kind, name);
CREATE INDEX IF NOT EXISTS venture_brand_collateral_snapshot_idx
  ON public.venture_brand_collateral (snapshot_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venture_brand_collateral TO authenticated;
GRANT ALL ON public.venture_brand_collateral TO service_role;

ALTER TABLE public.venture_brand_collateral ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their venture collateral"
  ON public.venture_brand_collateral FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage all venture collateral"
  ON public.venture_brand_collateral FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER venture_brand_collateral_updated_at
  BEFORE UPDATE ON public.venture_brand_collateral
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
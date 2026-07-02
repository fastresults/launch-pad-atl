GRANT SELECT ON public.deliverable_types TO authenticated, anon;
GRANT ALL ON public.deliverable_types TO service_role;
ALTER TABLE public.deliverable_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deliverable types are readable by everyone" ON public.deliverable_types;
CREATE POLICY "Deliverable types are readable by everyone"
  ON public.deliverable_types FOR SELECT
  TO authenticated, anon
  USING (true);
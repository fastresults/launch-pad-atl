CREATE TABLE public.founder_video_wall (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_name text NOT NULL,
  city text,
  founder_role text,
  startup_name text,
  quote text,
  video_bucket text NOT NULL DEFAULT 'master-media',
  video_path text NOT NULL,
  poster_bucket text,
  poster_path text,
  duration_seconds integer,
  sort_order integer NOT NULL DEFAULT 0,
  is_live boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.founder_video_wall TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.founder_video_wall TO authenticated;
GRANT ALL ON public.founder_video_wall TO service_role;

ALTER TABLE public.founder_video_wall ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live founder videos"
  ON public.founder_video_wall FOR SELECT
  USING (is_live = true);

CREATE POLICY "Super admins can view all founder videos"
  ON public.founder_video_wall FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert founder videos"
  ON public.founder_video_wall FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update founder videos"
  ON public.founder_video_wall FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete founder videos"
  ON public.founder_video_wall FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX idx_founder_video_wall_live ON public.founder_video_wall (is_live, sort_order);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_founder_video_wall_updated_at
  BEFORE UPDATE ON public.founder_video_wall
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
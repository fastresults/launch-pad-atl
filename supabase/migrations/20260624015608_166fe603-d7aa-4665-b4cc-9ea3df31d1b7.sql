
CREATE TABLE public.video_testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  founder_name TEXT NOT NULL,
  founder_role TEXT,
  startup_name TEXT,
  quote TEXT,
  video_bucket TEXT NOT NULL DEFAULT 'master-media',
  video_path TEXT NOT NULL,
  poster_bucket TEXT,
  poster_path TEXT,
  duration_seconds NUMERIC,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.video_testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_testimonials TO authenticated;
GRANT ALL ON public.video_testimonials TO service_role;

ALTER TABLE public.video_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published testimonials"
  ON public.video_testimonials FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can view all testimonials"
  ON public.video_testimonials FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert testimonials"
  ON public.video_testimonials FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update testimonials"
  ON public.video_testimonials FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete testimonials"
  ON public.video_testimonials FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER video_testimonials_set_updated_at
  BEFORE UPDATE ON public.video_testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX video_testimonials_sort_idx
  ON public.video_testimonials (status, sort_order, created_at);

-- Storage policies on master-media for testimonials/ prefix
CREATE POLICY "Admins can upload testimonial videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'master-media'
    AND (storage.foldername(name))[1] = 'testimonials'
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can update testimonial videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'master-media'
    AND (storage.foldername(name))[1] = 'testimonials'
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete testimonial videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'master-media'
    AND (storage.foldername(name))[1] = 'testimonials'
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can read testimonial videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'master-media'
    AND (storage.foldername(name))[1] = 'testimonials'
    AND public.is_admin(auth.uid())
  );

-- Seed default settings row
INSERT INTO public.site_settings (key, value)
VALUES (
  'testimonial_slider',
  jsonb_build_object(
    'enabled', true,
    'heading', 'Founders who walked out ready',
    'subheading', 'Real founders. Real Monday-morning starts.',
    'pause_seconds', 2,
    'autoplay', true,
    'start_muted', true,
    'loop', true,
    'show_on_mobile', true
  )
)
ON CONFLICT (key) DO NOTHING;

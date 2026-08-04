CREATE TABLE public.workshop_hero_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_slug TEXT NOT NULL,
  pain_id TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  image_url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  subject TEXT,
  screens BOOLEAN NOT NULL DEFAULT false,
  model TEXT,
  source TEXT NOT NULL DEFAULT 'generated',
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.workshop_hero_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workshop_hero_images TO authenticated;
GRANT ALL ON public.workshop_hero_images TO service_role;

ALTER TABLE public.workshop_hero_images ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX workshop_hero_images_published_unique
  ON public.workshop_hero_images (workshop_slug, pain_id)
  WHERE status = 'published';

CREATE INDEX workshop_hero_images_lookup
  ON public.workshop_hero_images (workshop_slug, pain_id, created_at DESC);

CREATE POLICY "Published hero images are viewable by everyone"
  ON public.workshop_hero_images FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can view all hero images"
  ON public.workshop_hero_images FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert hero images"
  ON public.workshop_hero_images FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update hero images"
  ON public.workshop_hero_images FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete hero images"
  ON public.workshop_hero_images FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can read workshop hero image files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'workshop-hero-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can upload workshop hero image files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'workshop-hero-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update workshop hero image files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'workshop-hero-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete workshop hero image files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'workshop-hero-images' AND public.is_admin(auth.uid()));
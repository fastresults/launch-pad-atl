
CREATE POLICY "Public can read deck-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'deck-images');

CREATE POLICY "Admins can upload deck-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'deck-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update deck-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'deck-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete deck-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'deck-images' AND public.is_admin(auth.uid()));

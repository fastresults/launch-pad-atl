CREATE POLICY "Super admins can read founder videos storage"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'founder-videos' AND public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can upload founder videos storage"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'founder-videos' AND public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update founder videos storage"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'founder-videos' AND public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (bucket_id = 'founder-videos' AND public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete founder videos storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'founder-videos' AND public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "venture_doc_images_admin_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'venture-doc-images' AND public.is_admin(auth.uid()));
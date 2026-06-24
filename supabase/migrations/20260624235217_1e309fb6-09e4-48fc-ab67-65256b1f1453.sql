
ALTER TABLE public.venture_documents
  ADD COLUMN IF NOT EXISTS hero_image_path text,
  ADD COLUMN IF NOT EXISTS hero_image_prompt text;

-- Storage RLS for venture-doc-images: owner folder is auth.uid()::text
DROP POLICY IF EXISTS "venture_doc_images_owner_select" ON storage.objects;
DROP POLICY IF EXISTS "venture_doc_images_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "venture_doc_images_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "venture_doc_images_owner_delete" ON storage.objects;

CREATE POLICY "venture_doc_images_owner_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'venture-doc-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "venture_doc_images_owner_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'venture-doc-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "venture_doc_images_owner_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'venture-doc-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'venture-doc-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "venture_doc_images_owner_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'venture-doc-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

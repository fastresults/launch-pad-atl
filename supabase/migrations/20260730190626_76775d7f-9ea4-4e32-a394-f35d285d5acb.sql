DROP POLICY IF EXISTS "Attendees can upload own docs" ON storage.objects;
CREATE POLICY "Attendees can upload own docs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attendee-docs' AND ((auth.uid())::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid())));

DROP POLICY IF EXISTS "Attendees can delete own docs" ON storage.objects;
CREATE POLICY "Attendees can delete own docs" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'attendee-docs' AND ((auth.uid())::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid())));

DROP POLICY IF EXISTS "Attendees can update own docs" ON storage.objects;
CREATE POLICY "Attendees can update own docs" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'attendee-docs' AND ((auth.uid())::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid())))
WITH CHECK (bucket_id = 'attendee-docs' AND ((auth.uid())::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid())));
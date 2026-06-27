-- F25: deck-images storage read — restrict to authenticated. App reads via signed URLs.
DROP POLICY IF EXISTS "Public can read deck-images" ON storage.objects;
CREATE POLICY "Authenticated can read deck-images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'deck-images');

-- F26: default author_id on inquiry_messages to the inserting user.
ALTER TABLE public.inquiry_messages
  ALTER COLUMN author_id SET DEFAULT auth.uid();

-- F27: add WITH CHECK to member_intakes UPDATE so users can't reassign user_id.
DROP POLICY IF EXISTS "Users update own intake" ON public.member_intakes;
CREATE POLICY "Users update own intake"
  ON public.member_intakes
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id) OR public.is_admin(auth.uid()))
  WITH CHECK ((auth.uid() = user_id) OR public.is_admin(auth.uid()));
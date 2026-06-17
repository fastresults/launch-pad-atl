
-- Fix workshop_registrations: prevent identity claim on insert, allow users to read own
DROP POLICY IF EXISTS "Anyone can submit a registration" ON public.workshop_registrations;
CREATE POLICY "Anyone can submit a registration"
  ON public.workshop_registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
  );

CREATE POLICY "Users read own registrations"
  ON public.workshop_registrations FOR SELECT
  TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());

-- attendee_documents: add UPDATE policy for owners and admins
CREATE POLICY "Users update own documents"
  ON public.attendee_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));

-- deliverable_types: restrict SELECT to admins only (contains prompt templates)
DROP POLICY IF EXISTS "Anyone authenticated reads deliverable types" ON public.deliverable_types;
CREATE POLICY "Admins read deliverable types"
  ON public.deliverable_types FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

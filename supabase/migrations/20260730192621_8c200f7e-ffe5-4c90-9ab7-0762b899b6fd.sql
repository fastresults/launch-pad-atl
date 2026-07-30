CREATE POLICY "brain_memory_owner_insert" ON public.founder_brain_memory
FOR INSERT TO authenticated
WITH CHECK ((auth.uid() = user_id) OR public.is_admin(auth.uid()));

CREATE POLICY "brain_memory_owner_delete" ON public.founder_brain_memory
FOR DELETE TO authenticated
USING ((auth.uid() = user_id) OR public.is_admin(auth.uid()));
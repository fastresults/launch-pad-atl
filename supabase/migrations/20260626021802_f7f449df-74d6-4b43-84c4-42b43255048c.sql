
CREATE POLICY "Users insert own pipeline runs" ON public.ai_pipeline_runs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins insert pipeline runs" ON public.ai_pipeline_runs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

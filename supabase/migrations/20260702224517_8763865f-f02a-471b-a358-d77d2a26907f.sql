
CREATE TABLE public.legal_setup_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  snapshot_id UUID,
  entity_choice TEXT,
  entity_state TEXT DEFAULT 'GA',
  business_name TEXT,
  name_reserved BOOLEAN NOT NULL DEFAULT false,
  registered_agent_choice TEXT,
  registered_agent_name TEXT,
  registered_agent_service TEXT,
  articles_filed_at TIMESTAMPTZ,
  articles_control_number TEXT,
  ein TEXT,
  ein_obtained_at TIMESTAMPTZ,
  operating_agreement_generated_at TIMESTAMPTZ,
  operating_agreement_markdown TEXT,
  steps_completed JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, snapshot_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.legal_setup_progress TO authenticated;
GRANT ALL ON public.legal_setup_progress TO service_role;

ALTER TABLE public.legal_setup_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founders manage their own legal setup"
  ON public.legal_setup_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins full access to legal setup"
  ON public.legal_setup_progress
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_legal_setup_progress_updated_at
  BEFORE UPDATE ON public.legal_setup_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

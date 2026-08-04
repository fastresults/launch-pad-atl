CREATE TABLE public.workshop_audit_intakes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workshop_slug TEXT NOT NULL,
  session_start TIMESTAMPTZ,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  file_urls TEXT[] NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, workshop_slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workshop_audit_intakes TO authenticated;
GRANT ALL ON public.workshop_audit_intakes TO service_role;
ALTER TABLE public.workshop_audit_intakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own audit intake"
  ON public.workshop_audit_intakes FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all audit intakes"
  ON public.workshop_audit_intakes FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.workshop_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  intake_id UUID REFERENCES public.workshop_audit_intakes(id) ON DELETE SET NULL,
  workshop_slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  report JSONB,
  overall_grade TEXT,
  prescribed_outcome TEXT,
  admin_notes TEXT,
  model TEXT,
  generated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.workshop_audits TO authenticated;
GRANT ALL ON public.workshop_audits TO service_role;
ALTER TABLE public.workshop_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own sent audit"
  ON public.workshop_audits FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND status = 'sent');

CREATE POLICY "Admins read all audits"
  ON public.workshop_audits FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins write audits"
  ON public.workshop_audits FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins update audits"
  ON public.workshop_audits FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete audits"
  ON public.workshop_audits FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX workshop_audits_status_idx ON public.workshop_audits (status, workshop_slug);

CREATE TRIGGER update_workshop_audit_intakes_updated_at
  BEFORE UPDATE ON public.workshop_audit_intakes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workshop_audits_updated_at
  BEFORE UPDATE ON public.workshop_audits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
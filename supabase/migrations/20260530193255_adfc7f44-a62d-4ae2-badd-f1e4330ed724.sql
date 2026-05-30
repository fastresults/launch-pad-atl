
-- 1) founder_applications
CREATE TABLE public.founder_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  linkedin_url text,
  about_you text NOT NULL,
  about_startup text NOT NULL,
  why_now text NOT NULL,
  industry text NOT NULL,
  stage text NOT NULL CHECK (stage IN ('idea','early','existing')),
  referral_source text,
  can_attend boolean NOT NULL DEFAULT true,
  cohort_id text,
  status text NOT NULL DEFAULT 'applied'
    CHECK (status IN ('applied','reviewing','shortlisted','selected','waitlisted','rejected','withdrawn')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  status_changed_at timestamptz NOT NULL DEFAULT now(),
  converted_registration_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_founder_applications_status ON public.founder_applications(status);
CREATE INDEX idx_founder_applications_created_at ON public.founder_applications(created_at DESC);
CREATE INDEX idx_founder_applications_cohort ON public.founder_applications(cohort_id);

GRANT INSERT ON public.founder_applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.founder_applications TO authenticated;
GRANT ALL ON public.founder_applications TO service_role;

ALTER TABLE public.founder_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an application"
  ON public.founder_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins read applications"
  ON public.founder_applications FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins update applications"
  ON public.founder_applications FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete applications"
  ON public.founder_applications FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- updated_at + status_changed_at trigger
CREATE OR REPLACE FUNCTION public.tg_founder_applications_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_founder_applications_touch
  BEFORE UPDATE ON public.founder_applications
  FOR EACH ROW EXECUTE FUNCTION public.tg_founder_applications_touch();

-- 2) application_notes
CREATE TABLE public.application_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.founder_applications(id) ON DELETE CASCADE,
  author_id uuid,
  author_name text,
  body text NOT NULL,
  kind text NOT NULL DEFAULT 'note' CHECK (kind IN ('note','system')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_application_notes_application_id ON public.application_notes(application_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.application_notes TO authenticated;
GRANT ALL ON public.application_notes TO service_role;

ALTER TABLE public.application_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read notes"
  ON public.application_notes FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins insert notes"
  ON public.application_notes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete notes"
  ON public.application_notes FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 3) promote_application: atomic create registration + link
CREATE OR REPLACE FUNCTION public.promote_application(_app_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a RECORD;
  new_reg_id uuid;
BEGIN
  SELECT * INTO a FROM public.founder_applications WHERE id = _app_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application % not found', _app_id; END IF;
  IF a.converted_registration_id IS NOT NULL THEN
    RETURN a.converted_registration_id;
  END IF;
  IF a.status <> 'selected' THEN
    RAISE EXCEPTION 'Application must be in selected status to promote (current: %)', a.status;
  END IF;

  INSERT INTO public.workshop_registrations (
    name, email, phone, business_idea, industry, stage,
    referral_source, tier_interest, cohort_id, status, assigned_tier
  ) VALUES (
    a.name, a.email, a.phone,
    'ABOUT THE FOUNDER:'||E'\n'||a.about_you||E'\n\n'||
    'ABOUT THE STARTUP:'||E'\n'||a.about_startup||E'\n\n'||
    'WHY THIS, WHY NOW:'||E'\n'||a.why_now||
    CASE WHEN a.linkedin_url IS NOT NULL AND a.linkedin_url <> '' THEN E'\n\nLINKEDIN: '||a.linkedin_url ELSE '' END,
    a.industry, a.stage, a.referral_source,
    'selection', a.cohort_id, 'confirmed', 'selection'
  ) RETURNING id INTO new_reg_id;

  UPDATE public.founder_applications
     SET converted_registration_id = new_reg_id, updated_at = now()
   WHERE id = _app_id;

  RETURN new_reg_id;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_application(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_application(uuid) TO authenticated, service_role;

-- 4) Backfill existing 'applied' rows from workshop_registrations
INSERT INTO public.founder_applications
  (name, email, phone, about_you, about_startup, why_now, industry, stage,
   referral_source, can_attend, cohort_id, status, created_at)
SELECT
  r.name,
  r.email,
  r.phone,
  COALESCE(NULLIF(trim(substring(r.business_idea FROM 'ABOUT THE FOUNDER:\s*(.*?)\s*ABOUT THE STARTUP:')), ''),
           r.business_idea),
  COALESCE(NULLIF(trim(substring(r.business_idea FROM 'ABOUT THE STARTUP:\s*(.*?)\s*WHY THIS, WHY NOW:')), ''),
           ''),
  COALESCE(NULLIF(trim(substring(r.business_idea FROM 'WHY THIS, WHY NOW:\s*(.*?)(?:\s*LINKEDIN:|\s*$)')), ''),
           ''),
  COALESCE(r.industry, 'unspecified'),
  COALESCE(r.stage, 'idea'),
  r.referral_source,
  true,
  r.cohort_id,
  'applied',
  r.created_at
FROM public.workshop_registrations r
WHERE r.status = 'applied' AND r.tier_interest = 'selection';

DELETE FROM public.workshop_registrations
 WHERE status = 'applied' AND tier_interest = 'selection';

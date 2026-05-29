
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.deliverable_review_status AS ENUM (
  'draft', 'pending_review', 'approved', 'rejected', 'changes_requested'
);

CREATE TYPE public.deliverable_publish_status AS ENUM (
  'unpublished', 'scheduled', 'published', 'unpublished_manual'
);

CREATE TYPE public.deliverable_content_source AS ENUM ('ai', 'admin_override');

CREATE TYPE public.pipeline_run_status AS ENUM (
  'queued', 'running', 'completed', 'failed', 'partial'
);

CREATE TYPE public.pipeline_step_status AS ENUM (
  'pending', 'queued', 'running', 'completed', 'failed', 'skipped'
);

-- ============================================================
-- attendee_profiles
-- ============================================================
CREATE TABLE public.attendee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  -- founder
  full_name TEXT,
  headline TEXT,
  background TEXT,
  skills TEXT[] DEFAULT '{}',
  time_commitment_hours INTEGER,
  primary_goal TEXT,
  -- business
  business_name TEXT,
  industry TEXT,
  stage TEXT,
  target_market TEXT,
  problem_solved TEXT,
  value_prop TEXT,
  competitors TEXT[] DEFAULT '{}',
  business_model TEXT,
  -- financial
  current_revenue NUMERIC,
  funding_raised NUMERIC,
  monthly_burn NUMERIC,
  runway_months INTEGER,
  projections JSONB DEFAULT '{}'::jsonb,
  -- meta
  intake_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.attendee_profiles TO authenticated;
GRANT ALL ON public.attendee_profiles TO service_role;

ALTER TABLE public.attendee_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own attendee profile" ON public.attendee_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users insert own attendee profile" ON public.attendee_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own attendee profile" ON public.attendee_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE TRIGGER attendee_profiles_updated_at
  BEFORE UPDATE ON public.attendee_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- attendee_documents
-- ============================================================
CREATE TABLE public.attendee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,  -- pitch_deck | business_plan | logo | other
  storage_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size_bytes BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attendee_documents_user ON public.attendee_documents(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendee_documents TO authenticated;
GRANT ALL ON public.attendee_documents TO service_role;

ALTER TABLE public.attendee_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own documents" ON public.attendee_documents
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users insert own documents" ON public.attendee_documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own documents" ON public.attendee_documents
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- attendee_goals
-- ============================================================
CREATE TABLE public.attendee_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  horizon INTEGER NOT NULL,  -- 30, 60, 90
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | in_progress | done
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attendee_goals_user ON public.attendee_goals(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendee_goals TO authenticated;
GRANT ALL ON public.attendee_goals TO service_role;

ALTER TABLE public.attendee_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own goals" ON public.attendee_goals
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users insert own goals" ON public.attendee_goals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own goals" ON public.attendee_goals
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own goals" ON public.attendee_goals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER attendee_goals_updated_at
  BEFORE UPDATE ON public.attendee_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- attendee_progress
-- ============================================================
CREATE TABLE public.attendee_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | in_progress | done
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendee_progress TO authenticated;
GRANT ALL ON public.attendee_progress TO service_role;

ALTER TABLE public.attendee_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own progress" ON public.attendee_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users insert own progress" ON public.attendee_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON public.attendee_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER attendee_progress_updated_at
  BEFORE UPDATE ON public.attendee_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- deliverable_types (catalog)
-- ============================================================
CREATE TABLE public.deliverable_types (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  stage_label TEXT,
  stage_n INTEGER,
  schema_version INTEGER NOT NULL DEFAULT 1,
  default_model TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  prompt_template TEXT,
  output_schema JSONB DEFAULT '{}'::jsonb,
  depends_on_keys TEXT[] DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  tier_required TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.deliverable_types TO authenticated;
GRANT ALL ON public.deliverable_types TO service_role;

ALTER TABLE public.deliverable_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated reads deliverable types" ON public.deliverable_types
  FOR SELECT TO authenticated USING (true);

-- Seed deliverable_types from the registration/value matrix
INSERT INTO public.deliverable_types (key, label, description, stage_label, stage_n, sort_order) VALUES
  ('llc_filing_packet',     'GA LLC Filing Packet',                       'Articles pre-filled, registered agent set',                          'Form',      1, 10),
  ('ein_letter',            'EIN Issued',                                 'Federal EIN issuance documentation',                                 'Form',      1, 20),
  ('legal_docs',            'ToS, Privacy & Service Agreement',           'Customized terms of service, privacy policy, service agreement',     'Form',      1, 30),
  ('compliance_checklist',  'Bank + License + Sales-Tax Checklist',       'Business bank, local license, and sales-tax setup checklist',        'Form',      1, 40),
  ('icp_prospect_list',     'Ideal Customer Profile + 25-name list',      '1-page ICP plus 25 named prospects',                                 'Customer',  2, 50),
  ('outreach_positioning',  'Outreach Script + Competitor Grid',          'Outreach script and 3-competitor positioning grid',                  'Customer',  2, 60),
  ('offer_pricing',         'Offer + Scope + Pricing Sheet',              'One-sentence offer, scope of work, and pricing sheet',               'Offer',     3, 70),
  ('workflow_tooling',      'Sale-to-Delivery Workflow + Tooling',        'Workflow map and tooling setup',                                     'Build',     4, 80),
  ('first_deliverable_qa',  'First Customer Deliverable + QA Checklist',  'Drafted first customer deliverable plus a 5-point QA checklist',     'Build',     4, 90),
  ('brand_kit',             'Logo + Palette + Font Pairing',              'Logo, 4-color palette, and font pairing',                            'Brand',     5, 100),
  ('website_4pg',           'Complete 4-Page Website',                    'Branded, written, SEO-configured 4-page site',                       'Brand',     5, 110),
  ('payments_email_ga',     'Stripe/Square + GA4 + Business Email',       'Payments, analytics, and business email configured',                 'Brand',     5, 120),
  ('messaging_pitch',       'Headline + Value Props + 30-sec Pitch',      'Headline, three value props, and a 30-second pitch',                 'Marketing', 6, 130),
  ('print_collateral',      'Business Card + Flyer Print Files',          'Print-ready business card and flyer files',                          'Marketing', 6, 140),
  ('social_30day',          '6 Social Posts + Video Script + 30-day Plan','6 social posts, 60-second video script, and 30-day plan',            'Marketing', 6, 150),
  ('launch_plan',           '30/60/90 Launch Plan + Outreach Drafts',     'Launch plan with named list and 10 outreach drafts',                 'Launch',    7, 160),
  ('day_of_kpis',           'Day-of Timeline + CRM + KPIs',               'Day-of timeline, CRM setup, and 3 KPIs to track',                    'Launch',    7, 170);

-- Set dependency chains so the pipeline runs in a sensible order
UPDATE public.deliverable_types SET depends_on_keys = ARRAY['llc_filing_packet'] WHERE key = 'ein_letter';
UPDATE public.deliverable_types SET depends_on_keys = ARRAY['ein_letter']        WHERE key = 'legal_docs';
UPDATE public.deliverable_types SET depends_on_keys = ARRAY['legal_docs']        WHERE key = 'compliance_checklist';
UPDATE public.deliverable_types SET depends_on_keys = ARRAY['icp_prospect_list'] WHERE key = 'outreach_positioning';
UPDATE public.deliverable_types SET depends_on_keys = ARRAY['icp_prospect_list','outreach_positioning'] WHERE key = 'offer_pricing';
UPDATE public.deliverable_types SET depends_on_keys = ARRAY['offer_pricing']     WHERE key = 'workflow_tooling';
UPDATE public.deliverable_types SET depends_on_keys = ARRAY['workflow_tooling']  WHERE key = 'first_deliverable_qa';
UPDATE public.deliverable_types SET depends_on_keys = ARRAY['offer_pricing']     WHERE key = 'brand_kit';
UPDATE public.deliverable_types SET depends_on_keys = ARRAY['brand_kit']         WHERE key = 'website_4pg';
UPDATE public.deliverable_types SET depends_on_keys = ARRAY['website_4pg']       WHERE key = 'payments_email_ga';
UPDATE public.deliverable_types SET depends_on_keys = ARRAY['offer_pricing']     WHERE key = 'messaging_pitch';
UPDATE public.deliverable_types SET depends_on_keys = ARRAY['brand_kit','messaging_pitch'] WHERE key = 'print_collateral';
UPDATE public.deliverable_types SET depends_on_keys = ARRAY['messaging_pitch']   WHERE key = 'social_30day';
UPDATE public.deliverable_types SET depends_on_keys = ARRAY['icp_prospect_list','offer_pricing','social_30day'] WHERE key = 'launch_plan';
UPDATE public.deliverable_types SET depends_on_keys = ARRAY['launch_plan']       WHERE key = 'day_of_kpis';

-- ============================================================
-- attendee_deliverables
-- ============================================================
CREATE TABLE public.attendee_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  deliverable_key TEXT NOT NULL REFERENCES public.deliverable_types(key) ON DELETE RESTRICT,
  review_status public.deliverable_review_status NOT NULL DEFAULT 'draft',
  publish_status public.deliverable_publish_status NOT NULL DEFAULT 'unpublished',
  publish_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  content_current JSONB,
  content_ai JSONB,
  content_source public.deliverable_content_source NOT NULL DEFAULT 'ai',
  admin_edited_at TIMESTAMPTZ,
  admin_edited_by UUID,
  ai_generated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  reviewer_notes TEXT,
  last_run_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, deliverable_key)
);

CREATE INDEX idx_attendee_deliverables_user ON public.attendee_deliverables(user_id);
CREATE INDEX idx_attendee_deliverables_review ON public.attendee_deliverables(review_status);
CREATE INDEX idx_attendee_deliverables_publish ON public.attendee_deliverables(publish_status, publish_at);

GRANT SELECT ON public.attendee_deliverables TO authenticated;
GRANT ALL ON public.attendee_deliverables TO service_role;

ALTER TABLE public.attendee_deliverables ENABLE ROW LEVEL SECURITY;

-- Attendees: only published + past publish-time
CREATE POLICY "Users read own published deliverables" ON public.attendee_deliverables
  FOR SELECT TO authenticated USING (
    (auth.uid() = user_id
      AND publish_status = 'published'
      AND (published_at IS NULL OR published_at <= now()))
    OR public.is_admin(auth.uid())
  );

CREATE TRIGGER attendee_deliverables_updated_at
  BEFORE UPDATE ON public.attendee_deliverables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- deliverable_revisions (append-only audit)
-- ============================================================
CREATE TABLE public.deliverable_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES public.attendee_deliverables(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  deliverable_key TEXT NOT NULL,
  action TEXT NOT NULL,  -- generated|edited|approved|rejected|changes_requested|scheduled|published|unpublished|reverted|regenerated
  actor UUID,
  source TEXT,  -- ai | admin | scheduler
  before JSONB,
  after JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deliverable_revisions_deliverable ON public.deliverable_revisions(deliverable_id, created_at DESC);

GRANT SELECT ON public.deliverable_revisions TO authenticated;
GRANT ALL ON public.deliverable_revisions TO service_role;

ALTER TABLE public.deliverable_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read revisions" ON public.deliverable_revisions
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- ============================================================
-- ai_pipeline_runs
-- ============================================================
CREATE TABLE public.ai_pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status public.pipeline_run_status NOT NULL DEFAULT 'queued',
  triggered_by UUID,
  options JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_pipeline_runs_user ON public.ai_pipeline_runs(user_id, created_at DESC);

GRANT SELECT ON public.ai_pipeline_runs TO authenticated;
GRANT ALL ON public.ai_pipeline_runs TO service_role;

ALTER TABLE public.ai_pipeline_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read pipeline runs" ON public.ai_pipeline_runs
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- ============================================================
-- ai_pipeline_steps
-- ============================================================
CREATE TABLE public.ai_pipeline_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.ai_pipeline_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  deliverable_key TEXT NOT NULL REFERENCES public.deliverable_types(key),
  status public.pipeline_step_status NOT NULL DEFAULT 'pending',
  model TEXT,
  input_snapshot JSONB,
  raw_output JSONB,
  error TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, deliverable_key)
);

CREATE INDEX idx_ai_pipeline_steps_run ON public.ai_pipeline_steps(run_id);

GRANT SELECT ON public.ai_pipeline_steps TO authenticated;
GRANT ALL ON public.ai_pipeline_steps TO service_role;

ALTER TABLE public.ai_pipeline_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read pipeline steps" ON public.ai_pipeline_steps
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- ============================================================
-- handle_new_user: also seed attendee_profiles row
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.attendee_profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;

  SELECT COUNT(*) INTO user_count FROM auth.users;

  IF user_count <= 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill attendee_profiles for any existing users
INSERT INTO public.attendee_profiles (user_id, full_name)
SELECT p.user_id, p.display_name
FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- Storage bucket: attendee-docs (private)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('attendee-docs', 'attendee-docs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Attendees can read own docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'attendee-docs'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid()))
  );

CREATE POLICY "Attendees can upload own docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'attendee-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Attendees can delete own docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'attendee-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendee_deliverables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_pipeline_steps;

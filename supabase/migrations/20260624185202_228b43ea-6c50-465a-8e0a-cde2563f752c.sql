
-- 1. Access flag on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS founders_hub_access boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS founders_hub_granted_at timestamptz,
  ADD COLUMN IF NOT EXISTS founders_hub_granted_by uuid;

-- 2. Enums
DO $$ BEGIN
  CREATE TYPE public.venture_snapshot_status AS ENUM ('input','enriching','review','generating','complete','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.venture_document_status AS ENUM ('pending','generating','complete','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.venture_job_status AS ENUM ('queued','running','paused','completed','failed','canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. venture_snapshots
CREATE TABLE IF NOT EXISTS public.venture_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text,
  website_url text,
  business_concept text,
  differentiation_statement text,
  scraped_content text,
  competitor_data jsonb,
  market_research text,
  extracted_data jsonb,
  status public.venture_snapshot_status NOT NULL DEFAULT 'input',
  enrichment_progress jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS venture_snapshots_user_idx ON public.venture_snapshots(user_id);
CREATE INDEX IF NOT EXISTS venture_snapshots_status_idx ON public.venture_snapshots(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venture_snapshots TO authenticated;
GRANT ALL ON public.venture_snapshots TO service_role;
ALTER TABLE public.venture_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners read snapshots" ON public.venture_snapshots
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "owners insert snapshots" ON public.venture_snapshots
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owners update snapshots" ON public.venture_snapshots
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "owners delete snapshots" ON public.venture_snapshots
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE TRIGGER venture_snapshots_updated
  BEFORE UPDATE ON public.venture_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. venture_documents
CREATE TABLE IF NOT EXISTS public.venture_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  status public.venture_document_status NOT NULL DEFAULT 'pending',
  content text,
  word_count int,
  quality_score int,
  version int NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_version_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(snapshot_id, document_type)
);
CREATE INDEX IF NOT EXISTS venture_documents_snapshot_idx ON public.venture_documents(snapshot_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venture_documents TO authenticated;
GRANT ALL ON public.venture_documents TO service_role;
ALTER TABLE public.venture_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners read venture docs" ON public.venture_documents
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.venture_snapshots s WHERE s.id = snapshot_id AND (s.user_id = auth.uid() OR public.is_admin(auth.uid())))
  );
CREATE POLICY "owners insert venture docs" ON public.venture_documents
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.venture_snapshots s WHERE s.id = snapshot_id AND (s.user_id = auth.uid() OR public.is_admin(auth.uid())))
  );
CREATE POLICY "owners update venture docs" ON public.venture_documents
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.venture_snapshots s WHERE s.id = snapshot_id AND (s.user_id = auth.uid() OR public.is_admin(auth.uid())))
  );
CREATE POLICY "owners delete venture docs" ON public.venture_documents
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.venture_snapshots s WHERE s.id = snapshot_id AND (s.user_id = auth.uid() OR public.is_admin(auth.uid())))
  );

CREATE TRIGGER venture_documents_updated
  BEFORE UPDATE ON public.venture_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. venture_generation_jobs
CREATE TABLE IF NOT EXISTS public.venture_generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  status public.venture_job_status NOT NULL DEFAULT 'queued',
  current_document_type text,
  progress_pct int NOT NULL DEFAULT 0,
  circuit_breaker_open boolean NOT NULL DEFAULT false,
  attempts int NOT NULL DEFAULT 0,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS venture_jobs_snapshot_idx ON public.venture_generation_jobs(snapshot_id);
CREATE INDEX IF NOT EXISTS venture_jobs_status_idx ON public.venture_generation_jobs(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venture_generation_jobs TO authenticated;
GRANT ALL ON public.venture_generation_jobs TO service_role;
ALTER TABLE public.venture_generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners read venture jobs" ON public.venture_generation_jobs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.venture_snapshots s WHERE s.id = snapshot_id AND (s.user_id = auth.uid() OR public.is_admin(auth.uid())))
  );
CREATE POLICY "owners write venture jobs" ON public.venture_generation_jobs
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.venture_snapshots s WHERE s.id = snapshot_id AND (s.user_id = auth.uid() OR public.is_admin(auth.uid())))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.venture_snapshots s WHERE s.id = snapshot_id AND (s.user_id = auth.uid() OR public.is_admin(auth.uid())))
  );

CREATE TRIGGER venture_jobs_updated
  BEFORE UPDATE ON public.venture_generation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. venture_generation_failures
CREATE TABLE IF NOT EXISTS public.venture_generation_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES public.venture_snapshots(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  attempt int NOT NULL DEFAULT 1,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS venture_failures_snapshot_idx ON public.venture_generation_failures(snapshot_id);

GRANT SELECT, INSERT ON public.venture_generation_failures TO authenticated;
GRANT ALL ON public.venture_generation_failures TO service_role;
ALTER TABLE public.venture_generation_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners read venture failures" ON public.venture_generation_failures
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.venture_snapshots s WHERE s.id = snapshot_id AND (s.user_id = auth.uid() OR public.is_admin(auth.uid())))
  );

-- 7. venture_document_types catalog
CREATE TABLE IF NOT EXISTS public.venture_document_types (
  type text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  sort_order int NOT NULL,
  dependencies text[] NOT NULL DEFAULT '{}',
  estimated_minutes int NOT NULL DEFAULT 5,
  icon text,
  free_tier boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.venture_document_types TO authenticated;
GRANT ALL ON public.venture_document_types TO service_role;
ALTER TABLE public.venture_document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone signed-in reads catalog" ON public.venture_document_types
  FOR SELECT TO authenticated USING (true);

-- 8. Seed the 20-document catalog
INSERT INTO public.venture_document_types (type, name, description, category, sort_order, dependencies, estimated_minutes, icon, free_tier) VALUES
  ('executive_summary',          'Executive Summary',           'One-page snapshot of the venture, problem, solution, market, and ask.',     'Foundation', 1, '{}',                                  4,  'FileText',     true),
  ('vision_mission',             'Vision & Mission',            'Long-term vision, mission statement, and core values.',                     'Foundation', 2, '{}',                                  3,  'Compass',      true),
  ('problem_solution',           'Problem / Solution Brief',    'Problem we solve, why now, and how the solution maps to it.',               'Foundation', 3, '{}',                                  4,  'Lightbulb',    true),
  ('value_proposition',          'Value Proposition',           'Differentiated value, target customer, and proof points.',                  'Foundation', 4, '{problem_solution}',                  4,  'Sparkles',     true),
  ('market_analysis',            'Market Analysis',             'TAM/SAM/SOM, trends, and competitive landscape.',                           'Strategy',   5, '{problem_solution}',                  6,  'TrendingUp',   true),
  ('customer_personas',          'Customer Personas',           '2-3 ICPs with jobs-to-be-done, motivations, and objections.',               'Strategy',   6, '{value_proposition,market_analysis}', 5,  'Users',        true),
  ('competitive_positioning',    'Competitive Positioning',     'Competitor grid, positioning map, and defensible moat.',                    'Strategy',   7, '{market_analysis}',                   5,  'Crosshair',    true),
  ('go_to_market_plan',          'Go-to-Market Plan',           'Channels, sales motion, launch sequence, and KPIs.',                        'Strategy',   8, '{customer_personas,competitive_positioning}', 6, 'Rocket',  true),
  ('brand_messaging',            'Brand & Messaging',           'Tone, story pillars, taglines, and elevator pitch.',                        'Strategy',   9, '{value_proposition}',                 4,  'Megaphone',    true),
  ('product_roadmap',            'Product Roadmap',             '90-day, 6-month, and 12-month roadmap with milestones.',                    'Operations', 10,'{go_to_market_plan}',                 5,  'Map',          true),
  ('operating_plan',             'Operating Plan',              'Org chart, hiring plan, and weekly operating cadence.',                     'Operations', 11,'{product_roadmap}',                   5,  'Settings',     false),
  ('sales_playbook',             'Sales Playbook',              'Outreach scripts, qualification, objection handling, and close.',           'Operations', 12,'{go_to_market_plan,customer_personas}',5, 'Briefcase',    false),
  ('marketing_plan',             'Marketing Plan',              'Channel mix, content calendar, and budget allocation.',                     'Operations', 13,'{brand_messaging,go_to_market_plan}', 5,  'Megaphone',    false),
  ('financial_model',            'Financial Model',             '3-year P&L, cash flow, and key assumptions.',                               'Finance',    14,'{operating_plan,sales_playbook}',     8,  'Calculator',   false),
  ('unit_economics',             'Unit Economics',              'CAC, LTV, payback period, and contribution margin.',                        'Finance',    15,'{financial_model}',                   5,  'BarChart3',    false),
  ('funding_strategy',           'Funding Strategy',            'Raise plan, use of funds, milestones, and investor targets.',               'Finance',    16,'{financial_model,unit_economics}',    5,  'PiggyBank',    false),
  ('pitch_deck_outline',         'Pitch Deck Outline',          '10-slide investor deck outline with speaker notes.',                        'Finance',    17,'{executive_summary,funding_strategy}',5,  'Presentation', false),
  ('legal_structure_brief',      'Legal Structure Brief',       'Entity recommendation, equity split, and key agreements.',                  'Governance', 18,'{}',                                  4,  'Scale',        false),
  ('risk_register',              'Risk Register',               'Top risks, likelihood, impact, and mitigations.',                           'Governance', 19,'{operating_plan,financial_model}',    4,  'AlertTriangle',false),
  ('board_governance_plan',      'Board & Governance Plan',     'Board composition, meeting cadence, reporting, and decision rights.',       'Governance', 20,'{legal_structure_brief,funding_strategy}',4,'Building',  false)
ON CONFLICT (type) DO NOTHING;

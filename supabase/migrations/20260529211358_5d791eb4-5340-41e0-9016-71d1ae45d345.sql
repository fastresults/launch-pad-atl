
-- ============================================================
-- AGENTIC WORKFLOW: 25 deliverables, progressive intake, brief/filing
-- ============================================================

-- 1) Extend deliverable_types with context-graph metadata
ALTER TABLE public.deliverable_types
  ADD COLUMN IF NOT EXISTS requires_context_keys text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS produces_context_key text,
  ADD COLUMN IF NOT EXISTS output_kind text NOT NULL DEFAULT 'document',
  ADD COLUMN IF NOT EXISTS user_can_trigger boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_runnable boolean NOT NULL DEFAULT true;

-- Backfill produces_context_key = key for existing rows so the graph works out of the box
UPDATE public.deliverable_types SET produces_context_key = key WHERE produces_context_key IS NULL;

-- Backfill requires_context_keys from depends_on_keys
UPDATE public.deliverable_types
  SET requires_context_keys = depends_on_keys
WHERE COALESCE(array_length(requires_context_keys,1),0) = 0
  AND COALESCE(array_length(depends_on_keys,1),0) > 0;

-- 2) Insert the 8 missing deliverable types (matching value-grid)
INSERT INTO public.deliverable_types
  (key, label, description, stage_label, stage_n, sort_order, depends_on_keys, requires_context_keys, produces_context_key, output_kind, user_can_trigger, auto_runnable, default_model, active)
VALUES
  ('funding_runway', 'Funding model & 12-month runway',
   'Costs, margin, break-even, monthly cash plan.', 'Form', 1, 45,
   ARRAY['llc_filing_packet'], ARRAY['business_brief'], 'funding_runway', 'document', true, true,
   'google/gemini-3-flash-preview', true),
  ('business_plan', 'Business plan with pro formas',
   'Narrative plan + 12-month P&L, cash flow, and break-even.', 'Form', 1, 46,
   ARRAY['funding_runway'], ARRAY['business_brief','funding_runway'], 'business_plan', 'document', true, true,
   'google/gemini-3-flash-preview', true),
  ('pitch_deck', 'Investor-ready pitch deck',
   '10 slides in your brand.', 'Form', 1, 47,
   ARRAY['business_plan'], ARRAY['business_brief','business_plan'], 'pitch_deck', 'document', true, true,
   'google/gemini-3-flash-preview', true),
  ('fundraising_kit', 'Fundraising kit',
   '1-page raise summary, outreach plan + email template, grants/microloans/SBA path.', 'Form', 1, 48,
   ARRAY['pitch_deck'], ARRAY['business_brief','pitch_deck'], 'fundraising_kit', 'document', true, true,
   'google/gemini-3-flash-preview', true),
  ('competitor_research', 'Competitive research pack',
   '3 competitors on offer/price/positioning, customer quotes, and a differentiation one-pager.', 'Customer', 2, 55,
   ARRAY['icp_prospect_list'], ARRAY['icp_prospect_list'], 'competitor_research', 'document', true, true,
   'google/gemini-3-flash-preview', true),
  ('competitive_advantage', 'Competitive advantage brief',
   'Your secret sauce distilled into a positioning line you can defend.', 'Customer', 2, 57,
   ARRAY['competitor_research'], ARRAY['competitor_research'], 'competitive_advantage', 'document', true, true,
   'google/gemini-3-flash-preview', true),
  ('operations_sops', 'Operations & workflow SOPs',
   '3 SOPs (intake, fulfillment, onboarding) + 1-page weekly operating rhythm.', 'Build', 4, 85,
   ARRAY['workflow_tooling'], ARRAY['workflow_tooling'], 'operations_sops', 'document', true, true,
   'google/gemini-3-flash-preview', true),
  ('sourcing_staffing', 'Sourcing & staffing plan',
   'Suppliers, contractors, hires with named candidates and a first-call list.', 'Build', 4, 95,
   ARRAY['operations_sops'], ARRAY['business_brief','operations_sops'], 'sourcing_staffing', 'document', true, true,
   'google/gemini-3-flash-preview', true)
ON CONFLICT (key) DO NOTHING;

-- 3) Business brief — Stage 0 intake that unlocks the entire pipeline
CREATE TABLE IF NOT EXISTS public.attendee_business_brief (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  -- Open-ended brief fields (voice or keyboard input on each)
  one_line_pitch text,
  origin_story text,
  problem_statement text,
  target_customer text,
  unique_insight text,
  offer_description text,
  pricing_idea text,
  business_model text,
  inspiration_brands text,
  twelve_month_vision text,
  -- Voice transcripts retained for traceability
  voice_transcripts jsonb NOT NULL DEFAULT '{}'::jsonb,
  completeness_score integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendee_business_brief TO authenticated;
GRANT ALL ON public.attendee_business_brief TO service_role;

ALTER TABLE public.attendee_business_brief ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own business brief"
  ON public.attendee_business_brief FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

CREATE POLICY "Users insert own business brief"
  ON public.attendee_business_brief FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own business brief"
  ON public.attendee_business_brief FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

CREATE TRIGGER trg_brief_updated_at
  BEFORE UPDATE ON public.attendee_business_brief
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Filing info — RLS-only PII (no encryption, no extra secrets)
CREATE TABLE IF NOT EXISTS public.attendee_filing_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  legal_first_name text,
  legal_last_name text,
  dob date,
  ssn_last4 text,                       -- store only last 4 by default
  ssn_full text,                        -- optional full SSN if user provides for EIN/LLC
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'US',
  llc_name text,
  registered_agent_name text,
  registered_agent_address text,
  business_purpose text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendee_filing_info TO authenticated;
GRANT ALL ON public.attendee_filing_info TO service_role;

ALTER TABLE public.attendee_filing_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own filing info"
  ON public.attendee_filing_info FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

CREATE POLICY "Users insert own filing info"
  ON public.attendee_filing_info FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own filing info"
  ON public.attendee_filing_info FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

CREATE TRIGGER trg_filing_updated_at
  BEFORE UPDATE ON public.attendee_filing_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Stage intake — progressive per-deliverable input that primes downstream
CREATE TABLE IF NOT EXISTS public.attendee_stage_intake (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  deliverable_key text NOT NULL,
  intake jsonb NOT NULL DEFAULT '{}'::jsonb,
  voice_transcripts jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, deliverable_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendee_stage_intake TO authenticated;
GRANT ALL ON public.attendee_stage_intake TO service_role;

ALTER TABLE public.attendee_stage_intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own stage intake"
  ON public.attendee_stage_intake FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

CREATE POLICY "Users insert own stage intake"
  ON public.attendee_stage_intake FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own stage intake"
  ON public.attendee_stage_intake FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

CREATE TRIGGER trg_stage_intake_updated_at
  BEFORE UPDATE ON public.attendee_stage_intake
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Allow users to read their own deliverables (including drafts/in-progress) — not just published.
-- Server fns mostly use supabaseAdmin, but we want the workflow page to read draft state too.
DROP POLICY IF EXISTS "Users read own published deliverables" ON public.attendee_deliverables;
CREATE POLICY "Users read own deliverables"
  ON public.attendee_deliverables FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

-- 7) Allow users to read their own pipeline runs/steps
CREATE POLICY "Users read own pipeline runs"
  ON public.ai_pipeline_runs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own pipeline steps"
  ON public.ai_pipeline_steps FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

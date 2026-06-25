-- 1. Schema additions
ALTER TABLE public.venture_document_types
  ADD COLUMN IF NOT EXISTS intake_schema jsonb;

ALTER TABLE public.venture_documents
  ADD COLUMN IF NOT EXISTS intake_answers jsonb;

-- 2. Seed Budget & Pro Forma deliverable in the Finance pillar
INSERT INTO public.venture_document_types
  (type, name, description, category, sort_order, dependencies, estimated_minutes, icon, free_tier, intake_schema)
VALUES (
  'budget_pro_forma',
  'Budget & Pro Forma',
  '12-month operating budget plus 3-year pro forma (P&L, cash flow, headcount, capex) grounded in your assumptions.',
  'Finance',
  17,
  ARRAY['financial_model']::text[],
  9,
  'Calculator',
  false,
  jsonb_build_object(
    'version', 1,
    'description', 'A few quick numbers so the budget and pro forma reflect your real plan, not generic placeholders.',
    'fields', jsonb_build_array(
      jsonb_build_object('id','starting_cash','label','Starting cash on hand today','type','currency','required',true,'placeholder','25000','help','Cash + equivalents available the day you start the plan.'),
      jsonb_build_object('id','owner_draw','label','Founder / owner monthly draw','type','currency','required',true,'placeholder','4000','help','How much you need to pay yourself each month (gross).'),
      jsonb_build_object('id','fiscal_year_start','label','Fiscal year start month','type','select','required',true,'default','January',
        'options', jsonb_build_array('January','February','March','April','May','June','July','August','September','October','November','December')),
      jsonb_build_object('id','revenue_model','label','Primary revenue model','type','select','required',true,
        'options', jsonb_build_array('Subscription','Transactional / one-time','Services','Marketplace','Advertising','Mixed')),
      jsonb_build_object('id','avg_price','label','Average price per sale','type','currency','required',true,'placeholder','99'),
      jsonb_build_object('id','cogs_pct','label','Unit cost / COGS as % of price','type','percent','required',true,'placeholder','30'),
      jsonb_build_object('id','month1_revenue','label','Realistic month-1 revenue','type','currency','required',true,'placeholder','2000'),
      jsonb_build_object('id','month12_revenue','label','Target month-12 revenue','type','currency','required',true,'placeholder','25000'),
      jsonb_build_object('id','hires','label','Planned hires in next 12 months','type','rows','help','Add a row per planned hire. Leave empty if no hires.',
        'columns', jsonb_build_array(
          jsonb_build_object('id','role','label','Role','type','text','placeholder','Operations lead'),
          jsonb_build_object('id','start_month','label','Start month (1-12)','type','number','placeholder','4'),
          jsonb_build_object('id','salary','label','Monthly salary','type','currency','placeholder','5000')
        )),
      jsonb_build_object('id','recurring_costs','label','Recurring monthly fixed costs','type','rows','help','Rent, software, insurance, accounting, etc.',
        'columns', jsonb_build_array(
          jsonb_build_object('id','name','label','Line item','type','text','placeholder','Software stack'),
          jsonb_build_object('id','amount','label','Monthly amount','type','currency','placeholder','450')
        )),
      jsonb_build_object('id','one_time_costs','label','Major one-time costs (next 12 months)','type','rows','help','Equipment, build-out, legal, branding, launch event.',
        'columns', jsonb_build_array(
          jsonb_build_object('id','name','label','Line item','type','text','placeholder','Initial inventory'),
          jsonb_build_object('id','month','label','Month (1-12)','type','number','placeholder','2'),
          jsonb_build_object('id','amount','label','Amount','type','currency','placeholder','8000')
        )),
      jsonb_build_object('id','funding','label','Funding committed or expected','type','rows','help','Investment, loans, grants — with month it lands.',
        'columns', jsonb_build_array(
          jsonb_build_object('id','source','label','Source','type','text','placeholder','Friends & family round'),
          jsonb_build_object('id','month','label','Month (1-12)','type','number','placeholder','3'),
          jsonb_build_object('id','amount','label','Amount','type','currency','placeholder','50000')
        )),
      jsonb_build_object('id','notes','label','Anything unusual about your cost structure, seasonality, or revenue timing?','type','textarea','rows',5,'placeholder','e.g. December is 40% of annual revenue; payment terms are net-60; we need to stock inventory 2 months ahead.',
        'quickTags', jsonb_build_array('Seasonal business','Long sales cycle','Inventory-heavy','Regulated industry','Grant-funded'),
        'allowVoice', true)
    )
  )
)
ON CONFLICT (type) DO UPDATE
  SET description = EXCLUDED.description,
      category = EXCLUDED.category,
      sort_order = EXCLUDED.sort_order,
      dependencies = EXCLUDED.dependencies,
      estimated_minutes = EXCLUDED.estimated_minutes,
      icon = EXCLUDED.icon,
      intake_schema = EXCLUDED.intake_schema;

-- 3. Nudge pitch_deck_outline to land after budget_pro_forma in Finance
UPDATE public.venture_document_types
  SET sort_order = 18
  WHERE type = 'pitch_deck_outline' AND sort_order = 17;
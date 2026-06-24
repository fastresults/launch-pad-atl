
UPDATE public.deliverable_types
   SET active = false
 WHERE key NOT IN (
   'concept_brief','executive_summary','value_proposition','market_sizing','competitive_landscape',
   'business_plan','go_to_market','pricing_strategy','customer_acquisition','partnership_strategy',
   'product_roadmap','team_structure','operations_plan','technology_stack',
   'financial_model','funding_strategy','investor_memo','exit_strategy',
   'risk_assessment','board_presentation'
 );

INSERT INTO public.deliverable_types
  (key, label, description, stage_label, stage_n, sort_order, tier_required, active,
   default_model, depends_on_keys, requires_context_keys, produces_context_key,
   output_kind, user_can_trigger, auto_runnable, schema_version)
VALUES
  ('concept_brief','Concept Brief','One-page articulation of the idea, who it''s for, and why now.','Foundation',1,101,'founders',true,'google/gemini-2.5-flash','{}','{}','concept_brief','document',true,true,1),
  ('executive_summary','Executive Summary','Three-paragraph summary investors read first.','Foundation',1,102,'founders',true,'google/gemini-2.5-flash','{concept_brief}','{concept_brief}','executive_summary','document',true,true,1),
  ('value_proposition','Value Proposition','Crisp value prop and positioning statement.','Foundation',1,103,'founders',true,'google/gemini-2.5-flash','{concept_brief}','{concept_brief}','value_proposition','document',true,true,1),
  ('market_sizing','Market Sizing','TAM / SAM / SOM with sourced assumptions.','Foundation',1,104,'founders',true,'google/gemini-2.5-flash','{concept_brief}','{concept_brief}','market_sizing','document',true,true,1),
  ('competitive_landscape','Competitive Landscape','Named competitors, positioning grid, and your defensible edge.','Foundation',1,105,'founders',true,'google/gemini-2.5-flash','{market_sizing,value_proposition}','{market_sizing,value_proposition}','competitive_landscape','document',true,true,1),
  ('business_plan','Business Plan','Narrative plan: company, market, offer, model, traction.','Strategy',2,201,'founders',true,'google/gemini-2.5-flash','{executive_summary,value_proposition,market_sizing,competitive_landscape}','{executive_summary,value_proposition,market_sizing,competitive_landscape}','business_plan','document',true,true,1),
  ('go_to_market','Go-to-Market','Channels, sequencing, and the first 90 days of motion.','Strategy',2,202,'founders',true,'google/gemini-2.5-flash','{business_plan,competitive_landscape}','{business_plan,competitive_landscape}','go_to_market','document',true,true,1),
  ('pricing_strategy','Pricing Strategy','Packaging, price points, and unit economics.','Strategy',2,203,'founders',true,'google/gemini-2.5-flash','{value_proposition,market_sizing}','{value_proposition,market_sizing}','pricing_strategy','document',true,true,1),
  ('customer_acquisition','Customer Acquisition','Acquisition channels, CAC targets, and first-30-day plan.','Strategy',2,204,'founders',true,'google/gemini-2.5-flash','{go_to_market}','{go_to_market}','customer_acquisition','document',true,true,1),
  ('partnership_strategy','Partnership Strategy','Channel, integration, and distribution partner shortlist.','Strategy',2,205,'founders',true,'google/gemini-2.5-flash','{go_to_market}','{go_to_market}','partnership_strategy','document',true,true,1),
  ('product_roadmap','Product Roadmap','Phased roadmap from MVP to year-one.','Operations',3,301,'founders',true,'google/gemini-2.5-flash','{business_plan}','{business_plan}','product_roadmap','document',true,true,1),
  ('team_structure','Team Structure','Org chart, first hires, contractor vs full-time plan.','Operations',3,302,'founders',true,'google/gemini-2.5-flash','{product_roadmap}','{product_roadmap}','team_structure','document',true,true,1),
  ('operations_plan','Operations Plan','How the business runs day-to-day: workflow, SOPs, vendors.','Operations',3,303,'founders',true,'google/gemini-2.5-flash','{product_roadmap}','{product_roadmap}','operations_plan','document',true,true,1),
  ('technology_stack','Technology Stack','Tools and platforms that run the business.','Operations',3,304,'founders',true,'google/gemini-2.5-flash','{product_roadmap}','{product_roadmap}','technology_stack','document',true,true,1),
  ('financial_model','Financial Model','12-month P&L, cash flow, break-even with assumptions.','Finance',4,401,'founders',true,'google/gemini-2.5-flash','{pricing_strategy,product_roadmap,team_structure}','{pricing_strategy,product_roadmap,team_structure}','financial_model','document',true,true,1),
  ('funding_strategy','Funding Strategy','Capital path: bootstrap, grants, debt, or equity.','Finance',4,402,'founders',true,'google/gemini-2.5-flash','{financial_model}','{financial_model}','funding_strategy','document',true,true,1),
  ('investor_memo','Investor Memo','Concise memo investors can forward.','Finance',4,403,'founders',true,'google/gemini-2.5-flash','{business_plan,financial_model}','{business_plan,financial_model}','investor_memo','document',true,true,1),
  ('exit_strategy','Exit Strategy','Acquisition, secondary, or hold scenarios.','Finance',4,404,'founders',true,'google/gemini-2.5-flash','{investor_memo}','{investor_memo}','exit_strategy','document',true,true,1),
  ('risk_assessment','Risk Assessment','Top risks (market, regulatory, execution) and mitigations.','Governance',5,501,'founders',true,'google/gemini-2.5-flash','{business_plan,financial_model,operations_plan}','{business_plan,financial_model,operations_plan}','risk_assessment','document',true,true,1),
  ('board_presentation','Board Presentation','First board / advisor deck with KPIs and asks.','Governance',5,502,'founders',true,'google/gemini-2.5-flash','{business_plan,financial_model,risk_assessment}','{business_plan,financial_model,risk_assessment}','board_presentation','document',true,true,1)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  stage_label = EXCLUDED.stage_label,
  stage_n = EXCLUDED.stage_n,
  sort_order = EXCLUDED.sort_order,
  tier_required = EXCLUDED.tier_required,
  active = true,
  default_model = EXCLUDED.default_model,
  depends_on_keys = EXCLUDED.depends_on_keys,
  requires_context_keys = EXCLUDED.requires_context_keys,
  produces_context_key = EXCLUDED.produces_context_key,
  output_kind = EXCLUDED.output_kind,
  user_can_trigger = EXCLUDED.user_can_trigger,
  auto_runnable = EXCLUDED.auto_runnable;

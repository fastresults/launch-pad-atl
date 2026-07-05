ALTER TABLE public.venture_snapshots
  ADD COLUMN IF NOT EXISTS sourcing_profile jsonb;

COMMENT ON COLUMN public.venture_snapshots.sourcing_profile IS
  'Classifier output: { is_physical_product bool, product_form, sourcing_mode, regulatory_flags[] }. Set by venture-deep-research at step 0; gates sourcing sub-steps and the two sourcing assets.';

INSERT INTO public.venture_document_types
  (type, name, description, category, sort_order, dependencies, estimated_minutes, icon, free_tier, model_tier, context_keys)
VALUES
  ('supplier_shortlist',
   'Supplier Shortlist',
   'Five to ten evaluated suppliers or manufacturers with MOQ, lead time, unit cost, pros/cons, contact URL, and a first-outreach message.',
   'Operations', 49,
   ARRAY['operating_plan','fulfillment_sop']::text[],
   5, 'Package', false, 'pro',
   ARRAY['identity','solution','customer','business_model_summary','known_numbers']),
  ('bom_and_landed_cost',
   'BOM & Landed-Cost Model',
   'Bill of materials, unit cost stack, freight/duty/landed-cost model with sensitivities, and break-even units at current price.',
   'Operations', 50,
   ARRAY['supplier_shortlist','unit_economics','financial_model']::text[],
   5, 'Calculator', false, 'pro',
   ARRAY['identity','business_model_summary','known_numbers','market_facts'])
ON CONFLICT (type) DO UPDATE
  SET name              = EXCLUDED.name,
      description       = EXCLUDED.description,
      category          = EXCLUDED.category,
      sort_order        = EXCLUDED.sort_order,
      dependencies      = EXCLUDED.dependencies,
      estimated_minutes = EXCLUDED.estimated_minutes,
      icon              = EXCLUDED.icon,
      free_tier         = EXCLUDED.free_tier,
      model_tier        = EXCLUDED.model_tier,
      context_keys      = EXCLUDED.context_keys;
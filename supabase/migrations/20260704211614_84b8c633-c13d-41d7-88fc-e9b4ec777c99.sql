INSERT INTO public.venture_document_types
  (type, name, description, category, sort_order, dependencies, estimated_minutes, icon, free_tier)
VALUES
  ('launch_plan_14day',            '14-Day Launch Plan',                 'Dated day-by-day sprint sequencing every asset into 14 blocks with owner, output, and definition of done.', 'Foundation',       33, '{value_proposition,go_to_market_plan}',                4, 'CalendarClock',      true),
  ('first_50_warm_list',           'First-50 Warm List',                 'Fifty named prospects with contact, angle, and specific ask — ready to work on day 2.',                       'Strategy',         34, '{customer_personas,value_proposition}',                4, 'ListChecks',         true),
  ('pre_sell_offer_test',          'Pre-Sell Offer & Waitlist Test',     '48-hour validation offer (deposit, LOI, or paid pilot) that proves demand before the site ships.',           'Strategy',         35, '{value_proposition,first_50_warm_list}',               4, 'Beaker',             true),
  ('fulfillment_sop',              'Fulfillment SOP',                    'Step-by-step delivery for orders 1-10 with time and cost per unit.',                                          'Operations',       36, '{operating_plan}',                                     5, 'Package',            false),
  ('customer_support_starter',     'Customer Support Starter',           'Shared inbox, response SLA, canned replies, and refund/return rules ready before day 15.',                   'Operations',       37, '{fulfillment_sop}',                                    4, 'LifeBuoy',           false),
  ('pricing_offer_sheet',          'Pricing Page & Offer Sheet',         'Packaged tiers, terms, inclusions, and exclusions — the artifact checkout points at.',                        'Finance',          38, '{unit_economics,value_proposition}',                   5, 'Tag',                false),
  ('payments_checkout_setup',      'Payments & Checkout Setup',          'Stripe account, tax, payouts, branded receipts, and one live checkout link tied to the offer.',              'Finance',          39, '{value_proposition,pricing_offer_sheet}',              5, 'CreditCard',         false),
  ('business_bank_books_starter',  'Business Bank & Bookkeeping Starter','Bank account opened, card issued, books tool connected, chart of accounts seeded to the model.',              'Finance',          40, '{legal_structure_brief,financial_model}',              5, 'Building2',          false),
  ('terms_privacy_refund_pack',    'Terms, Privacy & Refund Pack',       'Customer-facing legal set required by Stripe, app stores, and enterprise buyers.',                            'Governance',       41, '{legal_structure_brief}',                              5, 'FileCheck',          false),
  ('insurance_starter',            'Insurance Starter',                  'GL/E&O quote path with coverage tuned to buyer, landlord, and venue COI asks.',                               'Governance',       42, '{legal_structure_brief,risk_register}',                4, 'Umbrella',           false),
  ('contractor_1099_kit',          'Contractor & 1099 Kit',              'MSA, SOW, W-9, and IP assignment ready for the first contractor engagement.',                                 'Governance',       43, '{legal_structure_brief}',                              4, 'FileSignature',      false),
  ('domain_email_dns_checklist',   'Domain, Email & DNS Checklist',      'Domain purchased, business email live, SPF/DKIM/DMARC set, support alias routed.',                            'Marketing',        44, '{}',                                                   3, 'AtSign',             false),
  ('analytics_pixel_setup',        'Analytics & Pixel Setup',            'GA4, ad pixels, conversion events, and UTM convention wired before spend starts.',                            'Marketing',        45, '{website_prd}',                                        4, 'Activity',           false),
  ('landing_page_waitlist_test',   'Landing Page & Waitlist Test',       'One-page offer test live by day 4 so ads and outreach have a destination pre-site.',                          'Marketing',        46, '{value_proposition,pre_sell_offer_test}',              5, 'MousePointerClick',  false),
  ('reviews_testimonials_kit',     'Reviews & Testimonials Capture Kit', 'Request templates, review links, video-ask script, and wall-of-love page.',                                   'Social & Content', 47, '{customer_support_starter,brand_messaging_house}',     4, 'MessageSquareQuote', false),
  ('outbound_dm_email_scripts',    'Outbound DM & Email Scripts',        'Cold/warm outreach scripts tied to the First-50 list — opener, follow-up, and ask.',                          'Social & Content', 48, '{first_50_warm_list,brand_voice_tone_guide}',          4, 'Send',               false)
ON CONFLICT (type) DO UPDATE
  SET name              = EXCLUDED.name,
      description       = EXCLUDED.description,
      category          = EXCLUDED.category,
      sort_order        = EXCLUDED.sort_order,
      dependencies      = EXCLUDED.dependencies,
      estimated_minutes = EXCLUDED.estimated_minutes,
      icon              = EXCLUDED.icon,
      free_tier         = EXCLUDED.free_tier;
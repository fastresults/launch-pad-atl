# Name the stack: QuickBooks Online + GoHighLevel in the Operating Runway

Today the runway says "books tool" and "the CRM". Real work stalls on the unnamed step. This plan makes QuickBooks Online (books, invoicing, sales tax) and GoHighLevel (CRM, funnels, lists, nurture, calendars, phone) the house standard, with full setup checklists a founder or the agency can actually execute.

## QuickBooks Online — Day 9 (Finance)

Replaces the generic books sub-tasks with named steps:

- Create the QuickBooks Online company file (legal name, EIN, fiscal year, accounting method).
- Connect the business bank and card feeds and confirm transactions are syncing.
- Import/finalize the chart of accounts for this venture's revenue and expense categories.
- Set bank rules so recurring spend categorizes itself.
- Turn on and brand the invoice template (logo, deposit, net terms, late fee) and send one test invoice.
- Connect payments so an invoice can be paid by card/ACH; run and refund one live test charge.
- Configure sales tax (nexus answer, rates, agency registration if required).
- Set products/services items that map to the priced offer sheet.
- Add the accountant/bookkeeper user and set the reconcile day and monthly close date.
- Run the first reconciliation and save the P&L + Balance Sheet as the baseline.

## GoHighLevel — Days 3, 10, and 12 (Strategy / Marketing / Operations)

Day 3 (stand it up):
- Create the GHL sub-account from the agency snapshot, set business profile, timezone, and users.
- Build the opportunity pipeline and stages with entry criteria and one owner per stage.
- Add custom fields (source, segment, deal value, next step, close date) and make them required.
- Set tags and smart lists for ICP tiers, warm vs. cold, industry, geography.
- Import the First-50 with source tags attached.
- Complete A2P 10DLC brand + campaign registration and buy the number; verify a test SMS.
- Connect the sending domain / LC Email and verify SPF, DKIM, DMARC pass.

Day 10 (lists, funnels, nurture):
- Build the lead magnet funnel in GHL (landing page → form → thank-you → delivery email).
- Wire the form to create a contact + opportunity with source and UTM captured on the record.
- Turn on the 5-email welcome/nurture workflow with the trigger and exit conditions written.
- Set the UTM convention and confirm it lands in GHL attribution reporting.
- Build the retargeting audience feed from GHL page traffic and list.

Day 12 (run the machine):
- Turn on task/reminder and stale-opportunity automation (no deal untouched past N days).
- Connect the GHL calendar for booking, with reminders and a round-robin owner.
- Set the missed-call text-back and inbound conversation routing.
- Build the pipeline reporting dashboard (by stage, by source, by owner).
- Publish proposal/estimate send + e-signature path and hand the closed-won record to QuickBooks.

## Handoff between the two

One explicit task: connect GoHighLevel closed-won to QuickBooks invoicing (native, Zapier, or manual SOP) so a won deal produces an invoice without re-keying — done when one test deal flows end to end.

## Technical notes

- All changes are new `subs` entries in `supabase/functions/_shared/ops-runway.ts` on existing days 3, 9, 10, 12, using new task keys (`qbo-*`, `ghl-*`). Existing generic tasks stay so seeded ventures keep progress; the generic wording is tightened to reference the named tool.
- Seeding in `venture-ops` upserts on `(snapshot_id, task_key)` and re-aligns `sort_order`, so existing runways (e.g. CarveWorks) backfill the new tasks on next load — verify that path after deploy.
- No schema change. Redeploy `venture-ops` after the catalog edit.

Adds roughly 30 named tasks, taking the runway from ~106 to ~136 steps.

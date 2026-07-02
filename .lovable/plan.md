# Georgia Legal Setup — Foundation Workflow

Add a new Foundation-stage tool that walks the founder step-by-step through legally forming their business in Georgia and obtaining a Federal EIN (FEIN). It reuses the existing Filing Info the founder already provides, generates a personalized packet, and tracks progress task-by-task so the user always knows what to do next.

## What the founder experiences

A new card appears at the top of the Foundation pillar: **"Legal Setup — Form your Georgia business."** Opening it launches a full-page checklist with 7 sequential steps. Each step has a plain-English explanation, the official GA link, an estimated time, an estimated cost, and a "Mark complete" toggle. Progress persists per user and shows as a ring on the Foundation stage.

### The 7 steps

1. **Choose your entity** — LLC vs S-Corp vs Sole Prop, with a recommendation based on the founder's brief (industry, revenue plans, cofounders). Auto-picks LLC unless the brief signals otherwise.
2. **Name check + reservation** — GA Corporations Division business-name search, optional 30-day name reservation.
3. **Registered Agent** — explain the role, offer three paths: self, cofounder, third-party service (Northwest / ZenBusiness / Registered Agents Inc). Pre-fills from Filing Info.
4. **File Articles of Organization** — direct link to `ecorp.sos.ga.gov`, exact fees ($100 online / $110 mail), field-by-field crib sheet pre-filled from Filing Info the founder already entered.
5. **Get your FEIN (EIN)** — IRS Form SS-4 online walkthrough, exactly which "reason for applying" and "responsible party" options to choose, screenshot-annotated 10-minute path. Saves the EIN back to the profile once entered.
6. **Operating Agreement** — generates a Georgia-specific single/multi-member Operating Agreement document from the founder's data (uses the existing document generator pipeline).
7. **Post-formation checklist** — GA Annual Registration ($50, due April 1), business bank account, sales/use tax registration (if selling taxable goods), local business license (Atlanta or founder's city), BOI report status (currently paused — noted with disclaimer).

Every step has a **"What if I'm stuck?"** button that pipes the step + the founder's context into the Ask Concierge chatbot pre-loaded.

## How it fits the existing product

- Lives inside the Foundation pillar on the workflow page — same visual pattern as the current deliverable cards, so it feels native.
- Reads from `attendee_filing_info` / `member_filings` (already collected on the Filing page) so most fields are pre-filled.
- Writes progress to a new lightweight `legal_setup_progress` table keyed on `user_id` + `venture_snapshot_id`.
- Generates the Operating Agreement through the existing `venture-generate-document` edge function, adding a new document type `operating_agreement_ga`.
- Deep-links each step's "help" button to the existing Ask Concierge with a scoped system prompt.

## Technical outline

### Database (one migration)

- New table `public.legal_setup_progress` — `id`, `user_id`, `snapshot_id`, `entity_choice`, `entity_state`, `ein`, `registered_agent_choice`, `steps_completed jsonb`, `notes`, timestamps. Full GRANTs + RLS ("founder owns their row" + admin bypass), plus `updated_at` trigger.
- Seed one row in `public.deliverable_types` for `legal_setup_ga` (Foundation stage, `output_kind='workflow'`, `user_can_trigger=true`).
- Seed one row in `public.venture_document_types` for `operating_agreement_ga`.

### Frontend

- `src/lib/legal-setup.ts` — pure data: the 7 steps, GA-specific links, fees, and copy.
- `src/lib/legal-setup.functions.ts` — read/write progress via the Supabase client.
- `src/components/foundation/LegalSetupCard.tsx` — teaser card slotted into the Foundation pillar list.
- `src/routes/_authenticated/dashboard/legal-setup.tsx` — full stepper page (reuses existing `Accordion` + `Checkbox` primitives).
- Hook the "Generate Operating Agreement" button into the existing document generation flow.

### Edge function

- Extend `venture-generate-document` (or add `venture-generate-operating-agreement`) with a Georgia-specific Operating Agreement prompt that consumes filing info + entity choice.

### Chatbot integration

- Extend `src/lib/chatbot-knowledge.ts` with a "Georgia formation" section (SOS process, EIN, GA annual registration, Atlanta business license) so the concierge answers accurately when a founder clicks "What if I'm stuck?".

## Out of scope (call out to user)

- We won't file on the founder's behalf or store SSNs beyond what Filing Info already collects.
- BOI/CTA reporting is currently paused by court order — we'll surface the current status with a link but not automate it.
- Non-Georgia states are not covered in this iteration; the card only appears when the founder's Filing Info state is GA (or unset — then we ask).

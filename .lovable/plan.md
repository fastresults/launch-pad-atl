
## Goal

After registration & login, every attendee gets a dashboard that walks them through all **25 deliverables** from the "What you can actually walk out with" grid via a **progressive, agentic AI pipeline**: each stage's intake (plus AI-generated artifacts) becomes the grounding context for the next stage, so once enough information has been collected the agent can run the remaining deliverables **end-to-end without further user input**. Every text field supports **voice recording** as an alternative to typing. Super admins can run the same pipeline on behalf of any user.

---

## 1. Progressive Context Model (the heart of agentic execution)

Every AI call is grounded in a single, growing **AttendeeContext** object assembled server-side at run time:

```text
AttendeeContext = {
  profile,              // attendee_profiles
  brief,                // attendee_business_brief    (Stage 0)
  filing,               // attendee_filing_info       (Stage 1 intake)
  documents,            // attendee_documents text extracts
  stageIntake: {        // 1 small form per stage
    customer, offer, build, brand, marketing, launch
  },
  deliverables: {       // every approved upstream deliverable's content_current
    <key>: { ...structured output... }
  }
}
```

Rules that make the pipeline self-driving:

1. **Each deliverable declares `requires_context_keys`** (subset of the AttendeeContext above). The orchestrator only runs a deliverable when every required key is present and non-empty.
2. **Every deliverable's output is merged back into `AttendeeContext.deliverables[<key>]`** the moment it's generated, so the next deliverable in line sees it. No re-prompting the user.
3. **A single "Run remaining deliverables" agent loop** (`runAttendeePipeline`) walks the dependency graph topologically: as soon as a deliverable's inputs are satisfied it fires, the result is merged, and the next batch becomes runnable. This continues until either (a) every deliverable is generated, or (b) the graph hits a node whose `requires_context_keys` includes a stage intake the user hasn't filled — at which point the loop pauses and the dashboard surfaces *exactly one* "Next: tell me X" card.
4. **Autonomy threshold.** Once `brief` + `filing` + the Customer/Offer mini-intakes are complete, the agent has enough to drive Stages 3→7 without further prompts. The dashboard shows an explicit **[Run everything remaining]** button that kicks off the loop and streams progress.
5. **No silent re-asks.** If the model needs a fact that isn't in context, the orchestrator emits a structured `needs_input` record (field name + why) instead of hallucinating. The dashboard renders these as inline follow-up prompts in the relevant stage card.

This is the only mechanism by which deliverables advance. There is no per-deliverable form; intake is collected at the **stage** level once and reused across every deliverable in that stage and downstream.

## 2. Reconcile deliverables (25, not 17)

Migration adds the 8 missing types so the seed matches `VALUE_ROWS`. Each `deliverable_types` row gains:
- `requires_context_keys text[]` (drives the orchestrator)
- `produces_context_key text` (what slot its output fills)
- `output_kind` (`document` | `checklist` | `asset_brief` | `external_filing`)
- `user_can_trigger boolean default true`
- `auto_runnable boolean default true` (false for things requiring human judgment like final brand approval)

Stage map:

```text
Stage 0 Brief       → (intake only; no deliverable)
Stage 1 Form        → llc_filing_packet, ein_letter, legal_docs, compliance_checklist,
                       funding_runway, business_plan_proforma, pitch_deck, fundraising_kit
Stage 2 Customer    → icp_prospect_list, competitive_research, competitive_advantage
Stage 3 Offer       → offer_scope, pricing_sheet
Stage 4 Build       → workflow_tooling, first_deliverable_qa, operations_sops, sourcing_staffing
Stage 5 Brand       → brand_kit, website_4pg, payments_email_ga
Stage 6 Marketing   → messaging_pitch, print_collateral, marketing_comms
Stage 7 Launch      → launch_gtm, day_of_kpis
```

## 3. Business Brief (Stage 0 — the foundational context)

The single most important intake; everything downstream is grounded in it. New table `attendee_business_brief` (RLS: user owns):

- One-liner (≤200 chars)
- Why this, why now (founder story)
- Customer
- Painful problem
- Your solution
- How you'll make money + first 3 SKUs
- Inspirations & differentiators
- What you've done so far
- What you need first (30 days)
- Anything else AI should know

UX: `/dashboard/brief` — 10 cards, voice + keyboard. Auto-save. Completing flips `attendee_profiles.intake_completed_at` and unlocks the entire pipeline.

## 4. Filing intake (Stage 1 prerequisite)

`attendee_filing_info` (RLS user-owns; SSN/DOB encrypted with `pgp_sym_encrypt`, masked in UI). 3 short cards (≤6 fields each): **About you**, **Your LLC**, **Members & agent**. AI prefills NAICS, business-purpose statement, and LLC-name alternates **from the brief**, so user mostly confirms.

## 5. Progressive stage intakes (3–6 fields max, each)

Each form unlocks its stage *and* every downstream stage that depends on its `produces_context_key`. AI suggestions are pre-filled from upstream context so the user is editing, not authoring:

- **Customer**: "Who has this problem?" + "3 places they hang out" → unlocks ICP + competitors → feeds Offer.
- **Offer**: "One thing you sell" + price comfort → unlocks scope + pricing → feeds Build & Marketing.
- **Build**: "Tools you already use?" → unlocks workflow, SOPs, sourcing → feeds Brand & Launch.
- **Brand**: 4 visual-preference picks → unlocks brand kit + website + payments → feeds Marketing.
- **Marketing**: "Top channel?" + "Voice (3 words)" → unlocks pitch, collateral, comms → feeds Launch.
- **Launch**: "Launch date" + "First 5 people" → unlocks GTM + KPIs.

Every text input supports voice (§7).

## 6. Phased dashboard + agentic runner

`/dashboard/workflow` shows the 7 stages as gated cards. Each deliverable card shows status pill (`locked / needs-input / ready / generating / draft / approved / published`) and actions: `[Generate]`, `[Regenerate]`, `[Preview]`, `[Approve & publish]`.

Top of the page: a persistent **[Run remaining deliverables]** button + a streaming activity log ("Generating ICP… ✓ done. Generating Offer scope… ✓ done. Paused — need Brand preferences."). The orchestrator runs server-side and streams progress via TanStack Query polling on `ai_pipeline_runs` + `ai_pipeline_steps`.

## 7. Voice input on every text field

Reusable `<VoiceTextarea>` / `<VoiceInput>` wrap shadcn primitives. Mic button → `MediaRecorder` → on stop, audio (≤3 min, ≤25 MB) POSTed to `transcribeAudio` server fn → Lovable AI Gateway STT (verify exact model at build time; fallback to Gemini multimodal if no dedicated STT model is exposed) → transcript appended at cursor position. Audio is never persisted. Rate limit: 30/day per user. Graceful fallback for browsers without mic permission.

## 8. Server-fn changes

- `src/lib/brief.functions.ts` — `getMyBrief`, `upsertMyBrief`.
- `src/lib/filing.functions.ts` — `getMyFilingInfo`, `upsertMyFilingInfo` (encrypted PII).
- `src/lib/stageIntake.functions.ts` — `getMyStageIntake`, `upsertMyStageIntake(stage, payload)`.
- `src/lib/voice.functions.ts` — `transcribeAudio`.
- `src/lib/pipeline.functions.ts` — adds:
  - `buildAttendeeContext(userId)` — assembles the live AttendeeContext.
  - `getMyWorkflow` — returns 25 deliverables with status + per-card `missingContextKeys`.
  - `attendeeTriggerDeliverable` — refuses unless `requires_context_keys ⊆ AttendeeContext`; reuses `runStep`; rate-limited 5 concurrent + 30/day.
  - `runAttendeePipeline` — the agent loop. Topologically walks the graph, runs each ready deliverable, merges its output back into context, recomputes ready set, repeats until done or paused on `needs_input`. Emits one `ai_pipeline_runs` row + one `ai_pipeline_steps` row per deliverable for observability.
  - `attendeePublishDeliverable` — one-click approve & publish for own deliverables.
- `runStep` is updated to take the **full AttendeeContext** (not just profile + docs) and to enforce structured output via the AI SDK `Output` API; any `needs_input` is returned as a typed field, never inlined into the artifact.
- Existing `triggerPipeline` / `regenerateDeliverable` keep super-admin gate; admin can call `runAttendeePipeline(userId)` for any user.

## 9. Super-admin parity

`/admin/attendees/$userId` gets a **Workflow** tab mirroring the attendee view: same 25-card grid, same `[Run remaining]` button, view/edit brief + filing + stage intakes (decrypted PII admin-only), bulk regenerate per stage. Review queue stays for publish overrides.

## 10. Security & data handling

- New tables (`attendee_business_brief`, `attendee_filing_info`, `attendee_stage_intake`) all RLS-gated to `user_id = auth.uid()` with admin read via `is_admin()`.
- SSN/DOB encrypted; only decrypted inside `runStep` for `ein_letter` and `llc_filing_packet`.
- Voice audio never persisted.
- New secret `FILING_PII_KEY`.
- Rate limits on `transcribeAudio` and `runAttendeePipeline` to bound AI cost.

## 11. Out of scope

Real GA e-filing submission, actual IRS EIN issuance, Stripe account creation, domain purchase/DNS, real-time streaming transcription. We produce the artifacts and checklists; the user (or a future integration) executes them.

---

## Technical sketch

```text
src/
├── components/voice/
│   ├── VoiceTextarea.tsx           NEW
│   └── VoiceInput.tsx              NEW
├── lib/
│   ├── brief.functions.ts          NEW
│   ├── filing.functions.ts         NEW (encrypted PII)
│   ├── stageIntake.functions.ts    NEW
│   ├── voice.functions.ts          NEW (transcribeAudio)
│   ├── workflow.ts                 NEW (25-deliverable manifest, dependency graph, context-key map)
│   └── pipeline.functions.ts       + buildAttendeeContext, getMyWorkflow,
│                                     attendeeTriggerDeliverable, runAttendeePipeline,
│                                     attendeePublishDeliverable; runStep grounded on AttendeeContext
├── routes/_authenticated/
│   ├── dashboard.brief.tsx         NEW (10-card brief, voice everywhere)
│   ├── dashboard.filing.tsx        NEW (3-card filing intake)
│   ├── dashboard.workflow.tsx      NEW (phased grid + Run-remaining button + activity log)
│   ├── dashboard.workflow.$key.tsx NEW (per-deliverable detail + needs_input prompts)
│   └── _admin/admin.attendees.$userId.workflow.tsx  NEW (admin mirror)
└── supabase/migrations/<ts>_workflow_v2.sql
    - INSERT 8 missing deliverable_types + prompt templates
    - ALTER deliverable_types ADD requires_context_keys, produces_context_key, output_kind,
                                 user_can_trigger, auto_runnable
    - CREATE TABLE attendee_business_brief    (+ RLS, GRANTs)
    - CREATE TABLE attendee_filing_info       (+ pgcrypto, RLS, GRANTs)
    - CREATE TABLE attendee_stage_intake      (one row per user per stage; + RLS, GRANTs)
```

Migration first → server fns + orchestrator → UI. Existing flat "Deliverables" tab redirects to `/dashboard/workflow`.

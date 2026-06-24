# Plan: Founders Hub AI Workflow for Registrants

## Strategy

The existing app already has 80% of this infrastructure under different names. Rather than build a parallel "ventures" system, **extend what exists** and add the Founders-Hub-specific concepts (snapshot/enrichment, dependency-aware bulk generation, 20-doc catalog) on top. This avoids two competing workflows and keeps the admin tooling unified.

### Mapping PRD concepts → existing tables

| PRD concept | Existing equivalent | Action |
|---|---|---|
| `venture_snapshots` | `attendee_business_brief` (one-per-user) | Add new `venture_snapshots` table — registrants may want multiple snapshots; brief stays as the workshop intake |
| `venture_documents` | `attendee_deliverables` | Reuse pattern; new table scoped to snapshot |
| `venture_generation_jobs` | `ai_pipeline_runs` | Reuse pattern; new table scoped to snapshot |
| Document catalog | `deliverable_types` | New `venture_document_types` seed table (20 rows, 5 categories) |
| Edge functions | none yet for AI runs | New functions under `supabase/functions/venture-*` |
| Admin approval gate | `profiles.member_status` (`approved`/`pending`/`paused`) + role checks | Add a new per-registrant flag `founders_hub_access` (boolean + `granted_at`/`granted_by`) on `profiles` so admin can grant the AI workflow independently of general member approval |

## Access Gating (workshop-day approval)

1. **New column** `profiles.founders_hub_access boolean default false` plus `founders_hub_granted_at`, `founders_hub_granted_by`.
2. Admin members page (`/admin/members`) gets a "Grant Founders Hub" toggle per registrant. Default off; admin flips it on the morning of the workshop.
3. New route group `/dashboard/hub/*` guarded by a `<FoundersHubGate>` wrapper that checks `founders_hub_access` (admins bypass). Gated users see a "Access opens on workshop day — your facilitator will unlock this" placeholder.
4. Dashboard sidebar shows a "Founders Hub" item only when access is granted (or for admins).

## Routes (new)

| Route | Purpose |
|---|---|
| `/dashboard/hub` | Library — list of the user's venture snapshots |
| `/dashboard/hub/new` | Concept wizard (Step 1) |
| `/dashboard/hub/:snapshotId` | Wizard host: Enriching → Review → Generate (steps 2-4) |
| `/admin/hub` | Admin overview: snapshots, generation jobs, failure log |
| `/admin/hub/:snapshotId` | Admin view of one snapshot + docs |

## Data Model (new tables, all in `public`)

All tables: RLS scoped to `auth.uid()`; admins via `has_role(auth.uid(),'admin')`; GRANTs to `authenticated` + `service_role`.

```text
venture_snapshots
  id uuid pk, user_id uuid (auth.users), company_name, website_url,
  business_concept, differentiation_statement,
  scraped_content text, competitor_data jsonb, market_research text,
  extracted_data jsonb, status enum(input|enriching|review|generating|complete|archived),
  enrichment_progress jsonb, created_at, updated_at

venture_documents
  id, snapshot_id fk, document_type text, status enum, content text,
  word_count int, quality_score int, version int default 1,
  metadata jsonb, content_version_history jsonb default '[]',
  created_at, updated_at
  unique(snapshot_id, document_type)

venture_generation_jobs
  id, snapshot_id fk, status enum(queued|running|paused|completed|failed|canceled),
  current_document_type text, progress_pct int, circuit_breaker_open bool,
  attempts int, error text, started_at, completed_at

venture_generation_failures
  id, snapshot_id, document_type, attempt int, error text, created_at

venture_document_types  -- seed, 20 rows
  type pk, name, description, category, sort_order, dependencies text[],
  estimated_minutes int, icon text, free_tier bool
```

Free-tier cap and Business-tier client switching from the PRD are deferred (the current app has no tier/client model). Document the column shapes but treat all approved users as "full access" for v1.

## Edge Functions (new, under `supabase/functions/`)

| Function | Notes |
|---|---|
| `venture-extract-concept` | Scrape (Firecrawl connector) + Lovable AI Gateway (`google/gemini-3-flash-preview`) to fill `extracted_data`; writes `enrichment_progress` |
| `venture-generate-document` | One-shot doc gen, returns markdown + quality score |
| `venture-generate-document-stream` | SSE/chunked stream version for live UI |
| `venture-bulk-generate` | Walks dependency DAG, writes `venture_generation_jobs` row, respects circuit breaker, idempotent on `(snapshot_id, document_type)` |
| `venture-repair-document` | Re-run a failed doc |
| `venture-job-watchdog` | pg_cron every 5 min; flips stalled jobs to `paused` |

All use Lovable AI Gateway with `LOVABLE_API_KEY` (already present). Default model `google/gemini-3-flash-preview`; premium tier uses `google/gemini-2.5-pro`.

## UI Components (new, under `src/components/hub/`)

- `VentureLibrary` — grid of `SnapshotCard`
- `VentureConceptInput` — Step 1 form, 3 enrichment paths (owned URL / competitor URL / manual)
- `VentureEnrichingProgress` — Step 2, polls every 3 s, stale-detect at 90 s
- `VentureReviewStep` — Step 3, editable 4-section form
- `DocumentGenerator` — Step 4 host
  - `AutonomousGenerationCard` — "Generate all 20" CTA
  - `DocumentCategorySection` × 5
  - `DocumentRow` — per-doc actions, dependency tooltip, Start-Here badge
  - `StreamingDocumentContent` — live token render
  - `VentureDocumentGenerationProgress`, `DocumentRepairProgress`
  - `VentureDocumentViewer` — modal w/ markdown render, copy, .md/.docx download, version history

Reuse existing `Button`, `Badge`, `Dialog`, `Progress`, `Card` from shadcn.

## Implementation Phases

1. **Schema + access flag** — migration: 5 new tables + `profiles.founders_hub_access` columns + GRANTs/RLS. Seed `venture_document_types` (20 rows from PRD Appendix A).
2. **Admin grant UI** — add toggle to `/admin/members`; surface the count of granted users on `/admin`.
3. **Gate + library + concept wizard** — `<FoundersHubGate>`, `/dashboard/hub`, `/dashboard/hub/new`, snapshot creation.
4. **Edge function: `venture-extract-concept`** + enrichment polling UI.
5. **Review step** + persisting `extracted_data`.
6. **Single doc generation** (`venture-generate-document` + stream variant) + viewer modal.
7. **Bulk generation** (`venture-bulk-generate` + job progress UI) + watchdog cron.
8. **Repair + version history + admin view**.

## Technical Notes

- Snapshots are independent of `attendee_business_brief`; the brief stays the workshop's structured intake, while a snapshot is the AI-workflow input. We can later prefill a snapshot from the brief if desired.
- All AI calls go through Lovable AI Gateway — no new secrets needed beyond what's already set (`LOVABLE_API_KEY`). Firecrawl needs the standard connector linked when we get to scraping (phase 4).
- Generation idempotency: `UNIQUE(snapshot_id, document_type)` plus `version` bump on regenerate; previous markdown archived into `content_version_history` jsonb.
- Telemetry events listed in PRD §10 logged via a new `venture_events` table (deferred to phase 7 — not strictly required for MVP).

## Out of Scope (v1)

- Free/Pro/Business tiers, credit ledger, agency client-switching (no existing tier system).
- Onboarding video sidebar.
- `.docx` export (ship `.md` only; add `.docx` later via a small edge function using `docx` npm package).

Want me to proceed with this approach, or adjust scope (e.g. drop the standalone snapshots and just bolt the 20-doc catalog onto the existing brief/deliverables tables)?

## Plan: Present both AI workflows clearly on `/dashboard/day`

### Goal
Keep both 20-document systems, but make the choice obvious on `/dashboard/day` so a founder never has to wonder which path they're on:

- **Fast path — Founders Hub** (`/dashboard/hub/new`): paste a URL or short concept, the system enriches it and bulk-generates all 20 in dependency order. Best for "I already know what I'm building, give me the receipts."
- **Guided path — Workshop Brief & Workflow** (`/dashboard/brief` → `/dashboard/workflow`): voice-friendly intake that walks through each pillar with the facilitator, generating documents as decisions get made. Best for the in-room workshop morning.

### What's already built (no changes needed)
- Hub: `venture-extract-concept`, `venture-bulk-generate`, `venture-generate-document` edge functions; `venture_snapshots`, `venture_document_types` (20 seeded), `venture_documents`, `venture_generation_jobs`, `venture_generation_failures`; `/dashboard/hub`, `/hub/new`, `/hub/$snapshotId` UI with progress, version history, circuit breaker, cancel.
- Workshop Brief/Workflow: `src/lib/workflow.ts` manifest with voice intake fields, `/dashboard/brief`, `/dashboard/workflow`, `/dashboard/workflow/$key`, backed by `deliverable_types` + `attendee_deliverables`.

### Changes (UI/presentation only)

1. **`/dashboard/day` — add a "Two ways to build it" choice block** placed right after the hero strip, before the cohort card:
   - Card A — *Guided in the room* (primary, recommended for first-time founders attending the workshop). Subcopy emphasizes: facilitator-led, pillar-by-pillar, decisions out loud. CTA → "Start my founder brief" → `/dashboard/brief`.
   - Card B — *One-shot from a URL or concept* (secondary, recommended for founders who want a head start before the workshop or who already have a website). Subcopy emphasizes: drop a link, get all 20 back, then refine in person. CTA → "Spin up a venture" → `/dashboard/hub/new`.
   - Both cards make clear it's the same five pillars and same 20 deliverables — just different ways of getting there.

2. **Rework the existing CTA row at the bottom of `/dashboard/day`** so it no longer duplicates the choice. Replace with:
   - Primary: "See what we build together" → `/dashboard/workflow` (the pillar/document map)
   - Secondary: "Browse your ventures" → `/dashboard/hub` (only when the user has at least one snapshot; otherwise hide)

3. **Pillar section copy** — keep the current outcome-based copy, but add one sentence noting that whichever path the founder picks, the five pillars and outcomes are the same.

4. **Naming/labels** — across `/dashboard/day` only, refer to the two paths consistently as:
   - "Guided workshop path" (Brief → Workflow)
   - "Fast venture path" (Hub)
   Avoid "System A/B," "Hub vs Brief," or any internal naming.

### Out of scope (do not change in this plan)
- No DB migrations. The two catalogs (`venture_document_types` and `deliverable_types`) stay independent — reconciling them is a separate decision.
- No changes to Hub or Brief/Workflow internals, edge functions, or generation logic.
- No changes to `/dashboard/hub*` or `/dashboard/brief`/`/dashboard/workflow*` pages themselves.
- No pricing, auth, schema, or routing changes.

### Files touched
- `src/routes/_authenticated/dashboard/day.tsx` — add the two-path choice block, adjust bottom CTAs, refine pillar lead-in copy.

### Open question to confirm during build
The Hub catalog uses pillar split 4-5-4-4-3 (Foundation/Strategy/Operations/Finance/Governance) and the Workshop Workflow uses 5-5-4-4-2. The `/dashboard/day` pillar cards currently render from `STAGES` in `src/lib/workflow.ts` (the Workshop side). I will keep that as the canonical display on `/dashboard/day` and note in the Hub card subcopy that the Hub produces the same five pillars with a slightly different document split, so the founder isn't surprised when counts don't match exactly.
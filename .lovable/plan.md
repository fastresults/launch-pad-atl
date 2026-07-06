# Elevate the Founder Roadmap

## Why it feels "legacy"

The generator (`supabase/functions/venture-generate-roadmap/index.ts`) was written when a venture had roughly a dozen deliverables. The kit now spans **60+ assets** across four tracks (Introduction / Education / Tracking / Action, `src/lib/asset-tracks.ts`) covering legal, payments, DNS, ads, content calendar, financial model, brand system, ops SOPs, automation, referral, etc. The current prompt:

- **PROTECTED_TYPES = 11 docs.** Everything else is `smartExcerpt`ed to **1,800 chars** — so ~50 of the founder's assets arrive as truncated stubs. The synthesis literally can't see them.
- **Chapter list is fixed at 13** and skewed to strategy / VC framing. There is no chapter on Ops & Systems, Brand System, Growth Engine, Legal & Money Plumbing, or Content & Community — all major buckets in the expanded kit.
- **Stat Strip is hard-coded to 6 rows** ("Recommended raise", "Breakeven month" …) that only make sense for one persona. For Main Street track it's already partially patched via `TRACK_ADDENDUM`, but the strip still doesn't reflect what the kit actually produced (assets built, sprint days completed, brand system status, financial model status, GTM channels picked, etc.).
- **No traceability.** The doc never says "this comes from your Sales Playbook" in a scannable way, so the founder can't jump from a claim back to the source asset.
- **Fixed 45-day sprint** duplicates the 14-Day Sprint the founder just did. The roadmap should pick up on Day 15, not restart at Day 1.
- **Card + dialog** (`FounderRoadmapCard`, `FounderRoadmapDialog`) only surface word count, quality score, generated date — no signal of coverage ("synthesized from 63 of 63 assets across 4 tracks").

## Recommendation

Treat the roadmap as the **capstone that reads every asset**, structured around the four tracks the founder actually completed, with a visible chain of custody back to each source doc.

## Plan

### 1. Feed the full kit into the model (edge function)

`supabase/functions/venture-generate-roadmap/index.ts`

- **Expand `PROTECTED_TYPES`** to include every deliverable the founder actually completed for this snapshot. Rather than a static allow-list, pass the top-N docs by length/track weight in full; excerpt only when total budget forces it.
- **Raise the excerpt floor** from 1,800 → 3,500 chars for non-protected docs, and bump `MAX_PROMPT_CHARS` from 140k → 200k (Gemini 3 Flash context supports it).
- **Group source blocks by track** in `buildContextBundle` — Introduction / Education / Tracking / Action — so the model can synthesize per bucket instead of alphabetically by `document_type`.
- **Emit a coverage manifest** (JSON) alongside the markdown: `{ assetsUsed: string[], assetsTruncated: string[], tracksCovered: {...} }` and persist to a new `roadmap_coverage jsonb` column on `venture_snapshots` (migration).

### 2. Restructure the prompt around the expanded kit

Replace the current 13-chapter shape with a track-aware structure that mirrors what the founder built:

```text
Cover & Verdict
Stat Strip (dynamic: assets built, sprint days, brand system status,
             financial model status, GTM channels, legal status, etc.)
Part I  — The Business You've Built           (was Ch 1–3)
Part II — The Market You're Entering          (was Ch 4–5)
Part III — Your Growth Engine                 (NEW — pulls GTM, sales
             playbook, content calendar, ads, referral, email)
Part IV — Your Brand System                   (NEW — brand strategy,
             messaging house, voice, visual identity, logo pack)
Part V  — Your Operating System               (NEW — legal, payments,
             DNS, analytics, support, automation, SOPs, cadence)
Part VI — Money, Runway & Unit Economics      (was Ch 8, deeper)
Part VII — The Next 90 Days (Day 15 → Day 105)  (replaces 45-day sprint)
Part VIII — Year One, in Three Phases         (was Ch 7)
Part IX — How to Talk About This              (was Ch 9)
Part X  — Your Operating Cadence              (was Ch 11)
The One Thing · Closing Note
```

Rules the prompt must enforce:

- **Every claim carries a source tag** in the form `[from: <Asset Name>]` (max 2 per paragraph, styled quietly in the UI).
- **The 90-day plan explicitly starts at Day 15** and picks up from the last day of the 14-Day Sprint.
- **Stat Strip is generated, not templated.** Model chooses 6–8 metrics from what's actually in the kit; each row must cite a source asset.
- **Each Part opens with a 1-sentence "what this Part pulls from" line** listing the asset names it synthesizes.

### 3. Track-aware "Read next" (replaces Chapter 12)

Replace the flat "5 documents to read next" with a **4×2 grid** — two next-best reads per track (Intro / Edu / Tracking / Action) — grounded in what the founder has NOT yet opened (join with `venture_documents.last_opened_at` if present, else fall back to model choice).

### 4. UI: show the elevated shape

- **`FounderRoadmapDialog.tsx`**
  - Left nav becomes two-level: **Part → Chapter**, with a small track chip next to each Part where relevant.
  - Header meta row adds: `Synthesized from N of M assets · 4 tracks · Day 15 → Day 365`.
  - Render `[from: …]` tags as inline pills that link back to `#/dashboard/hub/:snapshotId?asset=<slug>`.
  - Add a "Coverage" popover (ⓘ) listing every asset used vs truncated, sourced from `roadmap_coverage`.
- **`FounderRoadmapCard.tsx`** (still used as the hero when `heroDone`)
  - Replace the single "63 assets" line with a **4-chip strip** showing per-track coverage (`Intro 8 · Edu 14 · Tracking 9 · Action 32`), each chip clickable to filter the library below.
  - Keep primary CTA "Open Founder Roadmap" (per selected element) but add a secondary "See coverage" ghost.

### 5. Regeneration ergonomics

- When the kit changes after the roadmap was generated (new assets, brand wizard rerun, financial model updated), mark `roadmap_status = 'stale'` and show a subtle "Kit has changed since this was written — regenerate?" ribbon in the dialog header. Uses existing `roadmap_generated_at` vs `max(venture_documents.updated_at)`.

## Files to change

- **Edit** `supabase/functions/venture-generate-roadmap/index.ts` — prompt rewrite, expanded protection, track grouping, coverage manifest, dynamic Stat Strip, Day-15 sprint start, source-tag rule.
- **New migration** — add `roadmap_coverage jsonb` and (optional) `roadmap_structure_version int` to `venture_snapshots`; GRANT unchanged (column-add).
- **Edit** `src/components/hub/FounderRoadmapDialog.tsx` — two-level nav, coverage popover, source-tag pill renderer, staleness ribbon, updated meta row.
- **Edit** `src/components/hub/FounderRoadmapCard.tsx` — per-track coverage chip strip, secondary "See coverage" action.
- **Edit** `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — pass `roadmap_coverage` + track counts into the card and dialog; wire the "regenerate if stale" ribbon.

## Out of scope

- No changes to the 14-Day Sprint planner, AI Stack, brand wizard, or asset accordion.
- No model swap — stay on `google/gemini-3-flash-preview`.
- No new deliverable types.
- No visual restyle of the roadmap dialog beyond the additions above.

## Verification

- Complete venture (60+ assets): coverage manifest lists ≥90% of completed docs as "used", <10% "truncated"; Stat Strip rows all carry a source; Part III / IV / V exist and cite ops/brand/growth assets by name; 90-day plan begins "Day 15".
- Dialog meta reads `Synthesized from N of M assets · 4 tracks`; per-track chips render on the hero card.
- Regenerating after editing one asset flips `roadmap_status` to `stale` and shows the ribbon until a new run completes.
- Existing roadmaps without `roadmap_coverage` still render (graceful fallback — coverage popover hidden, chips omitted).

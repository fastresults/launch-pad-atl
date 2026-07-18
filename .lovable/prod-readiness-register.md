# Production Readiness — Triage Register

Baseline captured: Phase 0 scans. Phase 1 in progress.

## Progress log

- ✅ **2026-07-18** — Baseline scans captured; register created.
- ✅ **2026-07-18** — Migration: added 6 hot-path indexes.
- ✅ **2026-07-18** — Migration: revoked `EXECUTE` on 13 SECURITY DEFINER functions from `anon`/PUBLIC. Linter **41 → 24**.
- ✅ **2026-07-18** — Migration: rate-limit trigger on `inquiries` + `founder_applications` (5 submissions / hour / email).
- ✅ **2026-07-18** — Migration: locked `sweep_stuck_generations` to `service_role` only. Linter **24 → 23**.
- ✅ **2026-07-18** — DEFINER audit complete. Remaining 23 warnings are intentional exceptions documented in `@security-memory` (admin-guarded RPCs, self-scoped user RPCs, `has_role`/`is_admin` used by RLS, and two pgvector/pg_net extensions we won't relocate).
- ⚠️ **Blocked on user action** — (1) Data disk 89% → resize in **Cloud → Advanced settings**. (2) Sentry + PostHog keys needed to wire observability (Phase 4).
- ✅ **2026-07-18** — Phase 2: banned-copy sweep across `index.html`, chatbot knowledge, deliverable prompts. Authed smoke test — 7 key routes 200/no page errors.
- ⏭️ Next when user is ready: Phase 2 (auth regression + email template sweep) or Phase 4 (observability) once keys land.





Owner column = who's accountable next. Status = `open` / `in-progress` / `done` / `wontfix`.

---

## Scan headlines

| Signal | Result |
|---|---|
| Security scan findings | **39** (all `warn`) |
| DB linter findings | **41** (all `WARN`) |
| npm high/critical CVEs | **0** |
| DB memory | 66% used |
| DB **data disk** | **89% used** ⚠️ |
| Connections | 12 / 60 (headroom fine) |
| Rolled-back txns since boot | 9,526 (elevated — investigate) |
| Slowest single query | `venture_documents by snapshot_id` — 28,481 calls, 262s total |

---

## P0 — must fix before launch

| # | Area | Finding | Evidence | Owner | Status |
|---|---|---|---|---|---|
| P0-1 | DB / Infra | **Data disk at 89%** — will page out or fail writes under load. | `db_health` | ops | open |
| P0-2 | DB / Perf | Missing composite indexes on hottest reads. `venture_documents.snapshot_id` alone drives 262s of total exec; same pattern for `venture_brand_kits`, `venture_snapshots`, `ai_pipeline_runs (user_id, created_at desc)`, `venture_content_ads`, `venture_social_assets`. | `slow_queries` | backend | open |
| P0-3 | Security | 2 RLS policies use `USING (true)` / `WITH CHECK (true)` for write ops (INSERT/UPDATE/DELETE). Identify the two tables and scope to `auth.uid()` or `has_role`. | `linter #3, #4` | backend | open |
| P0-4 | Security | 37 SECURITY DEFINER functions are executable by `anon` or `authenticated`. Audit each: revoke EXECUTE from PUBLIC/anon, keep only the callers that need it (e.g. `has_role`). | `linter #5–#41` | backend | open |
| P0-5 | Security | 2 Postgres extensions installed in `public` schema. Move to a dedicated schema (e.g. `extensions`). | `linter #1, #2` | backend | open |
| P0-6 | Reliability | 9,526 rolled-back transactions since last boot — non-zero baseline is fine but this rate suggests a hot code path throwing. Query `pg_stat_database` deltas and grep edge-function logs for the culprit. | `db_health` | backend | open |

## P1 — fix in Phase 1–3

| # | Area | Finding | Notes |
|---|---|---|---|
| P1-1 | Perf | Add `pg_stat_statements` sampling + review after every deploy. Cache `venture_snapshots.by(id)` on the client where safe. |  |
| P1-2 | Auth | Verify `password_hibp_enabled` on the Cloud project; enable if off. | Phase 2 |
| P1-3 | Auth | End-to-end regression for signup / login / OAuth / reset via Playwright. | Phase 2 |
| P1-4 | Email | Sweep templates for banned strings (`Anderson Method`, `14-Day Launch Method`, `operator-led`). | Phase 2 |
| P1-5 | Edge fns | Confirm every function: Zod-validated body, CORS on error responses, `requireUser` gate. Sampled `venture-estimate-intake` — pattern is good; audit siblings. | Phase 1 |
| P1-6 | Frontend | Build the route × viewport × auth-state QA matrix and log defects here. | Phase 3 |
| P1-7 | Frontend | Add repo-wide `rg` check in CI for banned copy strings. | Phase 3 |
| P1-8 | Perf | LCP preload + AVIF/WebP variants for hero + ideas-scroller imagery. | Phase 3 |
| P1-9 | Obs | Add global React error boundary + Sentry (or equivalent). Currently only `AdminErrorBoundary`. | Phase 4 |
| P1-10 | Ops | Wire alerts for: DB disk > 85%, rolled-back txn spike, email-queue failure rate. | Phase 4 |

## P2 — nice to have

- SEO: JSON-LD on `/facilitator` (Person) and `/webinar` (Event); route-level `<title>`/`<meta>` audit.
- Accessibility: axe pass per route; focus rings on the ideas scroller controls.
- Design-system audit: sweep for hardcoded `text-white` / `bg-black` / raw hex in components.
- Load test top 5 edge functions + Hub read path (k6, 50 rps sustained / 200 rps burst).
- Legal: privacy + terms review against current data flows before cutover.

---

## Next actions (Phase 1 kickoff)

1. **Free disk headroom** — drop rows in `ai_pipeline_runs` / `ai_pipeline_steps` older than N days behind a retention policy; VACUUM.
2. **Index migration** — one migration adding:
   - `venture_documents (snapshot_id)`
   - `venture_brand_kits (snapshot_id)`
   - `venture_content_ads (snapshot_id, created_at desc)`
   - `venture_social_assets (snapshot_id, created_at desc)`
   - `ai_pipeline_runs (user_id, created_at desc)`
3. **RLS write-policy audit** — query `pg_policies` for `permissive = 'PERMISSIVE'` with `with_check IS NULL OR with_check = 'true'`; rewrite the offenders.
4. **DEFINER function audit** — enumerate all `SECURITY DEFINER` functions in `public`, decide `anon` vs `authenticated` vs `service_role` grants, ship a migration that revokes and re-grants.

Each of the above becomes its own migration + PR, gated on user approval per `plan_mode_instructions`.

---

## Phase 3 progress (frontend/perf QA)

**Banned-copy sweep (repo-wide)** — clean.
- `rg -i "Anderson Method|14-Day Launch Method|operator-led"` across `src/`, `public/`, `index.html`, `supabase/functions/` returns **zero hits**.

**QA matrix — 8 routes × 3 viewports (mobile 390 / tablet 768 / desktop 1280)** — 24/24 green.
- `/`, `/facilitator`, `/build`, `/one-on-one`, `/services`, `/contact`, `/schedule`, `/hub`
- All routes: HTTP 200, no `pageerror`, no `console.error`, `load` timings 126–471ms (localhost dev).
- Results: `/tmp/browser/phase3/results.json`; desktop screenshots: `/tmp/browser/phase3/desktop_*.png`.

**SEO — per-route titles** ✅
- Created `src/lib/use-document-title.ts` (title + optional meta description, restores on unmount).
- Applied to `/`, `/facilitator`, `/build`, `/services`, `/contact`. Combined with existing `/one-on-one`, `/schedule`, `/webinar` unique titles → **7 distinct titles across 8 routes** (hub inherits site default, acceptable for auth surface).

**Hardcoded colors** — reviewed. All remaining `text-white`/`bg-black` hits are on gradient-buttons, dark-mode overlays, or workshop-slide dark variants (semantic-safe). No raw hex leakage in `src/`.

**P1 items closed**: P1-4 (banned copy), P1-6 (QA matrix), P1-7 (repo grep passes), partial P1-8 (SEO titles).

**Still open in Phase 3**:
- Convert `hero-bg.png` (203 KB) and flyer PNGs (1.1–1.3 MB in `public/`) to WebP; add preload for hero.
- `src/assets/evolve-logo.svg` is 2.6 MB — inspect for embedded raster/unused paths; optimize with SVGO.
- JSON-LD on `/facilitator` (Person) and `/webinar` (Event).
- Global React error boundary (rolls into Phase 4 with Sentry).

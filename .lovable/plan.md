# Production Readiness Plan — StartupLabs

A 5-phase program to stress-test the app, close gaps, and ship a stable, polished v1. Phases run mostly sequentially but Phase 2 (Security/Backend) and Phase 3 (Frontend/UX) can overlap once Phase 1 is complete.

---

## Guiding principles

1. **Triage by blast radius.** Auth, payments, data loss, and RLS come before cosmetics.
2. **Measure before fixing.** Every phase starts with an audit artifact (report, checklist, findings list) so we fix the category, not the instance.
3. **Ship in slices.** Each phase ends with a merged, verifiable milestone — no phase runs longer than ~1 week of focused work.
4. **Automate the guardrails.** Anything a human had to catch twice becomes a test, a lint rule, or a migration.

---

## Phase 0 — Baseline & Triage (½–1 day)

Establish the "as-is" picture so we're prioritizing from evidence, not memory.

- Inventory: routes, edge functions, tables, RLS policies, cron jobs, external secrets/connectors.
- Run automated scans in parallel:
  - `security--run_security_scan` + `supabase--linter` (RLS, grants, exposed columns)
  - `code--dependency_scan` (npm CVEs)
  - `supabase--db_health` + `supabase--slow_queries` (index/perf hotspots)
  - Lighthouse pass on `/`, `/webinar`, `/facilitator`, `/one-on-one`, `/services`, `/build`, `/register`, `/dashboard`, `/dashboard/hub/*`
- Produce a single **Triage Register** (severity × surface × effort) saved to `.lovable/prod-readiness-register.md`.
- Freeze scope: any new feature request during hardening goes to a "Post-launch" bucket.

**Exit criteria:** register reviewed, top 20 issues ranked P0/P1/P2.

---

## Phase 1 — Data & Backend Hardening (2–4 days)

Highest blast radius. Nothing else matters if data can leak or corrupt.

1. **RLS & grants sweep** — every `public.*` table has RLS enabled, policies scoped to `auth.uid()` (or `has_role`), and matching `GRANT`s. Fix everything flagged by the linter.
2. **Role model audit** — confirm admin checks all go through `has_role` (never client-side), and admin-only edge functions re-check server-side.
3. **Edge function contract** — every function: input validated with Zod, CORS headers on every response (including errors), user JWT verified in code, uniform error shape.
4. **Idempotency & concurrency** — venture creation, snapshot regeneration, email enqueue, and payment webhooks: add idempotency keys where missing; wrap multi-write flows in transactions or compensating logic.
5. **Migrations discipline** — reconcile drift between `supabase/migrations/` and live schema; add missing indexes surfaced by `slow_queries`.
6. **Backups & recovery** — confirm point-in-time restore is enabled; document a restore drill.

**Exit criteria:** linter clean, security scan clean of criticals, all edge functions pass a smoke suite.

---

## Phase 2 — Auth, Billing & Email Reliability (2–3 days)

The paths that convert visitors into paying customers.

- **Auth flows:** signup → confirm → login → reset → OAuth (Google) → session refresh → sign out. Test on desktop + mobile, incognito, and after a stale JWT.
- **Role transitions:** free → registrant → attendee → admin. Verify the Hub gate (admins unlimited ventures) and the single-venture gate for standard users.
- **Payment/registration path:** end-to-end reservation flow with test cards, webhook retries, and failed-payment recovery UX.
- **Transactional email:** application-received, reminder cadence, unsubscribe, and password reset. Verify domain auth (SPF/DKIM/DMARC), bounce handling, and that no template still says "Adam Anderson's Startup Process" (must be "The 14-Day Pivot Method" per the current copy pass).
- **Session-restoration smoke tests via Playwright** for each authenticated route.

**Exit criteria:** documented happy-path + 3 failure-path videos/screenshots for auth and checkout.

---

## Phase 3 — Frontend Stability, Performance & Accessibility (3–5 days)

The visible layer — where "production-ready aesthetically" lives.

1. **Route-by-route QA matrix** — every public + authenticated route, 3 viewports (390 / 834 / 1440), light + dark, logged-out + logged-in. Log every visual defect in the register.
2. **Design-system audit** — no hardcoded hex or `text-white`/`bg-black` outside tokens; gradient headline treatment applied consistently to the pages already using it; typography scale, spacing, and elevation consistent across marketing pages.
3. **Copy consistency lock** — automated `rg` guard in CI for banned strings: `Anderson Method`, `Adam Anderson's Startup Process` (headline uses only), `14-Day Launch Method`, `operator-led`, `document` (in user-facing surfaces), `business` where "startup" is required, `template` where "framework" is required.
4. **Performance budget** — LCP < 2.5s on `/`, JS < 250KB gz on marketing routes. Image formats (AVIF/WebP via `vite-imagetools`), LCP preload, lazy-loaded scrollers.
5. **Accessibility** — axe pass per route, focus rings, keyboard traversal for the ideas scroller + hub attract-pulse (respects `prefers-reduced-motion`, already implemented — verify), alt text, form label association, color contrast on gradient text.
6. **SEO** — unique `<title>` + meta description per route, canonicals, JSON-LD on `/facilitator` (Person) and `/webinar` (Event), sitemap.xml + robots.txt.

**Exit criteria:** QA matrix 100% green, Lighthouse ≥ 90 across the board, zero banned-string hits.

---

## Phase 4 — Load, Resilience & Observability (2–3 days)

Prove it holds up under real traffic and that we'll see it when it doesn't.

- **Load test** the top 5 edge functions and the Hub read path (k6 or Artillery) — target 50 rps sustained, 200 rps burst.
- **Compute sizing** — watch memory/connections during load; recommend Lovable Cloud instance upsize if we saturate (surface via `resize_compute`).
- **Client observability** — wire an error boundary + Sentry (or equivalent) for prod; add structured console.error taxonomy for edge functions (already partially in `edge-errors.ts`).
- **Cron & background jobs** — verify schedules, add dead-letter handling for the email queue, alert on failure rate > threshold.
- **Version-check banner** already exists — confirm it triggers on deploy and doesn't spam.

**Exit criteria:** load report attached to register; alerts wired; a synthetic uptime check hitting `/` and `/api/health` (add if missing).

---

## Phase 5 — Launch Rehearsal & Cutover (1–2 days)

- Full regression pass against the QA matrix on the **published** URL (not preview).
- Security re-scan; register must have zero P0/P1 open.
- Legal: privacy, terms, cookie notice reviewed against current data flows.
- Domain: confirm `startuplabs.online` + `www` both resolve, HTTPS valid, redirects canonicalized to one host.
- Content freeze 24h before cutover. Publish. Monitor for 48h with a rollback plan (previous deploy id noted).

**Exit criteria:** live, monitored, with an on-call rota for the first week.

---

## Deliverables

- `.lovable/prod-readiness-register.md` — living triage list (owner, severity, status)
- `.lovable/qa-matrix.md` — route × viewport × state grid
- `.lovable/load-report.md` — Phase 4 output
- CI additions: banned-strings check, dependency scan, edge-function smoke suite
- Runbook: `.lovable/runbook.md` (rollback, restore, incident triage)

## Sequencing summary

```text
Week 1: Phase 0 → Phase 1 (backend hardening)
Week 2: Phase 2 (auth/billing/email)  ┐
        Phase 3 (frontend/UX/perf)    ┘ parallel
Week 3: Phase 4 (load/observability) → Phase 5 (launch rehearsal + cutover)
```

## Open questions before we start

1. **Analytics/error tracking:** should we add Sentry + PostHog now, or use what's already wired?
2. **Load-test target:** what's the expected concurrent traffic at launch (workshop registration spike vs steady-state)?
3. **Cutover window:** is there a scheduled cohort we must avoid during the Phase 5 publish?
4. **Scope of "aesthetic":** full design refresh, or polish-only against the current design system?

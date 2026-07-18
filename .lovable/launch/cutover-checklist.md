# Production Cutover Checklist — Startuplabs

Owner: Adam / Dev team. Target domain: `startuplabs.online` (+ `www.`). Backend: Lovable Cloud.

Execute top-to-bottom on cutover day. Every item has an owner, a verification step, and a rollback trigger.

---

## T-24h — Freeze & pre-flight

- [ ] **Content freeze** — no copy or schema changes after this point without cutover-lead sign-off.
- [ ] **Register clean** — `.lovable/prod-readiness-register.md` shows zero open P0/P1.
- [ ] **Banned-copy sweep** — `rg -i "Anderson Method|14-Day Launch Method|operator-led" src public index.html supabase/functions` returns zero hits.
- [ ] **DB backup confirmed** — Lovable Cloud → Backend → Backups shows a snapshot < 24h old. Note snapshot ID: `__________`.
- [ ] **Disk headroom** — data disk < 75% used (resize completed in Phase 1 follow-up).
- [ ] **Linter clean** — remaining Supabase linter warnings match the documented allow-list in `@security-memory` (currently 23).
- [ ] **Secrets present** — `fetch_secrets` confirms: `RESEND_API_KEY`, `LOVABLE_API_KEY`, `STRIPE_*` (if billing live), `SENTRY_DSN`, `POSTHOG_KEY`.

## T-2h — Smoke on preview

- [ ] `k6 run -e BASE_URL=https://id-preview--<hash>.lovable.app .lovable/launch/k6-smoke.js` — thresholds green.
- [ ] Playwright QA matrix (8 routes × 3 viewports) — 24/24 green.
- [ ] Auth flow manual walk: signup → confirm email → login → protected route → logout.
- [ ] Webinar registration end-to-end: form submit → DB row → confirmation email received.
- [ ] Contact form → inquiry row created → rate limit rejects the 6th submit within an hour.
- [ ] Chatbot returns an answer using current knowledge (spot-check "What is the 14-Day Pivot Method?").

## T-0 — Publish

- [ ] Announce start in team channel with timestamp.
- [ ] Publish via Lovable (preview → published).
- [ ] Verify `https://startuplabs.online` and `https://www.startuplabs.online` both resolve, HTTPS valid, redirect to canonical.
- [ ] `curl -sI https://startuplabs.online | grep -i "content-type\|strict-transport"` returns expected headers.
- [ ] Hard-refresh `/`, `/facilitator`, `/build`, `/webinar` — titles match new SEO copy, no console errors.
- [ ] JSON-LD present: view source on `/`, `/facilitator`, `/webinar` — Organization / Person / Event blocks.

## T+15m — Live smoke

- [ ] `k6 run -e BASE_URL=https://startuplabs.online .lovable/launch/k6-smoke.js` against production.
- [ ] Submit one real contact inquiry from an external network; confirm email + DB row + Sentry has no new issues.
- [ ] PostHog: pageview events landing for `/` and `/webinar` from an external device.
- [ ] Sentry: no new `error` issues in the last 15 minutes.

## T+1h — Soak

- [ ] Sentry error rate < 0.1% of sessions.
- [ ] `supabase--slow_queries` — no query > 500ms p95.
- [ ] Rate-limit trigger firing correctly (spot check `inquiries` insert with same email 6x).
- [ ] Email deliverability: Resend dashboard shows 100% accepted for the last hour.

## T+24h — Post-launch review

- [ ] Register archived as `.lovable/prod-readiness-register-<date>.md`.
- [ ] Retrospective note added to `.lovable/plan.md` with what to carry into the next sprint.
- [ ] Any deferred P2/P3 items reopened as tracked tickets.

# Operations Dashboard: from foundation to a running business

Today the "Operationalize" item in the showcase sidebar opens the consultation modal. That's a sales prompt, not an answer. Replace it with an **Operations Dashboard** — a shared, persistent workspace that the founder *or* Adam's team actually works out of to deliver the real activities of standing up the business: accounting, legal execution, CRM, funnels, lead gen, proposals, delivery.

It is one dataset with two front doors:

- **Client view** — inside the shareable link (`/v/:token`), no login, the founder works their own runway.
- **Agency view** — inside the hub (`/dashboard/hub/:snapshotId/operations`), where the team assigns owners, updates status, adds notes, and delivers on the client's behalf.

Both read and write the same rows, so when the agency marks "EIN issued", the client's link shows it immediately.

## The arc: the Launch Cadence, continued

The showcase already tells the founder a 14-day story — the Launch Cadence (`LAUNCH_14DAY_PLAN`), Day 1 "Lock the concept" through Day 14 "Launch day + proof + growth loops". The dashboard does not invent a second story. It uses the same arc, same day numbers, same themes and "done when" lines, then extends past Day 14 into the part nobody covers: actually running the business.

```text
Days 1–7   Phase 1 — Prove it    (concept, offer, buyers, demand, wedge, sales machine, voice)
Days 8–14  Phase 2 — Wire it     (legal, money, domain, site, ops, content, launch)
Days 15–30 Phase 3 — Run it      (first proposals, first cash, first close, first proof)
Days 31–90 Phase 4 — Compound    (rhythm, dashboard, pricing, first hire, next quarter)
```

**Phase 1 · Prove it (Days 1–7)** — one task group per cadence day, carrying that day's theme, objective and `doneWhen` verbatim, with the day's `assetKeys` resolved into link chips to assets already in this showcase. A day is done only when its `doneWhen` is literally true (Day 4 isn't done until a paid deposit or five written commitments exist).

**Phase 2 · Wire it (Days 8–14)** — the operational spine. The cadence gives the theme; the dashboard adds the administrative reality as individually trackable tasks:

- **Day 8 · Legal + entity** — entity filed · EIN issued · registered agent · operating agreement · MSA / services agreement + SOW template · NDA · contractor agreement · ToS + Privacy live · GL insurance bound (E&O or trades rider as applicable). "Sent for signature" and "returned executed" are separate tasks — a contract that went out is not a contract that came back.
- **Day 9 · Money infrastructure** — business bank + card · personal spend separated · payment processor live with a real test charge · chart of accounts · bank feed connected · sales-tax posture decided · bookkeeping cadence named (weekly reconcile, monthly close, who owns it)
- **Day 10 · Domain, email, tracking** — domain + DNS · business email · GA4 + pixels firing real events · sending domain authenticated (SPF/DKIM)
- **Day 11 · Site + brand pack** — site live at the domain with logo, favicon, OG image, one call to action
- **Day 12 · Ops + CRM + proposals** — CRM pipeline stages with one owner per stage · proposal template built from the priced offer · e-sign connected · invoicing with deposit and late terms · onboarding kit (welcome email, kickoff agenda, asset request list) · delivery SOP · support inbox with a response-time promise
- **Day 13 · Demand engine** — three lead sources with a weekly quota each · outbound list built and the first 25 messages actually sent · 5-touch follow-up sequence scheduled · booking link wired into the CRM · content calendar loaded from the brand kit
- **Day 14 · Launch** — ads live · reviews/testimonials captured · referral link out · first paying customer logged

**Phase 3 · Run it (Days 15–30)** — first 10 proposals out, close rate tracked, cash collected vs. invoiced reconciled, first monthly close completed, first testimonial captured, delivery SOP survives contact with a real client.

**Phase 4 · Compound (Days 31–90)** — weekly operating rhythm installed (Monday pipeline, Friday five numbers, monthly close), one dashboard with CAC / close rate / cash on hand / pipeline value / MRR-or-backlog, pricing revisited against real win-loss, first hire or contractor scoped with a 30-day scorecard, Q2 plan written.

## What the dashboard looks like

**Top band.** Overall progress ring, plus a bar per phase. Three live counters: *blocked*, *due this week*, *waiting on client*. A "current day" marker derived from the runway start date so the founder always knows if they're ahead or behind.

**Filter row.** All / Mine / Agency / Blocked / Overdue, plus phase and category filters using the existing `CATEGORY_DOT` colors so it reads continuously with the Launch Cadence view.

**Task rows.** Grouped by phase, then by day. Each task carries:
- status: `todo · in progress · waiting on client · blocked · done`
- owner: `client` or `agency` (agency view can also name a person)
- due date, defaulted from the day offset against the runway start
- a one-line why and a "done when" acceptance line
- link chips into the showcase assets that already answer it
- a note thread (short comments) and an attachment/link field for proof — the filing receipt, the signed MSA, the Stripe dashboard link

**Right rail.** "Next five actions" — the highest-priority unblocked tasks, so nobody has to decide what to do next. Below it, the consultation CTA: **Request an operations consultation** (opens the existing `ShareOutroDialog` form) and **Call 929-234-7355**.

**Agency extras (hub only).** Bulk assign, bulk status change, a per-client rollup on the hub index showing progress and blocked count, and a "hand back to client" toggle per task.

**Export.** The whole runway exports to PDF/Word through the existing export path, with status, owner, and dates — a status report the agency can send without rewriting anything.

## Technical details

### Data

Two new tables, both keyed to the venture snapshot:

- `venture_ops_tasks` — `id`, `snapshot_id` (FK `venture_snapshots`), `phase`, `day`, `task_key` (stable slug like `day-8.ein`), `title`, `why`, `done_when`, `category`, `asset_keys text[]`, `status`, `owner_kind` (`client` | `agency`), `owner_name`, `due_at`, `sort_order`, `completed_at`, `proof_url`, timestamps. Unique on `(snapshot_id, task_key)`.
- `venture_ops_notes` — `id`, `task_id` (FK, cascade), `author_kind` (`client` | `agency`), `author_name`, `body`, `created_at`.
- A `runway_started_at` column on the ops state (small `venture_ops_state` row or reuse the snapshot) anchors due-date math.

Migration order per the platform rule: `CREATE TABLE` → `GRANT` (`authenticated` full, `service_role` all, no `anon`) → `ENABLE ROW LEVEL SECURITY` → policies. Policies scope to the snapshot owner plus `has_role(auth.uid(), 'admin')` / `'super_admin'` for the agency. No `anon` access — the public share link never touches these tables directly.

### Seeding

`supabase/functions/_shared/ops-runway.ts` builds the canonical task list: Phases 1–2 generated by mapping `LAUNCH_14DAY_PLAN` (day, theme, objective, `doneWhen`, `assetKeys`, `category`) and attaching the per-day sub-tasks; Phases 3–4 from a `POST_LAUNCH` constant. A `seedOpsRunway(snapshotId)` upsert on `task_key` creates missing tasks without touching existing status — so the catalog can grow later and existing clients pick up new tasks without losing progress. Seeding runs lazily the first time either view is opened. A mirrored client copy lives at `src/lib/ops-runway.ts` for labels and ordering, with a unit test asserting every `LAUNCH_14DAY_PLAN` day appears exactly once.

### Client (share link) access

The share link is unauthenticated, so it cannot hit the tables directly. Extend the existing public share edge function family with `supabase/functions/venture-ops/index.ts`:
- Validates body with zod, requires the share `token` (and share password where the share is protected), resolves it to a snapshot through `venture_shares`, then reads/writes with the service role.
- Actions: `list`, `set_status`, `set_owner`, `set_due`, `add_note`, `set_proof`. Writes made through the token are always recorded as `author_kind: 'client'`.
- Respects the share's existing expiry/revocation checks; CORS headers on every response.
- Client helpers live in `src/lib/venture-share.functions.ts` next to `requestConsultation`.

If the share is view-only the dashboard renders read-only with a "Ask for edit access" note — worth confirming whether client-side editing should be on by default.

### UI

- `src/components/ops/OpsDashboard.tsx` — the shared dashboard, driven by props (`tasks`, `onUpdate`, `canEdit`, `viewerKind`), so both front doors render identical UI.
- `src/components/ops/OpsTaskRow.tsx`, `OpsFilters.tsx`, `OpsNextFive.tsx` — small focused pieces. Progress uses the existing `ProgressRing`.
- Share side: `src/routes/v.$token.tsx` — in `goTo`, drop the `OUTRO_KEY → setOutroOpen(true)` branch and the "operations section opens the modal" side effect. `OUTRO_KEY` becomes a normal active key that renders `<OpsDashboard />` in the reading pane, the same way `BRAIN_KEY` / `TIMELINE_KEY` are special-cased. Mirrored in `src/components/share/MobileReader.tsx`; on phones the dashboard collapses to a single-column card list with the filter row as a sticky segmented control.
- `ShareSidebar.tsx` — keep `OUTRO_KEY` pinned, relabel the hint to "Your 90-day operating runway", swap to a checklist glyph, and show `x/y` complete.
- Agency side: new route `src/routes/_authenticated/dashboard/hub/$snapshotId/operations.tsx` reading through the authenticated Supabase client, plus a link from the hub nav and a progress rollup chip on the hub index.
- `ShareOutroDialog.tsx` is unchanged and reused — opened only from the dashboard's CTA, never auto-opened.
- Legal/entity tasks respect `resolveEntityState`, so a founder who has already formed sees those tasks pre-completed rather than being told to do it again.

## Suggested build order

1. Migration + `ops-runway.ts` catalog + seeding (no UI).
2. `OpsDashboard` rendered read-only in the share link, replacing the modal trigger.
3. `venture-ops` edge function + client writes (status, owner, due, notes).
4. Agency route in the hub, with assignment and bulk actions.
5. Export, next-five rail, and the rollup chips.

## Open question

Client-side editing is on by default in this plan. If you'd rather the founder see a read-only status board while only the agency drives the work, that's a one-flag change — say which you want before step 3.

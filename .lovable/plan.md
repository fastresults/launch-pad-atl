# Delivery Mode Gate + Managed Project Delivery

Before the founder sees a single step, they choose how the runway gets executed. That choice drives who owns each task, what the dashboard looks like, and whether Adam's team gets a delivery console for the venture.

## 1. The gate (first screen of Operationalize)

A one-time decision card replaces the current intro walkthrough's final panel. Three choices:

- **We'll build it ourselves** — every task assigned to the founder's side. Full self-serve dashboard: owner names, due dates, notes, proof links, all editable by the client.
- **Retain Adam's team** — the done-with-you track. Agency-led tasks flip to Startup Labs ownership, get due dates from a delivery schedule, and the client dashboard becomes a *status + review* view instead of a to-do list.
- **Mixed — decide step by step** — default owner mapping stays as-is (agency on the specialist work, founder on the rest), and either side can reassign per task.

The card explains each option in plain language plus what it costs the founder in time (self-build: ~X hours across 90 days, drawn from the existing minutes on the milestone tasks; retained: the same work delivered by the team). Choice is reversible from a small "Change how this gets delivered" control in the header, with a confirmation because it reassigns ownership.

## 2. What changes after the choice

**Self-build.** Everything unlocks in their dashboard. Milestone cards keep the "Where the agency normally leads" note as a nudge, with a "Hand this one to Adam's team" button on any single task — that raises a request rather than silently reassigning.

**Retained.** Each agency-led task becomes a delivery item with:
- Owner (named team member, set by the super admin)
- Committed date (delivery schedule seeded from the task's phase/day)
- Status the client can read but not edit: Not started → In progress → In review → Delivered
- A **work product link** — the actual artifact (file, doc, live URL, or an in-app asset from the venture) attached by the team
- A client action when needed: Approve / Request changes (reuses the creative sign-off pattern)

Founder-owned tasks stay editable by the founder either way. Nothing about the guided/checklist/timeline views is thrown away — the same three views render, with delivery metadata layered onto the rows.

## 3. The agency delivery console (super admin)

New page under the Agency Hub: **Delivery** for a venture, plus an all-ventures queue at the admin level so the team works across clients from one board.

- Board grouped by status (Not started / In progress / In review / Delivered / Blocked), filterable by venture, phase, owner, due-this-week.
- Row inline actions: assign teammate, set committed date, change status, attach work product, post an update note visible to the client.
- "Deliver" action marks the task done, timestamps it, and (optionally) requests client approval; the client dashboard immediately shows it as completed work with the artifact link.
- Blocked → the team writes what they need from the founder; that surfaces on the client side as a highlighted "We need this from you" item at the top of their view.

## 4. Client-side "completed work" view

A new **Delivered** rail on the client Operationalize page: reverse-chronological list of what the team shipped, each with the artifact link, the date, and who did it. This is the proof-of-value surface — it should read like a running receipt of the engagement.

## Technical details

**Schema (one migration, all with GRANTs + RLS):**
- `venture_ops_state`: add `delivery_mode` (`self` | `retained` | `mixed`, default null so the gate shows), `delivery_mode_set_at`, `delivery_mode_set_by`.
- `venture_ops_tasks`: add `assignee_name`, `assignee_user_id`, `committed_at`, `delivery_status`, `work_product_url`, `work_product_label`, `delivered_at`, `client_review_state` (`none` | `pending` | `approved` | `changes_requested`).
- New `venture_ops_updates` (task_id, snapshot_id, author_kind, author_name, body, visible_to_client, created_at) for the delivery activity feed and blocked-reason notes.

**Edge function `venture-ops`:** add actions `set_delivery_mode`, `assign`, `set_committed_date`, `set_delivery_status`, `attach_work_product`, `post_update`, `request_handoff`, `review_work_product`. Keep the existing dual path — share-token callers (client) get the client-permitted subset; authenticated admin callers (verified via `has_role`) get the full set. Applying a mode rewrites `owner_kind` across the catalog using the existing significance/leadership mapping in `src/lib/ops-significance.ts`.

**UI:**
- `src/components/ops/DeliveryModeGate.tsx` — the choice card, rendered by `OpsDashboard.tsx` when `delivery_mode` is null.
- `src/components/ops/DeliveryPanel.tsx` — per-task delivery block (owner, date, status, artifact, approve/request-changes) used by `OpsTaskRow` and `GuidedStep`.
- `src/components/ops/DeliveredRail.tsx` — completed-work feed.
- `src/routes/dashboard/admin/delivery.tsx` (+ hub-scoped variant) — the agency console, with sidebar entry alongside Operationalize.
- Both the share link (`v.$token.tsx`) and the dashboard read the same components, so parity holds.

## Build order

1. Migration + `venture-ops` actions.
2. Gate + mode application (ownership rewrite).
3. Client delivery rendering + Delivered rail.
4. Agency delivery console (venture-scoped, then cross-venture queue).
5. Approval loop and handoff requests.

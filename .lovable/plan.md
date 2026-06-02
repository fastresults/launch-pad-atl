
# Parallel-load Startup Labs as a scaffolded module under the target app

## How Option B actually works

Lovable's cross-project tools (`@mention` + `cross_project--read_project_file` / `cross_project--copy_project_asset`) only work in the **pull** direction — the agent reads from another project into the project it's running in. So this work happens in the **target app**, not here. My job in this project is to produce a single, exact "pull manifest + kickoff prompt" you paste over there.

Both projects must be in the same Lovable workspace for `@mention` to see this project. Confirm that first.

## What goes across (and what doesn't)

| Layer | Strategy | Why |
|---|---|---|
| Database schema, RLS, RPCs, triggers, pgmq queues | Copy all 27 migration files verbatim, run in filename order | Encodes cohort seat reservation, auto-approve, email queue, DLQ, role model — non-negotiable |
| Storage buckets (`attendee-docs`, `master-media`, `user-media`) | Recreate via tool, copy RLS policies | Migrations don't create buckets |
| Server functions (`src/lib/*.functions.ts` + `*.server.ts`) | Copy as-is into a namespaced folder, e.g. `src/lib/startuplabs/` | Preserves workflow DAG, AI pipeline, brief logic, email enqueue |
| Email templates (`src/lib/email-templates/*`) | Copy verbatim + register in target's template registry | Exact subject lines, copy, unsubscribe wiring |
| Routes (`src/routes/_authenticated/**`, public marketing pages) | Copy under a route prefix, e.g. `src/routes/startuplabs/` and `src/routes/_authenticated/startuplabs/` | Keeps target app's own routes intact; Startup Labs becomes a sub-surface |
| Components (`src/components/brief`, `dashboard`, `facilitator`, `value`, `brand`, `voice`, `register`, `home`, `media`, `admin`) | Copy under `src/components/startuplabs/` | Avoid clashes with target app's components |
| Shared UI (`src/components/ui/*` shadcn) | **Skip** — target already has them | Avoid version drift |
| Brand assets (`public/startuplabs-logo.svg`, `src/assets/*`) | Copy via `cross_project--copy_project_asset` | Binary-safe |
| Supabase generated files (`client.ts`, `client.server.ts`, `types.ts`, `auth-middleware.ts`, `auth-attacher.ts`) | **Do not copy** — target's are auto-generated for its own Supabase project | After migrations run, target's `types.ts` regenerates automatically |
| `.env`, secrets | **Do not copy**. Re-add only the non-managed ones via Add Secret in the target app | Service role keys are project-scoped |
| `routeTree.gen.ts` | **Do not copy** — auto-generated | TanStack Router regenerates on build |
| Edge functions in `supabase/functions/` (if any inherited) | Copy folder, redeploy | Lovable auto-deploys |

## Namespacing strategy (critical)

Because the target app already has its own identity, every Startup Labs file lands under a `startuplabs/` prefix and all imports are rewritten:

- `src/lib/*.functions.ts` → `src/lib/startuplabs/*.functions.ts`
- `src/lib/email-templates/*` → `src/lib/startuplabs/email-templates/*`
- `src/components/{brief,dashboard,...}/*` → `src/components/startuplabs/{brief,dashboard,...}/*`
- `src/routes/_authenticated/dashboard.*` → `src/routes/_authenticated/startuplabs/dashboard.*` (URLs become `/startuplabs/dashboard`)
- Marketing routes (`register.tsx`, `facilitator.tsx`, `schedule.tsx`, `contact.tsx`) → `src/routes/startuplabs/register.tsx`, etc.

All cross-imports inside copied files get a find/replace pass:
- `@/lib/` → `@/lib/startuplabs/` (except shadcn `@/lib/utils`)
- `@/components/{brief,dashboard,facilitator,value,brand,voice,register,home,media,admin,site}/` → `@/components/startuplabs/...`

## Deliverable: the kickoff prompt you paste into the target app

A single message containing:

1. `@`-mention of this Startup Labs project so the cross-project tools light up.
2. A 6-phase execution plan the target agent must follow in order, pausing for approval between phases:
   - **Phase 1 — Schema**: read all 27 migration files from `supabase/migrations/`, concatenate in filename order, run as one migration. Verify `cohorts`, `workshop_registrations`, `founder_applications`, `attendee_profiles`, `profiles`, `user_roles`, `email_send_log`, `email_unsubscribe_tokens`, `suppressed_emails`, plus the `reserve_cohort_seat` / `promote_application` / `enqueue_email` / `has_role` / `is_admin` / `auto_approve_member_on_payment` functions exist.
   - **Phase 2 — Storage**: create three private buckets and copy storage RLS policies from migrations.
   - **Phase 3 — Server code**: copy `src/lib/*.functions.ts`, `*.server.ts`, `src/lib/email-templates/**`, `src/lib/email/**`, `src/lib/workflow.ts`, `src/lib/cohorts.ts`, `src/lib/brief-blocks.ts`, `src/lib/curriculum-data.ts`, `src/lib/schedule-data.ts`, `src/lib/value-grid.ts`, `src/lib/admin-nav.ts`, `src/lib/business-ideas.ts`, `src/lib/workshop-mode.ts`, `src/lib/error-capture.ts`, `src/lib/error-page.ts`, `src/lib/use-event.ts`, `src/lib/config.server.ts`, `src/lib/ai-gateway.server.ts` under `src/lib/startuplabs/`. Run the import-rewrite pass.
   - **Phase 4 — Components**: copy all non-`ui` component folders under `src/components/startuplabs/`.
   - **Phase 5 — Routes**: copy public routes under `src/routes/startuplabs/`, copy authenticated routes under `src/routes/_authenticated/startuplabs/`, copy admin routes under `src/routes/_authenticated/_admin/startuplabs/`. Add a single entry link from the target app's homepage to `/startuplabs`.
   - **Phase 6 — Secrets, registry wiring, smoke test**: ensure `LOVABLE_API_KEY` exists, register copied templates in `src/lib/email-templates/registry.ts` (merging with target's existing registry), wire `attachSupabaseAuth` in `src/start.ts` if missing, navigate to `/startuplabs/register` and `/startuplabs/dashboard` and confirm both render.

3. An explicit **DO NOT COPY** list (auto-generated Supabase files, `.env`, `routeTree.gen.ts`, shadcn `ui/*`, target's existing files).

4. A list of secrets to re-add manually in the target app (none beyond `LOVABLE_API_KEY` which the target should already have via Lovable Cloud).

## What you should expect

- Migrations applying ~27 files in one go is the highest-risk step. If the target app already has tables named `profiles`, `user_roles`, or `app_role` enum from its own work, there **will** be conflicts. The plan handles this by having the target agent dry-run the concatenated SQL and report conflicts before applying — at that point you decide: rename target's tables, namespace Startup Labs tables (much bigger refactor), or accept a merge.
- ~150–200 files copied. The target agent will do this in batches over several turns.
- After Phase 1, `supabase/types.ts` regenerates in the target — every copied server function will typecheck cleanly against the new schema.
- The Startup Labs surface lives at `/startuplabs/*` URLs in the target app, fully sandboxed from the target app's own routes.

## Open questions to confirm before I write the prompt

1. Is the target Lovable project in the **same workspace** as this one? (Required for `@mention` cross-project access.)
2. Does the target app already have a `profiles`, `user_roles`, or `app_role` enum from its own auth setup? If yes, we need a conflict-resolution decision upfront.
3. Confirm URL prefix: `/startuplabs/*` for all routes, or do you want something else (e.g. `/labs/*`, `/sprint/*`)?
4. Should the target's homepage get an auto-added entry link/card to Startup Labs, or will you wire that yourself?

Once you answer those four, I generate the single paste-ready kickoff prompt as my next step.

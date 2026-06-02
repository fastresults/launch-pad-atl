## Goal

Produce a comprehensive, multi-file Product Requirements Document (PRD) bundle in `/mnt/documents/prd/` that fully specifies the StartupLabs platform so an engineering team can rebuild it on the same stack (TanStack Start + Supabase) with no access to the original repo.

## Approach

Use parallel subagents to exhaustively explore the codebase (routes, components, server functions, DB schema, RLS, emails, AI pipelines, admin tooling, copy), then assemble findings into a structured PRD bundle. Each document is high-level + reference style: architecture, contracts, workflows, and complete copy/email decks — not pixel-by-pixel UI breakdowns.

## Deliverable: `/mnt/documents/prd/`

```
prd/
  00-overview.md              Product vision, personas, top-level value props,
                              glossary, business rules
  01-information-architecture.md
                              Sitemap, route tree (public/auth/admin),
                              navigation, layouts, route gating
  02-design-system.md         Theme (oklch tokens), typography, spacing, shadcn
                              components in use, brand assets (logo, favicon),
                              dark/light mode, responsive rules
  03-data-model.md            Every public.* table: columns, FKs, enums,
                              triggers, indexes, plain-English access rules
                              (RLS) + SQL reference, storage buckets
  04-auth-and-roles.md        Signup/login flows, Google OAuth via Lovable
                              broker, app_role enum, has_role/is_admin,
                              member_status lifecycle, _authenticated gate,
                              paused/welcome flows
  05-public-site.md           Marketing pages spec: /, /facilitator,
                              /schedule, /register, /contact, /privacy,
                              /terms, /unsubscribe — sections, components,
                              CTAs, dependencies
  06-founder-dashboard.md     Authenticated founder app: dashboard home,
                              brief, workflow, deliverables, documents,
                              files, filing, goals, day-of, media, profile
  07-founder-brief-ai.md      Brief blocks structure, question schema,
                              checkpoint summaries, AI summarization,
                              founder memory store, voice capture
  08-workflow-and-pipeline.md User pipeline steps, AI pipeline stages,
                              stage intake, deliverable publishing, cron
                              hook (publish-due-deliverables)
  09-cohorts-and-payments.md  Cohorts table, seat reservation, tier
                              assignment (founders vs cohort), pricing,
                              auto-approval on payment, registration flow
  10-applications-flow.md     Founder application submission, statuses,
                              admin review, selection → promotion to
                              registration, related emails
  11-inquiries-and-contact.md Contact form, inquiries table, admin
                              triage, reply workflow, email templates
  12-admin-tooling.md         All /admin/* screens: dashboard, attendees,
                              applications, inquiries, cohorts, members,
                              registrations, review, site settings, users,
                              media library; permissions, badges, command menu
  13-media-system.md          Master media library, per-user media hub,
                              folders, collections, storage buckets, admin
                              push-to-attendee
  14-email-system.md          Full transactional email deck: every template
                              (subject + body + variables + trigger), pgmq
                              queue, enqueue/process/DLQ, suppression,
                              unsubscribe, auth emails, custom domain config
  15-server-functions.md      Inventory of every createServerFn (file,
                              method, input, middleware, returns); public
                              server routes (/api/public/*); patterns
  16-ai-gateway.md            Lovable AI usage, models used, ai-gateway.server
                              wrappers, prompts inventory
  17-copy-deck.md             Verbatim user-facing copy: marketing pages,
                              dashboard labels, empty states, errors, toasts,
                              CTAs, microcopy, legal pages
  18-environments-and-ops.md  Env vars, secrets, storage buckets, cron jobs,
                              publishing flow, domains, monitoring
  19-rebuild-checklist.md     Ordered build plan: scaffold → auth → schema
                              → public site → admin → founder app → AI →
                              emails → polish; acceptance criteria per phase
  README.md                   How the bundle is organized, reading order,
                              conventions
```

## Research plan (parallel subagents)

1. **Routes & navigation** — enumerate every file under `src/routes/`, capture title/purpose/components/data deps for each.
2. **Server functions & API** — list every `*.functions.ts` and `src/routes/api/**` with signature, middleware, input/output.
3. **Database schema** — read every migration in `supabase/migrations/`, compile tables, columns, RLS, triggers, functions, grants.
4. **Components & design system** — read `src/styles.css`, theme tokens, brand components, key reusable components (dashboard, admin, brief, media, value, voice).
5. **Copy extraction** — pull verbatim strings from marketing routes, dashboard routes, admin routes, email templates, legal pages.
6. **Email system** — read `src/lib/email-templates/*`, `src/lib/email/*`, `src/routes/lovable/email/**` and the email queue infra.
7. **AI / brief / pipeline** — read `src/lib/brief-blocks.ts`, `brief.functions.ts`, `pipeline.functions.ts`, `discovery.*`, `founderMemory.*`, `ai-gateway.server.ts`, `voice.*`.
8. **Admin features** — read every `src/routes/_authenticated/_admin/*`, `members-admin`, `applications-admin`, `inquiries-admin`, badges, nav.

## Acceptance criteria

- 20 markdown files in `/mnt/documents/prd/` (19 + README).
- Every public-schema table is documented with purpose, fields, access rules, and SQL reference.
- Every route in `src/routes/` appears in `01-information-architecture.md` and is described (purpose + key components) in the appropriate section.
- Every server function is listed in `15-server-functions.md`.
- Every email template appears verbatim in `14-email-system.md` and `17-copy-deck.md`.
- A new team could open `19-rebuild-checklist.md` and execute the rebuild in order without needing the original repo.
- Bundle emitted via `<presentation-artifact>` tags for each file (or a zipped archive — TBD; default is individual tags for the README + checklist plus a zip of the full bundle).

## Out of scope

- Pixel-perfect screen mockups (high-level + reference per your choice — sections point to source files for exact JSX).
- Stack-agnostic abstractions (PRD assumes TanStack Start + Supabase).
- Migration scripts or rebuild code itself (this is spec only).

## Notes

- Document will use plain English for access rules but include SQL excerpts as reference.
- "Startup" (not "business") in all user-facing copy, per project memory.
- This is a large research+writing task. Estimate 20–30 minutes of work in build mode using parallel subagents to keep it efficient.

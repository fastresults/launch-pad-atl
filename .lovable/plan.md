## Goal
Replace user-facing "deliverable(s)" copy with **"startup asset(s)"** across the app and marketing pages. Keep code identifiers, DB columns, route paths, edge-function names, and query keys unchanged (they are internal and refactoring them is risky + out of scope).

## Terminology rules
- Singular: **startup asset** (e.g. "each startup asset")
- Plural: **startup assets** (e.g. "34 startup assets")
- Count phrasing: **"34 startup assets across eight categories"**
- Never use "deliverables" in headings, body copy, buttons, tooltips, toasts, aria-labels, empty states, or emails visible to users.
- Keep it lowercase in body copy; Title Case only in headings/labels ("Your Startup Assets").

## Where to change (user-facing strings only)

### Marketing / home
- `src/components/home/HomeFramework.tsx`
  - L159 hero body: `"34 deliverables across eight categories …"` → `"34 startup assets across eight categories …"`
  - L217 bullet: `"All 34 deliverables — Foundation, Strategy, …"` → `"All 34 startup assets — Foundation, Strategy, …"`
  - Any other visible "deliverable" tokens in this file (sweep).
- `src/routes/services.tsx`
  - L254 detail copy: `"Fixed price, fixed deliverables, fixed clock."` → `"Fixed price, fixed startup assets, fixed clock."`
  - L120 `s.deliverables.map(...)` — data key, **do not rename**; only touch surrounding visible labels if any read "Deliverables".

### Brief flow
- `src/components/brief/BriefCompleteScreen.tsx`
  - L49: `"Every one of the 34 deliverables …"` → `"Every one of the 34 startup assets …"`
  - L75 button: `"See all 34 deliverables"` → `"See all 34 startup assets"`
- `src/components/brief/BriefReview.tsx` L112: `"deliverables and ventures stay untouched"` → `"startup assets and ventures stay untouched"`
- `src/components/dashboard/BriefStatusCard.tsx`
  - L48: `"build your 25 deliverables"` → `"build your 25 startup assets"` (also worth confirming the number matches `TOTAL_DELIVERABLES`; separate follow-up)
  - L109: same replacement as BriefReview.

### Dashboard / workflow / deliverables page
- `src/routes/_authenticated/dashboard.tsx`
  - L108 tooltip: `"…every deliverable reads from…"` → `"…every startup asset reads from…"`
  - L138 tooltip: `"makes every deliverable sharper"` → `"makes every startup asset sharper"`
  - L112 `key: "deliverables"` — **internal key, leave**.
  - Any sidebar label that reads "Deliverables" → rename to "Startup Assets" (sweep the nav strings in this file).
- `src/routes/_authenticated/dashboard/deliverables.tsx` (route path stays)
  - L218 H1: `"Your deliverables"` → `"Your startup assets"`
  - L236: `"Ask or search your deliverables"` → `"Ask or search your startup assets"`
  - L406 empty state: `"No deliverables yet"` → `"No startup assets yet"`
  - Any other visible strings; leave `queryKey`, `supabase.functions.invoke("deliverables-ask", …)` alone.
- `src/routes/_authenticated/dashboard/workflow.tsx`
  - L74 toast: `"${made} deliverables advanced"` → `"${made} startup assets advanced"`
  - L180: `"…founder-ready deliverables across…"` → `"…founder-ready startup assets across…"`
  - L181: `"Your full deliverables package…"` → `"Your full startup asset package…"`
  - L203–204 aria-label/title: `"Generate every deliverable that's still missing"` → `"Generate every startup asset that's still missing"`
  - L224: `"${bulkDone} of ${bulkTotal} new deliverables ready"` → `"…new startup assets ready"`
  - L225: `"Queuing your remaining deliverables…"` → `"Queuing your remaining startup assets…"`
  - L250: `"…deliverables that actually sound like your startup"` → `"…startup assets that actually sound like your startup"`
  - L356 title: `"We'll run upstream deliverables first, then this one."` → `"We'll run upstream startup assets first, then this one."`
  - Comments (L110) — leave.
- `src/routes/_authenticated/dashboard/day.tsx` — sweep any visible deliverable strings, replace.

### Workshop slides / brief-facing copy
- `src/components/workshop-slides/DeliverableSlide.tsx` and `src/components/workshop-slides/slides/*.tsx` (foundation, strategy, operations, finance, brand, marketing, social-content) — replace visible strings only. Keep the file/component name `DeliverableSlide` (internal).
- `src/components/workshop-slides/registry.ts` — labels only; keep keys.

### Privacy / legal
- `src/routes/privacy.tsx` — replace visible "deliverables" → "startup assets" where it refers to the founder's outputs (leave any legal-ese phrasing that requires a lawyer's sign-off; there shouldn't be any beyond the noun).

### Data / lib layers (sweep for user-visible strings only)
- `src/lib/framework-deliverables.ts` — filename stays; export const names stay; only literal display strings change.
- `src/lib/schedule-data.ts`, `src/lib/build-workshops.ts`, `src/lib/agency-services.ts`, `src/lib/founder-memory.ts`, `src/lib/admin-badges.functions.ts`, `src/lib/site-settings.functions.ts`, `src/lib/attendee.functions.ts`, `src/lib/userPipeline.functions.ts`, `src/lib/pipeline.functions.ts` — replace only user-visible string literals (e.g. labels, tooltips, badge text, email subjects/bodies). Skip keys, columns, log messages, and identifiers.

### App shell
- `src/App.tsx` — replace any visible route/nav label strings ("Deliverables" tab) → "Startup Assets".

## Out of scope (explicitly leave alone)
- Route paths: `/dashboard/deliverables` stays (breaking it invalidates bookmarks, sitemaps, and SEO). Nav label above the route becomes "Startup Assets".
- DB columns / types in `src/integrations/supabase/types.ts` (auto-generated, and referenced elsewhere).
- Edge functions (`deliverables-ask`, etc.) and their invoke() calls.
- React Query keys (`["my", "venture-deliverables"]`, etc.).
- File names, component names, constant names (`TOTAL_DELIVERABLES`, `framework-deliverables.ts`).
- Comments and log strings.
- Admin/internal-only surfaces (settings toggles) unless they render to end users.

## Method
One PR, mechanical sweep with manual review per file. For each file listed:
1. `rg -n "deliverable"` in the file.
2. For each hit, decide: user-visible string → replace; identifier/comment/log → skip.
3. Preserve capitalization at each site ("Deliverables" → "Startup Assets"; "deliverables" → "startup assets"; "deliverable" → "startup asset").
4. Preserve counts and surrounding punctuation.

## Verification
- `rg -n "deliverable" src` after the sweep — every remaining hit must be an identifier, comment, log, filename, DB column, edge-function name, route path, or query key. Confirm the list before merging.
- Spot-check the hero (`/`), `/services`, `/dashboard`, `/dashboard/deliverables`, `/dashboard/workflow`, and the brief complete screen in the preview.

## Follow-ups (not in this change)
- Decide whether to rename the route `/dashboard/deliverables` → `/dashboard/assets` with a redirect (SEO cost + link rot; needs its own plan).
- Reconcile `BriefStatusCard` "25" vs `TOTAL_DELIVERABLES` (34).

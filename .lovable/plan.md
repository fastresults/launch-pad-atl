# Copy audit & rewrite — reflect the 14-Day Sprint + 60+ assets

Full inventory found **34 stale strings across 13 files**, plus 4 open questions. Two dominant issues:

- Language still says **"workshop / workshop day / workshop morning / session"** where it should say **14-Day Sprint / 14-Day Launch Method**.
- Asset counts are wrong everywhere: **20, 21, 34, 50** appear across the app while the real number resolves to **75** (from `FRAMEWORK_DELIVERABLES.length`). Marketing has been rounding to **60+**.
- Recurring violation of the project rule: user-facing copy must say **"asset(s)"**, not **"document(s)"**.

## Step 1 — Establish a single source of truth

Add two exports to unblock every rewrite:

- `TOTAL_ASSETS_LABEL = "60+"` in `src/lib/framework-deliverables.ts` (or a new `src/lib/product-copy.ts`) — the human-friendly figure used in all marketing/UI copy.
- `SPRINT_LABEL = "14-Day Sprint"` and `SPRINT_METHOD_LABEL = "14-Day Launch Method"` in the same file, so future rewrites don't drift again.

Every string below uses these constants where it makes sense. The internal `TOTAL_DELIVERABLES` (75) stays as-is for progress math.

## Step 2 — Rewrite by surface

### Hub gate + hub index + concept studio
- `FoundersHubGate.tsx` (lines 22, 25–26) — gate headline + body.
- `ConceptStudio.tsx` (142) — "all 21 documents" → asset-neutral wording.
- `BulkUnlockDialog.tsx` (56) — "documents" → "assets".
- `FounderRoadmapCard.tsx` (62, 98), `FounderRoadmapDialog.tsx` (208, 255) — "workshop" → "14-Day Sprint", "documents" → "assets".
- `hub.index.tsx` (104, 234, 394, 406, 432) — five occurrences of "documents" + a wrong `20` fallback.

### Dashboard shell + day page
- `dashboard.tsx` (93, 122, 130, 138) — hub tile tooltip counts + "workshop/session" language.
- `day.tsx` (27, 44, 67, 113) — "Your workshop morning" headline, "workshop date" fallback, and reframe the "one at a time" coach paragraph as sprint days.

### Deliverables + asset viewer
- `deliverables.tsx` (222, 408) — "document/documents" → "asset/assets".
- `DocumentViewer.tsx` (958) — reconcile "startup asset" ↔ "Dashboard → Documents" (route stays `/dashboard/documents`, label becomes "Your assets vault" to match `files.tsx`).

### Brief + welcome
- `BriefStatusCard.tsx` (83) — "workshop day" → sprint framing.
- `BriefCompleteScreen.tsx` (49, 75) — "50 startup assets" → `60+`.
- `welcome.tsx` (103, 133, 196, 199) — "Register for a workshop" CTAs → "Reserve your 14-Day Launch seat" (keep the underlying route/action unchanged).

### Landing / chatbot
- `AskConcierge.tsx` (332) — chatbot welcome line: "50 startup assets" → `60+`, "workshop" → "14-Day Launch Method".

### Public docs
- `public/business-case.md` (53, 116) — "34 deliverables" → "60+ founder-ready startup assets across 8 tracks". Same for the `.txt` / `.html` mirrors of the business case; check and align in the same pass.

## Step 3 — Two follow-up sweeps (small, but confirm first)

1. **Chatbot knowledge base** — `supabase/functions/venture-chatbot/knowledge.ts` was flagged but not yet audited. Read it, apply the same rewrites (asset count + sprint framing), redeploy the function.
2. **Price consistency in `business-case.md`** — still says `$197` while `WORKSHOP_PRICE_LABEL` is `$297`. Not part of the "copy freshness" ask, so I'll flag it but only fix if you confirm.

## Step 4 — Guardrails so this doesn't rot again

- Add an ESLint `no-restricted-syntax` rule (or a `scripts/check-copy.mjs` pre-commit) that flags user-facing strings containing: `\b\d{2}\s+(documents?|deliverables?|assets?)\b`, the bare word `workshop` inside `src/routes/_authenticated/**` and `src/components/hub/**`, and `document(s)` inside JSX text nodes in those same trees. Emits a warning, not an error, so the /build/ workshop routes stay untouched.
- Point the rule's error message at `src/lib/product-copy.ts` so contributors reach for the constants.

## What I will NOT change

- `/build/*` routes and `WORKSHOP_PRICE_LABEL` — "workshop" is a legitimate product name there (8 post-sprint build sessions).
- Any DB column, route path, edge function name, `document_type` value, `DocumentViewer` component identifier, or `MediaType` — those stay `document*` per project memory.
- Any behavior, data, or backend logic. This is a copy-only pass.

## Files touched (final list)

Source-of-truth: `src/lib/framework-deliverables.ts` (or new `src/lib/product-copy.ts`).
UI: `FoundersHubGate.tsx`, `ConceptStudio.tsx`, `BulkUnlockDialog.tsx`, `FounderRoadmapCard.tsx`, `FounderRoadmapDialog.tsx`, `hub.index.tsx`, `dashboard.tsx`, `day.tsx`, `deliverables.tsx`, `DocumentViewer.tsx`, `BriefStatusCard.tsx`, `BriefCompleteScreen.tsx`, `welcome.tsx`, `AskConcierge.tsx`.
Static: `public/business-case.md` (+ `.txt` / `.html` if they mirror the same numbers).
Optional follow-ups (with your OK): `supabase/functions/venture-chatbot/knowledge.ts`, business-case price sweep, lint guardrail.

Approve and I'll execute Step 1 → Step 2 → Step 3 (with confirmation) → Step 4 in one pass.

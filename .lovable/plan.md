## Goal

Two small but high-visibility polish fixes to the authenticated dashboard:

1. **Restore the real StartupLabs logo** in the dashboard sidebar (currently a placeholder "SL" tile).
2. **Rename "business" → "startup"** in user-facing copy across the dashboard. Founders are *starting* a business — calling it "your startup" matches the mental model. Going forward this is the project-wide convention (I'll save it as a memory rule).

## Scope: what changes

### 1. Logo in dashboard sidebar
File: `src/routes/_authenticated/dashboard.tsx` (lines ~105–110)

- Import `logoUrl from "@/assets/startuplabs-logo.svg"` (same asset used by the public `Header`/`Footer`).
- Replace the "SL" colored square + "Startup Labs" wordmark with `<img src={logoUrl} alt="StartupLabs" />`.
- Sized to fit the sidebar header (h-7 expanded, h-6 collapsed). When the sidebar is collapsed to icon-only, show a smaller version of the same logo (no fallback letters).

### 2. Copy: "business" → "startup" (user-facing only)

Updating only labels users read — not database columns, types, or admin views.

| File | Current | New |
|---|---|---|
| `dashboard.tsx` line 97 | sidebar item `"My business"` | `"My startup"` |
| `dashboard.brief.tsx` line 13 | page title `"My business — Startup Labs"` | `"My startup — Startup Labs"` |
| `dashboard.index.tsx` lines 143, 364 | `"Answer 10 quick questions about your business."` | `"Answer 10 quick questions about your startup."` |
| `dashboard.index.tsx` line 380 | `"…walking out with a launched business…"` | `"…walking out with a launched startup…"` |
| `dashboard.workflow.tsx` line 55 | `"Finish your Business Brief"` | `"Finish your Startup Brief"` |
| `dashboard.profile.tsx` | section heading `"Business"`, field label `"Business name"`, button `"Save business"` | `"Startup"`, `"Startup name"`, `"Save startup"` |
| `dashboard.filing.tsx` | section heading `"Business"`, field label `"Business purpose"` | `"Startup"`, `"Startup purpose"` |
| `dashboard.documents.tsx` | doc type label `"Business plan"` | `"Startup plan"` (key stays `business_plan`) |
| `dashboard.day.tsx` line 51 | `"Your business idea…"` | `"Your startup idea…"` |

### 3. Out of scope (intentionally not changed)

- DB columns (`business_name`, `business_idea`, `business_purpose`), TypeScript field names, the `business_plan` document `key`, `useState` variable names, and admin-only screens (`admin.attendees`, `admin.registrations`, `admin.index`) — internal-only, renaming risks breaking server functions/RLS without user benefit.
- Public marketing site copy — user only asked about the post-login experience.

### 4. Memory

Save a project rule at `mem://index.md` (Core): *"User-facing copy says 'startup', never 'business'. Founders are starting a business — refer to the thing they're building as 'your startup'."*

## Verification

- Visit `/dashboard` → logo matches the public header.
- Collapse sidebar → logo still visible, no "SL" tile.
- Sidebar item reads "My startup"; brief/profile/filing/files pages show "startup" wording.
- TypeScript build passes (no schema or type changes).

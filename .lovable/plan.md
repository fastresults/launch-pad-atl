# Expand discovery beyond the 10-question brief

## Goal
Make the brief AI-first: collect richer **founder context** (background, skills, edge) and **market/model context** (industry, geography, business archetype, channels) with minimal typing. Let users upload a resume or paste a LinkedIn URL/profile text; AI extracts structured data. Everything flows into `attendee_founder_memory` so the 25 deliverables get a fuller picture.

## What the user will experience

After finishing the 10 startup-brief questions, the wizard continues into two new blocks before the final "You've told everything we need" screen:

**Block 4 — About you (the founder)**
- Single screen: "Tell us about you — the fastest way is to upload."
- Options (any one is enough):
  - Upload resume (PDF / DOCX)
  - Paste LinkedIn profile URL
  - Paste/type a short bio
- AI extracts: years of experience, roles, industries, skills, notable wins, education, location. Shown back as an editable recap card ("Did we get this right?").
- Two clarifier questions only if extraction is thin: "Why are you the right person to start this?" and "What's your unfair advantage?"

**Block 5 — Your market & model**
- Five quick chip/select questions (no essays):
  1. Business archetype — chips: Online / Main-street brick-and-mortar / Service-based / Blue-collar trade / Product / Marketplace / SaaS / Hybrid
  2. Where you'll operate — local city/region, regional, national, global
  3. Industry / category (typeahead, free text fallback)
  4. Primary channel — in-person, website, marketplace (Amazon/Etsy), social, referrals, B2B sales
  5. Who pays — consumers (B2C), other businesses (B2B), both
- Optional 1-liner: "Anything about this market we should know?"

**Checkpoint after each new block** uses the existing `BlockCheckpoint` summary pattern, so the founder feels heard before moving on. Both summaries are saved to `attendee_founder_memory` (sources `founder_profile` and `market_model`) and join the existing `brief_block` summaries in `loadFounderContext` for every downstream AI deliverable.

The completed-state `BriefCompleteCard` is updated to show five recap rows instead of three.

## Technical plan

### 1. Database (one migration)
- `attendee_founder_profile` table — extracted fields:
  - `user_id` (unique), `source` (`resume` | `linkedin` | `manual`), `source_file_path` (nullable, storage path in `attendee-docs`), `linkedin_url` (nullable), `raw_text` (nullable, capped), `extracted` jsonb (`{ headline, years_experience, roles[], industries[], skills[], education[], wins[], location }`), `right_person_reason` text, `unfair_advantage` text, `extracted_at`, timestamps.
  - RLS: owner read/insert/update; admins read. Standard GRANTs.
- `attendee_market_profile` table:
  - `user_id` (unique), `archetype` text[], `geography` text, `industry` text, `channels` text[], `customer_type` text (`b2c|b2b|both`), `market_note` text, timestamps.
  - RLS + GRANTs same pattern.
- Extend `attendee_founder_memory.source` usage with two new logical keys (`founder_profile`, `market_model`) — no schema change needed (text column).

### 2. Server functions (new file `src/lib/discovery.functions.ts`)
- `getFounderProfile` / `upsertFounderProfile` (manual fields, advantage answers).
- `getMarketProfile` / `upsertMarketProfile`.
- `extractFromResume({ storage_path })` — read PDF/DOCX via `pdf-parse` / `mammoth` in server fn (verify Worker compat; fall back to plain text upload + AI parse if a native dep is unsafe — preferred path is **AI-only**: pass the file text to `google/gemini-2.5-pro` with a Zod-validated `extracted` schema).
- `extractFromLinkedIn({ url, pasted_text })` — same AI extraction (URL is stored; we do NOT scrape — we ask the user to paste the profile text, which AI normalizes). If a LinkedIn connector is later added, swap implementations.
- `summarizeFounderProfile` and `summarizeMarketProfile` — mirror `summarizeBriefBlock`: hash inputs, write a recap + bullets into `attendee_founder_memory` with `source` = `founder_profile` / `market_model`.

### 3. Storage
- Reuse existing `attendee-docs` bucket. New folder convention: `{user_id}/founder/resume-*.pdf`. Upload via existing media/upload pattern from the brief wizard.

### 4. Wizard changes (`dashboard.brief.tsx` + `brief-blocks.ts`)
- Extend `BRIEF_BLOCKS` to 5 blocks. Blocks 4 & 5 use **custom screens** (not the generic `VoiceField` loop). Add a discriminator (`kind: "qa" | "founder" | "market"`) so the wizard renders the right component for each block, then routes through the same checkpoint flow.
- New components:
  - `src/components/brief/FounderBlock.tsx` — upload + LinkedIn + bio + extracted-recap editor.
  - `src/components/brief/MarketBlock.tsx` — chip selectors.
- Reuse `BlockCheckpoint` (parameterized to call the matching summarize fn).
- `BriefReview` shows founder + market answers alongside the original 10.
- `BriefCompleteCard` shows 5 recap rows.

### 5. Founder context for the 25 deliverables (`founderMemory.server.ts`)
- `loadFounderContext` already concatenates `brief_block` memories. Extend it to include `founder_profile` and `market_model` memory rows + raw structured fields from the two new tables. This is the only change the downstream pipeline needs.

### 6. Dashboard surface (`dashboard.index.tsx`)
- `briefScore` "complete" threshold becomes "all 10 brief fields + founder block + market block answered/skipped". `BriefCompleteCard` is gated on the new combined completeness, with sub-progress shown while the founder/market blocks are pending.

### 7. Out of scope (this plan)
- LinkedIn OAuth scraping (we only accept URL + pasted text now).
- Editing extracted founder data in admin UI.
- Reflecting new fields in `admin.attendees.$userId.*` views (follow-up).

## Files
- **New**: `supabase/migrations/<ts>_founder_market_profiles.sql`, `src/lib/discovery.functions.ts`, `src/lib/discovery.server.ts`, `src/components/brief/FounderBlock.tsx`, `src/components/brief/MarketBlock.tsx`.
- **Edited**: `src/lib/brief-blocks.ts`, `src/lib/founderMemory.server.ts`, `src/routes/_authenticated/dashboard.brief.tsx`, `src/components/brief/BriefReview.tsx`, `src/components/brief/BriefCompleteCard.tsx`, `src/components/brief/BlockCheckpoint.tsx` (parameterize summary source), `src/routes/_authenticated/dashboard.index.tsx`.

## Open questions (will ask before building if you want)
1. Resume parsing: AI-only on raw text (simpler, Worker-safe) vs. add `pdf-parse`/`mammoth` server-side? Recommend **AI-only**.
2. Should the founder & market blocks be **required** to unlock the 25 deliverables, or skippable with a "complete later" nudge? Recommend **skippable but strongly nudged**.
3. Industry list: free text only, or a curated list (NAICS-lite) for better downstream AI? Recommend **curated + "Other"**.

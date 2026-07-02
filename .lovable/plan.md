# Rebalance Copy: Main Street ↔ Online Founders

**Goal:** Every user-facing surface treats Main Street and Online (DTC / e-commerce / creator / digital-service / SaaS-lite) founders as equal, first-class audiences. Today, Main Street is the hero and online is a footnote ("...other tracks supported too").

## Audit findings

Copy currently skews Main Street on:
- `src/components/home/HomeFramework.tsx` — hero + facilitator bio lead Main Street; online is parenthetical.
- `src/lib/chatbot-knowledge.ts` + `supabase/functions/venture-chatbot/knowledge.ts` — "Atlanta's #1 accelerator **for Main Street and first-time founders**"; online listed only under "Standard track."
- `src/routes/services.tsx` — "government and Main Street alike."
- `src/components/home/HomeBusinessIdeasScroller.tsx` — order + phrasing leads Main Street.
- Track system (`src/lib/tracks.ts`) — Main Street explicitly labeled "the default track for most workshop attendees."
- Edge-function prompts referencing "main street" as default posture: `venture-synthesize-concept`, `venture-deep-research`, `venture-generate-roadmap`, `venture-bulk-generate`, `venture-generate-document`, `venture-generate-assessment`, `_shared/track-tones.ts`, `_shared/deliverable-prompts.ts`, `_shared/cover-art-director.ts`.
- Static marketing docs in `/public/business-case.*`.
- Onboarding: `src/routes/_authenticated/dashboard/hub.new.tsx`, `src/components/brief/MarketBlock.tsx`, `src/lib/brief-sync-profile.ts`, `src/lib/member-intake.functions.ts`.

## Rebalancing principle

- Replace phrases like "Main Street founders" as the lead subject with a **two-noun pairing** ("Main Street and online founders", "storefront and digital founders", "cafés, salons, trades — and DTC brands, creators, digital services").
- Wherever we say "default track" or "most attendees," reframe as "two equal tracks — pick the one that fits your startup."
- Order/parity: whenever Main Street is listed, list online right next to it, with a comparable example set (Shopify DTC, Etsy, creator brand, digital agency, coaching/consulting, SaaS-lite, marketplace side project).
- Keep the Main Street track's operator vocabulary intact where it exists as a track (that's a feature). Only the framing/marketing copy changes.

## Scope of changes

### 1. Marketing surfaces (highest priority — user-visible)
- `src/components/home/HomeFramework.tsx`
  - Hero subhead: reframe from "Built for Main Street founders — …" to a two-audience line covering Main Street + online, with matched example lists.
  - Facilitator bio: swap "tech, services, and Main Street" for "tech, services, Main Street, and online brands."
- `src/components/home/HomeBusinessIdeasScroller.tsx`
  - Reorder categories so online and Main Street alternate; rewrite the caption to lead with the pairing.
- `src/routes/services.tsx` — swap "government and Main Street alike" for "government, Main Street, and online brands alike."
- `src/routes/index.tsx`, `src/routes/register.tsx`, `src/routes/build.tsx`, `src/routes/facilitator.tsx`, `src/routes/schedule.tsx` — sweep for any Main-Street-only phrasing and rebalance.

### 2. Concierge chatbot knowledge
- `src/lib/chatbot-knowledge.ts` **and** `supabase/functions/venture-chatbot/knowledge.ts` (both must match):
  - Positioning line → "Atlanta's #1 startup accelerator for Main Street **and online** founders — cafés, salons, trades, local services, indie brands, DTC e-commerce, creators, digital services, and small SaaS."
  - "Two tracks" section → treat Main Street and Online/DTC as equal defaults; move deep-tech/SaaS/marketplace into a third "Also supported" line.
  - Update FAQ answers ("Is this good for…") to add an online-founder Q&A ("Is this good for an online store / DTC brand / creator business / digital service?").

### 3. Track framing (do NOT rewrite prompts, only the labels/descriptions)
- `src/lib/tracks.ts`
  - Remove "default track for most workshop attendees" from Main Street's `description`.
  - Update E-commerce/DTC `description` to feel equally first-class (add creators, digital services, small SaaS-lite alongside DTC).
  - Do not touch `tonePrompt` fields — those are correct per-track instructions.

### 4. Onboarding + intake
- `src/routes/_authenticated/dashboard/hub.new.tsx`, `src/components/brief/MarketBlock.tsx`, `src/lib/brief-sync-profile.ts`, `src/lib/member-intake.functions.ts`
  - Where Main Street is a prompt example, add an online example beside it (never replace).

### 5. Edge function prompts (light touch)
- `_shared/track-tones.ts`, `_shared/deliverable-prompts.ts`, `_shared/cover-art-director.ts`, and the six `venture-*` functions that mention "main street":
  - Only rebalance sentences that say "assume main street unless told otherwise." Change to "route by the track key on the concept; do not assume a default." Leave track-specific voice guidance intact.

### 6. Static docs
- `public/business-case.md/.txt/.html` — same rebalancing sweep as marketing surfaces so downloadable copy matches.

## Out of scope
- Existing generated user assets (personal deliverables) — not rewritten.
- Visual design, layout, imagery.
- New routes or new tracks.

## Verification
- Grep after changes: no line begins with "Built for Main Street" or "for Main Street and first-time founders" without an online pair.
- Chatbot: ask "is this workshop for an online store owner?" — answer should confirm equally.
- Home hero, `/services`, `/register` visually reviewed at 1280 and mobile widths.

## Risk
Two knowledge files must stay in sync (`src/lib/chatbot-knowledge.ts` and `supabase/functions/venture-chatbot/knowledge.ts`). Any drift and the chatbot answers differently than the site. I'll edit both in the same pass.

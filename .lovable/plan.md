## Goal
Make the Brand Wizard a hard prerequisite for the **Website PRD (AI-builder prompt)** deliverable, and feed the locked Brand Kit (palette, typography, logo, voice, full style guide) into the Website PRD generation as primary workflow context — not an optional hint.

## Why
The Website PRD output exists to be pasted into AI website builders (Lovable, v0, Bolt). If brand tokens, fonts, logo URL, and voice rules aren't authoritative inputs, the builder picks generic defaults and the user gets a generic site. Today the PRD only loosely references `brand_tokens` from the snapshot and can run before the Brand Wizard is completed.

## Changes

### 1. Gate the deliverable in the UI (Marketing section card)
File: `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`

- Read brand kit status with `getBrandKit(snapshotId)` once at the top of `GenerateStep` (TanStack Query, keyed by snapshot id).
- Treat `website_prd` as having a synthetic dependency on a locked brand kit (`status === "locked"`). When not locked:
  - Show `Lock` icon + status line: `Complete the Brand Wizard to unlock`.
  - Disable **Generate** / **Start** and **Rewrite** buttons with tooltip.
  - Replace the disabled CTA with a secondary **Open Brand Wizard** button that scrolls to / opens the Brand Studio section.
  - If the bulk **Generate this section** button for Marketing is clicked while the kit isn't locked, intercept and toast: `Finish the Brand Wizard first — it powers the Website PRD.`
- Mirror the same gate in `bulkGenerate` flow client-side (skip `website_prd` if kit unlocked, with toast).

### 2. Gate at generation time (server)
File: `supabase/functions/venture-generate-document/index.ts` (and `venture-bulk-generate/index.ts`)

- Before running `website_prd`, load `venture_brand_kits` row for the snapshot. If missing or `status !== 'locked'`, return a structured error: `{ error: "brand_kit_required", message: "Lock your Brand Wizard before generating the Website PRD." }` and mark the document `status='pending'` (not `failed`) so the UI shows the gate, not a retry state.

### 3. Make Brand Kit primary context for Website PRD
Files: `supabase/functions/_shared/venture-context.ts`, `supabase/functions/_shared/deliverable-prompts.ts`, `venture-generate-document/index.ts`.

- Extend `compactPreamble` (or add a `brandKitBlock(kit)` helper) so when a brand kit is locked the prompt prepends an authoritative block:
  ```
  ## BRAND KIT (LOCKED — use verbatim, do not invent)
  - Primary logo: <signed url>  (alt: "<company> logo")
  - Palette: { primary: #..., secondary: #..., accent: #..., neutrals: [...], semantic: {...} }
  - Typography: heading "<font>" (Google Font URL), body "<font>", scale + weights
  - Voice & tone: <3–5 bullets>
  - Style guide excerpt: <first ~800 chars of guide_markdown>
  ```
- Only fetch + inject this block for deliverables that declare brand dependency (start with `website_prd`; later: `social_kit`, `landing_page`, etc.). Use a typed `requires_brand_kit: true` flag on the deliverable definition.
- Rewrite the `website_prd` prompt in `deliverable-prompts.ts` to:
  - Open with: "You MUST use the BRAND KIT block above verbatim. Do not propose alternate colors, fonts, or logos."
  - Require the output's Brand voice recap, color tokens, typography, and image prompts to cite the exact hex values, font names, and logo URL from the block.
  - Drop the legacy "brand_tokens (colors, fonts, radius, mood)" soft reference.

### 4. Stale flag
- When the brand kit is updated/re-locked after a Website PRD has been generated, mark the PRD stale (reuse the existing `isStale` mechanism by comparing `brand_kit.locked_at` against `doc.updated_at` for `website_prd`).

### 5. Surface the dependency in the UI catalog
- Add a small "Requires Brand Kit" badge on the Website PRD card so users understand the gate before they try to generate.

## Out of scope
- No changes to other deliverables in this pass. Once the pattern is in place we can opt social/marketing deliverables into `requires_brand_kit` in a follow-up.
- No DB schema migrations needed — `venture_brand_kits.status` and `locked_at` already exist.

## Verification
1. New venture, no brand kit → Website PRD card shows Lock + "Open Brand Wizard" CTA; bulk Marketing generate skips it with toast.
2. Run Brand Wizard, lock it → Website PRD unlocks, generates, and output references exact hex/font/logo from the kit.
3. Re-open Brand Wizard, change palette, re-lock → Website PRD card shows "Brand updated" stale badge.
4. Direct edge-function call without locked kit returns `brand_kit_required` error; doc stays pending.

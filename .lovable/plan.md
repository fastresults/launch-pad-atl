# Apply the collateral logo contract to Social Studio and Content Studio

Brand Collateral now treats a founder's logo pick as a hard contract: exact Form × Tone, no silent substitution, no recolouring, layout adapts instead, and every render is verified against what was asked. Social Studio and Content Studio still run the old, looser path.

## Current state (verified)

- Collateral resolves marks through a slot registry (`collateral-marks.ts`: `slotsForKind`, `recommendMark`, per-slot Form × Tone cells) persisted in `venture_brand_kits.collateral_mark_choice`, and enforces the pick at render time.
- Social covers (`venture-social-cover`) and content ads (`venture-content-ad`) both call `fetchPrimaryLogoBitmap()` from `brand-logo-bitmap.ts`. That helper does its own `pickEntry()` guess from a coarse `{ lockup, dark }` hint and falls back to `primary` or `logos[0]`. It knows nothing about Form × Tone, and there is no founder-facing choice.
- The only logo control exposed in those studios is a size preference (`logoSize`, `sm|md|lg`) in `SocialAutopilot.tsx` and `RegenerateAssetDialog.tsx`.
- The compositor (`logo-compositor.ts`) may tint/knock out the mark for contrast, which is exactly the silent recolouring the collateral contract now forbids for manual picks.

## What to build

### 1. One shared mark resolver

Extend the slot registry to cover social and content pieces so both studios speak the same language as collateral:

- New slot sets keyed by asset kind: avatar (single square slot, `ground: brand`), cover/banner (edge slot, wide box), post/ad poster (chrome slot, corner), story/vertical (chrome slot).
- Replace `pickEntry()`'s ad-hoc guessing with a resolver that takes a Form × Tone cell (manual) or runs `recommendMark()` against the slot geometry (Auto) and returns the exact storage path plus source identity (variant, path, hash, requested vs resolved form/tone, mode).

### 2. Persist per-asset choices

- Store social/content picks alongside the collateral picks — same `{ slots: { <slotId>: { form, tone } } }` envelope — on the brand kit under a `studio_mark_choice` key, scoped by asset kind, with legacy shapes normalised on read.
- Include the resolved choice in the saved asset row's QA/meta so a reload shows what was actually used.

### 3. Enforce the contract at render

- Manual pick = immutable form and tone. If the exact cell is missing, fail the generation with a precise message; never fall back to another mark.
- Contrast is solved by the composition, not the artwork: place the exact mark on a compatible plate/field, or move it to a compatible zone. Remove tint/knockout for manual picks in `logo-compositor.ts` and in the poster path in `content-ad-svg.ts`; keep the adaptive behaviour only for Auto slots.
- Avatars keep the existing hard failure when no mark resolves.
- Record a verdict per asset (requested vs rendered identity) and refuse to publish an asset whose render doesn't match its contract.

### 4. Founder-facing UI

Mirror the collateral dropdown pattern in both studios:

- Add a "Mark" control next to the existing logo-size control in `RegenerateAssetDialog.tsx` and `SocialAutopilot.tsx`, and the equivalent in Content Studio's generate/regenerate surface.
- Show the 8-cell Form × Tone matrix with unsupplied cells disabled, plus "Auto — recommended" with its reason.
- Label the result **Exact** vs **AI selected**, and show **Verified** only after render verification, matching `CollateralPieceCard.tsx`.

### 5. Coverage

- Unit tests for the new slot sets and resolver (exact cell honoured; missing cell blocks; Auto recommends and reports).
- Regression: manual colour mark on a dark cover adapts the field rather than recolouring; avatar with stacked colour renders stacked colour; reload reproduces the same identity.
- Verify end-to-end on the current venture by regenerating one cover, one avatar, and one content poster and inspecting the saved identity against the pick.

## Technical scope

- `supabase/functions/_shared/collateral-marks.ts` and its `src/lib/brand/` mirror — add social/content slot sets, keep both copies in sync.
- `supabase/functions/_shared/brand-logo-bitmap.ts` — replace `pickEntry()` with the shared resolver; return source identity.
- `supabase/functions/venture-social-cover/index.ts`, `supabase/functions/venture-content-ad/index.ts` — accept `markPicks`, enforce the contract, persist identity.
- `supabase/functions/_shared/logo-compositor.ts`, `_shared/content-ad-svg.ts` — no recolouring on manual picks; plate/zone adaptation instead.
- `src/components/hub/social/RegenerateAssetDialog.tsx`, `SocialAutopilot.tsx`, `src/components/hub/ContentStudio.tsx` — mark selector UI and verified labels.
- Persistence reuses `venture_brand_kits` JSON; no new table required.

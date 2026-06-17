# Creative Studio — guided brand creative inside the setup wizard

## End result for the novice user

After completing this step, the user walks away with a downloadable **Brand Creative Pack** they can paste into every platform during the existing 4-stage setup checklist:

1. **Profile mark / avatar** — square 1024×1024 (used on all 14 platforms)
2. **Platform covers / banners** — sized per platform:
   - X header 1500×500
   - LinkedIn personal cover 1584×396
   - LinkedIn company banner 1128×191
   - Facebook page cover 1640×624
   - YouTube channel art 2560×1440 (safe area 1546×423)
   - GitHub/Twitch/Discord/Pinterest/Reddit covers at native specs
3. **Launch / announcement post** — 1:1 (1080×1080), 9:16 story (1080×1920), 16:9 (1920×1080)
4. **Founder portrait** — stylized headshot for "About" sections / press kit

Every asset is saved to the `user-media` bucket, attached to the user's brand kit, and surfaced as a "Copy image URL" / "Download" chip inside each platform's setup card — so the novice never has to wonder *which* image to upload *where*.

## How the wizard hand-holds creation

A new **Step 0.5 — Creative Studio** sits between Brand Kit (Step 0) and the platform grid, with the same checklist-style UX as the rest of the wizard.

Flow per asset type (4 sub-steps, no prompt-writing required):

1. **Pick a vibe** — 6 visual chip choices with thumbnail previews (e.g. *Bold & Editorial*, *Soft Minimal*, *Tech Futurist*, *Warm Founder Story*, *Playful Startup*, *Premium Corporate*).
2. **Pick a color mood** — 5 swatches; pre-filled from Brand Kit if a logo was uploaded (pulls dominant colors).
3. **Confirm subject** — auto-filled from Brand Kit (`display_name`, `short_bio`, industry tags). User can tweak in one textarea.
4. **Generate** — wizard calls Higgsfield, shows 3 variations with a blurred-while-loading state, user picks one (or "Regenerate"). Selection is saved to `social_setup_brand` and to the asset's per-platform slot.

For the **founder portrait**, an extra optional step lets the user upload a reference selfie (Higgsfield character/soul-frame style transfer).

Each asset card shows:
- Recommended platforms it's used on (badges)
- Exact pixel dimensions
- "Use on X / LinkedIn / Facebook / ..." quick-copy links that pre-fill the platform card downstream

## Higgsfield integration architecture

Mirrors the existing **Zernio** pattern (REST API, edge function proxy, TanStack Query wrappers).

**Edge function:** `supabase/functions/higgsfield/index.ts`
- Routes: `generate-image`, `generate-cover`, `generate-portrait`, `job-status`, `list-models`
- Reads `HIGGSFIELD_API_KEY` from secrets (will request via `add_secret` in build)
- Validates JWT, validates body with Zod, normalizes Higgsfield's job-based async response, polls until ready (or returns job id + a `status` route the client polls)
- Uploads the final PNG to `user-media/social-brand/{userId}/{assetType}/{uuid}.png` via service-role client, returns the storage path + signed URL
- Surfaces 402/429 errors cleanly to match the wizard's toast UX

**Server-side prompt builder:** `supabase/functions/higgsfield/prompts.ts`
- Pure-function `buildPrompt(assetType, vibe, colorMood, brand)` → string
- Per-asset-type templates with vibe/color injections; user never sees raw Higgsfield prompt syntax (matches "Guided form" choice)

**Client data layer:** `src/lib/higgsfield.functions.ts`
- TanStack Query wrappers: `generateAsset`, `pollJob`, `listGeneratedAssets`, `selectAssetVariation`
- Uses existing `supabase.functions.invoke` pattern

**Setup guide registry update:** `src/lib/zernio-setup-guides.ts`
- Each platform gains `creativeSpecs: { avatar, cover, launchPost }` with native dimensions, so the Creative Studio knows what to render per platform.

## Database changes (one migration)

New table `public.social_brand_assets`:
- `id uuid pk`, `user_id uuid not null` (auth.uid scope)
- `asset_type text` (`avatar` | `cover` | `launch_post` | `portrait`)
- `platform text null` (null = reusable across all platforms; set for per-platform covers/posts)
- `aspect_ratio text`, `width int`, `height int`
- `storage_path text`, `signed_url text`, `signed_url_expires_at timestamptz`
- `vibe text`, `color_mood text`, `prompt_used text`, `higgsfield_job_id text`
- `is_selected boolean default false` (the variation the user picked)
- `created_at`, `updated_at`
- RLS: user owns rows (`auth.uid() = user_id`), service_role full; admins read via `has_role`
- GRANT block per project standard

Extend `public.social_setup_brand` with:
- `vibe text`, `color_mood text`, `brand_colors text[]`

Extend `public.social_setup_progress` with:
- `creative_ready boolean default false` (flips true once user has selected required assets for that platform)

## New / changed files

- **New** `supabase/functions/higgsfield/index.ts` — edge function (CORS, JWT validate, route handler, image upload)
- **New** `supabase/functions/higgsfield/prompts.ts` — template registry per asset type + vibe
- **New** `src/lib/higgsfield.functions.ts` — TanStack Query wrappers
- **New** `src/lib/creative-vibes.ts` — typed registry of the 6 vibes (label, thumbnail URL, prompt fragment) and 5 color moods
- **New** `src/routes/_authenticated/_admin/admin.social.setup.creative.tsx` — Creative Studio overview (asset-type cards with progress)
- **New** `src/routes/_authenticated/_admin/admin.social.setup.creative.$assetType.tsx` — 4-sub-step guided flow per asset type with 3-variation picker
- **Edit** `src/routes/_authenticated/_admin/admin.social.setup.tsx` — insert "Step 0.5 — Creative Studio" card after Brand Kit, with progress %
- **Edit** `src/routes/_authenticated/_admin/admin.social.setup.$platform.tsx` — surface generated assets in each stage's "Profile complete?" section with copy/download chips
- **Edit** `src/lib/zernio-setup-guides.ts` — add `creativeSpecs` to each platform
- **Edit** `src/lib/social-setup.functions.ts` — extend `getBrand` / `upsertBrand` for new vibe/color fields; add `getCreativeProgress`
- **Edit** `src/lib/admin-nav.ts` — add "Creative Studio" sub-link under Social → Setup wizard
- **New migration** — tables + columns above

## Secrets

Build step will call `add_secret(["HIGGSFIELD_API_KEY"])` once. No other new secrets.

## Out of scope (v1)

- Animated covers / video generation (Higgsfield supports it; gated for v2)
- A/B testing variations against engagement data
- Auto-pushing assets to platforms via their APIs — user still uploads manually (matches existing "checklist + deep links" model)
- Brand-asset versioning / history beyond the selected variation

## Open question (non-blocking)

Higgsfield's official REST is async (submit job → poll). I'll implement polling on the client (TanStack Query `refetchInterval` until job is `succeeded`/`failed`) so the edge function stays short-lived and doesn't risk timeouts. If you'd prefer the edge function to block until ready, say so and I'll flip it.

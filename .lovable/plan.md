# Creative Studio — guided brand creative inside the setup wizard (Lovable AI build)

## Why this changed

MCP connectors only extend the Lovable agent during build, not the running app, and Higgsfield isn't in the connector catalog. We're using **Lovable AI Gateway** image models instead — already wired in, no extra API key, billed from existing workspace credits.

## End result for the novice user

After completing this step the user has a downloadable **Brand Creative Pack** they paste into every platform during the existing 4-stage setup checklist:

1. **Profile mark / avatar** — 1024×1024 (used on all 14 platforms)
2. **Platform covers / banners** — sized per platform:
   - X header 1500×500, LinkedIn personal cover 1584×396, LinkedIn company banner 1128×191
   - Facebook cover 1640×624, YouTube channel art 2560×1440 (safe area 1546×423)
   - Discord, Pinterest, Reddit, Twitch covers at native specs
3. **Launch / announcement post** — 1:1 (1080×1080), 9:16 story (1080×1920), 16:9 (1920×1080)
4. **Founder portrait** — stylized headshot for "About" sections / press kit

Every asset is saved to `user-media`, attached to the user's brand kit, and surfaced as "Copy URL" / "Download" / "Use on X" chips inside each platform card downstream.

## Hand-holding flow (Step 0.5 — Creative Studio)

Sits between Brand Kit (Step 0) and the platform grid. Same checklist UX as the rest of the wizard.

Per asset type, 4 sub-steps — no prompt writing required:
1. **Pick a vibe** — 6 visual chips (Bold & Editorial, Soft Minimal, Tech Futurist, Warm Founder Story, Playful Startup, Premium Corporate)
2. **Pick a color mood** — 5 swatches; auto-suggested from uploaded logo
3. **Confirm subject** — auto-filled from Brand Kit (display name, short bio, industry); user can edit one textarea
4. **Generate** — calls the edge function, streams 3 variations with blurred-while-loading state, user picks one (or "Regenerate")

Founder portrait adds an optional reference-selfie upload (image-to-image edit).

## Lovable AI integration

Mirrors existing `zernio` pattern: edge function proxy + TanStack Query wrappers.

**Edge function:** `supabase/functions/brand-creative/index.ts`
- CORS, JWT validation, Zod body validation, admin role gate
- Builds prompt server-side from `{assetType, vibe, colorMood, brand, dimensions}` using a template registry
- Calls `https://ai.gateway.lovable.dev/v1/images/generations` with `LOVABLE_API_KEY` in the `Lovable-API-Key` header
- **Default model** `openai/gpt-image-2`, `quality: "low"`, `stream: true`, `partial_images: 1` (per AI Gateway defaults)
- For founder portrait reference upload, sends the image via the Gemini image model (`google/gemini-3.1-flash-image-preview`) using the chat-completions-image shape with `messages` + `modalities: ["image","text"]`
- Pipes the SSE stream straight back to the client (no buffering — preserves progressive previews)
- On terminal frame: uploads PNG to `user-media/social-brand/{userId}/{assetType}/{uuid}.png` via service-role client and returns final storage path + signed URL as the last SSE event
- Surfaces 402 (credits) and 429 (rate limit) cleanly so the wizard can show a friendly toast

**Client data layer:** `src/lib/creative.functions.ts`
- `streamCreative({ assetType, vibe, colorMood, subject, refImageUrl? }, onFrame)` — fetch + `eventsource-parser` + `flushSync` (per the AI Gateway streaming rules)
- `listBrandAssets`, `selectVariation`, `deleteVariation` (TanStack Query wrappers on Supabase)
- 3 variations = 3 parallel `streamCreative` calls with shared abort controller

**Vibe + spec registries**
- `src/lib/creative-vibes.ts` — 6 vibes (label, thumbnail, prompt fragment) + 5 color moods (label, palette, prompt fragment)
- `src/lib/zernio-setup-guides.ts` — extend each platform with `creativeSpecs: { avatar?, cover?, launchPost? }` (dimensions + aspect ratio)

## Database changes (one migration)

New `public.social_brand_assets`:
- `id`, `user_id`, `asset_type` (`avatar` | `cover` | `launch_post` | `portrait`)
- `platform` text null (null = reusable across platforms; set for per-platform covers)
- `aspect_ratio`, `width`, `height`
- `storage_path`, `signed_url`, `signed_url_expires_at`
- `vibe`, `color_mood`, `prompt_used`, `model_used`
- `is_selected boolean default false`
- timestamps, RLS scoped to `auth.uid()`, service_role full, admin read via `has_role`
- GRANT block per project standard

Extend `public.social_setup_brand`: `vibe text`, `color_mood text`, `brand_colors text[]`
Extend `public.social_setup_progress`: `creative_ready boolean default false`

## Files

- **New** `supabase/functions/brand-creative/index.ts`
- **New** `supabase/functions/brand-creative/prompts.ts` — per-asset-type templates
- **New** `src/lib/creative.functions.ts` — streaming + persistence helpers
- **New** `src/lib/creative-vibes.ts`
- **New** `src/routes/_authenticated/_admin/admin.social.setup.creative.tsx` — overview grid (asset-type cards with progress)
- **New** `src/routes/_authenticated/_admin/admin.social.setup.creative.$assetType.tsx` — guided 4-step flow + 3-variation picker with blur-while-loading
- **Edit** `src/routes/_authenticated/_admin/admin.social.setup.tsx` — insert "Step 0.5 — Creative Studio" summary card
- **Edit** `src/routes/_authenticated/_admin/admin.social.setup.$platform.tsx` — surface generated assets in the "Profile completed" stage with copy/download chips for that platform's specs
- **Edit** `src/lib/zernio-setup-guides.ts` — add `creativeSpecs`
- **Edit** `src/lib/social-setup.functions.ts` — extend brand getters/setters for vibe + colors
- **Edit** `src/lib/admin-nav.ts` — add "Creative Studio" sub-link
- **Edit** `src/App.tsx` — register the 2 new lazy routes
- **New migration** — tables and column additions above

## Secrets

None new. `LOVABLE_API_KEY` already exists in this project's secrets.

## Out of scope (v1)

- Animated covers / video
- Auto-pushing assets to platforms via APIs (user still uploads manually — matches existing wizard model)
- A/B testing variations against engagement data
- Versioned brand-asset history beyond the selected variation

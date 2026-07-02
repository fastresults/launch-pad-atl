# Content Studio — Plan

Sibling to Social Studio. Where Social Studio produces **platform cover art** (avatars, headers, channel banners), Content Studio produces **campaign ad creatives** — 1:1, 4:5 and 9:16 renders of each post in the 90-Day Content Calendar — one week at a time.

## Gate & entry
- **Unlock rule:** Brand Wizard locked. Same `SocialStudioGate` pattern.
- **Additional soft-gate:** if the `content_calendar_90day` document doesn't exist yet, show an inline CTA to generate it (reusing `ensurePlanDoc`). No hard block — Content Studio's own "Prepare calendar" button generates it.
- **Route mount:** new `<ContentStudio snapshot={snapshot}/>` rendered in `hub.$snapshotId.tsx` next to Social Studio (own tab or its own hub section — user preference).

## The core problem: posts have no IDs
The 90-day calendar is unstructured Markdown parsed by regex. To key ad creatives to posts we must give every post a stable ID.

**Approach:** parse-and-normalize on first open. A new edge function `venture-parse-content-calendar` takes the existing Markdown, uses `google/gemini-3.5-flash` in JSON mode to extract each post into `{week, day, platform, pillar, format, hook, body, cta, hashtags, asset_notes}` and assigns a deterministic ID `sha1(snapshotId + week + day + platform).slice(0,12)`. Rows are written to a new `venture_content_calendar_posts` table. Idempotent — safe to re-run when the calendar is rewritten.

This preserves the existing Markdown deliverable untouched; the parser is a read-side projection.

## New tables (schema migration)

- **`venture_content_calendar_posts`** — one row per post. Columns: `id text PK` (deterministic), `snapshot_id`, `user_id`, `week int`, `day text`, `platform text`, `pillar text`, `format text`, `hook text`, `body text`, `cta text`, `hashtags text[]`, `asset_notes text`, `source_doc_id uuid`, `parsed_at timestamptz`. RLS: owner + service_role. GRANTs on public schema.
- **`venture_content_ads`** — one row per rendered ad (one post → up to 3 rows, one per aspect). Columns mirror `venture_social_assets`: `id uuid PK`, `snapshot_id`, `user_id`, `post_id text FK`, `aspect text CHECK IN ('1:1','4:5','9:16')`, `direction text`, `storage_path`, `signed_url`, `width/height`, `prompt_used`, `model_used`, `canvas_plan jsonb`, `qa_status`, `qa_notes jsonb`, `last_feedback`, `last_headline`, `last_logo_size`, `paletteOverride jsonb`, `is_selected bool`, `brand_kit_locked_at`. Same 7-day signed-URL refresh pattern.
- **`venture_content_progress`** — mirrors `venture_social_progress`. `snapshot_id PK`, `current_step`, `selected_weeks int[]`, `direction`, `default_aspects text[]`, `launch_status jsonb`.

All three tables need GRANT + RLS + policies matching the Social Studio tables.

## Edge functions

- **`venture-parse-content-calendar`** — new. Actions: `parse` (re-runs LLM extraction into `venture_content_calendar_posts`), `list`. Called on first entry and after any calendar rewrite.
- **`venture-content-ad`** — new, cloned from `venture-social-cover`. Actions: `list`, `generate`, `select`, `delete`. Inputs add `postId` and `aspect`; drop `platform`/`asset` in favor of a synthetic `AD_ASSET_SPECS = { "1:1":{1080,1080}, "4:5":{1080,1350}, "9:16":{1080,1920} }`. Uses the same `google/gemini-3-pro-image` primary + `openai/gpt-image-2` fallback, same `logo-compositor`, `signature-compositor`, `image-qa`.
- **Prompt director:** new `content-ad-director.ts` alongside `cover-art-director.ts`. Reuses the venture-context, brand-kit and canvas-plan blocks verbatim. Replaces "channel cover" language with "single-frame social advertisement" and injects a **Post brief** block: pillar, format, hook, CTA, hashtags, asset_notes. Same 4 art directions, same signature/palette/headline/logo controls, same literal-word guardrails.
- **Aspect-aware `logoSafeZone`** — extend `logo-compositor.ts`'s `logoSafeZone` helper to accept 4:5 and 9:16 canvases (currently tuned for cover formats). No new placement logic — reuse `placementForAssetKind` behavior via an `adPlacement` default (`bottom-left` for 1:1/4:5, `bottom-center` for 9:16).

## Client architecture (`src/components/hub/content/`)

Directly mirrors `src/components/hub/social/`:

- `ContentStudio.tsx` — gate + guided/advanced toggle.
- `ContentStudioGate.tsx` — brand-lock CTA (identical to Social).
- `ContentAutopilot.tsx` — 5-step stepper: **Calendar → Weeks → Style → Build Ads → Launch**.
  - **Calendar:** ensures `content_calendar_90day` exists and is parsed; shows post count.
  - **Weeks:** grid of Weeks 1–12; user picks weeks to render (batching per user answer). "Prepare Week N" is the primary action.
  - **Style:** direction picker + `venture-style-preview` thumbnails (reused as-is).
  - **Build Ads:** week-scoped autopilot. For each selected week: enumerate posts × user's default aspects (default `["1:1","4:5","9:16"]`, toggleable), fan out to `venture-content-ad generate`. Per-tile spinner, unblocked "Continue" if any ad ready.
  - **Launch:** grid view grouped by week → post → aspect. Each tile opens `AdPreviewDialog`.
- `AdPreviewDialog.tsx` — clone of `AssetPreviewDialog`; adds an "Aspect" selector (1:1 / 4:5 / 9:16) and a "Post" header showing pillar/hook/CTA. Prev/next walks post × aspect.
- `RegenerateAdDialog.tsx` — clone of `RegenerateAssetDialog`. Same palette override (4 roles, with Accent guaranteed), direction, signature intensity/placement, logo size, feedback. **Headline defaults to the post's hook**, with the same three modes (auto=hook / custom / none) — matches the user's "Hook + editable override" answer. Optional per-ad override of `variationSeed` for regen freshness.
- `content-autopilot.functions.ts` — clone of `social-autopilot.functions.ts` with `buildAdTasks(posts, aspects, direction)` producing `AdTask = {postId, aspect, direction, status}`.

## Regeneration & background behavior
- Reuse the "close-dialog-keeps-task-running" pattern from Social Studio.
- Delete tile → fresh generation on next click.
- Same signed-URL refresh (7-day TTL) and same `qa_status` UI badges.

## Cost controls
- Weekly batching (user's choice) means max ~21 renders per click (7 posts × 3 aspects). Show a pre-flight cost estimate ("This will render ~21 ads. Continue?") because Gemini-3-Pro-Image is the heaviest model in the app.
- Cache post-level renders keyed by `(postId, aspect, direction, paletteOverride hash, headline hash, logoSize)` — regen only fires when a control actually changes.

## Files & touch list

**New**
- `supabase/migrations/…_content_studio.sql` — tables + GRANT + RLS.
- `supabase/functions/venture-parse-content-calendar/index.ts`
- `supabase/functions/venture-content-ad/index.ts`
- `supabase/functions/_shared/content-ad-director.ts`
- `src/components/hub/ContentStudio.tsx`
- `src/components/hub/content/` (Gate, Autopilot, AdPreviewDialog, RegenerateAdDialog, step components)
- `src/lib/content-autopilot.functions.ts`

**Modified**
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — mount Content Studio.
- `supabase/functions/_shared/logo-compositor.ts` — extend `logoSafeZone` for 4:5 / 9:16.
- Sidebar / deliverables index if Content Studio needs a nav entry.

## Out of scope (v1)
- Editing the calendar Markdown from within Content Studio.
- Scheduling / posting to platforms — Launch step exports assets + captions only.
- Video/motion ads. Static PNG only, matching Social Studio.

## Order of build
1. Schema + GRANT + RLS.
2. `venture-parse-content-calendar` + verify JSON extraction on a real snapshot.
3. `venture-content-ad` + `content-ad-director.ts` — parity with `venture-social-cover`.
4. Client: `ContentStudio` + `ContentAutopilot` weekly flow.
5. `AdPreviewDialog` + `RegenerateAdDialog` — reuse Social Studio's controls.
6. Aspect extensions in `logo-compositor.ts`.
7. QA on a full week batch end-to-end.

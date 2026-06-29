# Audit: Missing Instagram & TikTok artwork in Build Kit / Launch

## Root cause

In `src/lib/social-autopilot.functions.ts` → `buildKitTasks()`, the asset filter is hard-restricted to four kinds:

```ts
spec.assets.filter(a => ["avatar","banner","header","channel_art"].includes(a.kind))
```

Looking at `src/lib/social-platform-specs.ts`:

| Platform   | Assets in spec                              | What survives the filter |
|------------|---------------------------------------------|--------------------------|
| Instagram  | avatar, pinned_post, story_cover            | avatar only              |
| TikTok     | avatar, video_poster                        | avatar only              |
| Threads    | avatar, pinned_post                         | avatar only              |
| Pinterest  | banner, vertical_pin                        | banner only              |
| YouTube    | channel_art, thumbnail                      | channel_art only         |
| LinkedIn   | banner, header, pinned_post                 | banner + header          |
| X          | header, avatar, pinned_post                 | header + avatar          |
| Facebook   | banner, pinned_post                         | banner                   |
| Reddit     | banner, avatar                              | banner + avatar          |

So Instagram and TikTok DO appear in the kit — but only as a tiny round avatar. The "cover artwork" the user expects (pinned post tile, story cover, video poster) is filtered out before tasks are even built. There is also an inner `seenCover` dedupe that would collapse multiple cover-class assets to one even if they were included.

Step 4 (Style) shows live previews of one art direction per tile and doesn't preview per-platform, so the gap shows up most visibly in Step 5 (Build kit) and Step 6 (Launch).

## Recommendation

Treat every channel as deserving at least one **feature/cover asset** in addition to the avatar, using the natural hero format from each platform's spec.

### Changes

1. **`src/lib/social-autopilot.functions.ts` — rewrite `buildKitTasks`**
   - Include this expanded "cover-class" set: `banner`, `header`, `channel_art`, `pinned_post`, `story_cover`, `video_poster`, `vertical_pin`, `thumbnail`.
   - For each platform, always emit:
     - the `avatar` task if the spec has one, and
     - **one** hero/cover task chosen by priority order: `channel_art` → `header` → `banner` → `pinned_post` → `video_poster` → `vertical_pin` → `story_cover` → `thumbnail`.
   - Optional second tile for platforms whose identity needs both a feed and a story/video format (Instagram: add `story_cover`; TikTok: keep `video_poster`; YouTube: add `thumbnail`). Gate behind a constant `EXTRA_KIT_ASSETS` so we can tune without code churn.

2. **`supabase/functions/_shared/social-platform-specs.ts`** — keep server mirror in sync; no schema change, just confirm the same kinds exist server-side so `venture-social-cover` accepts them.

3. **`venture-social-cover` (sanity check, not a behavior change)** — confirm `pinned_post`, `story_cover`, `video_poster`, `vertical_pin`, `thumbnail` all have prompt/aspect handling in `cover-art-director.ts`. If any are missing, add the canvas dimensions + composition hint (story/video posters are 9:16 vertical; pinned posts are 1:1; vertical pin is 2:3; thumbnail is 16:9). This is the only place where additional work might be needed; I'll inspect before editing.

4. **Step 5 UI (`SocialAutopilot.tsx` → `Step5BuildKit`)** — no logic change required, but verify the tile grid renders multi-asset platforms cleanly (Instagram will now show avatar + story cover, TikTok avatar + video poster, etc.). If tile labels collide, use `PLATFORM_SPECS[p].assets.find(a => a.kind === task.asset)?.label` for the caption.

5. **Step 6 UI (`Step6Launch`)** — already iterates `listSocialAssets`, so it will pick up the new assets automatically. Confirm the "ready/missing" count uses the new task list as the source of truth so the "Generate missing (N)" footer button stays accurate.

### Expected outcome

After this change, selecting Instagram and TikTok in Step 3 produces real feature artwork (story cover / video poster) plus an avatar in Steps 5 and 6 — matching what the user saw advertised in Step 3's channel picker.

### Out of scope

- No DB migration.
- No change to Brand Wizard, palette planning, or QA contrast pipeline.
- No change to the regenerate-with-feedback flow; new assets inherit it for free.

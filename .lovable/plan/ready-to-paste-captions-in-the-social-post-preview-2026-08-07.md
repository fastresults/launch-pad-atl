# Ready-to-paste captions in the social post preview

Right now the preview dialog shows the image plus technical QA info. The written post copy (hook, body, CTA, hashtags) lives on the calendar row but is never assembled into something a founder can paste into Instagram, LinkedIn, Facebook, X, or TikTok. This adds a Caption panel to every asset preview with platform-correct, length-aware copy and one-click copy.

## What the founder sees

Open any generated social image → a "Post caption" panel appears next to the image:

- The full caption, formatted for the platform the asset was made for (line breaks, CTA line, hashtag block).
- A live character counter against that platform's limit, e.g. `312 / 2,200` for Instagram, green when safe, amber near the limit, red over.
- Buttons: **Copy caption**, **Copy caption + hashtags**, **Copy hashtags only**.
- A platform switcher so the same image can be reused: pick LinkedIn and the caption re-formats to LinkedIn's rules (no hashtag wall, hook on line one, more room for body).
- **Shorten to fit** appears only when the caption is over the limit — one AI pass tightens it without losing the CTA.
- A short "first comment" variant for platforms where hashtags belong in the comment (Instagram, LinkedIn).

Everything is generated from the same post row that produced the image, so caption and image always tell the same story.

## Channel rules applied

| Platform | Caption limit | Hashtags | Notes |
| --- | --- | --- | --- |
| Instagram | 2,200 | 3–5, first comment | Hook in first 125 chars (truncation point) |
| Facebook | 63,206 (target ≤ 400) | 0–2 | Link CTA in body |
| LinkedIn | 3,000 | 3, inline at end | Hook in first 210 chars ("see more" fold) |
| X | 280 | 1–2 | Hard truncate guard, thread hint if over |
| TikTok | 2,200 | 3–5 inline | Caption doubles as on-screen hook |
| YouTube (Shorts) | 5,000 (title 100) | 3 | Title + description split |
| Threads | 500 | 1–3 | — |
| Pinterest | 500 (title 100) | 2–4 | Title + description split |

Fold-point limits (the "see more" cut) are shown as a marker in the counter, not just the hard cap.

## Technical approach

**New shared module** `supabase/functions/_shared/caption-specs.ts`
- Exports `CAPTION_SPECS`: per-platform hard limit, soft target, fold point, hashtag count/placement, whether a title field exists.
- Exports `assembleCaption(post, spec, brand)` — deterministic, no AI: hook → blank line → body → CTA → link → hashtags, trimmed to the spec, hashtags moved to `firstComment` when the spec says so. Returns `{ caption, firstComment, title?, chars, overBy }`.

**New edge function** `supabase/functions/venture-post-caption/index.ts`
- `action: "assemble"` — loads the `venture_content_calendar_posts` row by id, runs `assembleCaption` for the requested platform, returns all variants. No model call, instant.
- `action: "shorten"` — only when `overBy > 0` or the founder clicks Shorten: one Lovable AI Gateway pass with the platform spec in the prompt, must preserve the CTA and the hook's claim, re-validated through `assembleCaption` and hard-trimmed if the model overshoots.
- Auth: same venture-ownership check used by `venture-content-ad`.

**Caching**: assembled captions are cheap and deterministic, so they are computed on open, not stored. Only AI-shortened variants are persisted, on the post row in a new `caption_variants jsonb` column (migration adds the column plus the existing table's grants remain unchanged), keyed by platform, so a founder who shortens once gets the same text next open.

**UI** `src/components/hub/social/AssetPreviewDialog.tsx`
- New `CaptionPanel` child component (kept in its own file `CaptionPanel.tsx` to keep the dialog readable) rendered above the technical QA block in the sidebar, collapsed QA below it — caption is the primary thing, QA is secondary.
- Takes a new optional `post` prop on `PreviewableAsset` (`{ id, hook, body, cta, hashtags, platform }`).
- Both call sites — `ContentStudio.tsx` (two dialogs) and `SocialAutopilot.tsx` (three dialogs) — already have the post row in scope; they pass it through.
- Counter, platform switcher, copy buttons, and toasts use existing shadcn primitives and the existing `copy()` helper pattern.

**Assets with no post row** (Social Autopilot profile/cover art) show the panel only when a post is attached; otherwise it is hidden.

## Out of scope

- Direct publishing to channels (TikTok connector exists but is not wired here).
- Scheduling.
- Rewriting the image headline — that stays in the existing Regenerate flow.

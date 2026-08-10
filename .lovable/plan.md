# Social Studio: every channel gets a cover, every cover fills the frame

Three separate defects, all confirmed in the code.

## 1. Instagram, TikTok and Threads show "no cover"

The launch cards only treat an asset as a cover when its kind is `banner`, `header`, or `channel_art`. Instagram, TikTok and Threads have no such asset in their spec — they produce `pinned_post`, `story_cover` and `video_poster`. Those files were generated correctly; the card simply doesn't recognise them.

Fix: define one canonical "hero/cover" asset per platform (the same priority list the generator already uses) and have the launch card resolve the cover through that list instead of a hard-coded three-kind filter. Instagram shows its story cover, TikTok its video poster, Threads its intro card.

## 2. Pinterest has a cover but no profile image

Pinterest's spec has no `avatar` entry, so no profile image is ever queued. Pinterest profiles do use a round photo.

Fix: add `avatar` (1080x1080) to Pinterest in both the server spec and the client mirror. Audit the whole spec table so every platform with a real profile photo (Pinterest, Facebook, LinkedIn, YouTube) has an avatar and every platform has exactly one hero/cover.

## 3. White edges — the image doesn't fill the canvas

The image model can only return 1024x1024, 1536x1024 or 1024x1536. The result is uploaded as-is and the true spec size (e.g. Facebook 1640x624, Pinterest 800x450, LinkedIn 1584x396) is only written into the database row. Nothing ever resizes or crops the pixels to the delivered aspect ratio, and nothing trims the flat light bands the model paints at an edge when it reserves "quiet" space. That's the white block on the left of the Facebook cover and the right of the Pinterest cover.

Fix, in order, after generation and before logo/headline compositing:

1. **Trim flat borders.** Scan inward from each edge; drop rows/columns that are near-uniform and clearly off-palette (white/near-white or flat neutral) up to a sane cap of the frame.
2. **Cover-fit to the exact spec.** Scale the trimmed image so it fully covers the target width x height, then centre-crop (weighted toward the top for portrait posters so the focal subject survives). Output pixels always equal `asset.width` x `asset.height` — never letterboxed, never padded.
3. **Edge QA + retry.** After the fit, sample the four edge strips. If any edge is still a flat off-brand band, count it as a QA failure and re-run the generation once with a corrective note ("full-bleed image, no white margins, no framed border, no padding"), same mechanism the contrast/signature QA already uses.
4. **Prompt hardening.** Add an explicit full-bleed instruction to the cover prompt and remove the language that invites a reserved white chip; the compositor already owns the logo pixels.

Avatars keep their deterministic flat-surface path but are also emitted at exact spec size.

## Quality lift

- Every cover is delivered at the real platform pixel dimensions, so downloads drop straight into the channel with no cropping by the founder.
- Uniform edge QA means a bad render is retried automatically instead of shipping.
- The regenerate-means-replace behaviour already in place continues to delete superseded files.

## Technical notes

- `supabase/functions/_shared/social-platform-specs.ts` + `src/lib/social-platform-specs.ts`: add Pinterest avatar, keep both mirrors in sync.
- New `supabase/functions/_shared/image-fit.ts`: `trimFlatBorders()`, `coverFit(bytes, w, h, gravity)`, `edgeBandReport()` using the existing pngs decoder already used by `image-qa.ts`.
- `supabase/functions/venture-social-cover/index.ts`: run trim -> cover-fit -> edge QA before `compositeLogo`; feed edge failures into the existing retry note path; record results in `qa_notes`.
- `src/lib/social-autopilot.functions.ts`: export a `coverKindFor(platform)` helper from the existing `COVER_PRIORITY` list.
- `src/components/hub/social/SocialAutopilot.tsx` (~line 1545): resolve `cover` via `coverKindFor` instead of the `["banner","header","channel_art"]` filter, and label the button with the real asset name.

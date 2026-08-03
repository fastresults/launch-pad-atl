## Goal
Stop hard-coding the "Founders in their own words" styling in the homepage component. Move heading size, weight, opacity — and thumbnail size — into the admin screen at `/admin/video-wall`, so you can dial them in yourself without a code change.

No database migration is needed: these settings live in the existing `site_settings` row keyed `founder_video_wall` as JSON.

## 1. Extend the settings type — `src/lib/video-wall.functions.ts`
Add to `VideoWallSettings` (with defaults matching the current compact look):

- `heading_size`: `"xs" | "sm" | "md" | "lg"` — default `"xs"`
- `heading_weight`: `"normal" | "medium" | "semibold" | "bold"` — default `"normal"`
- `heading_opacity`: number 20–100 — default `50`
- `heading_style`: `"label"` (uppercase tracked sans) or `"serif"` — default `"label"`
- `thumb_size`: `"xs" | "sm" | "md" | "lg"` — default `"xs"` (≈84/96px, today's size)
- `show_subheading`: boolean — default `true`

`getVideoWallSettings` / `updateVideoWallSettings` already merge partials over defaults, so old rows keep working.

## 2. Admin controls — `src/routes/_authenticated/_admin/admin.video-wall.tsx`
In the existing settings card, below Heading/Subheading, add an "Appearance" block:

- Heading size — select (Extra small / Small / Medium / Large)
- Heading weight — select (Normal / Medium / Semibold / Bold)
- Heading style — select (Small label / Serif headline)
- Heading opacity — slider 20–100%
- Thumbnail size — select (Extra small / Small / Medium / Large)
- Show subheading — switch

Each control saves immediately via the existing `saveSettings.mutate({ ... })` pattern; live preview updates on the homepage after refresh.

## 3. Consume settings — `src/components/home/FounderVideoWall.tsx`
Replace the hard-coded heading classes with lookup maps:

```
SIZE   xs 10/11px · sm 12/13px · md 15/17px · lg 20/24px
WEIGHT font-normal | font-medium | font-semibold | font-bold
STYLE  label = font-sans uppercase tracking-[0.18em] · serif = font-serif normal-case
THUMB  xs 84/96 · sm 104/120 · md 132/152 · lg 160/188 px tile width
```

Opacity applied via inline `style={{ opacity: heading_opacity / 100 }}` on the `h2` (keeps the token color, avoids arbitrary Tailwind classes). Subheading hidden when `show_subheading` is false.

Play badge and duration pill scale with the chosen thumb size tier so small tiles stay clean.

## 4. Edge function
`supabase/functions/founder-video-wall` returns `settings` verbatim from `site_settings`, so the new keys flow through with no change. I'll verify and only touch it if it whitelists keys.

## Result
Defaults render exactly the compact, normal-weight, 50%-opacity heading you asked for — and every one of those attributes is now a control in the admin, not a code edit.

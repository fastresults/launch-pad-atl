## Goal

The founder name under each thumbnail (currently a hard-coded serif, truncated to one line) should be fully stylable from `/admin/video-wall` — no more code edits to change how it looks.

## New admin controls (Appearance section)

Under a new "Founder name" block:
- **Font style** — Serif / Sans / Small caps label (uppercase + letterspacing) / Mono
- **Size** — Extra small / Small / Medium / Large (independent of thumbnail size)
- **Weight** — Normal / Medium / Semibold / Bold
- **Letter case** — As typed / UPPERCASE / Capitalized
- **Opacity** — slider, 20–100%
- **Wrap long names** — toggle. On = name wraps to two lines instead of truncating ("Michael Dr…" becomes "Michael Drummond")
- **Show city line** — toggle, plus city size/opacity following the same scale

Also add matching **Subheading** controls (size, weight, opacity, style) so the whole block is adjustable, since the screenshot shows the subheading is still fixed in code.

All controls save instantly to the same `site_settings` record as the existing heading settings, defaults reproduce today's look so nothing changes until an admin touches them.

## Technical detail

- `src/lib/video-wall.functions.ts` — extend `VideoWallSettings` with `name_style`, `name_size`, `name_weight`, `name_case`, `name_opacity`, `name_wrap`, `show_city`, `city_size`, `city_opacity`, `sub_size`, `sub_weight`, `sub_opacity`; add matching entries in `DEFAULT_VIDEO_WALL_SETTINGS`. No DB migration needed — settings are a JSON blob in `site_settings.value`, and the public edge function already passes it through.
- `src/components/home/FounderVideoWall.tsx` — replace the hard-coded `font-serif ${thumb.name} … truncate` on the name and the fixed subheading classes with lookup maps (`NAME_STYLE`, `NAME_SIZE`, `NAME_WEIGHT`, `NAME_CASE`, `SUB_SIZE`, …) plus inline opacity, mirroring the existing heading pattern. `name_wrap` swaps `truncate` for `line-clamp-2 whitespace-normal`.
- `src/routes/_authenticated/_admin/admin.video-wall.tsx` — add the two new grouped blocks of `Select` / `Slider` / `Switch` controls wired to the existing `saveSettings.mutate({...})` handler.

No changes to upload, storage, RLS, or the lightbox.

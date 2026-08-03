## Goal

A brand-new, standalone video testimonial wall that appears immediately below the hero on the homepage. Small thumbnails showing name + city; clicking one opens a properly sized video lightbox styled like the homepage. Super admin uploads, orders, and toggles each video on or off, plus a master on/off for the whole section.

The existing testimonial slider (`video_testimonials`, `/admin/testimonials`, the marquee component) is left completely untouched and keeps working as-is.

## New pieces

### 1. Database (new table, no changes to existing ones)
`public.founder_video_wall`:
- `founder_name`, `city`, `founder_role` (optional), `startup_name` (optional), `quote` (optional)
- `video_bucket` / `video_path`, `poster_bucket` / `poster_path`
- `duration_seconds`, `sort_order`, `is_live` (boolean, per-video on/off)
- `created_by`, timestamps + updated_at trigger

Access rules:
- Anyone (including signed-out visitors) can view rows where the video is live.
- Only super admins can add, edit, or remove rows.
- Grants for anon / authenticated / service_role as required.

Master section on/off + heading/subheading stored as a new `site_settings` key `founder_video_wall` (separate from the existing `testimonial_slider` key).

Videos live in the existing private `master-media` bucket under a `video-wall/` prefix, served via signed URLs.

### 2. Public section — `FounderVideoWall`
New component `src/components/home/FounderVideoWall.tsx`, mounted in `HomeFramework` between `<Hero />` and `<HeroCopy />` so it sits immediately under the hero.

Adaptive layout by count:
- 1–2 videos: centered, larger thumbs
- 3–5: one centered row
- 6+: responsive wrapped grid (2 cols phone / 3–4 tablet / 5–6 desktop), capped at two rows with a "See all stories" expander so twenty videos never swamp the page

Each thumbnail: 9:16 rounded card with poster image, play badge, subtle hover lift; below it the founder name in the homepage serif and the city in small muted tracking-caps. Nothing autoplays; posters lazy-load; the section renders nothing at all when disabled or empty.

### 3. Lightbox
New `src/components/home/FounderVideoLightbox.tsx` built on the existing `Dialog` primitive with the homepage dark card tokens (`bg-card`, `border-white/10`) — matching the treatment already used on the other homepage dialogs.
- Video fitted to viewport (portrait-aware, max ~80vh) so it never overflows on phone or desktop
- Native controls, plays on open with sound, poster while loading
- Name · city (+ role/startup if set) and the quote beneath
- Prev/next arrows and arrow-key nav across the wall; Esc closes
- Signed URL requested only when a video opens, so a 20-video wall doesn't fire 20 signing calls on page load

### 4. Super admin page
New route `/admin/video-wall` (`admin.video-wall.tsx`), added to the admin sidebar and gated to `super_admin` only (other admins get redirected).
- Master switch: show/hide the whole section, plus editable heading and subheading
- Upload form: video file, optional poster (auto-captures a frame as poster when none is supplied), founder name, city, optional role/startup/quote
- Table of all entries with poster thumb, name, city, per-row **Live** switch, up/down reorder, edit, and delete (delete also removes the storage objects)

## Verification

Playwright pass at 390px, 768px, and 1400px with 1, 5, and 20 seeded entries: no horizontal overflow, thumbnails scale sensibly, lightbox video fits the viewport, toggling a row off removes it from the homepage, and the existing testimonial slider still renders unchanged.

## Technical notes

- New files: migration; `src/lib/video-wall.functions.ts`; `src/components/home/FounderVideoWall.tsx`; `src/components/home/FounderVideoLightbox.tsx`; `src/components/admin/VideoWallForm.tsx`; `src/routes/_authenticated/_admin/admin.video-wall.tsx`.
- Touched files: `src/components/home/HomeFramework.tsx` (mount the section), `src/App.tsx` (route), `src/components/admin/AdminSidebar.tsx` (nav link).
- Zero changes to `video_testimonials`, `testimonials.functions.ts`, `VideoTestimonials.tsx`, `LandingVideoTestimonials.tsx`, or `/admin/testimonials`.

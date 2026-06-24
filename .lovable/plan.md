## Video Testimonial Slider — Homepage + Admin Manager

### Where it goes
Inserted in `src/components/home/HomeFramework.tsx` directly after `<Hero />`, before `<Framework />`, as a new `<VideoTestimonials />` section.

### User-facing slider behavior
- One video visible at a time, centered (with peek of next/prev on desktop).
- Autoplays muted (browsers require muted for autoplay), inline, plays one video through to its end, pauses 2s, then advances to next. Loops.
- Hover (or focus / touch) anywhere on the slider pauses both playback and the advance timer. Leaving resumes.
- Controls: prev/next arrows, dot indicators, mute/unmute toggle, fullscreen button.
- Each slide shows: video + founder name, role, startup name, optional 1-line quote (all admin-editable).
- Respects `prefers-reduced-motion` (no autoplay, manual nav only).
- Hidden entirely if zero published testimonials exist.

### Admin manager — `/admin/testimonials`
New sidebar entry under an appropriate group (likely "Content"). Page contents:

1. **Settings panel** (global, one row in `site_settings` or new `testimonial_settings` table):
   - Enable/disable section on homepage (toggle)
   - Section heading + subheading (text)
   - Pause between videos in seconds (number, default 2)
   - Autoplay on/off (default on)
   - Start muted on/off (default on)
   - Loop on/off (default on)
   - Show on mobile (toggle)

2. **Testimonials list** (table):
   - Thumbnail preview, founder name, startup, status (draft/published), order, duration, updated date, actions (edit/delete/reorder via drag handle).
   - "Add testimonial" button.

3. **Add/edit drawer**:
   - Video uploader (drag-drop, mp4/webm, max ~100 MB) — uploads to existing `master-media` Supabase storage bucket.
   - Optional poster image upload (jpg/png) — auto-generated from first frame if omitted (client-side canvas grab).
   - Fields: founder name, role/title, startup name, quote (optional, short), display order, status.
   - Preview pane showing exactly how the slide will render.

### Data model (new migration)
```sql
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  founder_name text not null,
  founder_role text,
  startup_name text,
  quote text,
  video_bucket text not null default 'master-media',
  video_path text not null,
  poster_bucket text,
  poster_path text,
  duration_seconds numeric,
  sort_order int not null default 0,
  status text not null default 'draft', -- 'draft' | 'published'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
-- GRANTs: anon SELECT (published only via policy), authenticated full, service_role all
-- RLS: anon/auth can SELECT where status='published'; admins full CRUD via has_role
```

Settings stored as a single JSON row in existing `site_settings` (key `testimonial_slider`) — no new table needed.

### Storage
Reuse existing private `master-media` bucket. Public playback uses short-lived signed URLs fetched client-side via a small `getTestimonialsForHome` function (cached 5 min in React Query). Admin uses signed upload URLs (same pattern as `src/lib/media.functions.ts`).

### Files to add / change
- `supabase/migrations/...` — new `testimonials` table + GRANTs + RLS + `site_settings` seed row.
- `src/components/home/VideoTestimonials.tsx` — public slider component (Embla carousel, already in project).
- `src/components/home/HomeFramework.tsx` — mount `<VideoTestimonials />` after `<Hero />`.
- `src/lib/testimonials.functions.ts` — list (public), CRUD (admin), reorder, signed-URL helpers.
- `src/routes/_authenticated/_admin/admin.testimonials.tsx` — admin page (list + settings + drawer).
- `src/components/admin/TestimonialForm.tsx` — upload + edit form.
- `src/lib/admin-nav.ts` — add "Testimonials" entry.

### Open questions
1. Should the slider show **one video at a time** (cinematic, centered) or a **multi-card row** (3 visible on desktop, swipeable)?
2. **Audio default** — start muted with a clear unmute button, or start with sound on for the active slide? (Muted is required for reliable autoplay.)
3. **Pause-between-videos behavior** — should "pause 2s" happen on a still poster frame, on the last frame of the current video, or on the first frame of the next?
4. Any **max video length** to enforce on upload (e.g. 60s) so the rotation stays snappy?

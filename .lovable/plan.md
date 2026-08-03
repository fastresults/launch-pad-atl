## Goal
The "Founders in their own words" strip below the hero currently eats a full screen of vertical space — with only one video, the grid stretches the 9:16 thumbnail to ~400px tall. Shrink both the heading and the thumbnails so the section reads as a compact ribbon.

## Changes (all in `src/components/home/FounderVideoWall.tsx`)

1. **Fixed small tile size instead of stretch-to-fill grid**
   - Replace the count-based `gridClass` (which uses `grid-cols-2 max-w-[520px]` for 1–2 items) with a centered flex-wrap row where each tile has a fixed width of about **96px desktop / 84px mobile** (roughly 75% smaller than today's ~260px). Aspect stays 9:16, so height drops from ~460px to ~170px.
   - Tiles stay centered when there are few, wrap into rows when there are many.

2. **Scale down tile chrome**
   - Play badge: 36px → 24px, icon 14px → 10px.
   - Duration pill: 10px → 9px text, tighter padding.
   - Corner radius `rounded-xl` → `rounded-lg`.
   - Founder name 13px → 11px; city label 10px → 9px, keep truncation.

3. **Shrink the heading block**
   - `font-serif text-[22px]/md:text-[28px]` → `text-[15px]/md:text-[17px]`, or optionally an uppercase tracked eyebrow style to match other small section labels.
   - Subheading 13px → 11px, margin `mb-6/md:mb-8` → `mb-4`.

4. **Tighten section padding**
   - `py-10 md:py-14` → `py-6 md:py-8`.

5. **Row cap**
   - Since tiles are small, show more before the "See all stories" button: cap initial visible items at 12 and keep the expand button behavior unchanged.

## Not changing
Lightbox/modal playback, admin upload page, data fetching, and the DB layer all stay as-is.

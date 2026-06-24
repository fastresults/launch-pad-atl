## Seed 10 dummy video testimonials

### Approach
The slider signs URLs from the `master-media` bucket. To seed dummy data without uploading 10 actual video files, I'll make one tiny code tweak so any `video_path` / `poster_path` that already starts with `http://` or `https://` is used as-is (no signing). Existing real uploads keep working unchanged.

### Code change (one file)
`src/lib/testimonials.functions.ts` — `signUrl()` helper: if `path` matches `^https?://`, return it directly; otherwise sign from the bucket as today.

### Data seed (one insert)
Insert 10 rows into `public.video_testimonials`, all `status = 'published'`, `sort_order` 0–9, using Google's public sample MP4s and Unsplash headshots:

| # | Founder | Role | Startup | Quote |
|---|---|---|---|---|
| 1 | Maya Chen | Founder & CEO | Loomstack | "Walked in with a half-idea. Walked out with a 90-day plan I actually believe in." |
| 2 | Darius Patel | Co-founder | Northwind Goods | "The positioning exercise alone was worth the seat." |
| 3 | Aisha Okonkwo | Founder | Brightline Labs | "By Monday I had a price, a pitch, and my first three calls booked." |
| 4 | Jonas Berg | CEO | Pebble & Pine | "Finally stopped guessing. I have a real plan now." |
| 5 | Priya Raman | Founder | Verdant Health | "It cut six months of overthinking down to one morning." |
| 6 | Marcus Hall | Founder | Stoneblock Studio | "The offer they helped me write is what I'm still selling today." |
| 7 | Elena Vasquez | Co-founder | Aurora Yields | "Coffee, focus, and a foundation. Exactly what I needed." |
| 8 | Wesley Tran | Founder | Kitsune Care | "I left with twenty deliverables and zero fluff." |
| 9 | Hana Yamamoto | CEO | Folio Republic | "No upsell, no theater. Just the work that actually mattered." |
| 10 | Caleb Mwangi | Founder | Topograph | "First time I felt like a real founder instead of someone with an idea." |

Videos rotate through 4 public Google sample MP4s (Big Buck Bunny, Elephants Dream, For Bigger Blazes, Sintel). Posters use 10 distinct Unsplash portrait URLs.

### What you can do after
- Open the homepage to see the slider populated.
- Go to `/admin/testimonials` to edit, reorder, unpublish, or delete any of them.
- Replace videos one-by-one with real founder clips when ready.

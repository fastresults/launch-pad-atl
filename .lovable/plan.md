## Build: Business Ideas Scroller + Admin Toggle

### 1. New homepage section: `HomeBusinessIdeasScroller`
- File: `src/components/home/HomeBusinessIdeasScroller.tsx`
- Pulls from existing `BUSINESS_IDEAS` / `BUSINESS_CATEGORIES` in `src/lib/business-ideas.ts` (already 60 ideas across 6 categories — no new data).
- Layout:
  - Section heading: "60+ startup ideas founders are building" + sub: "Across online, main street, service, food, side hustle, and family-run — proof there's a clear path no matter what you're starting."
  - Category filter chips (All / Online / Main Street / Service / Food / Side / Family) above the scroller, using existing token styles (primary/border like the BONUS pill, not raw colors).
  - Auto-scrolling horizontal marquee (two rows, opposite directions) of compact idea cards: name, category label, offer line, and one stat (income potential). Pauses on hover. CSS-only animation (no extra deps).
  - Filtering a category swaps the marquee content (still auto-scrolls).
  - Mobile: single row, swipeable, drag to scrub.
- Visual style matches existing Framework section (gradient borders, subtle bg, Sparkles accents). No hardcoded colors — semantic tokens only.
- Placement: between `<Framework />` and `<HonestRoadmap />` in `HomeFramework.tsx`.
- Conditionally rendered based on the new site setting (see step 3).

### 2. Site setting key
- New key in `site_settings`: `show_business_ideas_scroller` (boolean, default `true`).
- Extend `SiteSettings` type and `getPublicSiteSettings()` in `src/lib/site-settings.functions.ts` to include this flag (default `true` when missing).
- Public read of `site_settings` is already allowed by existing RLS (the homepage already calls `getPublicSiteSettings`).

### 3. Wire toggle into homepage
- `HomeFramework.tsx` fetches site settings via `useQuery(["site-settings"], getPublicSiteSettings)` and only renders `<HomeBusinessIdeasScroller />` when `settings.show_business_ideas_scroller !== false`.
- Default-true so it shows immediately after deploy; admin can hide it.

### 4. Admin toggle UI
- New route: `src/routes/_authenticated/_admin/admin.settings.tsx` ("Site settings").
- Adds nav entry in `src/lib/admin-nav.ts`: `{ to: "/admin/settings", label: "Site settings", icon: Settings, group: "System", super: true }`.
- Page contents (super admin only):
  - Card: "Homepage sections"
    - Switch: **Business ideas scroller** — "Show the auto-scrolling list of 60+ startup ideas on the homepage between the Framework and Honest Roadmap sections." Saves via `updateSiteSetting({ key: "show_business_ideas_scroller", value: <bool> })`.
  - Room left for future toggles (registration_open, etc.) without restructuring.
- Optimistic toggle with toast feedback; invalidate `["site-settings"]` query.

### Files touched
- New: `src/components/home/HomeBusinessIdeasScroller.tsx`, `src/routes/_authenticated/_admin/admin.settings.tsx`
- Edit: `src/components/home/HomeFramework.tsx`, `src/lib/site-settings.functions.ts`, `src/lib/admin-nav.ts`

### Not changed
- `business-ideas.ts` data, DB schema (no migration — `site_settings` already exists with proper RLS), other admin pages, framework section, BONUS pills, pricing copy.

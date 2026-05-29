## Goal
Replace the current text-only "Atlanta Startup Workshop" brand mark (a small gradient dot + wordmark) with the supplied **StartupLabs color SVG** everywhere it shows up.

## Where the logo currently lives
- `src/components/site/Header.tsx` — `<span className="inline-block size-3 rounded-full bg-hero-gradient" />` + text wordmark
- `src/components/site/Footer.tsx` — same gradient dot + text
- `src/routes/__root.tsx` — no favicon link today; site uses default

There are no other `<img>` or imported logo assets in the codebase.

## Changes

**1. Add the asset to the repo**
- Download the signed Supabase URL once and save as `src/assets/startuplabs-logo.svg` (signed URLs expire — must be bundled).

**2. `src/components/site/Header.tsx`**
- Import the SVG: `import logoUrl from "@/assets/startuplabs-logo.svg";`
- Replace the gradient dot + wordmark `<span>`s inside the `<Link to="/">` with `<img src={logoUrl} alt="StartupLabs" className="h-7 w-auto" />` (height tuned to header padding).
- Keep the link target and surrounding layout.

**3. `src/components/site/Footer.tsx`**
- Same import + swap the gradient dot for `<img src={logoUrl} alt="StartupLabs" className="h-5 w-auto" />`. Keep the "· Norcross, GA" text next to it.

**4. `src/routes/__root.tsx`**
- Add favicon links under the existing `links: [...]`:
  - `{ rel: "icon", type: "image/svg+xml", href: "/startuplabs-logo.svg" }`
  - Also copy the SVG to `public/startuplabs-logo.svg` so the browser can fetch the favicon by URL (Vite serves `public/` at the root).

## Out of scope
- No changes to titles, meta descriptions, or the existing `og:image` (the user asked for logo replacement only).
- No dark/light variants (the SVG is full-color and works on the current dark background; revisit if contrast becomes an issue).
- Does not touch any user-uploaded "logo" docs in the dashboard (those are user content, not site branding).
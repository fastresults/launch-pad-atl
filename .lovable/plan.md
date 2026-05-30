## Problem

The `/facilitator` page is the only page on the site running a custom typography system:

- `src/routes/facilitator.tsx` injects an inline `<style>` block defining `.font-display` → **Playfair Display (serif)** and `.font-body` → **DM Sans**, and sets `fontFamily: "DM Sans"` inline on `<main>`.
- Every facilitator component (`FacilitatorHero`, `FacilitatorStory`, `FacilitatorPillars`, `FacilitatorTimeline`, `FacilitatorStats`, `FacilitatorAudience`, `FacilitatorCTA`) uses `font-display` for headings and `font-body` for body.

No other page (home, schedule, register, login, signup, privacy, terms) uses these classes or fonts. The rest of the site uses the default Tailwind sans stack (system-ui / inherited from `body`) with weight utilities like `font-semibold`, `font-bold`, etc. That's why the facilitator page reads as a different brand — it's literally a different typeface family.

## Fix

Bring the facilitator page onto the exact same typography system as the rest of the site: default sans, no serif, no custom font-family overrides.

### 1. `src/routes/facilitator.tsx`

- Remove the inline `<style>` block that defines `.font-display` and `.font-body`.
- Remove the `font-body` class from `<main>`.
- Remove the inline `style={{ fontFamily: '"DM Sans", ...' }}`; keep only `maxWidth: "860px"`.

### 2. Facilitator components (7 files)

In each file, do a surgical class swap — no layout, spacing, color, or copy changes:

- `font-display` → remove the class (headings inherit the site sans font; weight is already set via `font-bold` / `font-black`).
- `font-body` → remove the class (body text inherits site sans).
- Leave all weight, size, tracking, leading, and color utilities untouched.

Files touched:
- `src/components/facilitator/FacilitatorHero.tsx`
- `src/components/facilitator/FacilitatorStory.tsx` (includes the blockquote — drops serif, keeps italic + bold + border)
- `src/components/facilitator/FacilitatorPillars.tsx`
- `src/components/facilitator/FacilitatorTimeline.tsx`
- `src/components/facilitator/FacilitatorStats.tsx`
- `src/components/facilitator/FacilitatorAudience.tsx`
- `src/components/facilitator/FacilitatorCTA.tsx`

### 3. Out of scope

- No copy changes.
- No color, spacing, or layout changes.
- No edits to other pages or to `src/styles.css`.
- The Adam Anderson portrait, eyebrows, border-left treatment, stat numbers, and timeline structure all stay exactly as they are — only the typeface changes.

## Result

After the change, the facilitator headlines and body text render in the same default sans stack used by the home, schedule, and register pages. Visual hierarchy is preserved through the existing weight / size / tracking utilities, so the page still reads as editorial and structured — just in the site's actual brand voice instead of a foreign serif.

# Gold quote text across public pages

Make every quote on public-facing pages render in the brand gold `#c29b46` (the same tone already used by the hero "Now building" label), instead of the current muted brown `#8B7355`.

## What changes

- Pull quote in the homepage "learn more" section (the selected blockquote).
- The identical pull quote on the standalone landing page.
- Video testimonial quote lines on the homepage and landing page.
- Facilitator page pull quote.
- Any future blockquote inside a public marketing page picks up the color automatically.

Nothing changes inside the logged-in dashboard, admin, or Founders Hub — their document/markdown quotes keep the existing styling.

## Technical notes

- Add a design token (e.g. `--quote-gold: 41 51% 52%` → `#c29b46`) in `src/public.css` and a scoped rule so `.marketing-surface blockquote` uses it, keeping the existing left rule and serif treatment.
- Replace the hardcoded `text-[#8B7355]` on the blockquotes in `src/components/home/HomeFramework.tsx` and `src/components/landing/LandingFramework.tsx` with the token-based class.
- Apply the same token to the quote paragraphs in `VideoTestimonials.tsx`, `LandingVideoTestimonials.tsx`, `FounderVideoLightbox.tsx`, and the blockquote in `FacilitatorStory.tsx`.
- Verify contrast on the light editorial background and the dark cinematic sections; keep quotes at their current weight/size.

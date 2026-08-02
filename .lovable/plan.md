## Root cause

Nothing is broken in the responsive CSS itself — the breakpoints are simply set one tier too high. Verified by rendering the live site at several widths:

- **1440px wide** — correct: full horizontal nav, two-column editorial layout.
- **834px (iPad portrait)** — collapses to the phone layout: hamburger menu, single stacked column, coffee image full width above a stacked price card.
- **1280px** — correct, but content is capped at `max-w-6xl` (1152px) while the hero uses `max-w-7xl`, so the page narrows abruptly below the hero.

Every major desktop layout switch in the public pages is gated at Tailwind's `lg` breakpoint = **1024px**:

- `src/components/site/Header.tsx` — the full nav is `hidden … lg:flex`, and the hamburger is `lg:hidden`. Anything under 1024px gets the mobile menu.
- `src/components/home/HomeFramework.tsx` — the hero-copy section is `grid-cols-1 lg:grid-cols-12`. Under 1024px it stacks.

That 1024px line sits above iPad portrait (768–834px) **and** above the Lovable editor's preview iframe, which is a few hundred px narrower than the browser window — so on a 1512px laptop the preview renders under 1024px and shows the phone layout. That's what the report is describing.

## Fix

Move the desktop layout switch from `lg` (1024px) down to `md` (768px) on the public marketing surfaces, so tablets and narrow desktops get the desktop composition, and add a genuine tablet tier where things get tight.

1. **Header** — switch the horizontal nav to `md:flex` / hamburger to `md:hidden`. Between 768px and 1024px, tighten nav gap (`gap-4 lg:gap-7`), shrink the logo (`md:h-10 lg:h-12`), and shorten the CTA label to "Reserve — $197" until `lg`. Verify no wrap at 768px; if the full link set can't fit, keep `schedule` and `facilitator` hidden until `lg` rather than falling back to a hamburger.
2. **HomeFramework hero-copy section** — `md:grid-cols-12` with `md:col-span-7 / md:col-span-5`, promoting to `lg:col-span-8 / lg:col-span-4`. Scale the headline through a middle step (`md:text-[3.6rem] lg:text-[4.3rem]`) so it doesn't overflow at 768px.
3. **Container width** — raise the section container from `max-w-6xl` to `max-w-7xl` so the page body lines up with the hero instead of pinching in.
4. **Same `lg:`→`md:` pass on the other public pages** that share the pattern: `src/components/landing/LandingFramework.tsx`, `src/routes/build.tsx`, `src/routes/one-on-one.tsx`, `src/routes/private-tuesday.tsx`. Authenticated/admin routes are left alone — they legitimately want the wide-only layout.
5. **Chat widget overlap** — at 1280px the "Ask Startup Labs" bubble sits on top of the "Can't make it?" link; nudge its bottom offset up so it clears inline links.

## Verification

Playwright screenshots at 768, 834, 1024, 1280 and 1512 CSS px, plus a ~950px pass to simulate the editor preview iframe, confirming: horizontal nav present from 768 up, two-column editorial layout from 768 up, no headline overflow or horizontal scroll at any of those widths.

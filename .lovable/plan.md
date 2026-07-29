## Goal

When landing-only mode is ON, the landing page currently ends at the closing CTA with no way to sign in. Add a proper footer to the landing page that contains an organized, on-brand sign-in area — so returning members, staff, and admins can get in without knowing the `/login` URL.

## What gets built

**1. New `LandingFooter` component** (`src/components/landing/LandingFooter.tsx`), rendered as the last block inside `LandingFramework`, below the bottom CTA.

Three-column layout on desktop, stacked on mobile:

```text
┌──────────────────────────────────────────────────────────┐
│  [StartupLabs logo]        Workshop            Sign in    │
│  One focused morning.      Aug 20, 2026        [ email  ] │
│  Atlanta, Georgia.         IGNITE Center       [ pwd    ] │
│                            Get directions      [Sign in ] │
│                                                Google     │
│                                                Forgot?    │
├──────────────────────────────────────────────────────────┤
│  © 2026 Startup Labs · Atlanta, GA                        │
└──────────────────────────────────────────────────────────┘
```

**2. Sign-in panel behavior**

- Signed out: compact "Member sign in" card — email + password fields, primary Sign in button, "Continue with Google", and a quiet "Forgot?" reset link. Same auth calls the existing `/login` page uses (`signInWithPassword`, `lovable.auth.signInWithOAuth`, `resetPasswordForEmail`), so no new backend work.
- Signed in: the card collapses to a greeting with the user's email plus two actions — "Go to dashboard" (or "Admin" for super admins) and "Sign out".
- To keep the panel from competing with "Reserve your interest", it renders collapsed by default as a single quiet "Member sign in" link that expands the form in place. The landing page's only loud CTA remains the interest modal.

**3. Redirect on success**

After sign-in the user lands on `/admin` (super admin), `/dashboard` (approved member), or `/welcome` — matching the existing login redirect logic. Note: landing-only mode currently allowlists only `/login`, `/reset-password`, and `/admin`, so a non-admin signing in from the footer would bounce back to the landing page. Fix in the same change: add `/dashboard`, `/welcome`, and `/account` to the allowlist in `LandingOnlyGate`, gated on the visitor being authenticated — anonymous visitors still see only the landing page.

**4. Styling**

Uses the landing page's warm editorial tokens (cream surface, espresso text, serif headings) — no hardcoded colors, no new tokens. Footer sits on a slightly deeper surface band so it visually terminates the page.

## Technical notes

- Files touched: new `src/components/landing/LandingFooter.tsx`; edits to `src/components/landing/LandingFramework.tsx` (render footer) and `src/components/site/LandingOnlyGate.tsx` (allowlist post-login routes for authenticated users).
- No database, edge function, or auth-config changes.
- The full-site `Footer.tsx` and `/login` route are untouched.

# Privacy Policy Page + Footer Link

## Goal
Add a legally sound privacy policy to the Startup Labs site, served at `/privacy`, and link it from the site footer.

## Plan

### 1. Create the privacy policy route (`src/routes/privacy.tsx`)
- New TanStack route at `/privacy`.
- Content covers: what data is collected (name, email, phone, payment info), how it is used (registration, payment processing, communication, workshop logistics), how it is stored (Lovable Cloud/Supabase), cookies and analytics, third-party services (payment processor, Google OAuth), user rights (access, deletion, opt-out), and contact info.
- Design: clean, readable, single-column layout matching the site's dark theme (semantic tokens from `src/styles.css`), with proper heading hierarchy.
- SEO: page title "Privacy Policy — Startup Labs", meta description, canonical link.

### 2. Update the site footer (`src/components/site/Footer.tsx`)
- Add a "Privacy Policy" text link between the copyright line and the "A division of" line, or grouped in a small link row.
- Link points to `/privacy` using `<Link>` from `@tanstack/react-router`.

### 3. Verify
- Navigate to `/privacy` from the footer link.
- Check responsive layout and heading structure.

## Out of scope
- Terms of service (can be added later if needed).
- Cookie consent banner.
- International compliance specifics beyond standard US best practices (GDPR, CCPA add-ons can be layered later if requested).

## Assumptions
- The site currently collects: name, email, phone, and payment data via registration; authentication via email/password and Google OAuth.
- Data is stored in Lovable Cloud (Supabase).
- Payment processing is handled by a third-party processor (Stripe or similar) — the policy will reference this generically and can be tightened once the exact processor is confirmed.
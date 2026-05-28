# Atlanta Startup Workshop Site — Plan

Build a dedicated workshop site on this codebase (TanStack Start + Tailwind + Lovable Cloud / Supabase). Visual language mirrors StartupLabs.agency: dark background with a vivid orange→magenta→purple gradient, white sans-serif typography, lowercase nav labels, soft pill/rounded buttons.

## Event details (locked)
- **Date:** Thursday, July 23, 2026, 9:00 AM – 4:00 PM
- **Location:** 1500 Indian Trail Lilburn Rd NW, Norcross, GA 30093
- **Capacity:** 20 seats

## Pages (Phase 1)

1. **Home (`/`)**
   - Hero: "Start your business in one day" with gradient backdrop, date + Norcross venue, Register CTA, seats-remaining indicator
   - 6-stage flow strip (ideate → plan → develop → launch → grow → next steps), echoes the StartupLabs top nav
   - "What you'll leave with" deliverables row
   - Venue card with embedded map link
   - SEO meta (title, description, OG)

2. **Schedule (`/schedule`)**
   - Vertical timeline 9:00 AM → 4:00 PM, exactly as you outlined
   - Each block: time, duration, stage #, title, description, tools used
   - Breaks (coffee, lunch) styled distinctly
   - Bottom Register CTA

3. **Register (`/register`)**
   - Fields: name, email, phone, business idea (textarea), industry (select), stage (idea / early / existing), referral source
   - Zod validation + react-hook-form, inline errors, loading/success states
   - On submit: insert into Supabase via a `createServerFn` (no auth required for registration)
   - Success screen: confirmation, what-to-bring checklist, add-to-calendar link (.ics)

## Backend (Supabase via Lovable Cloud)

Enable Lovable Cloud, then create table:
```sql
create table public.workshop_registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  phone text,
  business_idea text not null,
  industry text not null,
  stage text not null,
  referral_source text,
  status text default 'pending'
);
grant insert on public.workshop_registrations to anon, authenticated;
grant all on public.workshop_registrations to service_role;
alter table public.workshop_registrations enable row level security;
create policy "anyone can register"
  on public.workshop_registrations for insert
  to anon, authenticated with check (true);
-- No SELECT policy: reads are admin-only via service_role (future admin page).
```
Insert happens through a `createServerFn` using `supabaseAdmin` so RLS stays locked down and the browser never gets read access.

## Design System (matches StartupLabs)

Add to `src/styles.css` (oklch tokens):
- `--background`: near-black (~oklch(0.15 0.02 270))
- `--foreground`: white
- `--brand-orange`, `--brand-magenta`, `--brand-violet` for the signature gradient
- `--primary`: bright blue (matches their Login button) for CTAs
- `--gradient-hero`: linear-gradient using the three brand stops
- Rounded-full buttons, subtle dotted-noise overlay on hero

Shared `<SiteHeader />` (lowercase nav: home, schedule, register) and `<SiteFooter />` so Phase 2 pages drop in cleanly.

## File structure
```text
src/
  routes/
    index.tsx
    schedule.tsx
    register.tsx
  components/
    site/{Header,Footer}.tsx
    home/{Hero,FlowStrip,Deliverables,VenueCard}.tsx
    schedule/{Timeline,SessionCard}.tsx
    register/RegistrationForm.tsx
  lib/
    registrations.functions.ts   # createServerFn insert
    schedule-data.ts             # single source of truth for the 6h flow
```

## Out of scope (Phase 2)
Facilitators page, participant dashboard (auth-gated), FAQ/Pricing, What-to-Bring/What-You'll-Build standalone pages, admin view of registrations, confirmation emails (Resend), payments.

## Open question
- **Ticket price** — leave blank ("Pricing coming soon") or set a placeholder I can swap later? Defaulting to "Pricing coming soon" unless you say otherwise.

# Hero Workshop Gateway

Add a discreet-but-featured workshop selector to the hero so visitors can see all 9 workshops, understand that Foundation is the one open now, and pick the one they want — without breaking the cinematic, single-focus hero.

## Recommended UX pattern (what efficus-style pages get right)

Efficus-style pages hold one focused center-stage input and put everything else in a quiet, secondary rail that only reveals depth on interaction. Applied here:

1. The idea prompt stays the hero's single primary action. It is the emotional entry point ("What would you like to start?").
2. Directly under the prompt, replace the "Now building: …" status line with a **workshop rail**: a single horizontal row of small pill chips, one per workshop, horizontally scrollable on mobile. Foundation is the only chip styled as live (gold ring + "Open · Aug 20"). The other eight are muted with a month tag (Sep, Oct, …) and read as "Coming Sep".
3. Clicking any chip opens a **gateway sheet** (bottom sheet on mobile, centered panel on desktop) with the full 9-workshop grid: name, one-liner, what gets built, next date, price. Live workshops get a "Reserve your seat" button; upcoming ones get "Notify me when this opens".
4. A quiet text link right of the rail — "See all 9 workshops" — opens the same sheet. This is the discreet-yet-featured lever: nothing shouts, but the whole catalog is one click deep from the hero.
5. Keep the scroll cue. The rail sits above it, inside the existing hero stack, so the hero silhouette does not change.

Why this over the alternatives: a dropdown hides the catalog and reads as a form; a tab bar across the top competes with nav; nine visible cards in the hero destroys the cinematic focus. The chip rail + sheet keeps one primary action, signals scarcity/sequence, and gives the catalog a real surface.

## The prompt adapts to the selected workshop

Selecting a chip does not just filter a list — it re-tunes the whole hero to that workshop. One selection drives three things:

1. **The question changes.** Each workshop owns its own hero question and typed ghost examples:
   - Foundation — "What would you like to start?"
   - Sales systems — "What kind of clients do you want?"
   - Brand identity — "What should people feel when they find you?"
   - Website — "What should your site get someone to do?"
   - Social / content / email / AI ops / legal-financial each get their own one-line question.
2. **The answer modal changes.** The existing idea-snapshot modal becomes workshop-aware: same shape (a short AI-written snapshot plus the workshop invite), different lens. For Sales it returns who those clients are in Atlanta, where they already gather, and the first move to reach them. For Brand it returns the positioning read. Each ends with the same invite CTA for that workshop's next date.
3. **Below the hero changes.** The page under the hero becomes a **sampler pattern**: one repeating section template that re-renders with the selected workshop's content — the pain, what actually gets built that morning, the agenda, the next date, and the price. Same rhythm and layout every time, different substance. Foundation is the default state on load.

Nothing hard-navigates. Selection is local hero state, the sections cross-fade, and the URL carries `?w={slug}` so a selection is shareable and the back button behaves.



## Positioning framework (how the 9 read as one ladder)

Frame the catalog as a sequence, not a menu:

- **Foundation is the door.** Every other workshop assumes your positioning, offer, and ICP already exist. Copy in the sheet: "Start here. Everything else builds on what you leave with."
- **The other eight are build layers**, each shipping one real asset (brand live, site live, follow-ups sending, tools running). Group them in the sheet under one line: "One morning each. One real piece of your startup, live before lunch."
- **Sequence creates urgency without discounting.** "One new workshop opens each month" turns the rollout into a release calendar rather than an incomplete product. Locked chips carry a month, never "coming soon".
- Each locked chip's notify action is a real capture (email → waitlist), so the gateway earns leads instead of just teasing.

## Technical notes

- New `src/components/home/WorkshopRail.tsx` (chips) and `src/components/home/WorkshopGatewaySheet.tsx` (catalog panel), rendered from `CinematicHero.tsx` inside `.sl-hero__stack`.
- Catalog source: extend `src/lib/build-workshops.ts` entries with `status: "open" | "upcoming"` and `opensLabel` (e.g. "Sep 2026"), plus a Foundation entry so all 9 live in one array. Next dates come from the existing `getUpcomingSessions()` in `src/lib/build-workshop-schedule.ts`.
- Open workshops link to `/build/{slug}` (Foundation → `/register`). Upcoming workshops open an inline email capture.
- Waitlist capture: new `workshop_waitlist` table (email, workshop_slug, created_at) with RLS + grants allowing anonymous insert only; no public read.
- Styling in `src/public.css` using existing tokens (`--sl-quote-gold` for the live chip). Sheet uses the existing shadcn Sheet/Dialog primitives, restyled to the cinematic surface.
- Mobile: rail is a scroll-snap row with edge fade; sheet becomes a full-height bottom sheet.

# Workshop parity: homepage stack adopts the workshop-page treatment

Right now the two surfaces read like two different companies. `/build/:slug` (reached from **workshops** in the nav) uses the blue-accent card system — rounded panels on `bg-card`, blue eyebrows, gradient-highlighted headline phrases, a gradient reserve button. The homepage stack under the chat box uses a gold editorial hairline system with no card chrome, and it stops short: no session dates, no agenda, no "have us build it instead", no FAQ.

This brings the homepage version fully in line — same look, same sections, same order — so picking a workshop chip below the hero gives the identical page a visitor would get from the nav.

## What changes visually

Every section in the homepage stack is restyled to the workshop-page system:

- Eyebrows: blue, uppercase, wide tracking, with the section's lucide icon.
- Headlines: the `public-heading` scale, with the closing phrase in the brand gradient.
- Content blocks: rounded cards on `bg-card` with a hairline border — replacing today's bare top-rule lists.
- Emphasis blocks (audit prescription, guarantee): the same blue-tinted border treatment.
- Primary CTA: the gradient reserve button. Gold is retired from these sections, including the sticky bar, so one accent runs across both surfaces.
- Alternating section backgrounds and the `border-t` rhythm the workshop page uses, so the scroll has the same cadence.

## Sections the homepage gains

Added in the workshop page's order, all driven by the same data the workshop page already reads, so nothing has to be re-authored:

1. **Upcoming dates** — the next sessions for the selected workshop, each with a reserve link.
2. **The agenda** — the timed blocks of the morning.
3. **Right fit / skip it** — the two-column qualifier.
4. **Or have us build it for you** — the gradient agency-offer panel with the credit-back line.
5. **FAQ** — the expandable list.

Sections the homepage already has that the workshop page doesn't (the cost-of-inaction opener, the formats, the objection handling) stay — they're doing conversion work above the fold-line and the workshop page will keep reading fine without them.

Foundation is unchanged: it keeps its short path (cost, three pains, decision) and none of the new sections.

## Technical notes

- Extract the repeated section chrome into small shared pieces (`SectionEyebrow`, `SectionShell`, card wrapper) under `src/components/home/workshop/` and use them in both `src/routes/build.$slug.tsx` and the homepage section components, so the two can't drift again.
- Restyle in place: `WorkshopCost`, `WorkshopPains`, `WorkshopAudit`, `WorkshopBuild`, `WorkshopOffer`, and the sticky bar in `WorkshopStack.tsx`.
- New homepage sections read from `getBuildWorkshop(slug)`, `getUpcomingSessions`, and `getWorkshopAgencyOffer` — the catalog already derives from the same records, so slugs line up 1:1.
- Keep the existing `!isFoundation` gate and the keyed cross-fade on workshop switch.
- Homepage sections stay inside `public-container` (the 20% margin rule); only the hero is full bleed.
- Verify in the browser at `/?w=brand-identity` against `/build/brand-identity` and check the mobile breakpoint.

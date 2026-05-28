## Pass A — Rewrite the 7 stage cards with concrete take-homes (unchanged from prior plan)

Replace the tiny generic blurb under each card with the **tangible thing the founder walks out with**. Empathetic, specific, irresistible.

### New copy (added as `takeHome` on each stage in `src/lib/curriculum-data.ts`)

1. **Form** → *"Your LLC packet ready to file, your EIN in hand, and the two contracts that let you legally take money on Monday."*
2. **Customer** → *"A named, real first customer with their pain priced in dollars — plus a 25-name prospect list you can start messaging tonight."*
3. **Offer** → *"One sentence a buyer can say yes or no to, a price that actually pays you, and the exact number of sales you need to break even."*
4. **Build** → *"The step-by-step way you'll deliver your first sale — set up in free apps, drafted, and rehearsed before a real customer sees it."*
5. **Brand** → *"A logo, color palette, fonts, and a Home + Offer page drafted in your website builder — ready to publish the moment your domain resolves."*
6. **Marketing** → *"A printable business card, a flyer, claimed social profiles, six post drafts, and a 60-second video script — your whole launch kit, done."*
7. **Launch** → *"A signed, dated 90-day plan with your first 3 paying customers → 10 → repeatable channel — and an accountability partner already on the calendar."*

### Card layout (`src/routes/index.tsx` → `FlowStrip`)

Per card, top to bottom:

```text
[ 1 ]                       ← existing gradient number badge
Form                        ← existing stage title
YOU WALK OUT WITH           ← new 10px uppercase eyebrow, muted
Your LLC packet ready to    ← takeHome copy, text-sm leading-snug,
file, your EIN in hand,        text-foreground/90 (louder than today's
and the two contracts…         muted blurb)
```

- Bump card padding `p-5` → `p-6`.
- Grid: `md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7` → `md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`. Cards lay out as 4 + 3 on xl with room to actually read the deliverables.
- Each card stays `<Link to="/schedule" hash="stage-N">`.

### Section subhead (one added line)

Under the existing "Seven stages. One working day. *A business built to make money…*", add:

> *Here's exactly what's in your hands when you stand up at 4:30 PM.*

So the eye reads the cards as a deliverable list, not a curriculum.

---

## Pass B — Venue, directions, embedded map, Add to calendar

Today's `VenueCard` is a quiet pair of columns: address text on the left, a decorative "20 seats" gradient on the right, and a single "Open in maps" link. For a $-bearing in-person workshop that's underselling it. We turn it into a real "everything you need to show up" panel.

### B1. EVENT data (`src/lib/schedule-data.ts`)

Extend the `EVENT` constant with the fields needed by the calendar links — derived once, used everywhere:

```ts
startISO: "2026-07-23T08:00:00-04:00",    // 8:00 AM ET
endISO:   "2026-07-23T16:30:00-04:00",    // 4:30 PM ET
durationLabel: "8 hours 30 minutes",
// helpers
googleCalendarUrl: <built from start/end/title/location/details>,
icsHref: <data: URI ICS payload>,
```

No new dependency — the Google Calendar URL is a simple `https://calendar.google.com/calendar/render?action=TEMPLATE&...` string, and the ICS payload is a 12-line text blob inlined as a `data:text/calendar;base64,…` href. Both download/open natively. Apple Calendar and Outlook both consume the ICS link.

### B2. VenueCard redesign (`src/routes/index.tsx`)

Replace the right-column gradient "Capacity" card with a real embedded map, and add a directions / calendar action row under the address.

New layout, same outer card (no new components, no new packages):

```text
┌─ Where it happens ──────────────────────────────────────────────┐
│  IGNITE Center at Greater Atlanta Christian School              │
│  1500 Indian Trail Lilburn Rd NW, Norcross, GA 30093            │
│  Thursday, July 23, 2026 · 8:00 AM – 4:30 PM ET                 │
│                                                                  │
│  Free on-site parking · 20 seats · Small cohort, no audience    │
│                                                                  │
│  [ Get directions ↗ ]  [ Add to calendar ▾ ]  [ Reserve seat → ]│
│   (opens Google Maps    (Google / Apple / Outlook              │
│    with the address      via .ics download)                     │
│    pre-filled)                                                   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                             ││
│  │   <iframe Google Maps embed — keyless share embed,          ││
│  │    aspect-video, rounded-2xl, lazy-loaded>                  ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

Details:

- **Map**: standard Google Maps share-embed iframe — `https://www.google.com/maps?q=1500+Indian+Trail+Lilburn+Rd+NW%2C+Norcross%2C+GA+30093&output=embed`. Loads with `loading="lazy"`, `referrerPolicy="no-referrer-when-downgrade"`, `aria-label="Map of IGNITE Center"`, full-width, ~aspect-video on desktop / `h-64` on mobile, rounded to match the card. **No API key needed**, no Google Maps connector required — this is the public share embed used by millions of sites.
- **Get directions** button: opens `EVENT.mapsUrl` (already exists) in a new tab. Same affordance as before, just renamed and promoted to a primary-tier border button.
- **Add to calendar**: a small details/summary disclosure (no new UI lib). Click reveals three links stacked: "Google Calendar" (opens the prebuilt Google render URL in a new tab), "Apple Calendar (.ics)" (downloads the inlined ICS), "Outlook (.ics)" (same ICS — works for Outlook desktop/web). Each link logs nothing, uses native browser handling.
- **Reserve seat** stays as the closing CTA.

The "Small cohort by design — 20 founders, one operator, no audience" line is preserved as a chip-style note above the action row, alongside a new "Free on-site parking" chip (true for the IGNITE Center campus).

### B3. Hero quick reinforcement (small)

In the existing four `Meta` chips at the bottom of the hero, the IGNITE Center chip already says "IGNITE Center · Greater Atlanta Christian School" — leave as is. No hero changes.

---

## Files touched

1. `src/lib/curriculum-data.ts` — add `takeHome: string` field to `Stage` type and fill for all 7 stages.
2. `src/lib/schedule-data.ts` — surface `takeHome` on `FLOW_STAGES`; extend `EVENT` with `startISO` / `endISO` / `durationLabel` / `googleCalendarUrl` / `icsHref` (computed once, exported).
3. `src/routes/index.tsx`:
   - `FlowStrip` — card body rewrite, eyebrow added, grid columns reduced to 2/3/4, one new subhead sentence.
   - `VenueCard` — replace the right-column gradient panel with the Google Maps iframe; add the directions / add-to-calendar / reserve action row; add parking + cohort chips.

No new npm packages. No new components. No design-token changes. The Lovable-managed Google Maps connector is **not** required because we use the keyless share-embed iframe — same approach the prior `mapsUrl` link uses, just embedded.

## Verification

- Reload `/`, scroll to "The day, hour by hour": each card now shows a "YOU WALK OUT WITH" eyebrow and a 2-sentence concrete deliverable; grid is 2 / 3 / 4 across at the standard breakpoints; clicking a card still jumps to that stage on `/schedule`.
- Scroll to "Where it happens": the embedded map renders (lazy-loaded, no console errors), "Get directions" opens Google Maps, "Add to calendar" reveals the three calendar options, clicking "Google Calendar" opens a pre-filled event in a new tab, clicking "Apple Calendar (.ics)" downloads `ignite-business-launch-2026.ics` that opens cleanly in Calendar/Outlook.
- `/schedule` page itself is unchanged.

Quietly fix on the way: stale SSR hydration warnings from the prior copy pass will clear with this fresh build.

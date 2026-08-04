# Workshop-Aware Homepage: One Page, Nine Products

Today only the hero and one sampler band react to the workshop chip. Everything below (video wall, hero copy, framework, roadmap, facilitator, venue, CTA) stays generic, so a visitor who picks "Email & CRM" reads a Foundation pitch and bounces.

This turns the whole page below the hero into a single workshop-aware sales page — the efficusai.co pattern: pick the capability at the top, and the entire page re-renders as a complete, self-contained pitch for that one capability, ending in one decision.

## What the visitor experiences

Pick a chip in the hero. The page below re-renders in place (300ms cross-fade, no scroll jump) as a full pitch for that workshop:

```text
[ HERO ]  question + prompt + 9 chips              (already built)
   |
[ 1 ] THE COST OF NOT HAVING THIS      pain, in their words + the number it costs
[ 2 ] WHAT YOU WALK OUT WITH           4-6 artifacts, each named like a real file
[ 3 ] THE ARTIFACT, SHOWN              a preview of the actual thing they leave with
[ 4 ] THE MORNING, HOUR BY HOUR        4 blocks: input -> working session -> output
[ 5 ] TWO WAYS TO GET IT               live morning ($197) | self-paced course ($97)
[ 6 ] IS THIS YOU / IS THIS NOT YOU    honest two-column qualifier
[ 7 ] PROOF + OBJECTIONS               3 objections answered in this domain's language
[ 8 ] ONE DECISION                     reserve seat / join course / notify me
   |
[ THE ROOM ]  facilitator, venue, video wall, footer   (stays constant — it's the same room)
```

Sections 1-8 are one template rendered nine times from data. Sections below stay shared so the page keeps its credibility anchors and doesn't become nine separate microsites.

## The expertise layer — nine products, written properly

Each of the nine gets authored as a real product, not a label. For every one: the pain a founder actually feels (not the category name), the specific artifacts, an artifact preview, a four-block morning, the three objections that kill the sale in that domain, and course-vs-workshop framing.

| Workshop | Pain it answers | Signature artifact |
| --- | --- | --- |
| Foundation | "I have an idea and no first real thing" | Live page + first message sent |
| Brand | "I look cheap, so I get priced like it" | Voice guide + visual system rules |
| Website | "My site describes me instead of selling" | Wireframed page with one job |
| Sales | "Every call is a coin flip" | ICP scorecard + 25-min sales script |
| Email & CRM | "People ask for a quote and vanish" | CRM live + 16-email lifecycle |
| Social | "I post and nothing happens" | Two-channel plan + 30 days queued |
| Content | "I write and no one finds it" | Pillars + keyword map + 3 drafts |
| AI ops | "I'm doing $20/hr work at 9pm" | 5 workflows automated live |
| Legal & money | "I've been avoiding it for eight months" | Entity, contract suite, books open |

Copy rules applied to all nine, consistent with existing standards: no plan/blueprint/roadmap/framework language for the offer itself; name the artifact; "startup" not "business"; second person; every section ends pointing at one action.

## Productizing: workshop and course

Each capability ships in two formats from the same content spine:

- **Live morning** — $197, in the room at the IGNITE Center, the artifact is finished before you leave. Scarcity is real (seat count, one date).
- **Self-paced course** — recommended $97, the same four blocks as modules with the same worksheets and artifact templates, no room, no deadline. Positioned as the honest second choice, never the equal choice: "same build, on your own clock, without anyone across the table."

Section 5 presents them side by side with the live option visually dominant, and a single line naming the real tradeoff (accountability and finish rate). Course purchase flow is out of scope for this build — the course card captures interest and links to a waitlist, same mechanism as the upcoming-workshop notify form.

## Technical notes

- Extend `src/lib/workshop-catalog.ts` into the full product record: `costOfInaction`, `artifacts[]`, `artifactPreview` (structured lines rendered as a mock document/screen), `morning[]` (from existing `BuildWorkshop.agenda`), `forYou[]`/`notForYou[]`, `objections[]`, `formats` (workshop + course), `outcomeStat`. Reuse `BUILD_WORKSHOPS` wherever content already exists; author the gaps. Foundation authored by hand.
- Replace `WorkshopSampler.tsx` with `src/components/home/workshop/` — one component per section, all pure and props-driven, composed by `WorkshopStack.tsx`.
- Selection state stays in `useSelectedWorkshop` (`?w=` URL). `WorkshopStack` keys on slug for the cross-fade; scroll position is preserved on switch (no `scrollIntoView` on change).
- A slim sticky sub-nav appears once the hero scrolls past: workshop name + price + "Reserve" — keeps the offer on screen through a long page.
- Reuse existing tokens only (`--sl-quote-gold` accent, `public-container`, `public-heading`); no new color literals.
- SEO: `?w=` variants get a canonical to `/`; each workshop's deep content already lives at `/build/:slug`, which stays the indexable page and the destination of section 8 for upcoming workshops.
- Course interest reuses the existing `workshop_waitlist` table with a `format` column added via migration.

## Build phases

1. **Data spine** — expand the catalog type and author all nine product records (the bulk of the work; this is the copywriting pass).
2. **Section components** — build the eight section components against Foundation, verify with a browser pass.
3. **Swap + motion** — wire `WorkshopStack`, cross-fade, sticky sub-nav, scroll stability; verify all nine render with no layout shift.
4. **Formats** — dual-format section, course waitlist capture, migration for `format`.
5. **Polish** — mobile pass, reduced-motion, screenshot review of all nine.

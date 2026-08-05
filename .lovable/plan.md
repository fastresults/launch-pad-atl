# Replace the "self-paced course" card with what actually comes with the seat

There is no paid self-paced course. Every seat includes two things that live on after the morning: a login where the advice and assets built in the room are stored, and a recap course they can always refer back to. The card in that slot is currently selling a product that does not exist — and worse, it is priced at $97 and framed as the weaker of two options, which invites the reader to buy less.

## Recommendation on how to present it

Stop presenting it as a second thing to buy. Present it as **what the seat keeps giving you after you leave** — an included, no-extra-cost half of the same purchase.

That means the section changes from a *choice* ("two ways to get it") to a *sequence* ("the morning, and everything that outlives it"). The room card stays dominant and priced. The right card loses its price, loses its waitlist email capture, and becomes an "Included with your seat" panel with two clearly named parts:

```text
THE MORNING  ($197, reserve)      ->   INCLUDED WITH YOUR SEAT  (no price)
  built with you at the table            1. Your dashboard — every asset
  artifact done before you leave            and decision from the morning,
                                            stored under your login, forever
                                         2. The recap course — the same
                                            build walked back through, on
                                            demand, whenever you need it
```

Concrete copy for the right card:

- Eyebrow chip: **Included with your seat**
- Heading: **You do not leave with a folder. You leave with a login.**
- Sub: Everything built that morning keeps living somewhere you can get to it.
- Two labeled blocks rather than a flat bullet list, since these are two distinct things:
  - **Your dashboard** — every asset, decision, and prompt from your morning, saved under your login. Come back in six months, it is still there.
  - **The recap course** — the same build walked back through on video, block by block, so you can redo any step alone.
- A closing line that removes the "is this upsell" question: *No extra cost. It comes with the seat.*
- No CTA button of its own — the reader's only action stays "reserve your seat."

Section heading changes from "In the room, or on your own clock" to **"The morning, and everything that outlives it."** Eyebrow changes from "Two ways to get it" to **"What the seat includes."**

Grid stays 7/5 so the room keeps visual dominance, but the right card loses the muted/dimmed treatment (`bg-card/50`, muted text, `Minus` icons). Included value should not look like a lesser option — it gets normal foreground text and check-style icons in a distinct accent so it reads as bonus, not consolation.

This applies to all eight build workshops and Foundation identically — the dashboard and recap course come with every seat.

## Technical detail

- `src/lib/workshop-products.ts`
  - Delete `COURSE_PRICE_LABEL` and the `course` half of `formatsFor()`.
  - Replace with an `included` record: `label`, `heading`, `summary`, `items` (each `{ title, detail }`), and `footnote`. Same shape for every workshop, authored once.
  - Rename the return of `getWorkshopFormats` to `{ live, included }` and update the `WorkshopFormat` type accordingly (drop `priceLabel`/`ctaLabel` from the included variant).
- `src/components/home/workshop/WorkshopOffer.tsx` — `WorkshopFormats`
  - Update eyebrow and heading text.
  - Rewrite the right-hand `Panel`: remove price, remove `WaitlistForm`, remove `Minus` bullets and `bg-card/50`/muted styling; render the two named blocks with title + detail and the footnote.
- No other file references the course; `build.$slug.tsx` does not use this section, so the homepage stack is the only surface affected.
- No backend, pricing, or checkout changes. Copy and presentation only.

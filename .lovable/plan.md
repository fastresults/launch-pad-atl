## Goal

Land one bold, defensible claim — **no accelerator, incubator, or startup bootcamp in Atlanta sends you home with a stronger foundation** — and let it echo lightly down the page. Three touchpoints, not a drumbeat.

## The claim (primary wording)

> **No accelerator, incubator, or startup bootcamp in Atlanta hands you a stronger foundation than you'll walk out with here.**

Naming the actual category is the point. "Program" is vague — the reader should picture the specific alternatives they've considered: ATDC, Techstars-style accelerators, university incubators, weekend bootcamps, SBA/SCORE workshops, business coaches. Those pitch, mentor, and advise. We build.

Backed immediately by proof so it reads as fact, not bluster: page live, offer priced, first message sent — in one morning, before you leave the room.

**Shorter echo forms** for tight slots:
- `Atlanta's strongest startup foundation`
- `Accelerators pitch. Incubators mentor. We build.`

## Touchpoint 1 — Hero kicker (`src/components/home/HomeFramework.tsx`, ~line 91)

Current: `One focused morning · IGNITE Center · Coffee's on us`

Change to: `Atlanta's strongest startup foundation · IGNITE Center`

Star icon and styling unchanged.

## Touchpoint 2 — Hero deck, one added sentence (~line 103)

Keep the warm existing deck intact and append the claim in its full, category-naming form plus its proof, so the boldest statement on the page is substantiated in the same breath. No new element, no added visual weight.

## Touchpoint 3 — A quiet claim line above "Designed for" (~line 118)

One small-caps `<p>` in the existing espresso `#8B7355` tracking style:

`Accelerators pitch. Incubators mentor. Bootcamps lecture. You leave our room already open for business.`

This is the only new DOM element in the hero — no card, border, or badge.

## Touchpoint 4 — Reinforce once below the fold

Sharpen the "What we actually build with you" eyebrow (~line 309) to name the contrast explicitly: `Not an accelerator. Not an incubator. Not a course.` H2 and body stay as previously rewritten.

## Balance guardrails

- Name the competitor *category*, never a specific named organization — no ATDC, Techstars, or university callouts.
- No badges, ribbons, "#1", star ratings, or stacked superlatives.
- Full claim stated **once**; other mentions are partial echoes.
- Every superlative sits adjacent to concrete artifact proof.
- Landing page (`LandingFramework.tsx`) gets the hero kicker + deck sentence only — shorter surface, no third echo.

## Out of scope

Layout, palette, imagery, pricing, dates, backend. Copy plus one small `<p>` per surface.

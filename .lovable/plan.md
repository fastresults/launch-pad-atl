## The move

Right now the home hero is a magazine masthead + big serif headline on the left and a hard rectangular price card on the right. It reads like a newsstand cover, not an invitation. We swap the right column's visual anchor for an artistic coffee cup illustration with a soft ribbon of steam curling up behind the headline, and warm the surrounding copy + composition so the whole section feels like someone pulling out a chair for you.

The offer, price, CTA, date, and "Designed for" list all stay — only the visual framing and a few sentences soften.

## New hero composition

```text
┌───────────────────────────────────────────────────────────────┐
│  Issue No. 01 — The Pivot        Pull up a chair (italic)     │
│  ─────────────────────────────────────────────────────────    │
│                                                               │
│   Pull up a chair.                       ~~~   (steam wisps)  │
│   Let's start your                        ~~                  │
│   business together.                     ( ☕ )  hand-drawn    │
│     — over coffee, in one morning         \_/   coffee cup    │
│                                                               │
│   [warm invite paragraph, shorter]      $297                  │
│   [who it's for, plain]                 Reserve your seat →   │
│                                          Can't make it? ...   │
│                                                               │
│  ── 01 live page · 02 priced offer · 03 first outreach ──     │
│  Aug 20 · Atlanta · 8:45–11:30 · 20 seats                     │
└───────────────────────────────────────────────────────────────┘
```

Left column (`lg:col-span-7`) carries the headline + invite copy. Right column (`lg:col-span-5`) becomes a stacked visual: the coffee cup illustration sits on top, the price/CTA card sits softly under it (no hard border — a warmer, rounded cream card with a thin espresso hairline). The cup art overlaps the top edge of the card by ~40px so it feels placed on the table, not stamped into a grid.

## The coffee cup itself

Generate a single artistic hero asset via `imagegen--generate_image` (standard tier), transparent PNG, ~900×1100:

- Loose ink-and-watercolor illustration of a ceramic mug of coffee, three-quarter angle, sitting on a barely-suggested saucer.
- Two or three delicate ribbons of steam curling upward, drawn with the same hand — organic, not symmetric, tapering to nothing.
- Palette drawn from the marketing surface: espresso `#8B7355`, deep ink `#3D3025`, warm cream `#FAF8F5` highlights, one whisper of `#C9B99A` in the shadow. No purple, no gradient, no photorealism.
- Feels like a New Yorker spot illustration — confident line, generous negative space, made by a human at the top of their craft.
- Transparent background so the steam breathes into the cream page.

Save to `src/assets/hero-coffee.png` (via `.asset.json` pointer if it's over the assets threshold). Import into `HomeFramework.tsx`.

Motion: fade + gentle 0.6s float on the cup (framer-motion, `y: [0, -4, 0]`, `repeat: Infinity`, `duration: 6`, `ease: "easeInOut"`). Steam gets a very slow opacity shimmer via a second SVG overlay or CSS `@keyframes` — subtle, respects `prefers-reduced-motion`.

## Copy softens (hero only)

- **Kicker** (stays small caps, espresso): `One focused morning · IGNITE Center at Greater Atlanta Christian School · Coffee's on us`
- **Headline** (serif, was "Start your business. Get your first paying customer in two weeks."):
  > Pull up a chair.  
  > Let's start your business — *together, over coffee.*
- **Deck paragraph** (was the "skip the fluff" line):
  > One quiet morning. A good cup of coffee. Someone who's done this before, sitting next to you while you actually build the thing. You'll leave with a real page, a real price, and your first customer already knowing your name.
- **Second paragraph** stays warm and plain:
  > For nurses, teachers, servers, coders, couples on Main Street — anyone who's been meaning to start something. Come sit with us. We'll figure it out together.
- **Price card sub** softens: "Just one morning. Come as you are." replaces "One-time. No subscription."
- **CTA** stays "Reserve your seat →" — already right.

Everything below the hero (Framework, HonestRoadmap, Facilitator, etc.) is untouched.

## Card + surface warming

- Right-column card: swap the sharp `border-[#C9B99A] bg-[#F0EBE3]` block for a softer treatment — `rounded-2xl bg-[#FBF7F1] border border-[#E4D9C4] shadow-[0_20px_60px_-30px_rgba(61,48,37,0.25)]`. Same content, gentler container.
- Section background gets a very faint radial wash behind the cup so the steam has somewhere to breathe: `radial-gradient(ellipse at 78% 30%, rgba(201,185,154,0.18), transparent 60%)` layered on the section.
- Masthead rule stays; italic tagline updates to `Pull up a chair`.

## Technical notes

Files touched:
- `src/components/home/HomeFramework.tsx` — rewrite the `Hero()` function only (~lines 59–183). No other functions in the file change.
- `src/assets/hero-coffee.png` (+ `.asset.json` if externalized) — new illustration.
- Optional: small `<style>`-less CSS addition in `src/styles.css` for the steam shimmer keyframe (scoped under `.marketing-surface .hero-steam`).

No route changes, no data changes, no chatbot changes.

## QA before handoff

1. View the rendered hero at 1386px and at 390px — cup must not clip the card or the headline on either.
2. Confirm the CTA button contrast still passes on the new softer card background.
3. Confirm `prefers-reduced-motion` disables both the float and the steam shimmer.
4. Confirm the illustration reads as hand-drawn, not AI-glossy — if it renders too polished, regenerate once with stronger "loose ink, uneven line weight, watercolor bleed" language.

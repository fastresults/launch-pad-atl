## What's wrong with the current composition

Looking at the screenshot against a 20-year editorial designer's eye:

1. **Cup is a floating orphan.** It hovers above the price card with a gap. No shared edge, no shared baseline, no frame — it looks pasted in.
2. **Columns don't share top or bottom baselines.** Left kicker starts higher than the cup's top. Left column ends at the second paragraph; right column keeps going through cup → card → "Designed for" list. The eye has nowhere to rest.
3. **"Designed for" list dangles.** It sits under the card with no counterpart on the left, so the right column tips heavy and the left tips empty.
4. **Headline is huge and left-column-only.** A 7xl serif with no visual counterweight next to it creates a lopsided page — the cup can't hold that weight from across a gap.
5. **Price is buried mid-card.** In award-winning editorial the number is a display element, not a stat inside a paragraph block.

## The recomposition

Move to a **9/3 asymmetric editorial layout on a shared grid** — the cup becomes a proper framed editorial illustration that anchors the masthead area, not a decoration on the price card.

```text
┌──────────────────────────────────────────────────────────────────┐
│ ISSUE No. 01 — THE PIVOT              Pull up a chair (italic)   │
│ ══════════════════════════════════════════════════════════════   │
│                                                                  │
│  ★ ONE FOCUSED MORNING · IGNITE CENTER · COFFEE'S ON US          │
│                                                                  │
│  Pull up a chair.                              ╭──────────╮      │
│  Let's start your business                     │   ~~~    │      │
│  — together, over coffee.                      │  ( ☕ )   │      │
│                                                │   \_/    │      │
│  One quiet morning. A good cup of coffee.      ╰──────────╯      │
│  Someone who's done this before, sitting                         │
│  next to you while you actually build the      $297              │
│  thing.                                        ─────              │
│                                                Just one morning. │
│  For nurses, teachers, servers, coders,        Come as you are.  │
│  couples on Main Street — anyone who's                           │
│  been meaning to start something.              [Reserve seat →]  │
│                                                Can't make it? ...│
│  Designed for:                                                   │
│  • Plan-B seekers  • Main Street operators                       │
│  • AI-displaced pros  • Couples building together                │
│                                                                  │
│ ──────────────────────────────────────────────────────────────   │
│ 01 live page   02 priced offer   03 first outreach sent          │
│ Thu Aug 20 · Norcross GA · 8:45–11:30 AM · 20 seats              │
└──────────────────────────────────────────────────────────────────┘
```

### The specific composition moves

**1. Cup becomes a framed editorial mark.** Circular or soft-rounded-square frame, ~260px, thin espresso hairline, cream fill, cup illustration centered inside. Sits **inline with the top of the headline** (not floating above the card). Same top baseline as the headline first line. Steam breathes into the frame's negative space, not the page. Feels intentional — like a New Yorker section mark, not a sticker.

**2. Grid switches to 9/3 on desktop.** Left column (`lg:col-span-9`) holds everything: kicker, headline, deck paragraph, secondary paragraph, "Designed for" as a compact horizontal 2×2 list. Right column (`lg:col-span-3`) is a single vertical stack: framed cup at top, price + CTA card below sharing the cup's left edge. Both columns snap to the **same top baseline** (kicker row) and **same bottom baseline** (above the promise strip).

**3. Price becomes a display element.** In the card, `$297` is set at the top as a large serif number with a rule under it — like a magazine dept header. The value prop and CTA follow. No more "One-time. No subscription." buried at the top.

**4. "Designed for" moves left, becomes horizontal.** Two columns of two items each, small caps kicker, inside the left column near the bottom. Balances the price card weight on the right and closes the left column with an intentional bottom edge.

**5. Headline scales back one notch.** From `text-7xl` to `text-6xl` on desktop (`lg:text-6xl` instead of `lg:text-7xl`), and drop the second-line break so the headline reads as three tight lines that don't sprawl the entire column width. This gives the cup room to sit beside it at the same optical weight.

**6. Card baseline aligns with the "Designed for" block on the left.** Bottom of the CTA card ≈ bottom of the "Designed for" list. That single alignment is what makes the whole thing snap into place.

**7. Promise strip (01/02/03) and event meta stay** — they already work as the horizontal foot rule that closes the section.

### Motion + illustration stay

The watercolor cup asset stays as-is (user loved it). Framer-motion float stays but is dialed down to `y: [0, -3, 0]` since the cup now lives inside a frame — subtle. Steam-shimmer via opacity keyframe on the whole cup at ~5% amplitude.

### Files touched

- `src/components/home/HomeFramework.tsx` — rewrite the `Hero()` function only. No other functions change. No new imports beyond what's already there.

No CSS changes required — everything uses existing Tailwind arbitrary values and the `.marketing-surface` token system.

## QA before handoff

1. Screenshot the hero at **1440px, 1024px, 768px, 390px**. Confirm:
   - At every breakpoint, the kicker row and the top of the cup frame share a baseline (±2px).
   - At every breakpoint, the "Designed for" block bottom and the CTA card bottom share a baseline (±8px).
2. At 390px, the cup frame stacks above the card as a centered element ≤ 220px wide. The headline drops to `text-5xl`.
3. Reduced motion disables the float.
4. CTA button contrast still passes.

## Also

**Resume the Lovable Cloud backend** (`supabase--resume`) — user asked in the same turn.

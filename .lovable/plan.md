## Goal

Position the workshop as **Atlanta's most founder-friendly accelerator** in the hero — visible immediately, backed by light proof points — without touching the headline, subhead, CTAs, or meta row.

## File

`src/components/home/HomeFramework.tsx` — `Hero()` component (lines 45–97). No other files change.

## Changes

### 1. Replace the single eyebrow pill with a two-pill row (line 55–57)

Before: one pill — `✨ Built for first-time founders · $497`

After: two pills sitting side-by-side, wrapping on mobile:

- Pill A (accent treatment, slightly stronger border + subtle gradient tint): `★ Atlanta's most founder-friendly accelerator`
- Pill B (current style, unchanged): `✨ Built for first-time founders · $497`

Same uppercase tracking, same height, same vertical position — just two chips instead of one. On mobile they stack; on `sm+` they sit in a row with a small gap.

### 2. Add a thin proof-point strip above the meta row (between line 87 and 88)

A single horizontal line of small, muted-white text with bullet separators — no boxes, no pills, just text so it reads as a quiet footnote, not a second CTA:

```
Atlanta-built · Founder-first · Coffee on us · No upsell in the room
```

Sits between the CTA buttons and the existing `Calendar · MapPin · Clock · Users` meta grid. Small text (`text-xs md:text-sm`), `text-white/70`, dot separators, wraps gracefully on mobile.

### Why this phrasing (not "#1")

"#1" implies a published ranking we'd have to cite. "Most founder-friendly" is a positioning claim — defensible, on-brand with the rest of the copy ("no upsell in the room", "coffee's on us", "built for first-time founders"), and reinforces the differentiator instead of making a numeric claim.

The proof strip avoids invented stats (no "200+ founders launched", no "4.9★") — it only restates things already true on the page.

## What is NOT changing

- Headline, subhead, "coffee's on us" paragraph — untouched
- Both CTA buttons — untouched
- Meta row (Calendar / MapPin / Clock / Users) — untouched
- Background image, overlay, spacing rhythm — untouched
- No new components, no new assets, no new dependencies

## Visual layout after change

```text
[★ Atlanta's most founder-friendly accelerator]  [✨ Built for first-time founders · $497]

The strategic foundation every startup needs —
built in one morning.

One morning. Twenty deliverables…
Coffee's on us…

[ Reserve a seat — $497 ]   [ See our services ]

Atlanta-built · Founder-first · Coffee on us · No upsell in the room

[📅 date]  [📍 city]  [⏰ time]  [👥 seats]
```

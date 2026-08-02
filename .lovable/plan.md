## Goal

Stop chasing cascade bugs. Enforce three hard rules at the shell level, in one place (`src/public.css`), so no page or component can drift:

1. Hero = full bleed, edge to edge, full viewport height.
2. Every other section on every public page = 20% margin left and right.
3. Everything on public pages (hero included) renders 25% smaller.

## How

### 1. One deterministic downscale switch

Add a single scale on the public shell rather than editing hundreds of font/spacing values:

```
.public-surface { zoom: 0.75; }
```

`zoom` scales fonts, padding, icons, borders, images, and Tailwind utilities uniformly — nothing can escape it, and it cannot drift per-breakpoint the way `text-7xl`/`clamp()` rules did. One number, one place.

Two follow-through fixes required because `zoom` changes how viewport units land:
- Hero height becomes `calc((100svh - header) / 0.75)` via a `--public-zoom: 0.75` variable so the hero still fills exactly one screen.
- Any `vw`-based width (gutters below) is divided by the same variable.

The sticky header sits inside the shell, so it scales with everything else — consistent with "all UI shrunk 25%".

### 2. Hero full bleed

`.sl-hero` gets `padding-inline: 0`, `width: 100%`, and keeps its background media at full width. Only the inner `.sl-hero__stack` keeps a small safety inset so text never touches the edge. Hero is explicitly exempted from the 20% gutter rule.

### 3. 20% side margins on all non-hero content

Set the shell gutter to a percentage of viewport instead of fixed rem:

```
--public-gutter: calc(20vw / var(--public-zoom));   /* ≥ 768px */
```

Then apply it once, globally, to every non-hero section on the public shell, and neutralize the ad-hoc containers that currently fight it (`mx-auto max-w-6xl/7xl/4xl px-6` scattered through `HomeFramework`, `services`, `build`, `webinar`, `one-on-one`, `schedule`, `contact`, `facilitator`, `private-tuesday`, `privacy`, `terms`, `build.$slug`, plus the landing/register frameworks):

- `.public-surface section:not(.sl-hero)` → `padding-inline: var(--public-gutter)`
- `.public-surface :is(section, footer):not(.sl-hero) [class*="max-w-"]` → `max-width: 100%` so inner containers stop imposing their own narrower column and double-padding.
- Inner `px-6` wrappers get their horizontal padding zeroed inside the shell.

Small screens: 20% each side leaves only 60% of a phone for text, which is unreadable. The gutter tapers below 768px (8% mobile, 12% tablet) and locks to the requested 20% from 768px up. Say the word if you want a literal 20% on phones too.

### 4. Proof, not assertion

Update `scripts/public-parity.py` to measure, on localhost + preview + `startuplabs.online`, at 1024 / 1280 / 1400 / 1920 CSS px:
- hero section width == viewport width (full bleed),
- non-hero section content box left edge == 20% of viewport (±2px) at ≥768px,
- H1 and body computed font-size == exactly 0.75× current values.

The build is only reported as done when those assertions pass against the published origin, not just the preview.

## Technical notes

- Files touched: `src/public.css` (all structural rules), `scripts/public-parity.py` (gate). Route files only get edits where a hardcoded container refuses to yield to the shell rule.
- `zoom` is supported in current Chrome, Safari, Edge, and Firefox 126+. Older Firefox degrades to normal size rather than breaking layout; a `@supports` fallback applies a `transform: scale` variant only if needed.
- No changes to copy, content, or backend.

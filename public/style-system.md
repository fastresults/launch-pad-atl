# Master Style System

A portable visual language you can apply to any other Lovable project. Dark-first, one electric-violet accent, an orange → magenta → violet brand gradient, glass surfaces, glow instead of drop shadow, Outfit + DM Sans.

Companion file: **`/style-system.css`** — the drop-in stylesheet with every token, utility and keyframe (Tailwind v4, with a v3 fallback section at the bottom).

**How to use this doc:** open the other Lovable project and paste this whole file into chat with: *"Apply this style system to my app — replace my tokens with these, wire the fonts, and swap any hardcoded colour utilities for the semantic tokens."*

---

## 1. Design principles

1. **Dark-first.** The default theme is near-black violet-tinted. Light mode exists as an opt-in `.light` class on `<html>`, and every token has a light counterpart. Never ship a section styled for one theme only.
2. **One electric accent.** Electric violet (`--primary`) carries interaction. Nothing else competes.
3. **Gradient is a garnish, not a wallpaper.** The brand gradient appears on the hero, on primary CTAs, and on a few headline words. It never fills a page or a card grid.
4. **Glass over flat.** Panels sit on the page with 4% white fill, a 10% white hairline, and a blur — not with a solid grey block.
5. **Elevation is light, not shadow.** Depth comes from the glow shadows and a hairline ring, not from a soft grey drop shadow.
6. **Foreground travels with its surface.** Anything that changes its background must also set its foreground, muted-foreground and border. No element inherits text colour across a surface boundary.
7. **Motion is subtle and reducible.** Slow drift, marquee, one attract pulse — all disabled under `prefers-reduced-motion`.

---

## 2. Colour tokens

Values are OKLCH. Dark is `:root`; light is `:root.light`.

| Token | Dark | Light |
| --- | --- | --- |
| `--background` | `oklch(0.14 0.02 280)` | `oklch(0.99 0 0)` |
| `--foreground` | `oklch(0.98 0 0)` | `oklch(0.18 0.02 280)` |
| `--card` | `oklch(0.18 0.025 280)` | `oklch(1 0 0)` |
| `--card-foreground` | `oklch(0.98 0 0)` | `oklch(0.18 0.02 280)` |
| `--popover` | `oklch(0.18 0.025 280)` | `oklch(1 0 0)` |
| `--popover-foreground` | `oklch(0.98 0 0)` | `oklch(0.18 0.02 280)` |
| `--primary` | `oklch(0.68 0.28 290)` | `oklch(0.58 0.28 290)` |
| `--primary-foreground` | `oklch(0.99 0 0)` | `oklch(0.99 0 0)` |
| `--secondary` | `oklch(0.24 0.03 280)` | `oklch(0.96 0.01 280)` |
| `--secondary-foreground` | `oklch(0.98 0 0)` | `oklch(0.18 0.02 280)` |
| `--muted` | `oklch(0.24 0.03 280)` | `oklch(0.96 0.01 280)` |
| `--muted-foreground` | `oklch(0.72 0.02 270)` | `oklch(0.45 0.02 270)` |
| `--accent` | `oklch(0.28 0.04 290)` | `oklch(0.94 0.02 290)` |
| `--accent-foreground` | `oklch(0.98 0 0)` | `oklch(0.18 0.02 280)` |
| `--destructive` | `oklch(0.65 0.22 25)` | `oklch(0.55 0.22 25)` |
| `--destructive-foreground` | `oklch(0.98 0 0)` | `oklch(0.99 0 0)` |
| `--border` | `oklch(1 0 0 / 10%)` | `oklch(0.18 0.02 280 / 12%)` |
| `--input` | `oklch(1 0 0 / 12%)` | `oklch(0.18 0.02 280 / 15%)` |
| `--ring` | `oklch(0.68 0.28 290)` | `oklch(0.58 0.28 290)` |

**Radius:** `--radius: 0.75rem`, with `sm/md/lg/xl/2xl/3xl` derived from it.

### Brand gradient stops

| Token | Value |
| --- | --- |
| `--brand-orange` | `oklch(0.72 0.21 45)` |
| `--brand-magenta` | `oklch(0.62 0.27 350)` |
| `--brand-violet` | `oklch(0.55 0.27 295)` |

### Status colours (identical hue family in both themes, darkened for light)

| Token | Dark | Light |
| --- | --- | --- |
| `--status-success` | `oklch(0.76 0.17 155)` | `oklch(0.42 0.14 155)` |
| `--status-warning` | `oklch(0.82 0.16 80)` | `oklch(0.48 0.13 70)` |
| `--status-danger` | `oklch(0.72 0.2 25)` | `oklch(0.48 0.18 25)` |
| `--status-info` | `oklch(0.76 0.15 230)` | `oklch(0.44 0.16 245)` |
| `--status-tip` | `oklch(0.76 0.16 310)` | `oklch(0.46 0.16 310)` |

### Composites

```css
--gradient-hero: linear-gradient(115deg, #d8941e 0%, #c040a0 48%, #6c92d4 100%);
--gradient-text: linear-gradient(90deg,
  oklch(0.78 0.18 55), oklch(0.72 0.28 350), oklch(0.68 0.28 290));
--glow-primary: 0 0 28px oklch(0.68 0.28 290 / .5), 0 0 8px oklch(0.68 0.28 290 / .35), 0 2px 16px oklch(0 0 0 / .4);
--glow-hero:    0 0 28px oklch(0.62 0.27 350 / .45), 0 0 8px oklch(0.72 0.21 45 / .3), 0 2px 16px oklch(0 0 0 / .4);
```

---

## 3. Typography

Add to `index.html` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

- **Outfit** — display, headings, numerals in stat blocks, buttons. Weights 500–700.
- **DM Sans** — body, UI labels, form text. Weights 300–500.
- Heading tracking: `-0.04em` on h1/display, `-0.03em` on h2–h4, normal on body.
- Body line-height 1.6; display line-height 1.0–1.1.
- **Kicker / eyebrow:** Outfit, uppercase, `0.75rem`, `letter-spacing: 0.18em`, `--muted-foreground`. Use the `.kicker` class.
- Long-form scale (for slide/poster contexts): title-lg 104 / title 88 / subtitle 52 / body-lg 40 / body 32 / caption 24 / kicker 22.

---

## 4. Utility catalogue

| Class | Use it for | Never |
| --- | --- | --- |
| `bg-hero-gradient` | Hero band, one feature CTA band per page | Card backgrounds, whole sections repeated |
| `text-gradient-brand` | 1–3 words inside a headline | Body copy, small text under 20px |
| `btn-glow` | Primary CTA on `bg-primary` | Secondary/ghost buttons |
| `btn-glow-hero` | Primary CTA sitting on the hero gradient | Anything on a light card |
| `glass-card` | Standard lifted card on a dark ground | On light theme without a dark scope |
| `glass-card-tinted` | The one featured card in a set (violet edge) | More than one card per group |
| `glass-panel` | Large cinematic panels, modal frames | Small chips |
| `gradient-ring` | 1.5px gradient border wrapper | Full-fill backgrounds |
| `glow-ring` | Focus/feature emphasis ring | Every card |
| `hero-haze` | Blurred colour bloom behind hero art | Over text |
| `scene-fade` | Mask an image into the page bottom | Text blocks |
| `scene-drift` | Slow 14s scale on hero imagery | Interactive elements |
| `animate-marquee-left/right` | Logo and testimonial ribbons | Anything clickable-critical |
| `animate-attract-pulse` | One onboarding "click me" hint at a time | Errors or persistent state |
| `theme-dark-scope` | Force a subtree (and its portalled dialogs) to stay dark | Whole app |

---

## 5. Component conventions

- **shadcn/ui, "new-york" style**, slate base, CSS variables on, lucide icons.
- **Buttons:** pill (`rounded-full`) for marketing CTAs, `rounded-lg` for app chrome. Primary = `bg-primary text-primary-foreground btn-glow`. Secondary = `glass-card` + `text-foreground`. Ghost = transparent, `text-muted-foreground`, hover to `text-foreground`.
- **Cards:** `rounded-xl`, 1px hairline border at `--border`, `glass-card` on dark grounds, `bg-card` on light.
- **Inputs:** `bg-input` fill, `--border` hairline, focus ring `--ring` at 2px offset.
- **Badges/chips:** `rounded-full`, `text-xs`, status token as text colour over a 12% `color-mix` of the same token.
- **Sections:** vertical rhythm `py-20` desktop / `py-12` mobile; content max width `max-w-6xl`.
- **Modals:** `glass-panel` frame, cap height at `min(86vh, 760px)` desktop / `92vh` mobile so sticky action bars survive.
- **Reduced motion:** every animation defined here already opts out; keep it that way.

---

## 6. Hard rules

- Never write `text-white`, `bg-black`, `text-black`, `bg-[#hex]` or a bare hex in a component. Tokens only.
- Every background change also sets foreground, muted-foreground and border.
- Every token defined for dark has a light counterpart, and vice versa.
- Surface/foreground pairs meet 4.5:1 (3:1 for large display type and muted text).
- Tables declare header row, label column, value cells, borders and zebra rows separately — the label column is what usually fails.
- One gradient element per viewport. One tinted glass card per group. One attract pulse at a time.

---

## 7. Porting steps

1. Copy `/style-system.css` into the target project's `src/styles.css` (Tailwind v4) or `src/index.css` (v3), keeping the existing `@import "tailwindcss"` at the top. For v3, follow the fallback section at the bottom of that file and extend `tailwind.config.ts` with the supplied colour/radius/font mapping.
2. Add the Google Fonts link tags to `index.html`.
3. If the target theme-toggles, make sure light mode is the `.light` class on `<html>` (this system is dark-by-default, inverted from the usual `.dark` convention). Alternatively rename `:root` → `.dark` and `:root.light` → `:root` if you prefer light-default.
4. Grep the components for `text-white`, `bg-black`, `bg-white`, `text-gray-`, `bg-slate-`, `#` hex values and replace with semantic tokens.
5. Apply `bg-hero-gradient` to the hero, `text-gradient-brand` to the headline's key words, and `btn-glow` to the primary CTA.
6. Convert card wrappers to `glass-card`, and the single featured one to `glass-card-tinted`.

### Verify checklist

- [ ] Toggle light/dark — no invisible text, no section that only works in one theme.
- [ ] Focus rings visible on every interactive element.
- [ ] Body text contrast ≥ 4.5:1 on its actual surface (not the page).
- [ ] Only one gradient surface per viewport.
- [ ] `prefers-reduced-motion: reduce` stills all animation.
- [ ] Fonts loading (Outfit on headings, DM Sans on body) — no fallback flash of system sans.

# Master Style System (portable)

Package this site's visual language into two files you can drop into any other Lovable project so it inherits the same look: electric-violet on near-black, orange→magenta→violet brand gradient, glass panels, glow CTAs, DM Sans + Outfit.

## What gets created

1. **`public/style-system.md`** — the human/agent-readable spec. One prompt-ready document: paste it into another Lovable project and say "apply this style system."
   - Design principles (dark-first, one electric accent, glass over flat, gradient reserved for hero/CTA/headline accents).
   - Full token table with exact OKLCH values for dark (`:root`) and light (`:root.light`): background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, radius `0.75rem`.
   - Extended tokens: brand gradient stops (orange / magenta / violet), status colors (success, warning, danger, info, tip), `--gradient-hero`, `--gradient-text`, `--glow-primary`, `--glow-hero`.
   - Typography: Outfit for display/headings, DM Sans for body, with the Google Fonts link tag, weight ramp, and heading tracking rules (`-0.04em` display, `0.18em` uppercase kickers).
   - Utility catalogue with usage rules: `bg-hero-gradient`, `text-gradient-brand`, `btn-glow`, `btn-glow-hero`, `glass-card`, `glass-card-tinted`, `glass-panel`, `glow-ring`, `scene-fade`, `scene-drift`, marquee and attract-pulse animations.
   - Component conventions: shadcn new-york, pill CTAs, 1px hairline borders at 10–12% white, elevation via glow not drop shadow, reduced-motion rules.
   - Hard rules: never `text-white` / `bg-black` / hex in components; foreground always travels with its surface; every light token has a dark counterpart.

2. **`public/style-system.css`** — copy-paste drop-in stylesheet containing the token blocks, the `@theme inline` color aliases, base layer, all shared utilities, the `.theme-dark-scope` scoped-dark block, and the keyframes. Written for Tailwind v4 (this project's setup) with a clearly marked **Tailwind v3 fallback section** at the bottom: the same tokens as HSL-safe `:root` variables plus the `tailwind.config.ts` `extend.colors` mapping, since many Lovable projects are still v3 with `index.css`.

## Porting instructions (inside the markdown)

Step-by-step: add the fonts link to `index.html` → replace the target project's `index.css` / `styles.css` token block → map shadcn semantic names → swap hardcoded color utilities for tokens → apply `bg-hero-gradient` + `text-gradient-brand` on the hero and `btn-glow` on primary CTAs. Includes a short "verify" checklist (light/dark parity, contrast, reduced motion).

## Notes

- Documentation and CSS assets only — no existing component, route, or backend code is touched.
- Values are copied verbatim from `src/styles.css` so the ported system is an exact match, not an approximation.

## Two fixes

### 1. White text on the espresso (#8B7355) hero background

The `.marketing-surface .bg-hero-gradient` override already sets `color: #FAF8F5` and uses `* { color: inherit }`, but Tailwind utility classes on descendants (`text-foreground`, `text-muted-foreground`, `text-primary`, `text-[#8B7355]`, etc.) win on specificity, so headline + body copy still render dark brown on brown (see screenshot).

**Change in `src/styles.css`** — extend the hero override so every text token resolves to cream/white when it sits on the espresso block:

```css
.marketing-surface .bg-hero-gradient,
.marketing-surface .bg-hero-gradient * {
  color: #FAF8F5 !important;
}
.marketing-surface .bg-hero-gradient .text-gradient-brand,
.marketing-surface .bg-hero-gradient [class*="text-[#8B7355]"],
.marketing-surface .bg-hero-gradient [class*="text-primary"],
.marketing-surface .bg-hero-gradient [class*="text-muted"],
.marketing-surface .bg-hero-gradient [class*="text-foreground"] {
  color: #FAF8F5 !important;
  -webkit-text-fill-color: #FAF8F5 !important;
  background: none !important;
}
/* Keep CTA buttons readable: cream button = espresso label, outline button = cream label */
.marketing-surface .bg-hero-gradient .bg-white,
.marketing-surface .bg-hero-gradient [class*="bg-[#FAF8F5]"],
.marketing-surface .bg-hero-gradient [class*="bg-[#F"] {
  color: #3D3025 !important;
}
.marketing-surface .bg-hero-gradient .bg-white *,
.marketing-surface .bg-hero-gradient [class*="bg-[#FAF8F5]"] * {
  color: #3D3025 !important;
}
```

Scope stays inside `.marketing-surface .bg-hero-gradient` so authenticated dashboard hero variants are untouched.

### 2. All modals adopt the site-wide marketing style

Dialogs render through a Portal, so they escape the `.marketing-surface` wrapper and fall back to the dark app theme (see the purple "Three ways to do this with us" modal). Fix in two moves:

**a. `src/components/ui/dialog.tsx`** — add `marketing-surface` to `DialogContent`'s className so every dialog inherits cream bg, espresso text, serif titles, square-ish corners, and the tan border tokens already defined for the marketing theme.

**b. `src/components/home/AccessModeDialog.tsx`** — strip the leftover dark-mode ornaments now that it renders in the cream theme:
- Drop `hover:bg-primary/5` shimmer (reads muddy on cream).
- Change "Done for you" pill from `border-primary/40 bg-primary/10 text-primary` to the site's existing tan pill: `border-[#C9B99A] bg-[#F0EBE3] text-[#3D3025]`.
- Title uses `font-serif` (matches DM Serif Display H1s elsewhere).
- Card border becomes `border-[#E4D9C4]`, selected/featured card `border-[#8B7355]`.

Also audit the other in-marketing dialogs (`FounderRoadmapDialog`, `DaySprintDeckDialog`, `DeckDialog`, `AssetPreviewDialog`, `RegenerateAssetDialog`, `FilePreviewDialog`) — since they mount inside authenticated dashboard flows, they keep the dark theme automatically because `marketing-surface` on `DialogContent` only activates the cream tokens *when the trigger is on a marketing route*. To keep dashboard dialogs dark, gate the class: read `useLocation()` in `DialogContent` and add `marketing-surface` only when `pathname` is one of the marketing routes (`/`, `/build`, `/services`, `/schedule`, `/contact`, `/facilitator`, `/one-on-one`, `/webinar`, `/register`, `/privacy`, `/terms`, `/build/:slug`).

### Verification

Playwright pass after build:
- `/` → open "Ways to work" modal → screenshot, confirm cream bg + espresso text + serif title.
- `/services` hero → screenshot, confirm headline + subhead + button labels are cream on espresso.
- `/dashboard` → open a dialog (e.g., FounderRoadmap) → screenshot, confirm it stays dark (no regression).

### Out of scope

No copy changes, no layout changes, no new components.

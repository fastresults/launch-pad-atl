# Fix the Brand Wizard modal in dark mode

## What's actually wrong

The Brand Wizard dialog is force-dark: `DialogContent` carries `theme-dark-scope` (BrandWizard.tsx line 84), so every token inside it — `foreground`, `muted-foreground`, `muted`, `border`, `card` — resolves to its dark value.

Inside that dark shell, the style-guide preview (`VisualBrandGuide.tsx`) renders a **light paper document**: the article background comes from the venture palette (`colors.bg`, typically near-white) and its cards are hardcoded `bg-white` with inline `color: #111827`, plus panes tinted `rgba(255,255,255,0.62)`.

Those two systems collide. On the white cards the text still uses dark-mode tokens:

- swatch metadata, typeface labels, fallbacks, logo captions → `text-muted-foreground` (light grey on white)
- the Brand Narrative block renders `RichMarkdown`, whose paragraphs, lists, tables, code and rules are all `text-foreground/85`, `bg-muted`, `border-border` — near-white ink on a white card
- the voice meter track is `bg-slate-200`, invisible against the white card

That is the low-contrast, half-missing content in the screenshot. Nothing is failing to load — it is rendering white-on-white.

## The fix

**Add a `.theme-light-scope` to `src/styles.css`**, the mirror of the existing `.theme-dark-scope`: it re-declares the light token values (background, foreground, card, muted, muted-foreground, border, input, ring, primary/secondary/accent pairs) and sets `color-scheme: light`. Any subtree that intentionally renders as printed paper opts in and every descendant — including shadcn parts and RichMarkdown — inherits correct light-mode contrast automatically.

**Apply it to the paper document.** In `VisualBrandGuide.tsx`, put `theme-light-scope` on the `<article>` that carries `pageStyle`. Then clean the subtree so it uses tokens instead of hardcoded values:

- drop the inline `color: "#111827"` and `borderColor: "rgba(0,0,0,0.12)"` repeats in favour of `border-border` / inherited foreground
- replace `bg-white` card surfaces with `bg-card`, and the `rgba(255,255,255,0.62)` section tints with a token-based overlay
- replace `bg-slate-200` on the voice meter with `bg-muted`
- keep the logo/moodboard plates white on purpose (artwork sits on white), but let their chrome follow tokens

**Sweep the rest of the modal for the same collision.** Check the other panes that live inside the dark dialog — the header/rail in `BrandWizard.tsx` (`bg-white` logo chip at line 1055), `LiveBrandPreview.tsx`, `Step1TrackPicker.tsx`, `ExistingBrandIntake.tsx` — and fix any place where a fixed light surface hosts token-coloured text, or a token-coloured surface hosts fixed dark text.

## Verification

Open the wizard at both app themes, walk all five steps to the locked style guide, and confirm: swatch hex/Pantone lines, both typeface cards, voice meters, and the Brand Narrative markdown (headings, body, tables) are all fully legible, and the surrounding wizard chrome stays dark.

## Technical notes

- Files: `src/styles.css` (new `.theme-light-scope` block), `src/components/hub/brand-wizard/VisualBrandGuide.tsx` (scope + token cleanup), with small token corrections in `BrandWizard.tsx` and the other wizard panes as the sweep turns them up.
- Presentation only — no brand-kit data, generation, or edge-function changes.

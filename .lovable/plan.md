# Brand Wizard — Stop auto-regenerating + live style-guide preview below

## Two problems

1. **Tabs auto-regenerate.** `StepPalette` and `StepTypography` call `gen.mutate()` on mount whenever `options.length === 0`. Because we never persist the generated option arrays, revisiting either step always fires a fresh AI call, replaces the option set, and the user's earlier selection (still saved in `kit.palette` / `kit.typography`) no longer matches any visible card — looks "lost."
2. **No live preview.** The brand style guide only renders after Step 5 "Generate brand style guide." The user has no sense of what they're building as they go.

## Fix plan

### A) Persist option sets; never auto-regenerate

- Save generated options into the kit alongside selections. Reuse the existing `dna` jsonb (no schema change): write `dna._paletteOptions` and `dna._typographyOptions` in each step's `gen.onSuccess`.
- On step mount, hydrate `options` from `kit.dna._paletteOptions` / `_typographyOptions`. Only call the AI when the array is genuinely empty (first visit) OR when the user clicks the explicit "Show new options" button.
- If `kit.palette` (or `kit.typography`) exists but isn't in the option set (older saves), inject it at the top of the rendered grid so it's always visible and highlighted as "Selected."
- Rename the regenerate button to "Show new options" with a tooltip clarifying the current pick is kept until a new one is chosen. Do not clear `chosen` on regenerate.
- Add a "Your current pick" summary card above the grid on both steps (swatches + font preview) so the saved state is unambiguous even if AI returns variants with new names.

### B) Live style-guide preview pane below the wizard

Restructure the dialog to a **two-pane layout** on wide screens (≥`lg`):

```
+----------------------------------+--------------------------+
| Wizard steps (left, scrollable)  | Live Brand Preview       |
| Step 1..5 UI                     | (right, sticky)          |
+----------------------------------+--------------------------+
```

On `md` and below, the preview stacks below the wizard.

The preview renders **purely from `kit` state** — no AI call, no DB write of guide markdown until Step 5 "Generate brand style guide" is pressed. Sections fill in progressively:

1. **Header band** — `snap.company_name`, tagline, locked palette `bg`/`fg`. Greyed placeholder until palette chosen.
2. **Personality** — chips from `kit.dna.mood` and a small bar chart from `kit.dna.personality`. Fills after Step 1.
3. **Color system** — 6 swatches (bg/fg/muted/accent/primary/secondary) with hex labels and computed AA contrast on each pair. Fills after Step 2.
4. **Typography** — H1/H2/Body/Caption specimen rendered in the locked Google fonts (already loaded via `loadGoogleFont`), with weight + line-height shown. Fills after Step 3.
5. **Moodboard & Logo** — 2×2 thumbnail grid from `kit.moodboard` and a highlighted primary logo from `kit.logos[0]`. Fills as user generates/picks in Step 4.
6. **Voice** — 4 sliders rendered as filled bars from `kit.voice.attributes` plus the rules paragraph. Fills as user adjusts in Step 5.
7. **Locked guide indicator** — green "Style Guide locked — N words" pill when `kit.guide_markdown` exists, with a "View full guide" button that opens the rendered markdown in a sheet.

Every step's `onSave` already writes to the kit; React Query invalidation refreshes the preview pane immediately. No additional persistence layer needed.

Add a small "Auto-saved" inline indicator at the top of the preview pane (shows last save time from `kit.updated_at`).

### C) Step 5 unchanged in role

Step 5 stays the place where the long-form Markdown guide is generated and saved (`kit.guide_markdown`). The live preview is the *visual* style guide; the markdown is the *document*. Both reflect the same kit state.

## Files touched

- `src/components/hub/brand-wizard/BrandWizard.tsx`
  - New two-pane layout in `DialogContent` (left = stepper + step body, right = `<LiveBrandPreview kit={kit} snapshot={snapshot} />`). Widen dialog to `max-w-7xl`.
  - `StepPalette` / `StepTypography`: hydrate from `kit.dna._paletteOptions` / `_typographyOptions`; remove auto-`gen.mutate()`; persist options on success; add "Your current pick" header card and "Show new options" CTA.
- `src/components/hub/brand-wizard/LiveBrandPreview.tsx` — **new file**, pure render from `kit`. No data fetching.
- No DB migration. No edge function change. No new dependencies.

## Acceptance

1. Switching to Palette or Typography after a selection shows the previously saved card highlighted and the option set unchanged — no AI request fires.
2. "Show new options" still works on demand and never clears the current pick.
3. The right-hand preview panel updates within the same render cycle every time a slider moves, a palette/font is picked, a logo is chosen, or voice changes — visible without leaving any step.
4. Final "Generate brand style guide" still writes the full markdown and is reflected with the locked-guide pill in the preview.

## Out of scope

- No new colors or fonts beyond what the existing AI options return.
- No persistence schema changes; `dna` jsonb absorbs `_paletteOptions` / `_typographyOptions`.
- No change to BrandStudio entry card, DOCX export, or moodboard/logo plan you already approved separately.

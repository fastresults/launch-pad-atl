# Agency-Grade Logo Generation Overhaul

## Why the current output falls short
- Single short prompt: "minimalist vector logo, centered, crisp edges" + venture context. No design thinking, no construction system, no typographic intent, no symbol rationale.
- All 4 variants share the same prompt → 4 near-identical results.
- Reference logos are passed raw with no instruction on *what* to learn from them (proportion? counterform? geometry? wordmark style?).
- No brand archetype, no logo-type taxonomy (wordmark vs. lettermark vs. monogram vs. pictorial mark vs. emblem vs. combination), no grid/construction system, no negative-space strategy.
- Asks an image model to "design"; image models render — they need an art director's brief.

## New approach: Creative Director → Designer pipeline

### Stage 1 — AI Creative Director (chat model)
Before any pixels, run one Lovable AI call (`google/gemini-3-flash-preview`, structured output) that takes the full venture context + brand DNA + reference logos (multimodal) and returns a **logo design brief** with 4 distinct *directions*. Each direction includes:

- `direction_name` (e.g. "Geometric Monogram", "Organic Wordmark")
- `logo_type` — one of: wordmark, lettermark, monogram, pictorial mark, abstract mark, emblem, combination mark
- `symbol_concept` — the metaphor/idea the mark embodies (max 2 sentences, grounded in venture differentiation)
- `construction_notes` — geometry (circle/grid base), stroke weight, corner treatment, counterforms, optical balance
- `typography_treatment` — if wordmark/combination: letter-spacing, case, custom ligatures, weight pairing with the wizard's chosen typeface
- `negative_space_play` — explicit hidden-shape opportunities or "none"
- `color_application` — which palette token leads, mono/duotone strategy
- `reference_learning` — 1 sentence each on what to borrow from each uploaded inspiration (proportion, weight, mark style — *never* copy)
- `avoid_list` — direction-specific anti-patterns (e.g. "no gradient swooshes", "no globe", "no generic leaf")

This is the missing layer. It forces design reasoning before rendering.

### Stage 2 — Image renderer with full art-director brief
For each of the 4 directions, build a long, structured image prompt and call `google/gemini-3-pro-image` (upgrade from flash-image for logo quality) with the reference logos attached multimodally. Prompt template:

```
LOGO DESIGN BRIEF — [direction_name]
Brand: {company}. Category: {industry}. Audience: {audience}.
Idea: {symbol_concept}
Type: {logo_type}.
Construction: {construction_notes}. Built on a clean geometric grid, optically balanced, vector-precise.
Typography: {typography_treatment}.
Negative space: {negative_space_play}.
Color: {color_application} from palette {hex codes}.
Reference study (do NOT copy): {reference_learning}.
Output: single centered logo on pure white #FFFFFF background, no mockup, no shadow, no 3D, no photo texture, no watermark, no UI chrome, no tagline unless specified. Print-ready, scalable, monochrome-safe silhouette.
Avoid: {avoid_list} + stock clichés, gradients-as-crutch, swooshes, generic AI flourishes, lens flares, drop shadows.
```

Generate one render per direction (not 4 of the same prompt). Optional: a second pass per direction at `1024x1024` monochrome for silhouette validation.

### Stage 3 — Per-logo rationale in UI
Save `direction_name` + `symbol_concept` alongside each generated asset so the wizard's logo grid shows each option with its name and one-line rationale — the way an agency presents concepts to a client. User picks based on *idea*, not just aesthetics.

## Backend changes
- New edge function `venture-logo-director` (or new mode inside `venture-brand-assets` keyed by `kind: "logo"`) that:
  1. Calls chat model with structured output → 4 design directions.
  2. Renders each direction sequentially via `google/gemini-3-pro-image` with reference images.
  3. Persists each result to `venture_brand_kits.logos` with `{ url, path, direction_name, logo_type, symbol_concept, prompt }`.
- Update `KIND_PRESETS.logo` and remove the single static `sceneHint`.
- Keep moodboard/social flows untouched.

## Frontend changes (`StepMoodboard` + `LiveBrandPreview`)
- Logo grid cards show: thumbnail, `direction_name` badge, `logo_type` chip, 1-line `symbol_concept`.
- "Regenerate this direction" button per card (re-renders only that direction, preserves the other 3).
- "New direction set" button regenerates the whole brief (rare, costly).
- Live preview's logo slot uses the selected direction's rationale as alt text and tooltip.

## Data
Extend each `logos[]` entry in `venture_brand_kits.logos` jsonb:
```
{ url, path, direction_name, logo_type, symbol_concept, prompt, created_at }
```
Backwards compatible — existing entries without these fields still render.

## Out of scope (call out, don't build now)
- True SVG output (image models still raster; mention vectorization as a follow-up via a separate "Vectorize winner" action using a tracing service).
- Full lockup system (horizontal/stacked/icon-only variants) — propose as next phase after the user picks a winner.

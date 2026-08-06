# Logo quality overhaul — from "AI shapes" to designed identity

Not stuck — the pipeline is stable now (runs, ledger, retries all work). The problem is that the *output ceiling* is too low. Here is what is actually capping quality, verified in `supabase/functions/venture-brand-assets/index.ts`:

1. **The drawing pass is starved of context.** `developVectorSpec` receives only the direction JSON, the core idea and colour tokens — not the strategy brief in full, not the brand documents, not the audience or the "never look like" list. All that research is done in stage 1 and then thrown away before the mark is drawn.
2. **The geometry system is too poor to draw a real mark.** Only 5 primitives, only rect/circle/line/path, no arcs, no groups, no transforms, no even-odd fill (so no true counterforms or negative-space play), no construction grid. Fortune 500 marks are built from arcs, mirrored modules and consistent stroke weights — none of that is expressible today.
3. **Wordmarks are set in Arial.** `renderVectorSvg` hardcodes `font-family="Arial, Helvetica"` with a crude size formula. That alone makes every wordmark read as a placeholder.
4. **Nothing looks at the finished artwork.** There is a vision critique function, but the vector path only critiques the *spec*, never the rendered mark. No geometric lint either — off-grid coordinates, mixed stroke weights and off-centre marks ship as-is.
5. **The thinking passes run on flash models.** Concepting and drawing both use `gemini-3.6-flash` — fast, but not the judgment tier this task needs.

## What we will change

### 1. One brand dossier, carried through every pass
Build the dossier once per run (venture facts, strategy brief, the strongest brand documents, palette/type tokens, audience, not-list) and pass it into concepting **and** drawing **and** critique. The drawing pass stops being a blind translator.

### 2. A real geometry system
Extend the vector spec so a designer-grade mark is actually expressible:
- up to 12 primitives, plus `group` with `transform` (translate / rotate / scale / mirror) so modular and rotationally symmetric marks are possible
- arc (`A`) and smooth-curve (`S`) path commands, added to the path sanitiser
- `fill-rule="evenodd"` for counterforms and negative-space ideas
- a required **construction contract**: one module unit, one stroke weight, a fixed radius set, everything aligned to the module grid

Then enforce it deterministically after generation: snap coordinates to the module grid, collapse stroke weights to the single declared value, and optically centre the mark in the canvas. The model proposes; the renderer disciplines.

### 3. Real typography instead of Arial
Fetch the venture's actual heading font (Google Fonts TTF) inside the function, convert the wordmark to vector outlines with `opentype.js`, and apply the direction's tracking/case/weight. The output becomes a genuine typographic wordmark with no font dependency at display time. Fallback is a curated geometric sans we ship — never Arial.

### 4. Rewrite the prompts as engineering briefs
- Strategy and concepting move to `openai/gpt-5.5` with `google/gemini-3.1-pro-preview` as fallback (flash stays as last resort so nothing breaks).
- The drawing prompt stops being descriptive prose and becomes a spec sheet: module grid, unit size, stroke weight, radius family, symmetry axis, counterform, optical corrections, x-height relationship between mark and wordmark, clear space.
- Concepting gets a hard anti-cliché gate tied to the venture's own not-list, and must state the *one* geometric operation that creates the mark.

### 5. Actually look at the result
- **Deterministic lint** on every rendered SVG: element count, stroke-weight variance, off-grid coordinates, bounding-box coverage and optical centring, ink density, and a 16px silhouette proxy.
- **Vision critique** on the rasterised SVG (render with `resvg-wasm`, then send the PNG to the vision critique that already exists).
- Failures produce one targeted revision pass with the exact lint findings and critique note. Still bounded by the existing attempt limits and lease system, so timeouts and stalls stay solved.

### 6. Deliver a lockup, not a single square
Each approved direction publishes: the mark, a horizontal lockup, a stacked lockup, and monochrome + knockout variants, plus clear-space and minimum-size rules. That's the difference between "a logo image" and an identity a founder can use.

## Technical notes

- Files: `supabase/functions/venture-brand-assets/index.ts` (strategy, concepting, vector spec, renderer, critique), plus new `_shared/logo-geometry.ts` (grid snapping + lint) and `_shared/logo-type.ts` (font fetch + outline conversion).
- New deps via `npm:` specifiers: `opentype.js`, `@resvg/resvg-wasm`.
- No schema change required — the existing `brand_logo_runs` / `brand_logo_directions` ledger already stores strategy, concept, asset, review score and note. Lint results ride along in `review_score`.
- Timeout safety is unchanged: each invocation still performs exactly one expensive step, leases and the watchdog stay in place. The added work (font outlining, lint, raster) is local and fast; only the vision critique is a network call, and it keeps the existing deadline guard.
- `BrandWizard.tsx` gains variant display for the new lockups; the polling/round logic is untouched.

## Phasing

1. Dossier plumbing + model upgrade for the thinking passes.
2. Geometry system + deterministic grid/stroke discipline.
3. Real typographic wordmarks.
4. Lint + rasterised vision critique + one revision pass.
5. Lockups and variants in the brand kit and wizard UI.

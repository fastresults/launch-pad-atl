# Stopping workflow breaks: one contrast authority, bounded workers, canary coverage

## What the logs actually show

The only failing surface right now is brand collateral. In the last run (Utah Claims Pros, 23:08–23:09 UTC):

- Every copy-bearing kind — notecard, email signature, invoice, proposal — was blocked by the same quality gate with the identical reason: `A logo specimen was drawn in #21c0ff on #F5F5F5 — too little contrast to be visible.`
- The run then died with `CPU Time exceeded` → HTTP 546 `WORKER_RESOURCE_LIMIT` after 12.1s.
- Document generation is otherwise healthy: 379 assets complete, 1 failed (`website_prd`, a stale row from Aug 10 that predates the current engine).

So this is not a generic reliability problem. It is one venture whose brand ink is a bright cyan, and two structural gaps that turned that into a total workflow stop.

### Break 1 — the ink chooser and the ink judge disagree

`collateral-qc.ts` enforces a contrast floor of 2.4 on every logo specimen. But the renderer in `collateral-svg.ts` hands it inks that were never checked: specimen tiles are assigned `ink: primary` (and other fixed values like `#121212`) directly, with the contrast guard only applied on the reversed/dark path. Cyan `#21c0ff` on paper `#F5F5F5` measures ~1.9. The judge is correct; the chooser is guessing.

Worse, the failure is terminal. `brand-logo` already gained hue-preserving repair (`repairSvgContrast` in `_shared/logo-ink.ts`), but the collateral pipeline does not import it — it has no repair path at all, so it throws `QUALITY_GATE_FAILED` and the founder gets nothing.

### Break 2 — no worker budget on the heaviest kind

The function already refuses more than one kind per request (`ONE_KIND_PER_REQUEST`) precisely because wasm rasterisation accumulates CPU. But a single multi-page kind (guidelines, presentation) still rasterises every page in one worker, and that is what exceeded CPU time here. The one-kind bound is too coarse.

## The fix

### 1. One contrast authority, applied before the draw

No template picks a specimen ink directly. Every mark colour goes through a single resolver in `_shared/logo-ink.ts` that takes the desired ink and its ground and returns a legible ink, walking lightness within the brand hue rather than collapsing to black or white. Cyan on paper becomes a deeper cyan that still reads as the brand, not `#121212`.

QC keeps its 2.4 floor, but becomes a backstop that should never fire in production. If it does fire, that is a renderer bug, and it is logged as one.

### 2. Brand-level legibility, resolved once at lock time

When a brand kit is locked, compute and store the ink-safe form of each palette role against paper, charcoal, primary and accent. Collateral, ads, covers and guidelines all read those resolved values instead of each recomputing. A venture with an unusable-as-ink brand colour is surfaced in the Brand Studio at lock time, not discovered eleven assets later.

### 3. Never let one specimen kill a whole piece

Repair first, then gate. A kind only fails when repair itself cannot produce a legible composition, and the failure names the specimen and the surface. Kinds stay independent: one blocked kind never prevents the other ten from publishing.

### 4. Per-page worker budget

Multi-page kinds render and rasterise page by page, each page persisted as it passes, with a wall-clock and page-count budget per invocation. A kind that exceeds its budget returns `MORE_PAGES` and the client resumes at the next page, exactly the way full-set generation already resumes across kinds. No single worker can run itself into `WORKER_RESOURCE_LIMIT`.

### 5. Fixtures that would have caught this

A contract test suite over hostile brand inputs — near-white brand, near-black brand, saturated cyan/yellow (this exact case), raster-only logo, no reversed variant, eight-role palette, very long venture name. Each fixture asserts every specimen clears the contrast floor after resolution and that no page throws. These run in CI, so a brand that cannot be typeset is a red test, not a founder's dead-end.

### 6. A canary run and a health surface

A scheduled synthetic venture generates one collateral kind, one ad and one document on a fixed cadence and records the outcome to `venture_generation_events` (already in place for documents). The admin hub gets a generation-health card: pass rate and p95 duration by workflow, plus the top failure reasons. Breaks get discovered by us, not reported by founders.

## Technical notes

- `supabase/functions/_shared/logo-ink.ts` — export `resolveInk(desired, ground, opts)` built on the existing hue-preserving lightness walk; single source of truth for specimen ink.
- `supabase/functions/_shared/collateral-svg.ts` — route all `ink:` assignments (specimen tile table around L1394, `markAt` call sites, `inkOn` uses) through `resolveInk`; keep recording `data-mark-ink` / `data-mark-bg` for QC.
- `supabase/functions/_shared/collateral-qc.ts` — unchanged thresholds; add a distinct `RENDERER_BUG` reason class when a contrast failure survives resolution.
- `supabase/functions/venture-collateral/index.ts` — per-page budget in `generateKind`, incremental `store` per page, `MORE_PAGES` resume contract; failures stay per-kind.
- `supabase/functions/venture-brand-wizard` (lock path) — persist resolved ink-safe roles onto `venture_brand_kits`.
- `supabase/functions/_shared/logo-ink.test.ts` — extend with the hostile-brand fixture matrix.
- Telemetry: reuse `venture_generation_events`; add a `workflow` dimension for collateral/ads/covers. Admin card on `admin.hub.tsx`.
- Clear the one stale `website_prd = failed` row so the venture reflects the current engine.

No founder-facing copy or layout changes beyond the Brand Studio lock-time legibility notice.

# Website PRD — from "spec document" to award-winning build brief

## What's actually wrong (verified against the shipped PRD)

I read the Utah Claims Pros PRD your builder consumed. It is not truncated: 12,092 words, complete master prompt, art direction locked ("Warm Storefront"), 22 spec tables, image prompts written to the craft recipe. The failure is in four instructions that hand the builder the wrong defaults.

1. **The logo ships as one flat URL.** The prompt says render `/brand-logo/{id}` exactly, in header and footer. Footers and CTA bands sit on `surface-inverted` (#005662 teal), so the light-background mark lands black on teal — your screenshot. The endpoint already supports `/{id}/auto?on=<hex>`, which returns the legible variant. The PRD never uses it.
2. **Text inherits across surface flips.** "Partner With Objective Experts" is #333333 on #005662 = 1.51:1. The surface rule is in the PRD as prose, but never as a per-section assignment with measured ratios the builder cannot skip. (Measured here: white/teal 8.37 fine, muted pink/teal 4.94 legal but weak for display, page-fg/teal 1.51 illegal — and it shipped.)
3. **Motion is boilerplate.** Section 5 is a hardcoded string: fade + slide-up 12px, IntersectionObserver reveals, hover scale 1.02. Every venture gets the same four lines. Each archetype in `site-art-direction.ts` carries a real motion character and two signature moves — none of it reaches the builder. The site feels flat because the PRD never asked for ambition.
4. **Image quality is left to the builder's default tier.** "Generate every image via your platform's image-generation tool" names no model, no quality tier, no regenerate rule. The builder uses its cheapest tier.

## The craft upgrades that separate a good site from an Awwwards site

A PRD that only specifies structure produces structure. These are the moves an award jury actually rewards, and each becomes a required, checkable clause.

**Depth and parallax.** Every full-bleed section declares a depth stack: background plate (translateY at 0.25x scroll), midground subject (0.6x), foreground type (1.0x), with a CSS gradient scrim between plate and type. Hero headline masks in by line via `clip-path` with an 80ms stagger. Reduced-motion collapses the stack to a static composition — not a broken one.

**A signature scroll moment per site.** Exactly one, drawn from the archetype: a pinned caption rail while frames advance, a scroll-scrubbed image sequence, a horizontal proof reel, or a headline that scales down into the sticky header. Named as a required implementation with the technique specified, not "add scroll animations."

**Typography with real hierarchy.** Display type gets a stated clamp range (e.g. `clamp(2.75rem, 6vw, 7rem)`), tracking, and a max measure of 62–70 characters. One editorial device is mandatory: drop cap, oversized pull quote, or an oversized statistic set as type. Numerals tabular in all data.

**Copy contract, not copy placeholders.** Headlines carry a specific claim, never a category label — "Partner With Objective Experts" is exactly the failure mode. Rules: ≤9 words, verb-led, one concrete noun from the venture's own world (claim, adjuster, policy limit); subhead states the mechanism in one sentence; every section opens with the reader's stake before the company's credentials; CTAs name the outcome ("Get my claim reviewed"), never "Learn more" / "Get started". Every page ships microcopy: form labels, helper text, empty, loading, success and error states.

**Detail layer.** Focus-visible rings on the brand accent, hover states with 180ms easing on every interactive, custom 404 and cookie banner in the art direction, view-transition-friendly page changes, image `aspect-ratio` reserved to keep CLS at zero, fonts preloaded with `font-display: swap`.

**Acceptance criteria the builder must self-check** before finishing: no section text-only twice in a row, no logo on an unmeasured surface, both archetype signature moves present, every image passing its legibility test at 480px, Lighthouse ≥95 across the four categories.

## Implementation

**A. Surface-aware logo URLs.** In `_shared/deliverable-prompts.ts` and `_shared/website-prd.ts`, stop injecting the bare URL. Inject three concrete URLs — on `page`, on `surface-inverted`, on `overlay` — each as `/brand-logo/{id}/auto?on=<hex>&v=<kitVersion>`. Add a lint in `_shared/identity-guard.ts`: a bare logo URL inside a non-light surface is a rejection.

**B. Computed contrast table.** Emit the surface ladder with a measured ratio per pair via `resolveInk`/`resolveBrandInks` in `_shared/logo-ink.ts` (already the single contrast authority for collateral), repairing any illegal pair hue-safely before it enters the document. Section 4 names the surface each section flips to.

**C. Archetype-driven motion + depth spec.** Replace the hardcoded Section 5 with a builder reading the archetype's `motion` and `signatureMoves`, emitting the parallax depth stack, the one signature scroll moment with its technique, timings/easings, and the reduced-motion fallback as a required implementation.

**D. Copy craft in Section 4.** Extend `_shared/copy-craft.ts` with the headline/CTA/microcopy rules above and raise the Section 4 floor so the existing expansion pass rewrites thin pages against them.

**E. Explicit image contract.** Highest-quality tier available, one image per call, regenerate on failed legibility test — stated as acceptance criteria. Portraits already rendered upstream are downloaded and reused, never regenerated.

**F. Metrics + regenerate.** Add `motionSpecific`, `logoSurfaceSafe` and `copyCraftPass` to `prdQualityMetrics` so regressions show on the generation health card. Then regenerate this venture's PRD and diff the master prompt to confirm all six changes are present.

## Technical notes

Files: `_shared/deliverable-prompts.ts` (master prompt sections 2/3/5/6), `_shared/website-prd.ts` (fact injection, metrics), `_shared/identity-guard.ts` (new lints), `_shared/site-art-direction.ts` (motion/depth block export), `_shared/copy-craft.ts` (headline + microcopy contract), `_shared/logo-ink.ts` (reused as-is). Redeploy `venture-generate-document` and `venture-bulk-generate`. No schema change; UI change limited to the health-card metrics.

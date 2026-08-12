# Website PRD quality breakdown — diagnosis and fix

## What I checked

I pulled the actual PRD your builder consumed (Utah Claims Pros) and compared it against the contracts in the pipeline. The PRD is not truncated or half-generated: 12,092 words, master prompt complete, art direction locked ("Warm Storefront"), 22 spec tables, per-image prompts written to the image-craft recipe. So the failure is not the generator dying — it is three specific instructions in the master prompt that hand the downstream builder the wrong defaults.

## Why quality collapsed

**1. The logo is injected as one flat URL, so it lands black on teal.**
The master prompt says: render `https://.../brand-logo/{snapshotId}` "exactly, in the header and footer — never draw a substitute mark." The footer and CTA bands sit on `surface-inverted` (#005662 teal). One URL means one artwork, so the light-background mark ships on the dark band. That is exactly what your screenshots show.

The `brand-logo` endpoint already solves this — it supports `/{id}/auto?on=<hex>`, which measures the artwork's ink against the surface and returns the legible variant. The PRD never uses it.

**2. Body/heading text inherits across surface flips.**
"Partner With Objective Experts" renders #333333 on #005662 — a 1.51:1 ratio. The surface ladder *is* in the PRD, and the rule is stated verbatim, but it is stated as prose and never as a per-section assignment with measured ratios the builder can't skip. Measured pairs in this kit: white-on-teal 8.37 (fine), muted pink-on-teal 4.94 (legal but visually weak for display type), page-fg-on-teal 1.51 (illegal, and it shipped).

**3. Motion is boilerplate, not the art direction.**
Section 5 of the master prompt is a hardcoded string in `deliverable-prompts.ts`: fade + slide-up 12px, IntersectionObserver reveals, hover scale 1.02. Every venture gets the same four lines regardless of archetype. Meanwhile each archetype in `site-art-direction.ts` carries a real motion character and two signature moves (pinned scroll sequences, line-mask type reveals, scroll-scrubbed crossfades) — none of it reaches the builder. That is why the site feels flat and "not tier one": the PRD literally never asked for the ambitious motion.

**4. Image quality is left to the builder's default tier.**
The imagery prompts are excellent, but the instruction is "generate every image via your platform's image-generation tool." No model, no quality tier, no retry-on-fail rule that the builder can act on. The builder defaults to its cheapest/fastest image tier, which is what produced the flat renders.

## The fix

**A. Surface-aware logo URLs (removes the contrast class of bug entirely)**
- In `_shared/deliverable-prompts.ts` and `_shared/website-prd.ts`, stop injecting the bare logo URL. Inject the rule: use `/brand-logo/{id}/auto?on=<surface-hex>&v=<kitVersion>` and pass the hex of whatever surface the lockup sits on. Give the builder the three concrete URLs it needs — on `page`, on `surface-inverted`, and on `overlay` — each with the hex baked in.
- Add a PRD lint in `_shared/identity-guard.ts`: a bare `/brand-logo/{id}` reference inside a section assigned to a non-light surface is a rejection, same as a missing surface assignment today.

**B. Contrast table the builder must honour**
- Emit the surface ladder with a computed ratio per pair (using `resolveInk`/`resolveBrandInks` from `_shared/logo-ink.ts`, already the single contrast authority for collateral) rather than letting the model restate hexes.
- Any pair below 4.5:1 body / 3:1 display gets repaired hue-safely before it enters the PRD, so an illegal pair can never appear in the document. Section 4's per-section specs each name the surface they flip to.

**C. Archetype-driven motion spec**
- Replace the hardcoded Section 5 string with a builder that reads the selected archetype's `motion` + `signatureMoves` and emits: the motion character, both signature moves as required implementations (with the technique named — pinned scroll, clip-path line mask, scroll-scrubbed crossfade), timing/easing, and the `prefers-reduced-motion` fallback. Add "the two signature moves must appear" as a hard acceptance criterion.
- Add `motionSpecific` to `prdQualityMetrics` (do the archetype's signature moves appear in the master prompt?) so a regression shows in the health card instead of shipping.

**D. Explicit image generation contract**
- The imagery spec instructs the builder to generate at the highest-quality image tier available, one image per call, and to regenerate any image failing its legibility test — stated as an acceptance criterion, not a suggestion.
- Portraits already rendered upstream (Section 4c) stay authoritative: download and reuse, never regenerate.

**E. Regenerate this venture's PRD** once A–D land, and diff the master prompt against the current one to confirm the four changes are present.

## Technical notes

Files: `supabase/functions/_shared/deliverable-prompts.ts` (Sections 2/5/6 of the master prompt), `_shared/website-prd.ts` (fact injection + metrics), `_shared/identity-guard.ts` (new lints), `_shared/site-art-direction.ts` (motion block export), `_shared/logo-ink.ts` (reused, no change expected). Redeploy `venture-generate-document` and `venture-bulk-generate`. No schema change; no UI change beyond the health-card metric.

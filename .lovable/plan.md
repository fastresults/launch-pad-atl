# The PRD is deep about words and silent about layout — fix the contract, then gate it

## What is actually wrong with these three screens

Read as a creative director, page by page. None of these are content problems. Every one is a layout, state or hierarchy problem — the exact class of thing the PRD never specifies.

**Structural**

1. There is no page container. Every element sits flush against the left viewport edge and the page overflows right: "Notice" renders as "otice", "Pricing" as "ricing", and "Request a Consultation" is cut off by the right edge on all three screens. No max-width, no gutters, no centred column. This alone reads as broken, not designed.
2. No baseline grid or vertical rhythm. The gap between the hero and "Packages" is roughly a full screen of dead white; sections are divided by hairline rules only, with no rhythm distinguishing a major band from a minor one.
3. Pricing and Case Studies use a two-column intro where column two is empty. Half of the fold is blank. The imagery contract ("no two consecutive text-only sections") is honoured on Home and abandoned on every inner route.

**Interaction and state**

4. Calls to action are not buttons. "Request a Consultation   Protect Your Assets" is two bare text strings sharing a line with no separation, no fill, no border, no padding, no hover target. The primary conversion element on every page has no visual weight at all.
5. The active nav item is drawn as pale blue text inside what appears to be a focus ring — the label is illegible on white. Focus styling is being used as the active-route indicator, and the active state fails contrast.
6. The cookie banner floats over live content with no card surface and no elevation, its buttons rendered as plain text ("Accept Required   Decline Non-Essential"), and it obscures the first case-study card's headline.
7. The announcement bar is unstyled system text with the dismiss X pinned to the raw viewport edge.

**Typography and colour**

8. One typeface, one weight register, no display face, no editorial device. Eyebrows ("Pricing", "Packages", "Case studies", "Selected work") are set at body size in body colour instead of tracked micro-caps.
9. The lede and the following paragraph say the same thing twice on both inner pages — the copy contract produced volume, not structure.
10. Brand colour appears nowhere except the logo and the illegible nav state. The whole site is black on white. The locked palette never reaches the page.

**Hero and imagery**

11. Hero type runs straight across the subject's face and the headline's left third sits on bright sky — no scrim, no clean side of frame reserved. The kicker "Parowan, Utah — Licensed Public Adjusters" is barely visible.
12. The case-study card sets its title over the image with no scrim, so it half-disappears.
13. The logo lockup is small, mis-scaled and jammed into the corner with no clear space.

**Content architecture**

14. A pricing page with no prices. "Two Ways to Engage Us" resolves to two plain headings and one line of text each — no cards, no tiers, no feature lists, no CTA.

## Why the PRD did not prevent any of this

Three concrete breaks, all mine.

**Break 1 — the craft contract is dead code on any good-length draft.** `enforceWebsitePrdDepth` returns the draft untouched when the master prompt is already complete and ≥1800 words (`website-prd.ts:143`). `buildDepthAddendum` — which is where the grid, section-composition, motion, scrim and detail-layer rules live — therefore only ever fires on *short* drafts. A verbose, generic PRD skips the entire craft layer. That is why the output looks like a first draft of a wireframe: for this venture, the depth contract almost certainly never ran.

**Break 2 — the contract has no layout or interaction layer.** Reading the whole spec: it is exhaustive about copy word floors, imagery rows, surfaces and motion, and nearly silent about the things broken above. There is one buried mention of "1200-px max content width with 24-px gutters" inside a different deliverable's section, and nothing at all about button anatomy, nav active vs focus states, overlay elevation and z-index, announcement-bar construction, or empty-column rules. Components are named in a list (`PricingBlock`, `CTASection`) with states named abstractly ("hover, focus, loading, empty, error") but never specified. Named is not specified.

**Break 3 — the gate measures words, not craft.** `prdQualityMetrics` counts words, imagery rows, hex mentions, `<img` tags and a few regexes. Every one of those can pass while the page has no container, no buttons and no active state. Nothing regenerates on a craft failure — the metrics are logged and the document ships regardless. And nothing anywhere inspects the *built site*; the loop ends at the markdown.

## The fix

### 1. The depth contract always applies

Split the two jobs that are currently tangled. Length expansion stays conditional; the craft contract becomes unconditional — every website PRD gets the addendum injected before the closing line, whether the draft is 900 words or 2,400. Deduplicate rather than skip, so re-runs don't stack it.

### 2. A Layout & Interaction Contract, written to the failures above

A new locked block, alongside the existing copy/image/surface contracts, injected into the prompt and restated in the PRD. It specifies, in checkable terms:

- **Shell**: one `Container` primitive — 1280px max, 24px gutters at 360px rising to 48px at desktop, applied to every section including the announcement bar, header, footer and cookie banner. `overflow-x: hidden` on the shell, and a stated rule that no element may touch the viewport edge unless it is deliberately full-bleed.
- **Buttons**: primary is a filled brand surface with its paired foreground, stated padding, radius, minimum 44px target, hover, active, focus-visible and disabled states. Secondary is outlined; tertiary is a text link with an underline affordance. Two CTAs sitting adjacent declare their gap. A CTA rendered as bare text is a hard failure.
- **Navigation**: active route and focus-visible are two different treatments, both specified with their contrast ratio. The active indicator must remain legible; a focus ring may never be the only active-state marker.
- **Overlays**: cookie banner, announcement bar, mobile nav and modals each get a surface assignment, elevation, z-index band, and a rule that no overlay may sit over primary content without its own opaque or blurred surface.
- **Composition**: no two-column section may ship an empty column — either the second column carries an asset, a stat block or a form, or the section is single-column and centred. Section spacing comes from a named rhythm scale, not ad-hoc padding.
- **Type over imagery**: any type on an image declares its scrim direction and the clean side of the frame — already required for hero rows in the imagery table, now extended to cards, bands and every overlay.
- **Brand colour deployment**: state where the accent must appear on every route — primary CTA, active nav, at least one full-bleed brand band, and one editorial accent. A route rendered entirely in neutrals is a failure.
- **Pricing pages**: tiers render as cards with a name, price or basis, an inclusion list of full sentences, and a CTA per tier.

### 3. A machine gate that can actually fail

Extend the PRD checks with craft assertions read from the generated markdown: container/gutter spec present, button anatomy specified with states, nav active ≠ focus, overlay z-index and surface stated, per-route accent deployment named, pricing tiers carrying prices and CTAs, and every route in Section 2 present in the 4b imagery table. Failures are named, and the document is regenerated on those specific points the way Section 4 already regenerates when it lands under its word floor — one targeted repair pass, then a recorded verdict. Craft failures also write to `venture_generation_events` so a slide in quality is visible on the health card instead of arriving as a screenshot.

### 4. A build-acceptance checklist inside the PRD

The PRD's final section becomes a checklist the builder must satisfy and the founder can verify by looking at the screen: no horizontal scroll at 360/768/1280/1920, no element flush to the viewport edge, every CTA a real button, active nav legible, no overlay covering content without its own surface, no empty half-columns, brand colour present on every route, prices visible on the pricing route. That is the same list the gate checks, written for a human.

## Technical notes

- `supabase/functions/_shared/website-prd.ts` — split `enforceWebsitePrdDepth` into unconditional `applyCraftContract` plus the existing length path; extend `prdQualityMetrics` into a pass/fail verdict; add a targeted craft-repair pass mirroring the Section 4 repair.
- `supabase/functions/_shared/layout-contract.ts` (new) — the locked Layout & Interaction Contract block, exported the way `copyCraftBlock` / `imageCraftBlock` / `surfaceSystemBlock` are.
- `supabase/functions/_shared/deliverable-prompts.ts` — reference the new contract from Sections 3, 4 and 8, and add the build-acceptance checklist to the closing section.
- `supabase/functions/_shared/site-art-direction.ts` — include the layout contract in the art-direction bundle so ads and covers inherit the same rules.
- `supabase/functions/venture-generate-document/index.ts` and `venture-bulk-generate/index.ts` — call the unconditional path, log the craft verdict, and record craft failures via `logGenEvent`.
- Tests: fixture PRDs that pass word floors but violate each craft rule, asserting the gate rejects them.

No founder-facing UI changes beyond the PRD document itself and the craft verdict surfacing where PRD status is already shown.

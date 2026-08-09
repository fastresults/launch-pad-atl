# Ship real portraits with the PRD instead of asking for them

The PRD never renders a human being. It only *describes* one. Section 4b writes a portrait recipe, the guard checks that the recipe text is present, and then the whole thing is handed to a downstream builder that is free to ignore it — which is exactly what happened in the screenshot: the testimonial block shipped as three empty white cards with no photograph at all (and near-invisible quote text on top).

Prompt-only enforcement has now failed several rounds. The fix is to stop delegating the people shots.

## What changes

### 1. The PRD generates its own portraits
At PRD time, after Section 4b is written, pull every imagery row whose visual type is `portrait` (testimonials, founder/about, team, process-with-people) and actually render them — capped at 4 per PRD — through the image model using the locked portrait recipe from `image-craft.ts`. Save the originals to the existing private doc-image bucket, get permanent signed URLs, and rewrite those rows in the PRD to embed the real `<img>` plus the prompt that produced it.

The builder then inherits finished photographs instead of a paragraph of instructions.

### 2. A portrait QA gate before an image is accepted
Each rendered portrait goes through the existing `image-qa` pass with portrait-specific checks: a real human face present, catchlights, believable skin texture, face luminance in the 45–60% band, no burned-in text or hex strings, no malformed hands. One corrective retry on failure; if it still fails, the row falls back to prompt-only and is flagged in the PRD as "generate manually" rather than silently shipping a plastic render.

### 3. Testimonial blocks stop being allowed to ship text-only
Section 4b gains a hard requirement: any social-proof section specifies a portrait slot per quote, the card surface tokens (background + foreground pair) with a stated contrast ratio, and the exact avatar geometry. The guard rejects a PRD where a testimonials section has no portrait row — that is the specific failure in the screenshot.

### 4. Contrast is specified, not assumed
The same screenshot shows white-on-white quote text. Every card and overlay slot in the PRD must name its foreground/background token pair and pass 4.5:1; the master prompt restates that no card may inherit body colour from a dark page background.

### 5. One theme contract — light and dark stop mixing
The feature-comparison screenshot is the same bug in a second place: a light card dropped onto a dark page, where the row labels and column headers keep the dark-page foreground and vanish, while the value cells happen to be legible. The PRD currently names colours but never names *surfaces*, so the builder invents them per section.

Add a **Surface system** subsection to Section 3 (design system) that the whole document then references:

- A fixed, named ladder — `page`, `surface`, `surface-raised`, `surface-inverted`, `overlay` — each defined once with its background token, its own foreground token, its muted-foreground token, and its border token, for both light and dark themes.
- The rule that **foreground always travels with its surface**: any element that changes background must also set the paired foreground. No component may inherit text colour across a surface boundary.
- One declared page mode per route (light-dominant or dark-dominant). Inverted sections are allowed but must be listed explicitly by name, and each one states the token pair it flips to.
- Every component in the Section 8 inventory — card, table, pricing tier, testimonial, FAQ row, form field, badge, footer — names the surface it sits on and its foreground/muted pair. Tables specifically call out header, label column, value cells, borders and zebra rows, because the label column is what failed here.
- A dark-mode parity check: any token pair defined for light gets a dark counterpart, and the PRD states that a section is never allowed to be "styled for one theme only".

The guard rejects a PRD where the surface ladder is absent, where any component in the inventory has no surface assignment, or where a section uses a light surface on a dark-mode route without declaring the inversion.

## Technical notes

- New `supabase/functions/_shared/prd-portraits.ts`: parse the 4b imagery table, select portrait rows, build prompts via `craftPrompt("portrait", …)`, call the gateway image endpoint, upload to the doc-image bucket, and splice URLs back into the markdown.
- Wire into `venture-generate-document` and `venture-bulk-generate` after the copy-expansion pass, inside the existing background-run path (rendering 4 images adds ~30–60s, which the 202/polling flow already absorbs).
- Extend `_shared/image-qa.ts` with a `portraitQA` check set; extend `_shared/identity-guard.ts` with `testimonialPortraitsMissing`, `contrastTokensMissing` and `surfaceSystemMissing`.
- New `_shared/surface-system.ts` holding the surface ladder definition and its prompt block, injected alongside `imageCraftBlock()` and `copyCraftBlock()` in `site-art-direction.ts` so art direction, copy and surfaces arrive as one contract.
- `_shared/deliverable-prompts.ts`: Section 3 gains the Surface system subsection, Section 4b gains a contrast-token column and the social-proof portrait requirement, Section 8's component inventory gains a per-component surface assignment, and the master prompt restates the "foreground travels with its surface" rule verbatim.
- Verification: regenerate a Website PRD for an existing venture and confirm the testimonial rows carry live image URLs that open, faces read as photographs, and every component row names a surface plus its foreground pair in both themes.


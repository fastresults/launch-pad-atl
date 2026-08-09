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

## Technical notes

- New `supabase/functions/_shared/prd-portraits.ts`: parse the 4b imagery table, select portrait rows, build prompts via `craftPrompt("portrait", …)`, call the gateway image endpoint, upload to the doc-image bucket, and splice URLs back into the markdown.
- Wire into `venture-generate-document` and `venture-bulk-generate` after the copy-expansion pass, inside the existing background-run path (rendering 4 images adds ~30–60s, which the 202/polling flow already absorbs).
- Extend `_shared/image-qa.ts` with a `portraitQA` check set; extend `_shared/identity-guard.ts` with `testimonialPortraitsMissing` and `contrastTokensMissing`.
- `_shared/deliverable-prompts.ts`: Section 4b gains a contrast-token column and the social-proof portrait requirement; Section 8 restates both.
- Verification: regenerate a Website PRD for an existing venture and confirm the testimonial rows carry live image URLs that open, and that faces read as photographs.

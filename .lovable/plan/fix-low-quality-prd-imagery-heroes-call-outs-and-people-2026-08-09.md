# Fix low-quality PRD imagery: heroes, call-outs, and people

The three failures in the screenshots trace to the same root cause: the PRD tells the builder *what* each image is about, but never *how it must be shot*. Section 4b asks for a 30–60 word prompt "in mood-board language with two brand hexes" — no exposure target, no camera spec, no subject rules. So the model writes vague prompts, and the builder renders them.

What that produces, matching each attachment:

1. **Hero too dark.** The chosen art direction (e.g. "Cinematic", "near-black base, accent as light source") pushes the *image itself* to near-black, and then the builder stacks a text scrim on top. Two darkenings compound and the underlying picture disappears.
2. **Call-out images unclear.** Spot/feature images get the same generic prompt treatment as heroes — flat blue field, a lone arrow or a 3D icon pile. No focal-subject rule, no crop rule, no "must read at 480px wide" test.
3. **People not studio quality.** There is no portrait recipe anywhere. Nothing specifies lens, lighting setup, wardrobe, framing, skin rendering, or a ban on rendered/AI-plastic faces — and one attachment even shows a stray hex string burned into the photo.

## The fix

### 1. New shared module: `_shared/image-craft.ts`
A per-visual-type craft contract that gets injected into the PRD, so every prompt is built from a real recipe instead of adjectives.

- **hero** — target mid-tone exposure (subject luminance ~35–55%), one clear light source, readable detail in shadows, generous negative space in the text zone (left third or lower third), 16:9. Hard rule: **darkening happens in CSS, never in the image** — the image ships legible and the builder applies a token-based gradient scrim for text contrast.
- **portrait** — 85mm equivalent, f/2 look, soft key + subtle rim, catchlights in the eyes, real skin texture and pores, natural wardrobe, waist-up or head-and-shoulders, eye contact, environment softly readable behind. Ban list: plastic/CGI skin, symmetrical AI faces, extra fingers, burned-in text or hex codes, watermark.
- **spot / call-out** — single unmistakable subject filling 60–75% of frame, high subject/background separation, 4:5 or 1:1, legible at 480px, no scene clutter, no floating icon soup, no lone-arrow-on-a-gradient.
- **product / UI mock** — clean plane, honest perspective, real interface shapes with blurred illegible text.
- **texture / band** — brand-hex derived, low contrast, always behind type, never a standalone "image".

Each recipe carries: exposure target, lens/technique, composition rule, minimum-legibility test, and its own never-do list.

### 2. Wire it into the PRD generator
In `_shared/deliverable-prompts.ts`:
- Section 4b's imagery table gains two columns: **Exposure/contrast target** and **Text-overlay plan** (scrim direction + which side stays clean). Prompt length moves to 55–90 words so the recipe fits.
- Every generation prompt must open with its visual-type recipe from `image-craft.ts` verbatim, then the venture-specific subject.
- Section 8 subsection 6 ("Imagery spec") restates the craft contract and the CSS-scrim rule so the builder can't re-darken a hero.

### 3. Stop the art direction from over-darkening
In `_shared/site-art-direction.ts`, the dark archetypes' `imagery` fields get an explicit carve-out: near-black applies to **UI chrome**, while photographic subjects stay properly exposed. Add "hero image so dark the subject is unreadable" to those archetypes' `never` lists.

### 4. Enforce it
Extend `_shared/identity-guard.ts` (already the PRD repair pass) with imagery checks that trigger a targeted regeneration when:
- any imagery row is missing exposure or overlay columns,
- a prompt containing a person lacks the portrait recipe keywords,
- any prompt says "dark"/"near-black"/"moody" without a paired exposure target,
- prompts don't reference brand hexes or the mood board.

### 5. Same recipes for images we generate ourselves
`_shared/hero-prompt.ts` and `venture-document-image` currently hardcode a single New Yorker illustration style. Route them through `image-craft.ts` so document/cover art follows the same exposure and legibility rules rather than a second, unrelated style.

## Technical notes

Files touched: new `supabase/functions/_shared/image-craft.ts`; edits to `_shared/deliverable-prompts.ts`, `_shared/site-art-direction.ts`, `_shared/identity-guard.ts`, `_shared/website-prd.ts` (depth addendum imagery paragraph), `_shared/hero-prompt.ts`, `supabase/functions/venture-document-image/index.ts`.

No schema changes, no UI changes. Verification is regenerating a Website PRD for an existing venture and confirming the imagery table carries exposure + overlay columns, that people rows contain the portrait recipe, and that no hero prompt bakes in darkness.

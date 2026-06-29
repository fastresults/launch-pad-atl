## Audit findings

**1. Style Guide ignores uploaded logos (the screenshot bug)**
`generateGuide()` in `supabase/functions/venture-brand-wizard/index.ts` passes `palette`, `typography`, `voice` into the prompt, but never passes `kit.logos` or `kit.moodboard`. So even when the founder uploaded a logo via the "Existing Brand" track (Track A), the model writes "As no logo is provided…". The DOCX exporter embeds the logo correctly — only the narrative prose is blind to it.

**2. Existing-track audit section is generic**
Section 1 is labeled "Existing Brand Audit" but the prompt doesn't tell the model what was actually extracted vs. inferred (Firecrawl branding payload, auto-mapped fonts, missing roles). Output ends up boilerplate.

**3. Section 5 ("Logo Usage") has no logo-specific guidance**
Even with a logo present, the prompt asks for generic "clear-space, min size, do/don'ts" with no reference to the uploaded mark's shape, colorway, or filename, so the section reads like a template.

**4. Extraction model was downgraded to Flash (last turn's timeout fix)**
Flash is fast enough but loses fidelity on color/font inference from screenshots. Worth keeping Flash but giving it tighter instructions, and falling back to Pro only when Firecrawl branding payload is empty.

**5. Style Guide model still Pro, no timeout guard**
`generateGuide()` calls `gemini-2.5-pro` with no `aiFetch` retry/timeout wrapper. Long generations can 504 the same way `extract-existing` did.

## Fix plan

### A. `supabase/functions/venture-brand-wizard/index.ts` — `generateGuide()`
- Build a `logoBlock` from `kit.logos`: count, primary filename, signed URL of the primary, and a note if multiple variants exist. Build a `moodBlock` from `kit.moodboard` (site screenshot caption, OG image, logo thumbnails) so the model knows what visual evidence exists.
- Inject both blocks into the user prompt, right after LOCKED VOICE, under headings `LOGO ASSETS` and `VISUAL EVIDENCE`.
- Update the Section 5 instruction from generic clear-space copy to: "Reference the uploaded primary logo by filename; describe its visual character (wordmark/symbol/combination), recommended clear-space as a multiple of the logo's cap-height, minimum sizes for print and screen, do/don'ts grounded in the actual mark, and lockup rules. If no logo was uploaded, say so explicitly and provide direction for a future mark."
- For the `existing` track, expand Section 1's instruction to enumerate: which fields came from Firecrawl branding vs. inferred, whether typography was `auto_mapped`, and any roles the extractor left blank.

### B. Same file — `generateGuide()` resilience
- Wrap the `callAI` call in `generateGuide` with `aiFetch` (already used elsewhere) — 90s timeout, 1 retry — so it surfaces a clean error instead of a 504 idle timeout if Pro is slow.
- Keep the model on `gemini-2.5-pro` (output quality matters here more than latency).

### C. Same file — `extractExistingBrand()` quality
- Keep Flash for speed but add an instruction: "If Firecrawl branding is present, you MUST copy `colors.primary/secondary/accent/background/textPrimary` and `fonts[]` verbatim. Only infer when a field is missing." This recovers the fidelity lost from the Pro→Flash downgrade without re-introducing the 150s timeout.
- Set `auto_mapped: true` whenever a font substitution was made so the Style Guide audit section can flag it.

### D. No client / schema changes
- `kit.logos` and `kit.moodboard` are already persisted by `extractExistingBrand` and the generative track. No DB migration, no new RPC, no UI changes required.
- DOCX exporter (`brand-guide-docx.ts`) already embeds the primary logo correctly — leave untouched.

## Verification

1. Run Track A in the preview: upload a logo + website URL → confirm Brand Kit locks with `logos[]` populated.
2. Click "Generate Style Guide" → open Step 5 preview. Section 5 should name the uploaded logo file and describe it; Section 1 should list what was extracted vs. inferred.
3. "Save to My Files" → open the DOCX in the file preview. Logo, palette swatches, and font specimens should all match the kit.
4. Run Track B (build from scratch) with no logos → Section 5 should say "no logo uploaded" and give forward-looking direction (no false claim of an existing mark).
5. Check edge logs for `venture-brand-wizard` — no 504s on `styleguide` action.
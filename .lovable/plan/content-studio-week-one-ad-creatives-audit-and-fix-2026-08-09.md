# Content Studio week-one ad creatives — audit and fix

## What I checked

I read the ad pipeline (`venture-content-ad`, `content-ad-director.ts`, `cover-art-director.ts`, `poster-copy.ts`) and the last run's function logs, then compared them against the three creatives you attached.

## What's actually wrong

**1. The ads never received the new art direction. This is the big one.**
The social-cover function loads the venture-derived scene brief and puts it on the context (`ensureSceneBrief` → `ctx.sceneBrief`). The content-ad function calls `loadVentureContext` and never sets `sceneBrief` at all. So the shared art director finds no brief and falls straight through to `LIBRARY_STARTUP` — the generic founder-metaphor bag. That is literally where the brass compass on weathered wood (twice) and the torn-paper reveal come from. The fix you approved for headers was never wired into Content Studio.

**2. No relevance QA on ads.**
Covers now run a vision check ("does this frame plausibly depict this line of work?") with one corrective retry. Ads run only contrast/signature QA, so an off-topic compass ships without objection.

**3. The photographic brief is being ignored, and nothing catches it.**
The poster brief bans collage and demands calm negative space in the bottom 45%. Creative #1 is a torn-paper collage; in all three the subject runs straight through the type zone, which is why the headline sits on top of busy wood grain instead of a quiet field.

**4. The headline copywriter is falling back more than it's writing.**
Logs show `headline rejected twice` on two of three runs — the validator flags perfectly good lines ("Polished ads drain your contribution margin", "Validate demand before you fund production") as "names a topic instead of making a claim", then ships the first rejected attempt anyway tagged `source: fallback`. The validator's verb list is too narrow (it doesn't know *drain*, *validate*, *prove*).

**5. Type is over-scaled for the frame.**
`longest_line_pct` came back at 92.8, 94.7 and 97.8 — the headline spans nearly the full canvas width across three lines. Editorial posters breathe at ~78-85%.

**6. Logo colour picks are marginal.**
One run composited the mark at 3.51:1 contrast (white logo on a light torn-paper edge). Covers hold a higher bar.

## The fix

**A. Wire ads into the venture scene brief** — content-ad loads/derives the same cached brief and attaches it to the context before prompting, so ad scenes come from the business (a creator filming one SKU on a phone rig, a variant grid on a media buyer's screen) instead of a compass. The post's pillar and asset notes stay as the scene *selector* within that brief, so week-one ads still vary post to post.

**B. Add scene-relevance QA + one corrective retry** to the ad path, matching covers, and record the chosen scene and its source in `qa_notes` so it's visible in the regenerate dialog.

**C. Enforce the photographic contract** — explicit "single continuous photograph, no torn paper, no collage, no composited layers" in the ad poster brief, plus a reserved-zone check: if the type band isn't calm, retry once with a corrective note.

**D. Repair the headline validator** — widen the verb/claim recognition so real claim lines pass, and when a headline is genuinely rejected twice, fall back to the *better* of the two attempts rather than the first, and stop marking a written line as `fallback` when it passed everything but the verb list.

**E. Rein in display type** — target 78-86% longest-line width and prefer two lines over three at these caps.

**F. Raise the logo contrast floor** on ads to match covers, with a plate as last resort.

**G. Founder control parity** — the ad regenerate dialog gets the same "scene used / write your own scene / shuffle scenes" controls the cover dialog now has.

## Files

- `supabase/functions/venture-content-ad/index.ts` — load scene brief, pass scene override + refresh, relevance QA and retry, record scene in `qa_notes`.
- `supabase/functions/_shared/content-ad-director.ts` — pass the scene signal through with brief-derived scenes; harden the photographic contract.
- `supabase/functions/_shared/poster-copy.ts` — validator fix and best-of-attempts fallback.
- `supabase/functions/_shared/content-ad-svg.ts` — line-width targets.
- `src/components/hub/content/` regenerate dialog + `src/lib/content-ad.functions.ts` — scene controls.

## Verification

Regenerate the three week-one ads and confirm the saved `prompt_used` scene directive names UGC/creator/DTC subject matter, `qa_notes.scene.source` reads `venture_brief`, `headline_source` is `written`, and `longest_line_pct` lands in the 78-86 band.

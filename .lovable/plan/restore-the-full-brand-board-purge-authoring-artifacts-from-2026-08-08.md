# Restore the full Brand Board + purge authoring artifacts from shared links

Two problems, both confirmed by reading the code and querying real venture content.

## 1. Brand Studio lost the moodboard, DNA, voice and CTAs

After the Brand Studio overhaul, the studio's summary view renders only `BrandIdentityHeader` (mark, palette, typography) plus collateral. The moodboard, brand DNA, voice attributes and CTA set still exist in the brand kit data (`moodboard`, `dna`, `voice` on the kit; CTAs derived from the content plan) — they are just no longer rendered anywhere outside the wizard's step-by-step preview. The public showcase (`ShareBrandBoard`) already renders all of them, so the hub is now showing *less* than the shared link.

**Fix:** give the hub the same complete board.

- Extract the showcase board sections into a shared presentational component set so hub and showcase render identical blocks (mark & lockups, palette, type specimens, moodboard grid, brand DNA, voice do/don't, CTA set).
- Render those sections in Brand Studio under the identity header, in the always-dark card styling already used there.
- Sections self-hide when their data is empty, with a one-line "generate in the Brand Wizard" hint instead of a blank slab.
- Moodboard images open in the existing asset preview dialog.

## 2. Shared links leak raw markdown and JSON at readers

Two distinct leaks, both verified against stored venture content.

**a. Fence info-strings printed as body text.** Several generator prompts literally instruct the model to emit fences like:

```text
```markdown labeled `# Landing / DM copy`
```

The model copies that whole line verbatim. Our unwrapper only matches clean info-strings (```` ```markdown ````), so a dirty one never matches, the fence is never opened, and the reader sees the raw line. Confirmed present in `pre_sell_offer_test` and `payments_checkout_setup`.

**b. Developer JSON shown to non-technical readers.** `visual_identity_brief` and `presell_landing_prd` both carry a "## Brand Tokens (JSON)" block; `website_prd` carries robots.txt / sitemap.xml blocks. Correct for a build handoff, wrong for a founder-facing showcase.

**Fix — at both ends, so future generations stay clean:**

- **Prompts** (`_shared/deliverable-prompts.ts`): replace every ```` ```lang labeled `# Title` ```` instruction with "a `## Title` heading followed by a plain ```lang fence". Fences carry content only; labels become real headings.
- **Renderer** (`src/lib/markdown-normalize.ts`): accept fences with any trailing info-string. Take the first word as the language, promote any quoted/`#` label in the rest to a `###` heading above the block, then apply the existing prose-vs-code decision. Also drop a stray literal fence line whose info-string contains prose words.
- **Showcase filter** (new pass used by `venture-share`): strip reader-hostile blocks from public payloads — the "Brand Tokens (JSON)" section, any bare `json` fence in a non-technical asset, and the `robots.txt` / `sitemap.xml` fences in the website PRD. These stay intact in the hub, where they are the point.
- Backfill is not needed: normalization runs at render time, so existing assets clean up immediately.

## Technical notes

- Files: `src/components/hub/BrandStudio.tsx`, new `src/components/brand/BrandBoardSections.tsx` (shared by `ShareBrandBoard.tsx`), `src/lib/markdown-normalize.ts`, new `src/lib/share-content-filter.ts`, `supabase/functions/venture-share/index.ts`, `supabase/functions/_shared/deliverable-prompts.ts`.
- No schema changes.
- Verification: render the two known-bad assets (`pre_sell_offer_test`, `visual_identity_brief`) through the showcase and confirm no backticks, no info-strings and no JSON reach the reader.

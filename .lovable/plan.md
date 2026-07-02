# Let users override the on-image headline text

## What's happening today
The generator overlays a short headline on most covers (banner, thumbnail, poster, story). That text comes from `headlineFor(ctx)` in `supabase/functions/_shared/cover-art-director.ts`, which pulls in this order:

1. `brain.identity.tagline`
2. `brain.identity.one_liner`
3. `snap.tagline`
4. `snap.one_liner`
5. otherwise the venture name

The user can't touch it from the UI. Regenerating with feedback like "change the text to X" works inconsistently because the model treats it as a hint, not a rule.

## What we'll add
A first-class **Headline text** control in the Regenerate modal (and the same field re-used for first-time generation from the modal) with three modes:

- **Use suggested** (default) — current behavior, shows the derived headline as read-only preview.
- **Custom text** — free-text input (max 64 chars, matches current slice), becomes the ONLY allowed headline.
- **No text** — instructs the director to render the composition with zero rendered glyphs (logo composite still happens after).

The chosen value is passed through the whole pipeline and turned into a hard rule in the prompt, not a suggestion.

## UI changes
`src/components/hub/social/RegenerateAssetDialog.tsx`
- New section above Feedback: "Headline text" with three-way toggle + input.
- Live character counter (0/64).
- Show the current suggested headline as a hint when "Use suggested" is picked.
- `onSubmit` payload extended with `headlineOverride: { mode: "auto" | "custom" | "none"; text?: string }`.

`src/components/hub/social/AssetPreviewDialog.tsx`
- No structural change, but display the last-used headline in the sidebar (below "Last feedback") so the user can see what's on the current image.

## Client wiring
`src/lib/social-cover.functions.ts` and `src/lib/style-preview.functions.ts`
- Add `headlineOverride` to the `generateSocialCover` / `generateStylePreview` input types and forward it in the request body.

`src/lib/social-autopilot.functions.ts`
- Add `headlineOverride` to `generateOneKitTask` opts and forward.

`src/components/hub/social/SocialAutopilot.tsx`
- Thread the value from the Regenerate dialog through `regenerateSingle` and `regenerateAll` (already forwards palette/signature — same pattern).

## Edge function changes
`supabase/functions/venture-social-cover/index.ts` and `supabase/functions/venture-style-preview/index.ts`
- Parse `body.headlineOverride` with the same validation shape.
- Pass into `buildCoverArtPrompt({ ..., headlineOverride })`.
- Persist chosen headline on the asset row (`last_headline` text column, nullable) so the preview modal can show what shipped.

`supabase/functions/_shared/cover-art-director.ts`
- Extend `buildCoverArtPrompt` args with `headlineOverride?: { mode: "auto" | "custom" | "none"; text?: string }`.
- Update `headlineFor()` to accept the override and short-circuit:
  - `custom` → returned text (trimmed, ≤64 chars).
  - `none` → returns empty string AND we set a new flag `suppressHeadline = true`.
  - `auto` → today's behavior.
- Update `assetSystem()`:
  - When `suppressHeadline`, replace the current "if a headline is rendered" clauses with a strict "DO NOT render any headline, subhead, tagline, URL, or lettering anywhere on the canvas. The composition must work as pure image + reserved logo zone."
  - When custom text is provided, the existing "headline candidate: X" line becomes "HEADLINE (verbatim, exact wording, no substitutions): X". This closes the loophole where the model paraphrases.
- Also strengthen the top-level rules block: when `suppressHeadline`, remove the "single approved headline" carve-out from the forbidden-text rule.

## Database
One additive migration:
```sql
ALTER TABLE public.venture_social_assets ADD COLUMN IF NOT EXISTS last_headline text;
ALTER TABLE public.venture_style_previews ADD COLUMN IF NOT EXISTS last_headline text;
```
No RLS/GRANT changes — inherits existing table policies.

## Out of scope
- Multi-line headlines (still one line, ≤64 chars).
- Fonts/sizing overrides (still brand kit).
- Editing text on already-generated images (regeneration only).

Ship this and the user gets exact control over what text appears (or doesn't) on every generated cover.

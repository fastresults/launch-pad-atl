# Update Website PRD with the Live Brand

Once the Brand Wizard is complete (palette, typography, personality, moodboard, primary logo), the founder gets a one-click **Update Website PRD** button that rewrites the existing Website PRD so the whole brand — including a logo link that actually works outside this app — is baked into the paste-ready builder prompt.

## What the founder sees

1. In **Brand Studio** (and on the Website PRD asset itself), a button: **Update Website PRD with brand**.
   - Hidden/disabled until the brand kit is locked (or auto-derived).
   - Shows "Updating…" while it runs, then a toast and the refreshed PRD.
   - If no Website PRD exists yet, the button reads **Generate Website PRD** and creates it.
2. The refreshed PRD carries a **Brand System** section near the top: exact hex palette, the two Google Fonts, brand personality/voice, moodboard direction, and the primary logo with a real, clickable image URL.
3. The Section 8 paste-ready master prompt repeats the brand block verbatim, so pasting it into lovable.dev builds the site with the right colors, fonts, voice, and the actual logo image.

## The logo link problem (must fix)

Today the primary logo lives in a private storage bucket and is referenced by a **signed URL that expires in 7 days**. Pasted into an external builder it will 404 shortly after. Fix: serve published brand logos through a small public read-only endpoint so the PRD can embed a permanent URL.

- New public edge function `brand-logo` (no JWT): `…/functions/v1/brand-logo/{snapshotId}/{logoId}.svg`
  - Looks up the logo path on the venture's brand kit, streams the SVG from storage with long cache headers and CORS.
  - Only serves assets that are marked published/primary on that kit — nothing else is reachable.
- The brand kit stores this stable URL alongside the existing signed URL, and the PRD always uses the stable one.

## Technical notes

- `supabase/functions/_shared/venture-context.ts` → `brandKitBlock()` already injects palette/typography/voice/logo. Extend it to emit the **stable** logo URL, the moodboard image URLs, and the brand personality axes, plus an explicit instruction: embed the logo via `<img src="…">` in header and footer, and use it for the favicon/OG image.
- `supabase/functions/_shared/deliverable-prompts.ts` → `website_prd` prompt: add a mandatory "Brand System" section and require the Section 8 master prompt to restate the exact hex/font/logo-URL values inside the delimiters (no placeholders like `{brand color}`).
- New handler in `supabase/functions/venture-brand-assets` (or a small reuse of `venture-generate-document`): the button calls `venture-generate-document` with `documentType: "website_prd"` and a rewrite instruction "re-infuse the locked brand kit verbatim", preserving the existing PRD's strategy/IA and only re-skinning brand-dependent content.
- UI: add the button to `src/components/hub/BrandStudio.tsx` (visible when `status === "locked" | "auto"`) and to the Website PRD header in `src/components/hub/DocumentViewer.tsx`, reusing the existing `regenerateWebsitePrd` mutation path with new feedback text; invalidate the `hub` query and refresh the shown content.
- The existing incomplete-prompt guard (sections 1–11, word count, delimiters) still applies to the regenerated output.

## Out of scope

- No change to the Brand Wizard flow itself, and no change to the logo generation pipeline.

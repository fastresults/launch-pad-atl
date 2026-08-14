# Enforce exact logo selections across every asset page

## Verified diagnosis

This is no longer a picker or payload problem:

- The live brand-kit record stores `business_card.front = stacked/colour` and `business_card.back = stacked/colour`.
- The latest worker logs confirm both slots were explicitly requested and resolved as `stacked/colour`; neither used Auto nor a fallback.
- The correct stacked-colour source file exists in the locked logo inventory.
- The failure happens **after** selection: the renderer treats the template’s background as authoritative and can tint/repaint selected artwork for contrast. On the card front, the layout forces the mark onto a dark brand-colour field, then `markAt()` may flatten the chosen colour artwork. The result can visually resemble an inverse or malformed hybrid even though telemetry reports `stacked/colour`.
- Current quality checks verify visibility and size, but do not prove that the rendered paths match the selected source artwork. This incorrect result can therefore pass.
- The UI reports the selected/resolved label, not a verified final-render identity. This is why it can say “Stacked · Colour” while showing something else.

## Required behavior

A manual logo selection becomes a hard contract:

1. **Form is immutable:** stacked may never become horizontal, symbol, or wordmark.
2. **Tone/artwork is immutable:** colour may never be recoloured into inverse or monochrome.
3. **Contrast adapts the composition, not the logo:** if the exact selected artwork fails on a surface, change the local surface, add a deliberate brand-safe plate, or move the mark into a compatible layout zone.
4. **No silent fallback:** if the exact source is unavailable or cannot be placed legibly, block that page with a precise error and retain the previous valid output.
5. **Auto remains flexible:** AI may choose form, tone, size, and placement only for slots explicitly left on Auto.

## Phase 1 — Replace the permissive resolver

- Separate manual and Auto resolution paths in the collateral worker.
- For manual picks, load only the exact Form × Tone cell; remove cross-form and cross-tone fallback.
- Carry a stable source identity through rendering: variant, storage path, source hash, requested form/tone, and resolution mode.
- Reject invalid or missing manual cells before rendering instead of falling through to another logo.
- Continue reading old saved shapes, but normalize them into explicit per-slot choices before generation.

## Phase 2 — Make layout respond to the chosen logo

- Replace post-selection tinting with placement policy:
  - exact colour artwork on a compatible light or neutral field;
  - exact inverse artwork on a compatible dark field;
  - if the chosen artwork conflicts with the planned field, alter the field or use a restrained plate without modifying logo paths.
- Recompute the logo box, clear space, alignment, and surrounding copy from the exact artwork’s measured ink bounds.
- For the business card, build front and back from their independent selections. A stacked-colour pick gets a light-compatible lockup zone on both sides rather than being forced into the existing blue field.
- Keep AI optical sizing inside legal min/max bands. AI may size and position the selected artwork; it may not substitute or repaint it.

## Phase 3 — Build a complete page/slot manifest

Audit and register every logo placement:

- Business card: front and back.
- Presentation: cover, every repeated interior mark, and closing.
- Guidelines: cover plus every internal logo/specimen page where a mark appears.
- Proposal, invoice, and other multi-page exports: each cover, header, footer, or closing placement.
- Single-page digital and print assets: their primary/header placements.

For each rendered page, record page name/index, slot, manual vs Auto, requested and rendered Form × Tone, source identity, ink bounds, scale, alignment, surface, contrast result, and any plate/layout adaptation.

No logo may render outside this registry. Repeated placements inherit one choice only when the UI clearly labels that scope, such as “All interior slides.”

## Phase 4 — Add an invariant-based acceptance gate

Before publishing each page:

- Compare rendered metadata to the requested slot contract.
- For manual selections, require exact form, exact tone, and exact source hash.
- Detect tinting, fill replacement, substitution, missing artwork, clipping, undersizing, overflow, and low contrast.
- Identify failures by exact asset, page, and slot.
- Publish atomically per asset; never replace a valid multi-page set with a partial or non-conforming run.
- Persist the render manifest with generated files so the UI reports verified output rather than intent.

## Phase 5 — Make the admin UI unambiguous

- Show the actual selected-logo thumbnail beside every page/slot selector.
- Label manual choices **Exact** and automatic choices **AI selected**.
- Show a full page/slot assignment summary before regenerating a multi-page asset.
- Display **Verified: Stacked · Colour** only after final-render source verification.
- If the layout was adapted, state the harmless adaptation, such as “light logo field added,” without implying the logo was recoloured.
- Keep front/back and page names persistently visible in previews and filenames.

## Phase 6 — Regression and end-to-end coverage

Cover the complete matrix:

- Business-card front/back both set manually to stacked colour.
- Different manual selections on front and back.
- Presentation cover/running/closing with three distinct choices.
- Guidelines cover and internal specimen pages.
- Missing exact cell blocks instead of falling back.
- Manual colour on a dark field adapts the layout without tinting or substitution.
- Manual inverse on paper adapts the layout without tinting or substitution.
- Auto slots may recommend alternatives but must report what was used.
- Multi-slice retries preserve the same immutable assignment on every resumed page.
- Reloaded saved choices reproduce the same source identities.

Validate against the current Friendship House venture by regenerating the card and inspecting both SVG metadata and raster previews. Acceptance requires the exact stacked-colour source on both labeled sides, correct optical sizing, no clipping, and no silent recolouring.

## Technical scope

- Client selection/status: `BrandCollateral.tsx`, `CollateralPieceCard.tsx`, `collateral.functions.ts`
- Slot registry/normalization: both copies of `collateral-marks.ts`
- Worker resolution/persistence: `venture-collateral/index.ts`
- Rendering and quality gates: `_shared/collateral-svg.ts` and collateral tests
- Persistence: existing `venture_brand_collateral.meta` and `collateral_mark_choice` JSON; no new table is currently required
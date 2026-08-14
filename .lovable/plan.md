# Make logo selection available on every generated graphic

## Objective
Every admin-visible graphic that contains a logo will have the same compact split action shown in Branded Collateral:

```text
[ Generate / Regenerate ] [⌄]
```

The chevron opens the complete logo matrix for that exact graphic or page placement: Auto, every supplied Colour option, and every supplied Inverse option. The choice will be saved and enforced for that graphic’s next generation.

## Confirmed audit findings
- **Branded Collateral already has the correct interaction model:** its Generate/Regenerate button has a chevron menu and multi-page pieces expose each real placement separately (`CollateralPieceCard.tsx`).
- **Social Studio currently uses a large inline “Logo version” selector on Build-kit and Launch cards.** This is not the requested arrow drop panel attached to Generate/Regenerate (`SocialAutopilot.tsx`).
- **Content Studio cards have no logo chevron at all.** Logo choice appears only after opening the regeneration dialog (`ContentStudio.tsx`).
- **Social style-preview graphics have no logo-version control.** Their dialog is opened without an asset kind, logo inventory, saved pick, or used-mark metadata, and the style-preview worker still loads only the primary logo.
- **Several Social Studio regeneration paths open the dialog without passing logo picker inputs**, despite the dialog supporting them.
- **Studio choices are currently stored by broad surface class** (`studio_avatar`, `studio_cover`, `studio_post`, `studio_story`). That makes one choice affect multiple graphics and cannot satisfy “this exact graphic uses this exact logo.”
- **Bulk generation paths usually rely on the broad saved default rather than an explicit per-graphic choice.** The UI and worker therefore do not yet share a complete one-graphic/one-placement contract.
- **Preview dialogs show logo size but do not expose the exact logo-version chevron**, so an admin cannot change the logo from every place a graphic is acted on.

## Phase 1 — Create one authoritative graphic-placement registry
- Inventory every logo-bearing output produced by Branded Collateral, Social Studio, Content Studio, and all preview/regenerate flows.
- Define a stable placement key for each actual graphic using its durable identity rather than only its shape:
  - social asset: platform + asset kind (+ direction/asset ID when applicable)
  - content graphic: post ID + aspect
  - style preview: direction
  - collateral: piece kind + page/placement slot
- Keep existing geometry and AI recommendation logic, but make the registry the single source for whether a graphic has zero, one, or several logo placements.
- Unknown logo-bearing graphics must fail the coverage check instead of silently receiving the primary logo.

## Phase 2 — Standardize the compact split-button picker everywhere
- Extract the proven Branded Collateral chevron menu into one shared `LogoPlacementMenu` used by all studios.
- Replace the oversized inline Social Studio “Logo version” controls with a discrete chevron attached to each graphic’s Generate/Regenerate action.
- Add the split action to every Content Studio card, Social style-preview card, cover-art card, Launch avatar/cover card, and all other registry entries.
- Add the same logo menu to each graphic’s preview action area and regeneration dialog.
- For graphics with multiple logo placements/pages, show one clearly labeled section per placement, matching the collateral behavior.
- Always show all eight Form × Tone cells: Symbol, Horizontal, Stacked, and Wordmark in both Colour and Inverse. Unsupplied versions remain visible but disabled and labeled “Not supplied.”
- Show `Auto — [recommended version]` or `[selected version] — exact`, plus `Verified exact` after generation.

## Phase 3 — Persist choices per exact graphic and placement
- Replace broad surface-only persistence with a versioned per-graphic choice map while retaining broad surface values only as migration defaults.
- Use atomic backend mutation for picker updates so simultaneous selections cannot overwrite sibling graphics or page slots.
- On first read, migrate/fan out existing broad choices to matching graphics without losing current admin selections.
- Keep Auto as an explicit absence of a manual override for that exact placement; it must not erase selections for other graphics.
- Refresh all relevant cached views after save so card, preview, and dialog immediately show the same authoritative choice.

## Phase 4 — Enforce the choice through every generation path
- Pass the exact graphic key and per-placement selection through single generate, regenerate, batch generate, batch regenerate, launch regenerate, style-preview generation, and recovery/retry flows.
- Upgrade the style-preview worker from “primary logo” loading to the same exact Form × Tone resolver used by Social and Content generation.
- Resolve manual choices as immutable artwork: no recoloring, substitution, or fallback to another form/tone. Adapt the surface/plate for contrast instead.
- If a selected file is unavailable, stop that graphic with `EXACT_LOGO_UNAVAILABLE`; do not generate with another logo.
- Store requested and actually used Form × Tone + placement key in each generated graphic’s metadata.
- Ensure retries/background recovery reuse the original selection rather than rereading a later global default.

## Phase 5 — Close bulk and multi-placement gaps
- Before a bulk run starts, provide a compact “Logo choices” review listing every distinct placement included in that run.
- Preserve individual overrides; an optional “Apply to all compatible placements” action may set several choices deliberately but never implicitly.
- For multi-page graphics, send and verify every page/slot independently. A passing cover cannot mask a wrong running or closing mark.
- Regenerating one graphic must not change any sibling graphic’s selection.

## Phase 6 — Acceptance gates and regression coverage
- Add a registry coverage test that fails when a logo-bearing generator or graphic card has no registered picker placement.
- Add component tests confirming every registered admin graphic renders its chevron logo menu in card and preview/regenerate contexts.
- Add contract tests for all eight logo variants, unavailable variants, Auto recommendations, exact manual selection, and contrast adaptation without artwork mutation.
- Add generation-path tests for single, bulk, retry, recovery, style preview, Social, Content, and every multi-page slot.
- Add a pre-publish invariant: `requested graphic + placement + form + tone === rendered metadata`; a mismatch blocks publication.
- Verify in the live admin UI at desktop and mobile widths using a venture with all eight logo versions, including persistence after refresh and exact rendered output after regeneration.

## Completion criteria
- Every logo-bearing graphic exposes the chevron drop panel directly beside Generate/Regenerate and inside its preview/regeneration path.
- The admin’s selection applies only to the intended graphic and placement unless they explicitly choose a bulk apply action.
- Colour and Inverse options are both always represented.
- No generation, batch, retry, recovery, or style-preview path can silently use a primary/default/substitute logo after an admin makes an exact selection.
- Automated coverage fails future development if a new logo-bearing graphic is added without its picker and enforcement contract.
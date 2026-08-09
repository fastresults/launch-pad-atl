# Make "Regenerate website PRD" impossible to miss

Right now the only real one-click regenerate lives inside the Brand Wizard, on step 4 (Logo Studio), below the fold. Once you close the wizard it's gone. The hub card for the Website PRD offers a ghost "Rewrite" button that demands feedback text before it will do anything, and the viewer's regenerate action only appears when the builder prompt is detected as truncated. So after locking a brand there is no obvious "rebuild my site PRD with this brand" button anywhere.

## What gets added

**1. Brand Studio — a rebuild CTA right where the brand gets locked**
When the kit is locked, the Brand Studio panel gains a bar at the bottom: "Your Website PRD was written before this brand" (or "matches this brand" when current) plus a primary **Rebuild website PRD** button. One click, no feedback dialog. Shows a spinner while running, a success state with a **Read PRD** link when done. This is the same action buried in the wizard, surfaced where the founder actually ends up.

**2. Website PRD card in the deliverables list — a real Regenerate button**
When the PRD is complete, the card gets a visible **Regenerate** button beside **Read**, separate from the existing "Rewrite" (which stays, for when you want to give notes). Regenerate runs immediately with the current brand kit. When the card is already flagged stale (brand locked after the PRD was written), the button becomes the primary action on the card and the stale badge gets a one-line explanation.

**3. Document viewer — always-on regenerate**
The PRD viewer header gets a persistent **Regenerate** action instead of only exposing it as a repair path when the master prompt looks truncated. Same handler already implemented there; it just stops being conditional, and its confirm copy changes from "fix truncated prompt" language to a plain rebuild.

**4. After the wizard locks**
When the brand kit is locked from the wizard, the success toast gains a "Rebuild website PRD" action so the next step is offered at the moment it matters.

## Behaviour details

- Regenerating always uses the current locked brand kit, mark and palette — no extra input required.
- While a regenerate is in flight, all three entry points disable and show the same running state so the founder can't fire two at once.
- On success the PRD card's stale badge clears and the hub queries refresh.

## Technical notes

- `src/components/hub/BrandStudio.tsx` — new locked-state footer bar; reuses `generateDocument({ documentType: "website_prd" })` and `listSnapshotDocuments` (same calls as `BrandWizard.tsx` lines ~795-811), extracted into a small shared `useWebsitePrd(snapshotId)` hook in `src/components/hub/brand/use-website-prd.ts` so the wizard, studio and card share one mutation and one in-flight flag.
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — add the Regenerate button to the deliverable card action row (around line 1600); reuses the existing `genOne` mutation with no `rewriteFeedback`. Existing `staleLabel` / `brandKitLockedAt` logic drives the primary-vs-secondary styling.
- `src/components/hub/DocumentViewer.tsx` — make the existing `regenerateWebsitePrd` action unconditional in the header for `website_prd`, and drop the truncation-specific `rewriteFeedback` string when the user invokes it manually.
- `src/components/hub/brand-wizard/BrandWizard.tsx` — switch its local PRD mutation to the shared hook and add the toast action on lock.
- No backend, schema or prompt-pipeline changes.

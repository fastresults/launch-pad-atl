## Add facilitator decks to the Founders Hub (per snapshot), section-by-section

**Where**
`src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — the venture workflow currently has a "Generate this section" button per category but no deck button. The `/dashboard/workflow` page already has this pattern; we'll mirror it here.

**Changes (single file)**

1. **Imports:** add `Presentation`, `Lock` icons; `STAGE_DECKS`, `slugify` from `@/components/workshop-slides/registry`; `DeckDialog` from `@/components/workshop-slides/DeckDialog`.

2. **Deck-state map:** alongside the existing `categories` derivation, compute a `deckStateByCat: Map<string, { slug; available; unlocked; prevLabel }>`. Walk categories in order; a category's deck `unlocked = true` only after all prior non-bonus categories have every deliverable complete (reusing `completedKeys` + `catComplete` logic already in scope). Bonus categories don't gate later decks. `available` is true when a deck with that slug exists in `STAGE_DECKS` and is marked available.

3. **Dialog state:** `const [openDeckSlug, setOpenDeckSlug] = useState<string | null>(null)`.

4. **Category header buttons** (around line 805): keep "Generate this section" button, add a sibling button to its left:
   - Unlocked + available → `Open facilitator deck` (outline, Presentation icon) → `setOpenDeckSlug(deck.slug)`.
   - Locked (prior incomplete) → disabled `Unlocks after {prevLabel}` (Lock icon).
   - Available but no deck authored → disabled `Deck coming soon`.
   - Bonus categories always show as unlocked if a deck exists.

5. **Dialog mount:** render `<DeckDialog slug={openDeckSlug} onOpenChange={(o) => { if (!o) setOpenDeckSlug(null); }} />` near the bottom of the JSX (where other dialogs live).

**Notes**
- Slug mapping uses the same `slugify(category)` as the workflow page so existing decks (Foundation, Strategy, etc.) light up immediately for snapshots that share those labels.
- No backend or schema changes; gating is purely client-side from `completedKeys`.
- No changes to existing generate behavior or styling of "Generate this section".
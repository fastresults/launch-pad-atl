# Fix non-working accordion toggles on the Hub

## Audit result

After the studio restyle, three of the four new headers use `SectionHeader` but never actually toggle anything. The framework category rows (Strategy / Operations / …) still work correctly.

| Accordion | File | Toggle behavior | Status |
| --- | --- | --- | --- |
| Framework categories (Strategy, Operations, Finance, Marketing, Governance, Brand, Social & Content) | `hub.$snapshotId.tsx` ~1370 | `Collapsible` + `toggleSection(cat)` state | ✅ works |
| Brand Wizard & bonus tools (outer wrapper) | `hub.$snapshotId.tsx` ~1515 | `SectionHeader.onToggle` sets `details.open` imperatively | ❌ chevron/`aria-expanded` don't update; React state desynced from native `<details>` |
| Brand Studio | `BrandStudio.tsx` ~48 | `isOpen` hardcoded `true`, `onToggle={() => {}}` | ❌ click does nothing |
| Social Studio | `SocialStudio.tsx` ~56 | same as above | ❌ click does nothing |
| Content Studio (all 3 variants) | `ContentStudio.tsx` ~161/193/219 | same as above | ❌ click does nothing |

Root cause: the three studios were rewritten to reuse `SectionHeader` for its visual style, but never wired to any open/close state — the body is always rendered, and clicking the header is a no-op. The outer bonus wrapper tries to drive a native `<details>` element imperatively, which doesn't trigger a React re-render, so the chevron never rotates even when the panel actually opens.

## Fix plan (presentation + local state only, no logic changes)

### 1. Brand Studio, Social Studio, Content Studio
Each component gets its own `useState<boolean>(defaultOpen)` and:
- passes `isOpen={open}` and `onToggle={() => setOpen(o => !o)}` to `SectionHeader`
- wraps its existing body card in `{open && (...) }`

Default-open rules per studio (keeps current behavior):
- **Brand Studio** — open when kit is unlocked/in-progress, closed once `locked` (user rarely edits after lock)
- **Social Studio** — open when brand is locked and no strategy yet; else closed
- **Content Studio** — open on the active step; closed on the two gated variants (still show the explanatory paragraph, but collapsed body under a working chevron)

### 2. Brand Wizard & bonus tools wrapper (`hub.$snapshotId.tsx`)
Replace the imperative `<details>` with the same `Collapsible` + state pattern used by framework categories:
- Add `bonusOpen` to `openSections` state (or a dedicated `useState`), default matches current `(completeCount === total && total > 0) || !brandKitLocked`
- `SectionHeader.isOpen={bonusOpen}` / `onToggle={() => setBonusOpen(o => !o)}`
- Body wrapped in `<CollapsibleContent>` (or `{bonusOpen && …}`) — remove the `<details>/<summary>` wrapper entirely
- Preserve `brandStudioRef` scroll target on the outer `<section>`

## Files touched
- `src/components/hub/BrandStudio.tsx`
- `src/components/hub/SocialStudio.tsx`
- `src/components/hub/ContentStudio.tsx` (all 3 return branches)
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` (bonus wrapper only)

## Verification
Reload `/dashboard/hub/:id`. Click each of the four headers (Bonus wrapper, Brand Studio, Social Studio, Content Studio):
- chevron rotates
- `aria-expanded` flips
- body collapses/expands
- initial defaults match current UX (nothing that used to be visible on load becomes hidden)

Framework category rows remain untouched and continue to work.

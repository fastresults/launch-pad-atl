## Goal

The deliverable cards on the Home page currently read like generic buttons. Every one of these is *actually produced with you in the room*, so they should read as a checked-off list — a receipt, not a menu.

## The design direction: "checked in the room"

One editorial move, applied consistently to all 8 stage grids:

```text
┌──────────────────────────────────────────────┐
│  (✓)   Your one-page story              [ ]  │   ← filled check mark, left
└──────────────────────────────────────────────┘
        title, medium weight        topic icon, faint, right
```

- **Left: a real check mark.** A small filled circle (espresso/primary tint) with a white `Check` glyph — the visual anchor that says "done." Replaces the current colored topic icon in the lead position.
- **Right: the topic icon, demoted.** The existing Lucide icon moves to the far right at ~30% opacity, so the category cue survives without competing with the check.
- **Card treatment.** Softer, flatter surface than today's card: hairline border, subtle warm tint behind the check side, no heavy fill. Hover/focus lifts the border to primary and deepens the check circle — a gentle "it's yours" reaction rather than a button press.
- **Rounded corners stay** (matches the site's editorial pill language), but padding tightens slightly so the rows scan as a list rather than eight separate buttons.
- Tooltips, keyboard focus, and the `cursor-help` affordance all stay exactly as they are.

## Reinforcing copy (small, one line)

Under the section intro, add a single quiet line so the checks are unmistakable:

> *Every item below is checked off with you, in the room — not homework.*

Styled as small uppercase-tracked meta text matching the existing kickers.

## Technical notes

- New presentational component `src/components/home/DeliverableCheck.tsx` — renders one checked row (check badge, title, faint topic icon), so the markup isn't duplicated.
- `src/components/home/HomeFramework.tsx` — the `Framework()` stage grid swaps its inline `<li>` for `<DeliverableCheck />`; the tooltip wrapper stays.
- `src/components/landing/LandingFramework.tsx` — same swap, so the landing fork doesn't drift visually.
- All colors via existing semantic tokens (`primary`, `card`, `muted-foreground`, warm border tokens already in use). No hardcoded hex added.
- No data, copy content, or business-logic changes to `framework-deliverables.ts`.

## Verification

Screenshot the Home page framework section at desktop and mobile widths, confirm the checks read clearly on the warm background, hover/focus states behave, and tooltips still open.

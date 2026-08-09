# Make “Regenerate Website PRD” visible and functional

## Verified issue

- The attached screen is the Brand Wizard’s final **Voice & Review** step.
- Its persistent footer currently contains only **Regenerate style guide**, **Save to My Files**, and **Close**.
- A working Website PRD regeneration path already exists through `useWebsitePrd`, but the wizard only exposes it inside the earlier **Moodboard & Logo** step. That is why the action is absent from the screen shown.

## Implementation

1. **Add the missing primary action to the footer shown in the screenshot**
   - Place a clearly labeled **Regenerate Website PRD** button in the sticky final-review footer, beside the style-guide action.
   - Use the primary visual treatment and keep the full text label visible; do not hide it in an icon, menu, earlier step, or off-screen panel.
   - Keep it available for both new-brand and existing-brand tracks because both finish on this review screen.

2. **Connect it to the real shared regeneration workflow**
   - Wire the button to `useWebsitePrd(snapshot.id, kit.locked_at)` rather than creating a second PRD generation path.
   - Before regeneration, persist the current Voice & Review values so the PRD uses the latest voice, palette, typography, and selected logo set—not stale wizard data.
   - Trigger the existing Website PRD generation request, refresh the PRD query and hub assets, and preserve the shared success/error handling.

3. **Make every state explicit and usable**
   - Show **Generating Website PRD…** with a spinner while running and prevent duplicate clicks only during that request.
   - Label the first-run state **Generate Website PRD** when none exists and **Regenerate Website PRD** when one already exists.
   - Do not grey out the action because the style guide already exists or because the user is on the final wizard step.
   - Surface backend failures as a visible error toast and leave the button ready to retry.

4. **Confirm the result in place**
   - After success, show a compact confirmation/status beside the action, including that the Website PRD is current with the brand.
   - Keep the existing Brand Studio and asset-viewer PRD controls connected to the same hook so all entry points report one consistent state.

## Files

- `src/components/hub/brand-wizard/BrandWizard.tsx` — add and wire the final-review footer action and latest-brand save sequence.
- `src/components/hub/brand/use-website-prd.ts` — only adjust shared status/error behavior if needed for the footer confirmation; no duplicate mutation.

## Verification

- Open the Brand Wizard on **Voice & Review** and confirm the button is visible in the sticky footer at desktop and mobile widths without horizontal clipping.
- Click it and verify the button enters its loading state, makes one Website PRD generation request, then returns to an enabled success state.
- Confirm the regenerated asset contains the current company name, selected logo, palette, typography, and voice.
- Confirm a failed request shows the error and can be retried without closing or changing wizard steps.
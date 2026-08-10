# Make "Lock brand kit" prominent

Today, locking the brand kit is hidden. In the Brand Wizard's final step the action is an `outline` button labeled "Generate brand style guide", sitting fourth in a crowded footer row next to Website PRD, Mood Board, Save to My Files and Close. Nothing on that button says it locks the brand, and outside the wizard there is no lock action at all — the Brand Studio panel only offers "Resume wizard".

(Confirmed: `BrandWizard.tsx` StepReview footer button calls `generateStyleGuide`, and the `styleguide` action in the brand wizard function is what sets `status: "locked"` + `locked_at`.)

## What changes

**1. Wizard step 5 — a real lock CTA**
- The style-guide button becomes the single primary action in the footer, labeled **Lock brand kit** (and **Regenerate style guide** once already locked), with a lock icon and a size bump so it reads as the terminal step.
- The other footer buttons (Website PRD, Mood Board, Save to My Files) drop to ghost/secondary so only one thing looks like the next step.
- Above the footer, when the kit is unlocked and palette + typography are set, add a highlighted "Ready to lock" bar: one line explaining that locking writes the style guide and feeds brand tokens into the Website PRD, collateral and social assets, plus the same **Lock brand kit** button.
- When palette or typography is missing, the button stays disabled with a tooltip naming exactly what's missing instead of silently greying out.
- Once locked, the bar switches to a green "Brand kit locked · <date>" confirmation.

**2. Brand Studio panel — lock without reopening the wizard**
- When a kit exists but is not locked, the Brand Studio header gains a primary **Lock brand kit** button beside "Resume wizard", running the same action with a spinner and success toast.
- Disabled with an explanatory tooltip if palette/typography aren't set yet — clicking that state opens the wizard at the step that's missing.
- After locking, the panel refreshes and the existing locked-state Website PRD bar appears as it does today.

**3. Super Admin parity**
- Same UI, no admin-only branch: admins viewing or impersonating a member's venture see the identical prominent lock CTA, since the wizard and studio already run under the impersonated user.

## Technical notes

- `src/components/hub/brand-wizard/BrandWizard.tsx` — StepReview: restyle the footer, add the "ready to lock"/"locked" bar above it, reuse the existing `lock` mutation and `kit.locked_at`/`kit.guide_markdown` state.
- `src/components/hub/BrandStudio.tsx` — add a `lock` mutation (`generateStyleGuide` from `src/lib/brandKit.functions.ts`) and a header button gated on `kit && !locked`, invalidating `["brandKit", snapshot.id]` on success.
- No backend, schema or edge-function changes; locking already happens server-side in the `styleguide` action.

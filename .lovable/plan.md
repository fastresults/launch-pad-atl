## Problem

In `DeckDialog.tsx` the slide stage is broken:

- `DialogContent` (shadcn) uses `grid` by default — so `flex-1` on the inner slide wrapper does nothing.
- `ScaledSlide` measures its parent's height as ~0 and the scale calculation falls back to 1.
- Result: the 1920×1080 slide renders unscaled, pushed to the bottom of the modal with a huge black void above it (exactly what the screenshot shows).

It's also missing facilitator UX basics: real fullscreen, slide counter that's actually visible, ESC to close hint, a thumbnail rail to jump between slides, and a progress bar.

## Plan

### 1. Fix the scaling/layout bug (root cause)

Update `src/components/workshop-slides/DeckDialog.tsx`:

- Add `flex flex-col` to `DialogContent` so children stack vertically.
- Give the slide stage `flex-1 min-h-0` (the `min-h-0` is required or flex children won't shrink and `ResizeObserver` reports wrong height).
- Render `ScaledSlide` inside an explicit `relative w-full h-full` wrapper so its parent has a real measured box.

This alone makes the slide fill the modal correctly at any viewport.

### 2. Make the modal feel like a real presenter

Same file (`DeckDialog.tsx`):

- **Top bar:** deck title (left) · slide title (center, truncated) · `Slide X / N` + `Esc` hint (right). Auto-hides after 3s of mouse inactivity, reappears on mousemove.
- **Bottom bar:** thin progress bar (`width: (index+1)/total %`) plus a horizontally scrollable thumbnail strip. Each thumbnail is a mini `ScaledSlide` in a 160×90 box; clicking jumps to that index; current one gets a ring.
- **Nav buttons:** keep ←/→ pills but also auto-hide with the chrome.
- **Fullscreen toggle:** button in top bar (`Maximize2` icon) that calls `requestFullscreen()` on the dialog content; `F` key shortcut; handles `fullscreenchange` to sync state.
- **Keyboard:** keep ←/→/Space; add `Home`/`End` (jump to first/last), `F` (fullscreen), and let `Esc` close as Dialog already does.

### 3. Minor polish

- Use `bg-background` instead of hard `bg-black` so it respects the design tokens.
- Add `aria-label="Facilitator deck"` and live region announcing slide changes for screen readers.
- Mobile/tablet: drop thumbnail rail under `md:` and stack the top bar onto two lines.

### Files touched

- `src/components/workshop-slides/DeckDialog.tsx` — layout fix + presenter UX (only file that changes).
- No changes to `ScaledSlide`, `SlideDeck`, registry, or individual slides — the bug is purely in the modal wrapper.

### Validation

- Open any unlocked deck from `dashboard/hub/$snapshotId` and from `dashboard/workflow` — slide fills the modal at desktop, tablet, and mobile widths.
- Resize the window: slide rescales smoothly via the existing `ResizeObserver`.
- Arrow keys, thumbnail clicks, fullscreen toggle, and Esc all work.

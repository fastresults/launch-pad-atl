## Goal

When the Atlanta snapshot modal opens, give the visitor a second, lower-commitment path next to "Reserve my seat": **Learn more** — which closes the modal and smooth-scrolls them to the section directly below the hero, keeping them on the homepage.

## What to change

### 1. Anchor the section below the hero
In `src/components/home/HomeFramework.tsx`, give the `HeroCopy` section a stable id (`id="learn-more"`) and `scroll-mt-24` so the sticky header doesn't cover the top when scrolled to.

### 2. Add the "Learn more" action to the modal
In `src/components/home/IdeaSnapshotModal.tsx`:

- Add a `learnMore()` handler: close the dialog, then on the next frame `document.getElementById("learn-more")?.scrollIntoView({ behavior: "smooth", block: "start" })` (respecting `prefers-reduced-motion` → `behavior: "auto"`). Deferring past close avoids the dialog's scroll-lock cancelling the scroll.
- Place it in two spots:
  - **Sticky footer bar** — a secondary text/ghost button "Learn more ↓" beside the primary **Reserve my seat**, so it's on screen from first paint (loading and error states included).
  - **Inline invite card** at the end of the read — replace/join the current "Ask a question first" row with "Not ready to reserve? Learn more about the morning ↓".
- Styling stays inside the existing cinematic tokens: primary keeps `.hero-cta`, secondary uses the muted underline/ghost treatment already used for "Ask a question first" so the hierarchy reads clearly.

### 3. Workflow shape after the change

```text
type idea → modal opens
  ├─ Reserve my seat  → /register?idea=…   (primary, unchanged)
  └─ Learn more ↓     → close modal → smooth scroll to #learn-more (stays on homepage)
```

## Technical notes

- Files touched: `src/components/home/IdeaSnapshotModal.tsx`, `src/components/home/HomeFramework.tsx`. No backend or AI-prompt changes.
- Verify with Playwright at desktop and mobile widths: modal opens, "Learn more" is visible without scrolling, clicking it closes the modal and lands the viewport at the top of the section below the hero.

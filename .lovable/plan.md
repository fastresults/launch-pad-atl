## What I verified before planning

- The published CSS at `startuplabs.online` (`/assets/index-CADe4gN9.css`) **already contains this morning's fixes** — the fluid `clamp(2.05rem, 1.15rem + 3.1vw, 4rem)` headline, the `clamp(11rem, 8.2rem + 8vw, 15rem)` glass card, and the `--breakpoint-lg: 60rem` override. So this is **not** a stale deploy: the published build is current, and the oversized rendering is what the current CSS actually produces at your monitor's width.
- Tailwind v4 is in use, so the `--breakpoint-lg` token in `@theme inline` is valid and live.
- Comparing the two screenshots at the same image width: the target (3.18.51) has a headline that occupies roughly half the frame width with wide side gutters and a card clearly inset from the edges. The broken published view (3.03.32) has the headline nearly edge-to-edge and the glass card running almost full-bleed. That is the `4rem` upper cap plus the `max-w-[1100px]` card being too wide relative to the surrounding gutters at large viewports — the elements keep growing while the whitespace around them does not.

## Step 1 — Measure the real published page (no guessing)

Drive Playwright against `https://startuplabs.online` at 1280, 1440, 1512, 1728 and 1920 CSS px and record computed values for: H1 font-size, H1 box width, glass card width and height, header nav font-size and total nav width, and the left/right gutter in px. Capture a screenshot at each width. Do the same against the local preview so I can pin the exact delta between "what you see published" and "what the target looks like". No CSS changes until those numbers are in hand.

## Step 2 — Rescale the hero to the target proportions

Based on the measurements, adjust in `src/styles.css` and the hero components only:

- **Headline**: lower the clamp ceiling so the H1 stops growing at a size that keeps roughly 2:1 headline-width-to-gutter proportion at 1512–1920px (expected landing around 3.1–3.4rem rather than 4rem), keeping the fluid middle term so nothing snaps.
- **Glass card**: reduce the max width from `1100px` to a narrower measure so real gutters appear at wide viewports, and lower the `min-height` clamp ceiling so the card stops reading as an empty slab. Card width and headline width stay locked to the same container.
- **Vertical whitespace**: increase the space above the kicker and between headline → card → "now building" line so the group breathes rather than stacking tight, matching the target's rhythm.

## Step 3 — Rescale the header

`src/components/site/Header.tsx`: bring nav font-size, item gap and the CTA pill back to the target's compact scale, and cap the header's inner container so the logo and CTA don't ride the extreme viewport edges at 1920px. Nav item visibility stays as it is now — the current set matches the target screenshot.

## Step 4 — Verify against both surfaces

Re-capture local at 1280/1512/1920 and confirm the measured H1 size, card width and gutters match the target proportions. After you publish, re-measure the live domain the same way to confirm the shipped build matches. Scope stays hero + header; no other public page is touched.

## Technical note

The root issue is that the hero's fluid sizing has no upper restraint proportional to viewport width — `4rem` type inside an `1100px` card inside a `max-w-6xl` (1152px) container means at 1920px the content block is only ~60% of the screen but every element inside it is at its maximum. Capping the element scale while letting the container gutters grow is what produces the whitespace in your target shot.

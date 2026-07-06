
# Attract-loop pulse on the 14-day sprint tiles

## Goal

First-time visitors don't realize the day cards are clickable. Add a subtle "attract" animation that walks a soft pulse from Day 1 → Day 14, one tile at a time, until the user interacts. On any real interaction the loop stops permanently for that user + sprint.

## Behavior spec

- **What pulses**: a single tile at a time, in order Day 1, 2, 3, … 14, then back to 1.
- **Pulse look**: a soft outline ring that fades in (0.9s) and fades out (0.9s) on the active tile, plus a very small scale (1 → 1.03 → 1). Not bouncy, not distracting. Reduced-motion users get only a static ring cue on the current tile (no scale, no continuous animation).
- **Cadence**: ~1.8s per tile. One day gets highlighted at a time; the currently-open day (`openDay`) is skipped so the loop doesn't fight the ring already on the user's active card.
- **Start**: begins ~1200 ms after the planner mounts (avoids competing with page-in fade). Only runs if the sprint isn't 100% complete — a finished sprint doesn't need a nudge.
- **Stop conditions** (any one):
  1. User clicks any day tile.
  2. User hovers any day tile (mouse) or focuses one via keyboard.
  3. User clicks anywhere inside the planner card (Open Day Deck, sort toggle, an asset row).
  4. User scrolls the planner off-screen (via `IntersectionObserver` — pauses; resumes if they scroll back and haven't dismissed).
- **Persistence**: once stopped by real interaction (not just scroll-away), write a flag to `localStorage` under `hub:sprintAttractDismissed:<snapshotId>`. Future visits to this sprint never replay the loop.
- **Accessibility**: the pulse is decorative — no `aria-live`, no focus change, no keyboard trap. Respects `prefers-reduced-motion: reduce` by rendering a single static hint ring on Day 1 only.

## Implementation

All changes live in `src/components/hub/LaunchPlanner14Day.tsx` plus one small keyframe in `tailwind.config.ts`.

**1. New keyframe + animation utility** in `tailwind.config.ts`:

```ts
keyframes: {
  "attract-pulse": {
    "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0)", transform: "scale(1)" },
    "50%":      { boxShadow: "0 0 0 6px hsl(var(--primary) / 0.35)", transform: "scale(1.03)" },
  },
},
animation: {
  "attract-pulse": "attract-pulse 1.6s ease-in-out",
},
```

**2. Planner state and effect**:

```ts
const attractKey = `hub:sprintAttractDismissed:${snapshotId}`;
const [attractIdx, setAttractIdx] = useState<number | null>(null);
const [attractOn, setAttractOn] = useState(false);
const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
const sprintDone = daysWithState.every((d) => d.state === "complete");

useEffect(() => {
  if (prefersReducedMotion || sprintDone) return;
  if (localStorage.getItem(attractKey)) return;
  const start = window.setTimeout(() => setAttractOn(true), 1200);
  return () => window.clearTimeout(start);
}, [attractKey, prefersReducedMotion, sprintDone]);

useEffect(() => {
  if (!attractOn) return;
  let i = 0;
  setAttractIdx(daysWithState[0].day.day);
  const tick = window.setInterval(() => {
    i = (i + 1) % daysWithState.length;
    // skip whichever day the user has open so the two cues don't stack
    let next = daysWithState[i].day.day;
    if (next === openDay) { i = (i + 1) % daysWithState.length; next = daysWithState[i].day.day; }
    setAttractIdx(next);
  }, 1800);
  return () => window.clearInterval(tick);
}, [attractOn, openDay, daysWithState]);

const dismissAttract = useCallback((persist = true) => {
  setAttractOn(false);
  setAttractIdx(null);
  if (persist) { try { localStorage.setItem(attractKey, "1"); } catch {} }
}, [attractKey]);
```

**3. Wire dismissal**: wrap the planner root in a single `onClickCapture={() => dismissAttract()}` and `onMouseEnterCapture` / `onFocusCapture` on the tile grid. The existing `onClick={() => setOpenDay(day.day)}` still fires normally after the capture-phase handler.

**4. Apply the ring**: in `renderTile`, add:

```ts
const attracting = attractIdx === day.day && !isOpen;
const attractClass = attracting
  ? "animate-attract-pulse ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
  : "";
```

Reduced-motion fallback: instead of the animation, render a static `ring-2 ring-primary/40` on Day 1 only, cleared on first interaction.

**5. Pause when off-screen**: an `IntersectionObserver` on the planner root sets `attractOn` false when `intersectionRatio < 0.2` and true again when it re-enters (only if not persisted-dismissed). This avoids animating in a background tab or below the fold.

## Why this approach

- **Sequential, not simultaneous**: one moving pulse reads as guidance ("click these"), whereas pulsing all 14 at once reads as an error/emergency.
- **Skips the already-open day**: prevents the double-highlight confusion in the screenshot where Day 2 is already ringed.
- **Persisted dismissal**: novices see it once, power users never see it again.
- **Pure CSS keyframe + interval**: no animation library, no layout thrash, ~40 lines of code.

## Out of scope

- Any change to card content, colors, layout, or click behavior.
- Attract cues elsewhere on the page (asset library rows, roadmap card).
- Onboarding tour / coach-mark overlays — heavier pattern, not asked for.

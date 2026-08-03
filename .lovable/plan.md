# Stabilize the hero: fix the memory leak behind display deterioration

## What's actually happening

The hero renders all 107 scene photos into the page at once. Each is a 1536×1024 JPEG that the browser must decode to a raw bitmap — roughly 6 MB of memory each, about 650 MB if every scene decodes. On top of that, every one of the 107 images carries `will-change: opacity, transform` plus a continuously running Ken Burns animation, so the browser also promotes each to its own GPU compositor layer.

That is why the page looks fine at first and degrades after several rotations: images decode progressively as the rotation advances, memory climbs, the compositor runs out of headroom, and the browser starts dropping frames, flashing blank scenes, and evicting decoded bitmaps (which then re-decode, causing the jerk and the washed-out/stuck frames).

Confirmed in the code: `CinematicHero.tsx` maps every scene to an `<img>`; `.sl-hero__scene` in `public.css` applies `will-change` and an infinite animation to all of them; `src/assets/scenes/` holds 107 files at 1536×1024.

## The fix

**1. Render only a small window of scenes (the core fix).**
Instead of 107 `<img>` elements, keep only three mounted at any time: the previous scene (fading out), the current scene, and the next scene (preloaded and ready). The rotation order and cadence stay exactly as they are today — three-lane shuffle, random start, no repeats. Only the DOM changes.

Effect: peak decoded memory drops from ~650 MB to under ~20 MB, and compositor layers drop from 107 to 3. Memory stays flat no matter how long the page is left open.

**2. Preload the next image before it's shown.**
The next scene is fetched and decoded off-screen (via the browser's image decode API) while the current one is on screen, so the crossfade never starts against an undecoded image — this removes the flash/jerk that appears once the browser starts thrashing.

**3. Restrict `will-change` to the two images actually animating.**
Applied to the active and outgoing scene only, dropped from everything else.

**4. Shrink the source images.**
The hero never displays more than ~1920px wide on a normal screen and the files are 1536×1024 at ~120 KB each. Re-encoding at a tighter quality and adding a `sizes`/`srcset` pair keeps the same visual quality while cutting decode cost further. This is a secondary win — the windowing in step 1 is what actually fixes the problem.

**5. Verification.**
Load the hero in a headless browser, let it run through 15+ rotations, and sample JS heap and DOM node count at the start and end to confirm both stay flat. Screenshot mid-crossfade to confirm the fade still looks smooth.

## Technical notes

- `src/components/home/CinematicHero.tsx`: derive `visibleScenes` from `index` (prev/current/next by modulo), render only those with stable `key={scene.id}`, and keep the existing `data-active` crossfade contract so no CSS rewrite is needed.
- Drop the `style={{ animationDelay }}` per-index hack — with three elements it no longer serves a purpose and it forces a style recalc on every render.
- Add a small `useEffect` that constructs `new Image()` for the next scene and awaits `decode()`, guarded against unmount.
- `src/public.css`: move `will-change` off the base `.sl-hero__scene` rule onto `[data-active="true"]` and a `[data-leaving="true"]` state; keep the drift animation and 1400 ms fade unchanged.
- `src/hooks/use-scene-cycle.ts` and `src/lib/founder-scenes.ts` are unchanged — timing and ordering logic stay as-is.

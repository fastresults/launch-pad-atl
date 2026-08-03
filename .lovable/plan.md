## What the two screenshots actually show

Both screenshots are the same macOS screen, same browser, same window size — but:

- **Editor shot:** the app renders inside the Lovable preview pane (~1530 image px wide) and shows the full desktop nav at normal text size.
- **Published shot:** the app fills the same screen (~1920 image px) but every element is roughly **2x larger** — header bar, logo, nav links, H1, prompt box.

Same machine, same window, same day. If this were a build/CSS difference, the published page would be *differently laid out*, not *uniformly scaled*. Uniform scaling of everything, including the browser-drawn text metrics, is what **per-origin browser zoom** looks like. Chromium-based browsers (Comet included) persist a zoom level **per domain**, so `lovable.dev` can sit at 100% while `startuplabs.online` sits at ~175–200% forever, across reloads and new tabs.

This also explains every earlier dead end: our diagnostics measured the effective CSS viewport at ~1027px on a "1400px monitor", and every CSS fix we shipped was correct in the sandbox and "broken" live.

**This is a diagnosis, not yet a confirmation.** Step 1 below proves or kills it in one page load, and the plan continues either way.

## Step 1 — Confirm with the logging already shipped

Open `https://startuplabs.online/` and read the `[layout]` console line (or run `window.__slViewportLog`). The decisive fields:

```text
cssViewportWidth   ~960–1030   (vs. the real 1400+ monitor)
screenWidth        1400+
effectiveZoom      ~1.4–2.0    ← anything above ~1.05 means browser/OS zoom
devicePixelRatio   2
```

Then press **Cmd+0** (reset zoom) on that tab and reload. If `cssViewportWidth` jumps to ~1400 and the page instantly looks like the editor, the cause is confirmed and it was never the build.

If `effectiveZoom` comes back ~1.0 and the page is still magnified, the cause is a real publish-time divergence — in that case the plan pivots to Step 2b instead.

## Step 2a — If it is browser zoom (expected)

The site should not depend on the visitor being at 100% zoom. Three changes:

1. **Drop the forced-desktop hack.** Remove `min-width: 1024px` on `.public-surface` / `.sl-site-header` and the block of `sm:`/`md:`/`lg:` utility overrides added last turn. They were built to fight a symptom that isn't a layout bug, and they break genuine phone visitors.
2. **Restore the responsive header,** including the mobile nav path removed last turn, so real phones get a real phone layout again.
3. **Make the 960–1240px band look deliberate.** Add one honest desktop-compact tier: H1 ~38px, section padding reduced, container gutters tightened. A zoomed-in visitor at an effective 1000px then sees a correct, well-proportioned page instead of an oversized one.
4. **Optional, one line of UI:** when `effectiveZoom > 1.25`, show a dismissible bar — "Your browser is zoomed to 175%. Press Cmd+0 for the full layout." Non-blocking, remembers dismissal.

## Step 2b — If zoom is ~1.0 and it is still magnified

Then the published bundle genuinely differs from the sandbox bundle. Sequence: capture the served CSS asset hash from `data-css-bundle` on `<html>` live vs. local build output, diff the two `public.css` payloads, and confirm whether the deployed HTML shell (which hosting rewrites — it injects og:image and the badge) still carries `<meta name="viewport" content="width=device-width, initial-scale=1.0">`. A dropped or altered viewport meta on the served shell would produce exactly this uniform magnification.

## Technical notes

- Files touched in Step 2a: `src/public.css` (remove min-width + utility overrides, add the compact tier), `src/components/site/Header.tsx` (restore mobile nav), optionally a small `ZoomNotice` component.
- `src/lib/viewport-log.ts` stays as-is — it's the instrument that settles this.
- No changes to routes, copy, or backend.

## What I need from you

Load the published site, open the console, and paste the `[layout]` line — specifically `cssViewportWidth`, `screenWidth`, and `effectiveZoom`. That single line decides between 2a and 2b and ends the guessing.

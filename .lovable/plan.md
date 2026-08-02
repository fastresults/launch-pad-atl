# Forensic Rendering Recovery Plan

## What is confirmed now

- The published Lovable URL and both custom-domain variants currently return the same JavaScript and CSS asset names: `index-k8_BAsbK.js` and `index-Cb3UrhUH.css`.
- Their HTML is served with revalidation/no-cache semantics, so there is no current evidence that the custom domain alone is serving an older stylesheet.
- The app has one correct viewport meta tag and no application code that applies global browser `zoom`.
- The authenticated editor-preview URL cannot be compared anonymously; previous checks that treated localhost as equivalent to the actual editor preview did **not** prove preview/publish parity.
- A build timestamp currently changes the JavaScript asset graph on every build even when source is unchanged. That is a real deployment-integrity defect, but it does not yet prove the magnification cause.
- The decisive clue is that identical deployed asset names can still appear at different visual scales. Therefore the next investigation must start after asset delivery: effective CSS viewport, per-origin browser zoom, DPR, loaded fonts, runtime CSS, or host injection.

No further typography or breakpoint tweaking will be done until the first divergent measurement is identified.

## Phase 1 — Add a non-invasive rendering fingerprint

Create an opt-in diagnostic mode, activated only by a query parameter, that displays and copies a safe rendering fingerprint containing:

- hostname, route, release ID, CSS asset filename, and JS asset filename
- `innerWidth`, `clientWidth`, `outerWidth`, `screen.width`, `devicePixelRatio`, and `visualViewport.scale`
- matched responsive tiers at 640, 960, 1024, 1280, 1400, and 1440 CSS pixels
- root font size and loaded font family/status
- computed font size, line height, width, height, transform, and zoom for the header, H1, prompt panel, and first content-section heading
- active `.public-surface` presence and stylesheet order

This contains no account data or secrets. It gives us the actual facts from the user’s browser, where the defect occurs.

## Phase 2 — Prove the first divergence

Capture the fingerprint and screenshots from the same browser window for:

1. actual Lovable editor preview
2. published Lovable URL
3. `startuplabs.online`
4. `www.startuplabs.online`

Test `/`, `/services`, and `/build` at the same window dimensions. First reset browser zoom to 100% on each origin, because Chromium stores zoom per origin and a custom domain can remain at 125% while the preview origin is at 100%.

Classify the first mismatch into exactly one layer:

```text
artifact -> viewport/zoom -> font -> CSS cascade -> DOM -> hosting injection
```

- Different release/assets: deployment artifact problem.
- Same assets but different DPR/viewport scale: per-origin browser zoom or display-scaling problem.
- Same viewport but different computed font: font loading/fallback problem.
- Same font but different computed geometry: cascade/media-query problem.
- Same computed geometry but different screenshot: browser compositing or injected-host behavior.

## Phase 3 — Make builds deterministic

Remove the wall-clock timestamp from the shared JavaScript bundle and use the content-derived release ID as the stable build identity. Keep one authoritative release marker in HTML and runtime diagnostics.

This prevents identical source from generating a completely new chunk graph on every preview and publish build, removes false parity failures, and reduces stale lazy-chunk risk.

## Phase 4 — Apply only the proven fix

Implement the correction selected by Phase 2 evidence:

- **Per-origin zoom:** add a clear one-time diagnostic warning when effective scaling differs; do not distort site CSS to compensate for a browser setting.
- **Viewport mismatch:** make the public shell respond to measured container width and remove the specific breakpoint seam proven by the trace.
- **Font mismatch:** self-host the two public fonts with explicit metrics/fallbacks so preview and production cannot differ by remote font timing.
- **Cascade mismatch:** remove only the winning conflicting rules identified by computed-style provenance; no additional global overrides.
- **Artifact mismatch:** correct publish/version behavior and verify that HTML references only assets present in that deployment.
- **Host injection:** isolate or remove the injected behavior after confirming its effect in a controlled A/B capture.

## Phase 5 — Establish a real parity gate

Replace the current localhost-versus-production assumption with a reproducible gate that records, for every public route at 390, 1024, 1400, and 1576 CSS pixels:

- release and asset fingerprints
- viewport/DPR/font data
- computed geometry snapshots
- screenshots
- overflow and console errors

The gate must fail on any unexplained geometry difference, missing asset, font fallback, or release mismatch.

## Acceptance criteria

- The actual editor preview, published Lovable URL, and both custom-domain hosts report the same release and computed geometry at the same CSS viewport and zoom.
- At 1400 CSS pixels, H1, header, prompt panel, and content-section measurements remain within a 1px geometry tolerance across origins.
- `/`, `/services`, and `/build` visually match at desktop and tablet widths with no overflow or unexpected breakpoint change.
- Two consecutive builds from unchanged source produce the same content-derived release identity and stable output graph.
- The final report records the confirmed root cause, the exact evidence that proved it, and the single corrective change—no more speculative CSS patches.
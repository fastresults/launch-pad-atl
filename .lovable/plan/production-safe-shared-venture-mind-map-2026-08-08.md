# Production-safe shared venture mind map

## Goal

Restore the shared-link mind map so it loads reliably after publishing while preserving the animated, exploratory experience: floating nodes, curved connectors, and directional data-flow dots.

## Confirmed current state

- The public mind map is lazy-loaded inside an error boundary.
- The screenshot is the boundary fallback, which means the page survives but `ShareMindMap` or its force-graph dependency throws before producing a usable canvas.
- The current implementation combines a continuously painted canvas, a force simulation, curved links, directional particles, custom node painting, resize observation, and imperative force configuration.
- The existing boundary only logs the failure and offers no retry or diagnostic detail to the visitor.

The exact production exception is not present in the available runtime snapshot, so the repair will remove the fragile runtime path rather than guess at one canvas callback.

## 1. Replace live force physics with a deterministic SVG map

- Remove `react-force-graph-2d` and `d3-force` from the public shared-link mind map only; the internal founder mind map remains unchanged.
- Compute a stable radial layout from the current venture payload:
  - venture at the center;
  - section clusters distributed around it;
  - each section's assets arranged in a local arc around their cluster.
- Derive positions from stable keys so nodes do not jump between visits, browser sizes, or rerenders.
- Scale the layout from the measured container with guards for zero, missing, or non-finite dimensions.
- Cap initial visual density and reveal labels based on zoom, hover, and selection so 60+ assets remain legible.

## 2. Preserve the intended motion without a perpetual simulation

- Render curved SVG paths for venture → section → asset relationships.
- Add lightweight CSS/SVG animation for:
  - subtle independent node breathing and vertical drift;
  - soft node glows;
  - dashed connector drift;
  - small directional dots moving outward along each path.
- Pause decorative animation when the tab is hidden and honor `prefers-reduced-motion`.
- Avoid per-frame React state updates and endless physics ticks, keeping CPU and memory predictable on published pages and mobile devices.

## 3. Restore useful interaction and accessibility

- Support pointer drag to pan, wheel/pinch zoom, and a visible reset-view control.
- Make every asset node keyboard focusable and open the correct asset on click or Enter/Space.
- Highlight the connected branch on hover/focus and expose complete node labels through accessible names/tooltips.
- Use larger touch targets and fewer simultaneous animated flow dots on mobile.
- Keep the map clipped to its panel and prevent gestures from breaking the surrounding shared-link layout.

## 4. Harden loading and failure recovery

- Render only after valid payload sections and usable container dimensions exist.
- Sanitize duplicate/missing node keys, empty labels, invalid brand colors, and unexpectedly large section payloads before layout.
- Reset the error boundary when the venture/share identifier changes.
- Replace the dead-end fallback with a compact retry action plus links back to Contents and Ask this venture.
- Keep lazy loading so the map does not delay the initial shared page or chat experience.

## 5. Production verification

- Verify the actual public `/v/...` route, not only the authenticated venture hub.
- Test direct load, Ask → Mind map tab switching, repeated switching, node opening, resizing, and navigation between shared ventures.
- Test desktop and narrow mobile viewports with normal and reduced motion.
- Confirm no console errors, blank canvas, runaway CPU animation, horizontal page overflow, or layout movement after the map opens.
- Confirm a large 60+ asset payload stays interactive and the rest of the shared page remains responsive.

## Technical scope

- `src/components/share/ShareMindMap.tsx`: replace the force-canvas implementation with deterministic responsive SVG layout and bounded animation.
- `src/components/share/MindMapBoundary.tsx`: add reset/retry behavior and actionable fallback navigation.
- `src/components/share/ShareBrain.tsx`: provide the share identity/reset key and wire fallback actions to the existing tabs/navigation.
- No backend or shared-payload changes are required.
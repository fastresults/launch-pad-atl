# Logo Studio: why the marks look like blobs, and why runs stall

## 1. What the hell happened to the design

The three identical dark lozenges-in-a-ring on your screen are not a model failure. They are the direct result of the change made an hour ago.

Before that change, the picture on each card was the Higgsfield render — a real image model drawing your concept. That is why the earlier sets had recognisable subjects (the porch, the two figures, the umbrella). The problem you raised was that approving one and vectoring it produced a *different-looking* mark, because vectoring redrew the concept from scratch instead of tracing the approved image.

The fix applied was "vector-first": draw the concept as SVG up front and rasterise that SVG for the card, so preview and download can never diverge. Fidelity was solved. Quality was destroyed. The SVG is authored by a language model emitting JSON into a deliberately tiny primitive vocabulary — `rect`, `circle`, `ellipse`, `line`, `path`, `group` — through `logo-geometry.ts`. A text model composing a handful of primitives cannot draw a porch or two figures. It can draw a circle with a rounded rectangle inside it, three times. That is precisely what you are looking at, and the banner still says "3 rendered · 0 fell back" because Higgsfield was never asked.

So: fidelity and quality got traded against each other, and the wrong side won.

### The correct answer to both

Keep Higgsfield as the concept artwork — it is the only thing in this pipeline that can actually draw. Then make finalising a **faithful trace of that exact approved image**, not a redraw:

1. Stage 4 goes back to Higgsfield rendering the concept. The card shows the render.
2. Approving runs a real raster-to-vector trace of the approved PNG (edge detection to closed paths, palette-snapped to the brand tokens, path-simplified) — a deterministic image operation, not a second model call. What you approved is what gets traced, so shape fidelity is preserved by construction.
3. The primitive-drawing path (`developVectorSpec`) is demoted to an emergency fallback used only when Higgsfield is unavailable, and any concept produced that way is clearly badged as a fallback sketch instead of being presented as a finished mark.
4. The jury keeps judging the render, so nothing reaches you that the critique pass rejected.

## 2. Why runs stall — the log audit

Run `f2167f53` (version 11) is alive right now: heartbeat 03:28:35, slot 2 rendering, slots 0 and 1 waiting at the jury stage. Yet the UI labels one card "Paused — this concept stopped part-way through." Nothing is broken in that moment; the badge is wrong.

Run history for this venture in the last four hours: 6 completed with review, 3 canceled by hand, 1 failed with "Logo Studio paused after 30 minutes of recovery attempts." No provider error is recorded on any of them. The `venture-brand-assets` edge function logs across the window contain only boot/shutdown lines and one `logo_force_reset` — no thrown errors. These are not provider failures. They are orchestration failures.

**Root cause:** the entire run is driven from the browser. `processLogoRun` in the Brand Wizard calls the edge function once per stage, per concept, in a React loop — read context, develop directions, render two at a time, jury two at a time, sweep orphans. The edge function is stateless; it executes only the one stage it is handed. So the run advances only while that tab is open, awake, and on the page. A refresh, a navigation, HMR in preview, a sleeping laptop, a background-tab throttle, or one failed call out of fifteen strands the run permanently: rows sit mid-flight, the run row keeps a stale `rendering` status, and nothing on the server is watching. That is every stall from tonight, including the 30-minute failure and the repeated force-clears.

Secondary defect: the stall badge calls a concept "stalled" when it has a drawing, no lease and no retry time — which is the normal resting state between jury batches. It fires on healthy rows mid-run.

## 3. The durable fix

**Server-side run driver.** A `logo_drive_run` action in `venture-brand-assets` claims the run and executes the stage machine that currently lives in the component, against the database, respecting existing leases and attempt counts. When its time budget runs low it re-invokes itself via `EdgeRuntime.waitUntil`, so a long run chains across invocations instead of dying in one.

**Client becomes a spectator.** `processLogoRun` shrinks to: create run, kick the driver once, poll `logo_get_run` until terminal. Closing the tab stops nothing; reopening shows the run wherever the server took it. Resume and Refine also just kick the driver.

**Watchdog sweep.** The existing `venture-job-watchdog` cron picks up non-terminal runs with a heartbeat older than ~3 minutes, clears expired leases, and re-kicks the driver. A run with no forward progress across several sweeps fails with a real reason rather than a generic timeout.

**Honest status.** "Paused" appears only when the run is terminal or its heartbeat is stale. While the heartbeat is fresh, a waiting concept shows its stage. The banner reports stage, concepts drawn, and last check-in, so a slow run reads as working.

## Technical notes

- `logo-render-prompt.ts` / stage 4 revert to the Higgsfield path; `render_provider` records `higgsfield` vs `vector_fallback` truthfully.
- Finalise becomes trace-of-approved-raster plus lockup assembly in `logo-geometry.ts` / `logo-compositor.ts`; no model call in that step.
- New `logo_drive_run` action; existing per-stage actions stay and become internal calls.
- Concurrency uses mechanisms already on the tables: `lease_token` / `lease_expires_at` on `brand_logo_directions`, `heartbeat_at` on `brand_logo_runs`. No schema change expected; if a run-level claim token is needed it is one nullable column.
- `BrandWizard.tsx` loses the multi-stage loop; the stall UI is rewritten against run heartbeat and status.

## What you will see afterwards

Concepts that look drawn, not assembled. Approving one gives you a vector of that same mark. Start a run, close the tab, come back later — it finished on its own. "Paused" only when something is actually paused.

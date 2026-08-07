# Logo Studio: why runs pause, and the durable fix

## What the logs and database show

Run `f2167f53` (version 11) for this venture is *currently alive*: heartbeat 03:28:35, three concepts — slot 2 rendering, slots 0 and 1 sitting at the `jury` stage with a finished drawing and no lease. Yet the screen shows one card reading "Paused — this concept stopped part-way through." Nothing is actually broken in that moment; the UI is mislabelling a queued concept.

Run history for this venture over the last four hours: 6 runs completed with review, 3 canceled by hand, and 1 (`c52ea8aa`) failed with "Logo Studio paused after 30 minutes of recovery attempts." No provider error was recorded on any of them — no Higgsfield failure, no model error, no last_error text on the failed run other than the timeout message. The edge function logs for `venture-brand-assets` over this window contain only boot/shutdown lines and one `logo_force_reset` — no thrown errors. So the failures are not provider failures. They are orchestration failures.

## Root cause

The whole run is driven from the browser. `processLogoRun` in the Brand Wizard calls the edge function once per stage, per concept, in a loop that lives in the React component: read context, develop directions, render each concept two at a time, jury each render, sweep orphans. The edge function is stateless — it only ever executes the single stage it is handed.

That means the run only advances while that browser tab is open, awake, and on that page. Anything that interrupts the tab — navigating away, a refresh, HMR in preview, the laptop sleeping, a background-tab throttle, a network blip on one of the fifteen-plus sequential calls — permanently strands the run. Rows are left mid-flight (`rendering_concept` with a lease, or `queued` at `jury`), the run row keeps a stale `rendering` status, and nothing on the server is watching. That is exactly the shape of every stall seen tonight, including the 30-minute recovery failure and the repeated force-clears.

Two smaller defects sit on top of it:

1. The stall badge is wrong. A concept is called "stalled" when it has a drawing and no lease and no retry time — but that is the normal resting state of a concept waiting for the next jury batch. It fires on healthy rows mid-run, which is what the screenshot shows.
2. The client loop has no overall deadline or resume-on-mount. If the tab does survive, three rounds of rendering plus jury can outlast the user's patience with no progress reporting; if the tab does not survive, nothing ever restarts the run.

## The fix: move the driver to the server

**1. Server-side run driver.** Add a `logo_drive_run` action to `venture-brand-assets`. It claims the run, then executes the same stage machine that currently lives in the component — context, concepting, render, jury, corrective redraw, completion — against the database, one stage at a time, respecting the existing leases and attempt counts. When its time budget runs low it re-invokes itself for the next slice via `EdgeRuntime.waitUntil` and returns, so a long run chains across invocations instead of dying in one.

**2. Client becomes a spectator.** `processLogoRun` is reduced to: create the run, kick `logo_drive_run` once, then poll `logo_get_run` (already implemented) until the run reaches a terminal status. Closing the tab no longer stops anything; reopening the page shows the run wherever the server has taken it. "Resume" and "Refine" also just kick the driver.

**3. Watchdog sweep.** Extend the existing `venture-job-watchdog` cron to look for logo runs whose heartbeat is older than ~3 minutes and are not terminal, and re-kick `logo_drive_run` for them. Runs with expired leases have those leases cleared so the driver can reclaim the row. A run that makes no forward progress across N sweeps is marked `failed` with a real reason instead of a generic timeout.

**4. Honest stall reporting.** Replace the client-side heuristic with server truth: a concept is only "paused" when its run is terminal (or its heartbeat is stale) and the row is not finished. While the run heartbeat is fresh, a waiting concept shows a queue position or its current stage, never "Paused". The per-run banner shows what the driver is doing now and when it last checked in.

**5. Progress and stage visibility.** The run row already carries `completed_count` and `heartbeat_at`; surface them as "stage 4 of 6 · 2 of 3 concepts drawn · last checked in 8s ago" so a slow run reads as working rather than hung.

## Technical notes

- New action `logo_drive_run` in `supabase/functions/venture-brand-assets/index.ts`; the existing per-stage actions stay as-is and become internal calls, so nothing else that uses them breaks.
- Concurrency safety uses the mechanisms already in the table: `lease_token` / `lease_expires_at` on `brand_logo_directions`, and `heartbeat_at` on `brand_logo_runs`. A single driver claim per run prevents two drivers from racing after a watchdog kick.
- No schema change is expected; if the driver needs a claim token on the run row it will be added as a nullable column in one migration.
- Watchdog work goes into the existing `venture-job-watchdog` function rather than a new cron.
- `BrandWizard.tsx` loses the multi-stage loop; the stall/"Resume this one" UI is rewritten against run heartbeat and status.

## What you will see afterwards

Start a run, close the tab, come back later — the concepts are done. A genuinely stuck run reports the real reason and gets retried on its own before you ever notice it. "Paused" only appears when something is actually paused.

# Header art, generated in the background — never on click

Today a header graphic is only reliably made in two moments: right after an asset is written (fire-and-forget, which silently dies if the model hiccups or the run gets busy), and when a user opens the asset modal — which is why opening a section makes them wait. Anything in between stays missing until someone clicks it or presses "Generate missing" in Share settings.

The fix: make header art a background sweep that the system runs on its own, so by the time anyone opens an asset or a share link, the image already exists.

## What changes

1. **A dedicated header-art sweeper.** A new backend routine takes a venture and finds every completed asset that has no header image (or whose last attempt failed, or has been stuck "generating" past the stale window), then produces them a few at a time until the venture is fully illustrated. It is safe to call repeatedly — the existing atomic claim on each asset prevents double work.

2. **It runs automatically at the end of every bulk generation.** When "run all assets" finishes its retry and sprint passes, the run kicks off the sweeper for that venture instead of relying on the per-asset fire-and-forget. Progress is reported on the job so the hub can show "finishing visuals".

3. **The periodic watchdog also sweeps.** The existing watchdog pass picks up any venture with completed assets and missing header art from the last few days and finishes them, covering ventures whose original attempt failed hours earlier.

4. **Opening an asset stops being a trigger-and-wait.** The asset modal keeps showing art the instant it exists; if it's genuinely missing it requests it as today, but in practice the sweeper will have gotten there first. Auto-firing on open stays, just as a last resort.

5. **Creating or refreshing a share link guarantees coverage.** When an owner opens Share settings or creates a link, the sweeper is fired for that venture in the background so the public showcase is fully illustrated without anyone pressing "Generate missing". The existing manual button stays as an override.

6. **Warm cache for viewers.** Header images are already stored permanently in storage with a long cache lifetime; the share payload keeps returning signed URLs so the public page renders them immediately with no per-view generation.

## Technical notes

- New edge function `venture-hero-sweep`: input `{ snapshotId, force?, limit? }`. Queries `venture_documents` where `status = 'complete'` and (`hero_image_path is null` or `hero_image_status in ('failed')` or `hero_image_status = 'generating'` with `hero_image_started_at` older than the 3-minute stale cutoff). Invokes `venture-document-image` with the service key at a concurrency of 2–3, with a per-invocation cap so the worker stays inside CPU/wall limits; re-queues itself (`waitUntil` + self-fetch) when work remains.
- Rate-limit/credit responses (429/402) from the image gateway abort the sweep for that venture rather than burning retries; the sweep resumes on the next watchdog pass.
- `venture-bulk-generate`: after the final status update, fire `venture-hero-sweep` for the snapshot (non-blocking).
- `venture-job-watchdog`: add a pass that selects recent snapshots with illustrated-coverage gaps and calls the sweeper, bounded to a small number of ventures per tick.
- `venture-generate-document`: keep the existing per-doc fire-and-forget (fast path), unchanged.
- `ShareVentureDialog`: on open/link creation, fire the sweeper once per session; keep the "Generate missing" button wired to the same function so the two paths can't diverge.
- `DocumentViewer`: no behavior change beyond leaving the auto-fire as a fallback.

No database schema changes — `hero_image_status`, `hero_image_started_at`, and `hero_image_error` already carry everything the sweeper needs.

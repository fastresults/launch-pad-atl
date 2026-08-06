# Rebuild logo generation as a durable vector studio

## What the failures taught us

The latest refactor fixed one problem—four logos are no longer generated inside one request—but each individual render request still performs too much work.

- On August 6, deployment 455 received one successful render request at **103.3 seconds** and three requests that ended at the platform limit: **150.126s, 150.145s, and 150.164s**.
- A `logo_render` request can currently run a pro image generation, a fallback image generation, a visual critique, and two complete corrective render/critique cycles. Its theoretical duration remains several times longer than the 150-second limit.
- The gateway logs show pro image calls cancelled after roughly **74.8 seconds** (for example log `019fd94b-afa2-7cdd-ac31-9490183eacba`, August 6 at 22:58:38 UTC). The function then falls back and continues working inside the same expiring request.
- The client starts all four render requests simultaneously. Slow providers therefore create a burst of concurrent pro calls, fallbacks, critiques, and retries.
- Progress exists only in React state. Closing the wizard, refreshing, losing the connection, or receiving a response after the platform closes the connection leaves no authoritative record of what should happen next.
- Persistence has two competing writers: the function atomically appends a logo, while the client also saves its local logo array. Late client saves can overwrite newer backend results. Persistence failures are currently logged but still returned as success.
- The current kit contains four cached directions but only three logos. That partial state confirms the workflow can do paid work without completing or cleanly reconciling the set.
- Raster image models repeatedly add texture, shadows, extra text, and mockup styling despite flat-vector instructions. More critique/retry calls increase cost and timeout exposure without guaranteeing a production-ready identity mark.

The durable answer is to make failure recoverable by design and to generate final logos as validated vectors—not to keep a long raster correction loop alive.

## Target experience

1. The founder starts one logo run and immediately sees four named directions enter a persistent queue.
2. Cards update from `Concepting` → `Drawing` → `Reviewing` → `Ready` without holding browser requests open.
3. Refreshing, closing the wizard, or returning later resumes the same run from backend state.
4. Each direction produces a crisp SVG plus a PNG preview. No gradients, textures, mockups, garbled words, or accidental taglines can enter the final file.
5. A failed stage retries independently with a changed tactic. Completed stages are never repeated or charged again.
6. A run is complete only when all four slots are `ready`, `needs_review`, or have a clear terminal error with a targeted retry action.

## Phase 1 — Establish one authoritative job ledger

Add dedicated, venture-scoped backend records:

- `brand_logo_runs`: snapshot, owner, strategy/version, status, requested count, completed count, heartbeat, timestamps, and cancellation state.
- `brand_logo_directions`: run, stable slot and idempotency key, concept brief, vector specification, status, current stage, attempt counters, critique, SVG/storage paths, preview path, and last error.
- Enforce one active run per venture and one result per run/slot.
- Add owner/admin access rules, authenticated grants, service-role grants, indexes for queued work, and updated timestamps.
- Add atomic functions to claim one stage, record an attempt, publish an asset, and release/requeue stale work. These operations must verify the expected run version so an old worker cannot overwrite a newer run.
- Stop storing workflow state inside `venture_brand_kits.dna`. The kit will reference only the selected/published results; the job tables retain generation history.

## Phase 2 — Replace raster-first rendering with a vector-first design system

Keep the strongest part of the existing process—the strategy, wide ideation, scoring, and venture context—but change the execution format.

1. **Strategy stage:** one structured text call distills the startup’s positioning, audience, category cues, exclusions, and locked brand tokens into a versioned creative brief.
2. **Direction stage:** one structured text call generates 8–10 candidates, scores them, removes category clichés and near-duplicates, and persists the best four distinct concepts.
3. **Vector specification stage:** each selected concept becomes a constrained design specification using an allowed vocabulary of paths, geometric primitives, transforms, negative-space cutouts, palette tokens, and separately typeset wordmarks.
4. **Deterministic renderer:** server code converts the validated specification to sanitized SVG. Text is rendered with the selected real font rather than asking an image model to spell it. It also exports a PNG preview.
5. **Mechanical quality gate:** reject unsupported SVG elements, scripts, external URLs, embedded raster data, gradients, filters, masks outside the approved subset, excessive path/element counts, more than two brand colors, invalid bounds, tiny details, and low-contrast output.
6. **Visual quality gate:** a single vision review scores relevance, distinctiveness, silhouette, balance, legibility, and similarity to the other three directions. It returns structured scores and one correction instruction.
7. A failed review creates a new queued `revise_vector` stage. It never loops inside the current request.

The image model may remain available as an optional internal exploration reference, but it will not create the final logo file or sit on the critical path.

## Phase 3 — Make every worker invocation short, bounded, and idempotent

- Split work into stage-specific function actions: `create_run`, `develop_brief`, `develop_directions`, `draw_vector`, `review_vector`, and `publish_vector`.
- One invocation performs **one model call or one deterministic render**, then persists its result and exits. No nested fallback and no corrective loop in one request.
- Set a hard overall budget below the platform limit (target 75 seconds) and a shorter upstream deadline. On deadline, persist `retry_wait` before returning; do not continue into another provider call.
- Model fallback becomes a separate queued attempt. It runs only after the primary attempt records a retryable provider failure.
- Classify errors: rate limit, credits, provider timeout, malformed structured output, invalid vector, review failure, storage failure, and permanent validation failure. Each class gets its own retry policy.
- Use exponential backoff with jitter for transient failures and cap attempts by stage. Creative review retries use the critique note; transport retries reuse the same idempotency key.
- Limit execution to at most two logo stages concurrently per run and apply a project-level cap so several founders cannot create a gateway burst.
- Never swallow persistence errors. A result is not `ready` until SVG, preview, media metadata, direction status, and kit reference are committed successfully.

## Phase 4 — Add recovery that does not depend on the browser

- Extend the existing watchdog pattern to claim queued logo stages and recover stale claims from backend state.
- Run the recovery dispatcher on a recurring backend schedule and after each successful stage, while preserving the scheduled recovery as the source of truth if chaining fails.
- Heartbeat claimed work and return abandoned stages to the queue after a conservative lease expires.
- Reopening the wizard reads the active run and its four direction rows; it never restarts completed work.
- Starting a new direction set cancels the prior active run without deleting its assets or history.
- Add a reconciliation operation that repairs interrupted publish steps by comparing direction rows, storage paths, media metadata, and the brand kit reference.

## Phase 5 — Rebuild the wizard around persisted state

- Replace `Promise.all` and local `pending` orchestration with a run-creation request followed by query polling or realtime updates from the job ledger.
- Render four stable slots keyed by direction id so completion order cannot shift cards.
- Show the actual stage, review score, and whether a fallback/revision is underway.
- Provide targeted controls: `Retry stage`, `Revise this direction`, `More like this`, `Replace direction`, and `Cancel run`.
- Never write the entire `logos` array from client state. Selection and removal call backend operations keyed by direction id.
- Surface `needs_review` honestly instead of silently presenting a logo that failed critique as approved.

## Phase 6 — Quality, failure, and regression testing

Build tests around the failures already observed:

- Unit tests for structured-response validation, candidate diversity, vector-spec validation, SVG sanitization, color/element limits, idempotency, leases, and retry classification.
- Function tests for malformed AI JSON, empty directions, 429, 402, provider 5xx, 60-second timeout, invalid SVG, failed visual review, storage failure, duplicate delivery, and a worker dying after upload but before publish.
- Concurrency tests proving two workers cannot claim the same stage and late results from an old run cannot overwrite a new run.
- Browser test: start four directions, refresh mid-run, close/reopen the wizard, and verify all cards resume without duplicates or missing logos.
- End-to-end quality fixture set across trades, local services, professional services, retail, and technology startups. Require four materially distinct marks, correct spelling, valid SVG/PNG downloads, and no forbidden effects.
- Instrument each stage with run id, direction id, attempt, model, duration, outcome, and error class. Add an admin view for stalled runs, retries, provider fallbacks, and per-run AI cost.

## Rollout and acceptance gate

1. Add the job ledger and vector renderer behind a feature flag; keep existing saved logos readable.
2. Run internal fixture ventures through both pipelines and review the vector set for creative quality.
3. Enable the new path for Super Admin first, then a small percentage of normal runs.
4. Retire the current `logo_brief`/`logo_render` raster loop only after the new workflow passes recovery and quality tests.

The rebuild is accepted when:

- No logo worker request approaches the 150-second platform boundary.
- A refresh or browser closure cannot lose progress.
- Repeated delivery of the same stage cannot create duplicates or extra charges.
- Four slots reconcile correctly after injected provider, network, storage, and worker failures.
- Final downloadable marks are sanitized SVGs with matching PNG previews, correct text, approved palette constraints, and visible quality scores.
- Known failures produce a recoverable stage or a precise user action—never a blank screen, generic 504, or silently missing logo.
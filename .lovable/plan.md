# Why the Website Brief (PRD) isn't generating — audit + fix

## What the logs and data actually show

The document row for this venture (The Friendship House) is:

- `status: failed`
- `last_error: "AI generation is currently unavailable. Please try again shortly."`
- `metadata.orchestration_attempts: 3` (budget exhausted)

Every PRD attempt in the AI Gateway log failed the same way:

```text
17:06:39  google/gemini-3.1-pro-preview  chat_completions  503 upstream_error  90,826 ms
17:08:37  google/gemini-3.1-pro-preview  chat_completions  503 upstream_error  90,837 ms
17:22:10  google/gemini-3.1-pro-preview  chat_completions  503 upstream_error  90,833 ms
```

Three separate runs, all ~90.83 seconds, all 503. That is not random flakiness — it is a hard upstream ceiling. The enhanced PRD asks one single call to read up to 220,000 characters of context plus brand vision images and write 24,000 output tokens. The upstream model gives up at ~91s and the gateway returns 503.

Three compounding causes:

1. **One giant call.** The PRD is generated in a single request that is now far too large to finish inside the upstream window.
2. **No retry and no fallback on the PRD path.** `venture-generate-document` calls the gateway with `retries: 0` for the PRD (a 180s client timeout that never gets used, because upstream dies at 91s). One 503 = permanent failure. There is no second model.
3. **The self-driving loop is now dead-ended.** The orchestrator allows 3 attempts; all three burned. The watchdog now logs `website_prd_budget_exhausted` on every pass and will never try again. Nothing resets that budget when the failure was transient/infrastructural.

## The fix

### 1. Generate the PRD in sections, not one call
Split the single request into sequential passes that each fit comfortably inside the upstream window (target < 60s per call):

- Pass A — Sections 1–3 (brand, voice calibration, information architecture / route list)
- Pass B — Section 4 page copy, generated per route group, using Pass A's route list
- Pass C — Sections 5–8 plus the master build prompt

Each pass gets `max_tokens` ≈ 8,000 and a trimmed context slice rather than the full 220k. Results are concatenated into the same final document, so the existing craft checks, repair passes and identity guard run unchanged on the assembled output. Partial results are checkpointed to the row after each pass, so a failure resumes instead of restarting.

### 2. Retry + model fallback on every PRD call
- `retries: 2` with the existing backoff, timeout 75s per pass.
- If the Pro model still 503s, fall back to `google/gemini-3-flash-preview` for that pass and record which model wrote it in `metadata.model_used`, so a degraded brief is visible rather than silent.

### 3. Make the orchestration budget self-healing
- Only count an attempt against the budget when the failure is *not* an upstream 5xx/timeout; infrastructure failures get their own separate, larger allowance with a cooldown (e.g. retry no sooner than 15 minutes later).
- Add a reset when the row is manually regenerated from the UI, so a founder pressing "Build website brief" always gets a real attempt.

### 4. Surface the truth in the UI
The Founders Hub card currently shows the generic "AI generation is currently unavailable". Replace with the real state: which pass failed, whether it will retry itself, and when. Add an explicit "Retry now" that clears the budget.

### 5. Unblock this venture
Clear the failed state and exhausted budget for The Friendship House and re-run the PRD through the new sectioned path to verify end to end.

## Technical notes

Files touched: `supabase/functions/venture-generate-document/index.ts` (sectioned passes, retries, fallback model, checkpointing), `supabase/functions/_shared/website-prd.ts` (pass assembly helper alongside the existing expand/repair helpers), `supabase/functions/_shared/orchestrate.ts` (failure-class-aware budget + cooldown), `src/components/hub/brand/use-website-prd.ts` and the Hub card (honest status + retry).

No schema change required — pass checkpoints and `model_used` live in the existing `metadata` JSON. Verification is a full PRD build for this venture with all passes green in the gateway log and the assembled document passing the craft checks.

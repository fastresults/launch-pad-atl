## What the logs show

All 12 recent `atlanta-viability` calls succeeded (HTTP 200) — nothing errored. The problem is latency and layout:

- Calls run **5.7s–11.8s** (older, longer-output calls ~11s; the trimmed prompt brought recent ones to ~6.5s). One model call, non-streamed, so the visitor stares at a skeleton the whole time.
- Nothing is cut off server-side — the screenshot shows the read rendering past the bottom of the frame with the sticky bar and the invite card off-screen, i.e. a **modal-height/scroll containment failure**, not an AI failure. Exact cause to confirm first (see step 1).

## 1. Fix the cut-out (confirm, then fix)

Reproduce in the browser at the user's viewport (1498×1025) with "Senior care consulting" and measure the dialog's rendered height vs. viewport, and whether the body is the scroller. Likely candidates: the dialog's `max-h` losing to a base `DialogContent` rule, the `top-1/2 -translate-y-1/2` centering pushing the frame off-screen when content is tall, or the flex column not constraining the middle region.

Fix so it holds regardless of content length: hard-cap the frame with `height: min(86vh, 780px)` on `.hero-modal` in CSS (not just a utility class that can be overridden), keep `min-h-0` on the scroll region, and pin the action bar. Add a Playwright check at 3 viewport heights (700 / 1025 / 1400) asserting the CTA is inside the viewport before and after scrolling to the bottom.

## 2. Make it fast (perceived + actual)

- **Stream the read.** Switch the edge function to a streaming response and render sections as they arrive: verdict appears in ~1s, then the money panel, then signals, then the rest. This alone kills the dead-air feeling.
- **Cheaper/faster model.** Move from `openai/gpt-5.6-sol` to `openai/gpt-5.6-luna` (or `google/gemini-3.6-flash`) with `reasoning_effort: "none"` — this task is formatting a grounded read, not hard reasoning. Expect ~2–4s to full output and roughly an order of magnitude lower cost per read.
- **Priority serving** (`service_tier: "priority"`) on the chat call for lower latency.
- **Instant first paint:** render the idea label, the money panel skeleton, and the workshop bar immediately from client state, so the modal never opens empty.
- **Cache** identical/normalized ideas for the session so re-opens are instant.

## 3. Add the money picture (the missing piece)

New required block in the AI output, rendered as the **first visual** under the verdict — a "What this can earn around Atlanta" panel:

```text
┌──────────────┬──────────────┬──────────────┐
│ Typical      │ Jobs/clients │ Month 1–3    │
│ ticket       │ per week     │ realistic    │
│ $X–$Y        │ N–M          │ $A–$B        │
└──────────────┴──────────────┴──────────────┘
        │ simple bar: month 3 → month 12 range
```

Fields: `typical_ticket`, `volume_per_week`, `first_90_days_range`, `steady_state_range`, plus a one-line `basis` sentence explaining how the range is framed and a plain disclaimer ("ranges, not promises — what similar startups charge around metro Atlanta").

Guardrails, unchanged from the current prompt: **ranges only, never a sourced-sounding statistic, never an income promise.** The panel carries a visible "illustrative ranges, not a guarantee" line.

## 4. More visual overall

- Money panel as three big numeric tiles + one simple CSS bar for the month-3 → month-12 range (no chart library).
- Signals become 4 compact tiles with icons instead of text cards.
- First moves as a numbered 1-2-3-4 stepper; watch-outs collapse to a single tinted block.
- Prose ("Why Atlanta") drops to one short paragraph and moves below the numbers.
- Result: the whole read fits in roughly one scroll, with the invite always reachable.

## Technical notes

- Files: `supabase/functions/atlanta-viability/index.ts` (model swap, streaming, new `economics` object in the schema), `src/components/home/IdeaSnapshotModal.tsx` (streamed progressive render, money panel, visual tiles), `src/styles.css` (`.hero-modal` height cap, money-tile styles).
- No database or pricing changes. Workshop details ($197, Thursday Aug 20 2026, IGNITE Center) stay as-is.
- Verification: Playwright run for "senior care consulting" and two other ideas — time to first visible content, CTA visibility at three viewport heights, and money panel present in all successful reads.

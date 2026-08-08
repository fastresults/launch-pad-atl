# Executive summary: add a data-backed forecast

## The problem

The current summary is deliberately number-free. Its prompt says "no invented numbers, dates, customers or partners," so the model strips out every figure — even the real ones the venture already produced in its financial model, pricing sheet, and market research. The result reads as descriptive, not confident, and gives no forecast of revenue or success.

The fix is not to let the model make numbers up. It is to feed it the venture's own numbers, require it to use them, and show them.

## What changes

### 1. Pull the real numbers first

Before writing, the generator loads the money-bearing assets in full (not the 900-character truncation everything else gets):

- financial model / 12-month money picture
- pricing and offer sheet
- market research / demand sizing
- customer acquisition and first-campaign assets
- operating plan or capacity assumptions

These get a larger excerpt budget so revenue tables, price points, unit costs, and capacity figures survive into the prompt instead of being cut off mid-table.

### 2. Extract a structured metric set

A first AI pass reads only those assets and returns a strict set of metrics, each with the figure, a plain-language label, and the asset it came from. Typical set:

- price point / average revenue per customer
- customers needed to reach breakeven
- month-12 revenue projection
- gross margin
- market size or reachable demand in the venture's city
- startup capital required
- time to first revenue

Any metric with no traceable source in the assets is dropped, never guessed. If fewer than three survive, the summary falls back to today's qualitative behavior rather than inventing confidence.

### 3. Rewrite the summary around those numbers

The prompt changes from "no numbers" to "only these numbers." Four paragraphs, roughly 320–360 words:

1. What the startup is, who it serves, the promise — now with the market figure and the price point.
2. What has been built across the asset set and why it de-risks launch.
3. **The forecast**: the revenue path in the venture's own figures — price x customers to breakeven, month-12 projection, margin, capital required — stated as the model's projection with its assumption named, not as a guarantee.
4. How to use the assets in the next 14 days to reach the first paying customer, tied to the breakeven number.

Guardrails stay strict: every figure must match one in the extracted set, no rounding drift, no new percentages, no fabricated traction or customer names.

### 4. Show the numbers

The showcase renders a "By the numbers" strip above the summary prose: three to six metric tiles (figure, label, source asset), styled to match the dark showcase cards. This is what makes the section feel evidence-backed at a glance, before anyone reads a word.

The strip appears in both the public shareable link and the founder hub view. When no metrics were extractable, the strip is simply absent.

### 5. Confidence, honestly stated

A short line under the strip names the basis: "Projected from your financial model and pricing sheet. Figures are your own assumptions, not guaranteed outcomes." This inspires more confidence than an unqualified claim, and keeps the venture defensible in front of a lender or partner.

## Technical notes

- `supabase/functions/venture-exec-summary/index.ts`: add a priority-asset loader with a larger per-doc character budget; add a metric-extraction call using a strict JSON schema (figure, label, unit, source asset type); rewrite the system prompt to four paragraphs with the "only extracted figures" rule; persist metrics alongside the prose.
- New column `venture_snapshots.executive_metrics jsonb` (migration, with the existing table's grants unchanged) to cache the structured metrics next to `executive_summary`; bump the regeneration path so `force: true` refreshes both.
- `supabase/functions/venture-share/index.ts`: include `executiveMetrics` in the share payload.
- `src/lib/venture-share.functions.ts`: extend `SharePayload` with `executiveMetrics`.
- New `src/components/share/ExecutiveMetrics.tsx`: the metric tile strip, rendered above the summary prose in the showcase section and reused in the hub.
- Existing cached summaries stay valid until regenerated; the strip appears after the next generation.

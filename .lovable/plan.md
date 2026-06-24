
# Deep research before documents

Right now the flow goes: concept → light scrape (`venture-extract-concept`) → 4-section `extracted_data` → review → generate 20 docs. The extractor only pulls the founder's own URL via a crude HTML strip, so every downstream doc inherits the same thin context. That's why outputs feel generic.

The fix: insert a real research phase between "concept captured" and "extracted_data finalized" — multi-source, evidence-grounded, with citations stored in the snapshot. Then docs generate from a much richer brief.

## New pipeline

```text
concept → [1] scrape own/competitor site (Firecrawl)
        → [2] discover competitors + market signals (Firecrawl search)
        → [3] scrape top 3-5 competitors (Firecrawl batch)
        → [4] industry/market research pass (Firecrawl search, time-filtered)
        → [5] AI synthesis into structured research_brief + extracted_data
        → review gate (founder edits)
        → bulk doc generation (uses research_brief as grounded context)
```

Each step persists raw artifacts so we can re-run synthesis without re-scraping (cost + speed).

## What we research, concretely

For every venture, gather and store:

1. **Company surface** — homepage + /about + /pricing + /product scraped as markdown.
2. **Competitor set** — 3-5 named competitors with one-line positioning + scraped homepages. Sourced by Firecrawl `/search` queries like `"<concept keywords> alternatives"`, `"<category> tools comparison"`.
3. **Market signals** — recent (last 12mo) articles on category size, trends, funding, regulation. Firecrawl `/search` with `tbs: qdr:y`.
4. **Customer voice** — Reddit/HN/G2-style mentions of the problem. Firecrawl `/search` scoped to those domains.
5. **Pricing benchmarks** — competitor pricing pages scraped explicitly.

All raw results go into a new `research_artifacts` JSONB column (or sibling table) with source URL, fetched_at, and content. Citations are preserved end-to-end so docs can footnote them.

## Reliability levers

The user asked for "reliable outputs." Five things matter more than the model choice:

- **Evidence-grounded prompts.** Synthesis prompt receives the scraped corpus and is told: "Only state facts present in SOURCES. If unknown, write `[needs founder input]`. Cite source URL in brackets." This is the single biggest quality lever.
- **Structured output with validation.** Zod schema on the synthesis response. Reject + retry once on parse failure.
- **Per-step idempotency + caching.** Each research step writes to `research_artifacts` keyed by step name. Retry only re-runs failed steps. Saves Firecrawl credits.
- **Human review gate (already exists, keep it).** Surface the citations and `[needs founder input]` gaps in the review UI so the founder fills them before generation.
- **Quality floor on synthesis.** Self-rated `research_confidence` (0-100) per section; below threshold blocks "Generate all" and prompts the founder to add context.

## Cost + latency budget per venture

- Firecrawl: ~1 scrape (own) + 1 search + 3-5 scrapes (competitors) + 2 searches (market/voice) ≈ **8-10 Firecrawl calls** (~$0.05-0.15 depending on plan).
- Lovable AI: 1 large synthesis call with the full corpus (~50-100k input tokens, ~4k output) using `google/gemini-3-flash-preview`.
- Wall time: 60-120s. Run as background job with the same progress pattern `venture-bulk-generate` uses, so the UI streams live status.

## Concrete changes

**New edge function `venture-deep-research`** (replaces the work currently done by `venture-extract-concept`'s scrape step):
- Input: `{ snapshotId }`.
- Runs the 5 steps above with progress updates to `enrichment_progress`.
- Writes `research_artifacts` (raw) and a structured `research_brief` (synthesized) to the snapshot.
- On finish, calls the existing extractor to fill `extracted_data` from `research_brief` (so the current review UI still works), then sets `status = "review"`.

**Schema additions** to `venture_snapshots`:
- `research_artifacts JSONB` — array of `{ step, source_url, fetched_at, content, metadata }`.
- `research_brief JSONB` — structured `{ company, competitors[], market, customer_voice[], pricing_benchmarks[], gaps[], confidence }`.
- `research_status TEXT` and progress reuses `enrichment_progress`.

**Doc generation update** (`venture-bulk-generate`): system prompt gets `research_brief` injected alongside `extracted_data`, with instruction to cite sources where claims come from research.

**Review UI** (`hub.$snapshotId`): new "Research" tab showing competitors found, sources, gaps flagged `[needs founder input]`, and a confidence bar. Founder can add/remove competitors and re-run synthesis without re-scraping.

**Connector**: Firecrawl is already linked (`FIRECRAWL_API_KEY`). No new secrets.

## Open choices for you

1. **Scope of research per run** — minimal (own site + 3 competitors), standard (the full 5 steps above), or deep (add Reddit/HN voice-of-customer + funding data from Crunchbase-style search)?
2. **Auto-run vs gated** — should deep research kick off automatically on snapshot create (current behavior for the lighter extractor), or should the founder click "Start research" after reviewing the seed inputs?
3. **Citations in final docs** — show inline `[1]` style footnotes with a sources list at the bottom of each generated doc, or keep docs clean and only show sources in the review UI?
4. **Industry research source mix** — Firecrawl search only, or also add Perplexity (`sonar-pro`) for the market/trends step? Perplexity is better at synthesized "state of the industry" answers; Firecrawl is better at raw pages. Cost is similar.

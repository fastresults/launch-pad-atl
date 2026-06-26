## Goal
Turn `/dashboard/deliverables` into an AI-first retrieval surface: natural-language ask bar on top, smart filters underneath, and ranked results — so a founder can type "show me everything about pricing" or "what did we decide about our ICP?" and get the right docs (and the exact passages) instantly.

## UX

```text
┌───────────────────────────────────────────────────────────┐
│  Your deliverables                          [Open the Hub]│
│  33 ready · 1 venture                                     │
├───────────────────────────────────────────────────────────┤
│  ✨ Ask your deliverables…                          [↵]   │
│     e.g. "summarize our go-to-market" · "pricing logic"   │
│     Suggested: GTM • Pricing • Risks • Funding ask        │
├───────────────────────────────────────────────────────────┤
│  Filters: [All] [Ready] [In progress]                     │
│  Category ▾  Venture ▾  Updated ▾  Sort: Relevance ▾      │
├───────────────────────────────────────────────────────────┤
│  AI Answer (when a question is asked)                     │
│   ┌───────────────────────────────────────────────────┐   │
│   │ Short synthesized answer with inline [1][2] cites │   │
│   │ Sources: Pitch Deck · Funding Strategy · …        │   │
│   └───────────────────────────────────────────────────┘   │
│                                                           │
│  Ranked results (cards) — each shows matched snippet      │
└───────────────────────────────────────────────────────────┘
```

Two modes share one input:
- **Search mode** (default as user types) — keyword/snippet ranking, instant, no AI cost.
- **Ask mode** (press Enter or click "Ask") — runs an Edge Function that retrieves top chunks and returns a synthesized answer with citations.

## Scope

### 1. Client-side smart search (free, instant)
File: `src/routes/_authenticated/dashboard/deliverables.tsx`
- Add `query` state + debounced input at the top of the page.
- Build a lightweight in-memory index over `{label, category, content}` per doc. Score = title hit (×5) + category hit (×3) + content term frequency. Highlight matched snippet (±120 chars around first hit).
- Add filter chips: Category (derived from `typeMap`), Updated (7d/30d/all), plus existing Ready/In progress and Venture filters. Move into a single filter bar.
- Sort dropdown: Relevance (default when query present) · Recently updated · Word count.
- Result cards reuse existing layout but render the matched snippet under the title when searching.

### 2. AI ask (semantic Q&A across all deliverables)
New Edge Function: `supabase/functions/deliverables-ask/index.ts`
- Input: `{ question, snapshot_id?: string }`.
- Loads the user's `venture_documents` (RLS‑scoped via user JWT), chunks each `content` into ~800‑token windows, scores chunks with a cheap keyword+embedding hybrid (use Lovable AI Gateway embeddings `text-embedding-3-small`; cache per doc in a new `venture_document_embeddings` table keyed by `document_id + chunk_index + content_hash`).
- Picks top 8 chunks, calls Lovable AI Gateway chat (`google/gemini-2.5-flash`) with a strict "answer only from sources, cite as [n]" system prompt. Returns `{ answer, citations: [{document_id, snippet, score}] }`.
- Streams response back; UI renders answer card above the result grid with clickable citations that open `DocumentViewer` scrolled to the snippet.

New table (migration):
```
venture_document_embeddings(
  id uuid pk, document_id uuid fk → venture_documents,
  chunk_index int, content_hash text, chunk_text text,
  embedding vector(1536), created_at timestamptz default now(),
  unique(document_id, chunk_index, content_hash)
)
```
- Enable `pgvector`, add ivfflat index on `embedding`.
- RLS: select/insert/delete only where the parent `venture_documents` row belongs to `auth.uid()` (via subquery on `venture_snapshots`).
- GRANTs: `authenticated` select/insert/delete, `service_role` all.
- Embeddings populate lazily on first ask, and refresh when `venture_documents.updated_at` changes (hash mismatch triggers re-embed for that doc only).

### 3. Saved & suggested questions
- Pre-seed 6 suggestion chips derived from the user's doc categories ("Summarize my GTM", "What's our pricing logic?", "Top 3 risks", "Funding ask & use of funds", "Who is our ICP?", "What's in our 90-day plan?").
- Persist last 5 questions in `localStorage` per user for quick re-ask.

### 4. Empty/loading/error states
- Loading skeleton for AI answer card.
- "No matches" hint suggests switching from Search to Ask.
- Credit-limit (403) error → inline message: "Daily AI cap reached — search still works."

## Out of scope
- Cross-venture admin search, public sharing, doc editing. Only retrieval/filtering on the user's own deliverables.

## Technical notes
- All retrieval respects existing RLS on `venture_documents` / `venture_snapshots`; Edge Function uses the user's JWT, not service role.
- Hybrid ranking keeps cost low: keyword pre-filter to ≤30 chunks before embedding similarity rerank.
- Streaming via `ReadableStream` from the Edge Function; UI uses `fetch` + `getReader` (no new deps).
- Reuse `DocumentViewer`; add an optional `initialScrollText` prop to jump to a citation snippet.

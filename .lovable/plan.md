
# Founder Second Brain

A persistent, voice-and-visual command center at `/dashboard/brain` that gives each founder a chat + dashboard bonded to their entire startup context. It can **answer**, **act**, and **coach** — while the marketing `AskConcierge` stays put for site visitors.

## What it does

1. **Answers anything** about the founder's own startup — brief, deliverables, brand, social, content ads, legal setup, roadmap — with citations back to the source card.
2. **Takes actions** via tool-calling: "regenerate my LinkedIn ads," "re-run deep assessment on GTM," "run legal step 4," "generate hero image for Ops plan," etc. Destructive/expensive actions ask for confirmation.
3. **Coaches proactively** — a daily briefing panel: what's stale, what's blocked, what's next, which assessment scored lowest, which asset is still "painting."
4. **Talks & listens** — push-to-talk mic (reuses `venture-transcribe`) and spoken replies (reuses `venture-speak`), plus a compact "voice HUD" on the dashboard.
5. **Remembers** — a persistent `founder_brain_memory` table + pgvector store of every deliverable, assessment, and founder note. Chats and manual notes fold back into memory.

## Visual command center — `/dashboard/brain`

```text
┌───────────────────────────── Founder Brain ─────────────────────────────┐
│  Today's briefing  |  Roadmap next 3  |  Risk flags  |  Voice HUD 🎙️  │
├───────────────────────────────────────────────────────────────────────────┤
│  Left: live status grid          │  Right: chat + voice thread          │
│  • Foundation  4/6 ready         │  🧠 "Show me what's blocking me"     │
│  • Brand       ✓ done            │  → cites Ops doc, opens card         │
│  • Content     12/30 ads         │  [ Mic ] [ Text ] [ Actions ▾ ]      │
│  • Legal       5/7 steps         │                                       │
│  Click any card → deep-link.     │  Streamed reply + inline tool calls   │
└───────────────────────────────────────────────────────────────────────────┘
```

## Technical design

**Data**
- `founder_brain_memory` — `{ id, user_id, kind, source_ref, title, content, embedding vector(3072), updated_at }`. Backfill from `attendee_deliverables`, `deep_assessment`, `attendee_business_brief`, `venture_snapshots.snapshot_brain`, brand/content/legal tables.
- `founder_brain_notes` — freeform notes captured by voice/text; embedded on write.
- `founder_brain_threads` + `founder_brain_messages` — persistent chat threads keyed to user (single-thread default, expandable later). Stores AI SDK `UIMessage[]`.
- All tables: RLS scoped to `auth.uid()`, GRANTs to `authenticated` + `service_role`, admin-bypass policy consistent with the existing impersonation pattern.

**Embeddings & retrieval**
- Model: `google/gemini-embedding-001` via Lovable AI Gateway, `vector(3072)` + HNSW cosine index.
- Reindex hook: DB trigger enqueues a row into `venture_generation_jobs` (`kind='brain_reindex'`) whenever a deliverable/assessment/brand asset changes; edge function `brain-reindex` processes it.

**Edge functions**
- `brain-chat` — AI SDK `streamText` with Gemini 3 Flash, tool calling (`stopWhen: stepCountIs(50)`), retrieves top-k memory + snapshot brain per turn, streams via `toUIMessageStreamResponse`, persists on `onFinish`.
- `brain-reindex` — chunk + embed + upsert into `founder_brain_memory`.
- Reuses existing `venture-transcribe` (STT) and `venture-speak` (TTS).

**Tools exposed to the agent** (all server-side, scoped to `auth.uid()`, admin honors impersonation)
- `search_memory(query)` — vector search over founder's own brain.
- `open_asset(kind, key)` — returns deep-link the UI renders as a card.
- `run_deliverable(key, feedback?)`, `run_deep_assessment(key)`, `generate_hero_image(key)`.
- `regenerate_content_ad(id)`, `regenerate_social_asset(id)` — `needsApproval: true`.
- `save_note(text, tags?)` — writes to `founder_brain_notes`.
- `get_status_snapshot()` — powers the briefing panel.

**Client**
- New route `src/routes/_authenticated/dashboard/brain.tsx` + components under `src/components/brain/`: `BrainDashboard`, `BrainChat` (AI SDK `useChat`, `message.parts` rendering, markdown, tool-call cards), `VoiceHUD` (push-to-talk button reusing `VoiceRecorder`), `BriefingPanel`, `StatusGrid`, `RoadmapNext`, `RiskFlags`, `MemoryNotesDrawer`.
- Sidebar entry "🧠 Brain" under Dashboard.
- Coexists with `AskConcierge` — Concierge stays on marketing routes, hidden on `/dashboard/brain` to avoid double-chat.

**Proactive coach**
- On brain load, `get_status_snapshot()` runs, then a lightweight Gemini Flash call produces a 3-bullet briefing (stalest asset, lowest assessment score, next roadmap step). Cached for 6h in `founder_brain_memory` as `kind='briefing'`.

## Rollout

1. Migration: tables + pgvector + HNSW + GRANTs + RLS + admin bypass.
2. `brain-reindex` edge function + one-shot backfill for existing users.
3. `brain-chat` edge function with retrieval + tool loop.
4. `/dashboard/brain` route and components; sidebar link.
5. Voice HUD wiring on top of existing transcribe/speak functions.
6. Proactive briefing + risk flags.
7. Verify end-to-end: create note by voice → ask about it in a new session → agent retrieves and cites it; run a `regenerate_content_ad` via chat with approval.

## Out of scope (for now)

- Realtime always-on voice (push-to-talk only, per your pick).
- Multi-thread history (single evolving thread; can add threading later without schema break).
- Cross-founder or team memory.

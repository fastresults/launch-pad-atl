
# Ask Startup Labs — Persistent Site Chatbot

A branded chat bubble fixed to the bottom-right on every public page. It answers anything about Startup Labs: the workshop, pricing, cohorts, tracks, the 34 startup assets, Brand/Social/Content Studios, Founder Playbook, refunds, schedule, location, contact — grounded in the site's own copy so answers stay accurate.

## 1. Knowledge base (single source of truth)

Create `src/lib/chatbot-knowledge.ts` that aggregates every user-facing copy source we already own into one structured, versioned corpus. Sections:

- **Offer & pricing**: $197 price, Founders vs Cohort tiers, Atlanta's #1 accelerator positioning, seats/cohort model (from `HomeFramework.tsx`, `services.tsx`, `register/`).
- **Event logistics**: Thu Jul 23, 2026 · Norcross, GA · 20 seats, agenda/day flow (from `dashboard/day.tsx`, `schedule.tsx`).
- **Tracks**: standard + Main Street Startup track.
- **34 startup assets**: names, 40-word descriptions, category, stage — pulled directly from `src/lib/framework-deliverables.ts`.
- **Workshop curriculum**: Foundation, Strategy, Operations, Finance, Governance, Brand, Marketing, Social & Content — titles + summaries from `components/workshop-slides/slides/*`.
- **Studios**: Brand Wizard (two tracks — existing brand vs new), Social Studio, Content Studio (weekly ad accordion), Concept Studio / Epiphany Engine, Founder Playbook + Roadmap, Budget & Pro Forma intake.
- **Policies & meta**: Privacy, Terms, Unsubscribe, Contact, Facilitator info.
- **FAQ seed** (~20 Q/A): "What do I leave with?", "Is this for a Plan B?", "Do I need a business idea already?", "What if I already have a logo/website?", "Refunds?", "Who's it not for?", etc.

Each entry: `{ id, section, title, body, route }` so answers can cite/link back to the relevant page.

## 2. Edge Function: `venture-chatbot`

Server-side streaming chat, mirroring the pattern used by other `venture-*` functions.

- Loads the knowledge corpus (imported from a shared TS module compiled into the function, or duplicated as a `.ts` in `supabase/functions/venture-chatbot/knowledge.ts` generated from `src/lib/chatbot-knowledge.ts` — we'll keep one canonical file and re-export).
- Uses Lovable AI (`google/gemini-3-flash-preview`) via the shared `ai-gateway.ts` helper.
- System prompt: "You are the Startup Labs concierge. Only answer using the provided knowledge. If unknown, offer to connect them via /contact. Never invent pricing, dates, or guarantees. Tone: confident, plainspoken, founder-to-founder."
- Streams via `toUIMessageStreamResponse`.
- CORS enabled; `verify_jwt = false` (public marketing chat, no PII writes).
- Rate limit: soft cap per IP (in-memory best-effort) + 402/429 pass-through toasts.

No DB tables — conversation is ephemeral per browser (localStorage), matching a lightweight marketing chatbot.

## 3. UI: `src/components/site/AskConcierge.tsx`

- Fixed `bottom-6 right-6 z-50` launcher button: circular, brand primary gradient, small "Ask Startup Labs" label on hover, subtle pulse on first visit only.
- Click opens a 380×560 panel (bottom-right anchored, mobile: full-width sheet).
- Built with AI Elements: `Conversation`, `Message`, `MessageResponse`, `PromptInput`, `PromptInputTextarea`, `PromptInputFooter`, `PromptInputSubmit`, `Shimmer`.
- Uses `useChat` + `DefaultChatTransport` pointing at the edge function URL.
- Messages persist in `localStorage` under `sl.concierge.v1` (one conversation, "Clear" button in header).
- Header: small ATL badge icon + "Startup Labs Concierge" + close (×).
- Empty state: 4 suggested chips — "What do I leave with?", "How much is it?", "When's the next cohort?", "Is this right for me?".
- Markdown rendering for assistant answers; auto-link route references (e.g. `/services`, `/register`).
- Textarea auto-focus on open; ESC closes; focus trap while open.

## 4. Brand & styling

Uses existing semantic tokens only (`--primary`, `--background`, `--foreground`, `--accent`, `--border`, `--muted`) — no hardcoded colors. Matches the dark-navy hero aesthetic:

- Launcher: `bg-primary text-primary-foreground shadow-elegant` with subtle ring in `--accent`.
- Panel: `bg-background border-border` with hex-pattern faint background echoing the hero.
- User bubble: `bg-primary text-primary-foreground`. Assistant: no background, plain foreground on panel.
- Typography: inherits site font stack (no new fonts).

## 5. Mount & visibility

- Mounted once in `src/routes/__root.tsx` (or `App.tsx` layout) so it appears on every route.
- Hidden on: `/login`, `/signup`, `/reset-password`, `/unsubscribe`, and inside `_authenticated/dashboard/*` (dashboard has its own tools).
- Admin toggle in `admin.settings.tsx`: `concierge_enabled` in `site_settings` (default on).

## 6. Guardrails

- Edge function refuses off-topic prompts politely and steers back.
- No promises about outcomes, guaranteed funding, legal/tax/medical advice.
- If asked something not in corpus (e.g. "what's the WiFi password"), it says so and links `/contact`.
- All answers stay under ~180 words unless user asks "explain in detail".

## Technical notes

- New files: `src/lib/chatbot-knowledge.ts`, `src/components/site/AskConcierge.tsx`, `src/components/site/AskConcierge.launcher.tsx`, `supabase/functions/venture-chatbot/index.ts`, `supabase/functions/venture-chatbot/knowledge.ts`.
- Modified: `src/routes/__root.tsx` (mount), `src/routes/_authenticated/admin.settings.tsx` (toggle), reuses `edge-errors.ts` for 402/429/403 toasts.
- Install (if missing): AI Elements `conversation message prompt-input shimmer` — check first.
- No DB migrations required unless we add the admin toggle row; that's a single `site_settings` upsert, no schema change.

## Out of scope (call out for approval)

- Human handoff / live chat.
- Multi-thread history or per-user account persistence.
- Analytics dashboards for chat volume (can add later via `email_send_log`-style table if wanted).

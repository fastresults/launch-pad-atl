# Atlanta Viability Snapshot — AI routine on the hero

When someone types "I want to open a daycare" and hits **Start For Free**, they stay on the homepage. A modal opens and an AI routine writes a short, confidence-building profile of that startup in Atlanta, then invites them into the next workshop.

## What the visitor sees

1. Submits the idea in the hero glass card (no navigation away).
2. Modal opens instantly with a skeleton state: "Reading the Atlanta market for *pet grooming van*…"
3. Content streams/loads in, scrollable inside the modal:
   - **Headline verdict** — one line, e.g. "Mobile pet grooming works in Atlanta — here's why."
   - **Why it works here** — 2–3 short paragraphs tied to Atlanta specifics (population growth, suburban sprawl, commute patterns, small-business density, relevant metro dynamics).
   - **Signal cards** — 4 compact stat/fact tiles (market signal, who buys, typical starting price range, realistic first-90-days revenue shape). Each written plainly, no invented precision.
   - **What it takes to start** — 3–5 concrete first moves (license/permit reality, first offer, first 10 customers).
   - **Watch-outs** — 2–3 honest risks, so it reads credible instead of hype.
   - **Invite block** (pinned visually at the end) — next Foundation Workshop, Thursday August 20, 2026, IGNITE Center at Greater Atlanta Christian School, $197 — with **Reserve my seat** (→ `/register?idea=…`) and a secondary "Email me this snapshot" option.
4. Close returns them to the hero, idea preserved.

Tone: the same plainspoken, founder-to-founder voice as the rest of the site. Never promises income. Uses "startup," "assets," and the done-with-you framing per existing copy standards.

## AI behavior and honesty guardrails

- The model is told to ground claims in general, durable Atlanta metro characteristics and to phrase numbers as ranges or directional signals, never fabricated citations or fake percentages with sources.
- If the entered text isn't a startup idea (gibberish, off-topic), it returns a friendly "tell us a bit more" state instead of inventing a market.
- Off-limits: legal/tax/financial advice, guaranteed outcomes, invented studies.

## Technical details

- **New edge function** `atlanta-viability` (public, no auth, CORS like `venture-chatbot`), calling the Lovable AI Gateway via the shared `aiFetch` helper with `openai/gpt-5.6-sol` and `reasoning_effort: "none"`. Structured JSON output (verdict, why_atlanta, signals[], first_moves[], watch_outs[]) so the modal can render real cards instead of a wall of markdown. Input validated and length-capped; rate-limit/credit errors (429/402) surfaced as a readable message with a retry.
- **New component** `src/components/home/IdeaSnapshotModal.tsx` — shadcn `Dialog`, max-height with internal scroll, skeleton → content → error states, mobile-safe.
- **`src/components/home/IdeaPrompt.tsx`** — submit opens the modal and fires the request instead of `navigate("/register?idea=…")`. The register hand-off moves to the modal's CTA.
- Optional email capture reuses the existing inquiries path (`submitInquiry`) so leads land where the others do; no new table needed.
- Requests are not persisted (no PII), matching the existing public chatbot's posture.

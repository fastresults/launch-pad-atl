## Goal

Retire the phrase **"operator-led"** in user-facing copy and replace with **"done-with-you"** — a category term prospects already understand (vs. done-for-you and DIY). Keep internal/technical uses of the noun "operator" intact where they carry meaning (e.g., "an operator applies a CFO lens" inside session descriptions).

## The new positioning line

> **The done-with-you method replacing accelerators, courses, and raw AI.**

Used everywhere the old tagline appeared.

## Files to update

**Public site pages**
- `src/routes/one-on-one.tsx` — 2 hits (meta description + hero subhead)
- `src/routes/webinar.tsx` — 3 hits (meta, subtitle, hero)
- `src/routes/services.tsx` — 2 hits (headline + intro paragraph)
- `src/routes/build.tsx` — 1 hit ("extending the operator-led method…")
- `src/routes/schedule.tsx` — 1 hit ("the operator-led method"); leave the two standalone "operator" noun uses that describe who's applying the lens

**Chatbot & knowledge**
- `src/lib/chatbot-knowledge.ts` — 6 hits total
  - Swap the two tagline instances and the "Operator-led, method-driven" line
  - Soften "operator-led, AI-accelerated methods" → "done-with-you, AI-accelerated methods"
  - Keep "Adam, an operator who's shipped companies" — that's a noun describing Adam, not the jargon phrase

**Funnel report (already delivered)**
- `.lovable/startuplabs-funnel-report.md` and `public/adam-funnel-v1.md` — the report doesn't use "operator-led" (only "Operator Appendix," which is a distinct internal-transparency section name). **No changes.** Confirm with a grep before finishing.

## What stays

- **"Operator Appendix"** in the report — different meaning (internal working docs), not the jargon phrase.
- **"an operator applies a CFO/brand/distribution lens"** in `schedule.tsx` and `curriculum-data.ts` — describes the human doing the work in a session.
- **"Adam, an operator who's shipped companies"** in chatbot knowledge — noun, not tagline.
- **`idealOperator` field** in `business-ideas.ts` — internal data key, never rendered as that string.
- **`Travel › Tour operator`** industry option — unrelated.

## Verification

1. `rg -i "operator-led"` on `src/` and `public/` returns zero hits.
2. `rg "done-with-you"` shows the new tagline in every place the old one lived.
3. Spot-check the three highest-traffic pages (`/`, `/webinar`, `/services`) in the preview to confirm hero + meta read cleanly.

## Out of scope

- No visual/layout changes.
- No edits to the funnel report content or PDF.
- No rewrites of surrounding paragraphs — surgical phrase swap only.

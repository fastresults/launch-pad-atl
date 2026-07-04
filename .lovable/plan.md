# Reframe: "Launch a profitable business in 14 days — with Adam"

## The strategic frame

Right now the copy sells **artifacts** ("20 startup assets," "documents," "AI venture workflow"). Buyers of workshops don't wire money for artifacts — they wire money for **the outcome those artifacts unlock**: a business that makes money, fast, without them quitting their day job on faith.

New positioning, one sentence:

> **Launch a profitable business in 14 days — or a real Plan B by the weekend. Built with Adam, in the room, not by a bot.**

Three pillars every page will hammer:

1. **Outcome, not output.** Lead with "profitable business" / "paying customers" / "first revenue" — not "assets," "deliverables," or "documents."
2. **Human > AI.** Adam is the differentiator. AI is the accelerant behind the curtain; the promise is *Adam's hand on your business*, not "AI does the work." Attendees leave saying "Adam helped me launch," not "the AI made my deck."
3. **Speed to income.** Every format (workshop, webinar, done-for-you) is positioned as **the fastest legitimate path to your first paying customer** — 14 days, not 14 months.

## Copy rules (apply everywhere)

- **Say:** "launch," "profitable," "paying customers," "first revenue," "in 14 days," "Plan B," "your business, live," "built with Adam."
- **Don't say:** "20 startup assets," "deliverables," "documents," "AI venture workflow," "generate," "investor-ready docs" as the hero promise. (Keep these as *supporting proof* deep in the page, never the headline.)
- **Never** put "AI" in a headline or CTA. AI shows up once, low on the page, as "we use AI so Adam can spend the hour on *your* business, not on formatting."
- Keep the existing "startup" vs "business" rule for user-facing nouns describing the thing being built — but the *outcome* is a "profitable business" / "real income."

## Files to audit and rewrite

Hero + primary conversion surfaces (deep rewrite):

1. `src/routes/index.tsx` → `src/components/home/HomeFramework.tsx` and hero components — new H1, subhead, section headers, CTA labels.
2. `src/routes/build.tsx` and `src/routes/build.$slug.tsx` — workshop landing pages.
3. `src/routes/webinar.tsx` — webinar sell page.
4. `src/routes/one-on-one.tsx` — done-for-you with Adam (this one *already* leans human; sharpen the 14-day promise).
5. `src/routes/services.tsx` — reframe services as "what we build for you *after* you're live and taking money."
6. `src/routes/schedule.tsx` — reframe the day as "the day you launch," not "the day you generate assets."
7. `src/routes/facilitator.tsx` — Adam bio page; strengthen "in your room" outcome language.
8. `src/components/register/RegisterFramework.tsx` — hero eyebrow, headline, aside copy, walk-out list, footer line.
9. `src/components/home/AccessModeDialog.tsx` — three-mode picker copy (workshop / webinar / done-for-you).
10. `src/components/facilitator/FacilitatorCTA.tsx` — CTA framing.

Shared strings / config:

11. `src/lib/framework-deliverables.ts` — rename stage descriptions from asset-lists to outcome-statements ("Stage 1: You know exactly who will pay you and why" rather than "5 startup assets"). Keep asset counts as supporting bullets, not the headline.
12. `src/lib/build-workshops.ts` — rewrite `oneLiner`, `subhead`, and `walkOuts` for each build workshop around income/launch outcomes.
13. `src/lib/cohorts.ts` / `src/lib/schedule-data.ts` — session titles/blurbs.
14. `src/lib/chatbot-knowledge.ts` + `supabase/functions/venture-chatbot/knowledge.ts` — update the public chatbot's positioning paragraph so it answers "what is this?" with the new frame (currently answers with capability lists).
15. `index.html` — `<title>` and meta description.

Supporting UI (light copy pass, keep functional labels):

16. `src/components/hub/FoundersHubGate.tsx` — reframe the gate message.
17. `src/components/dashboard/*` — audit any hero/empty-state copy that says "generate documents" → "get to your first customer."
18. Email templates in `src/lib/email-templates/` — confirmation and reply copy.

## Concrete headline swaps (proposed, to be finalized once approved)

| Where | Today | Proposed |
|---|---|---|
| Home H1 | (asset/AI-led) | **Launch a profitable business in 14 days. With Adam, in the room.** |
| Home sub | "20 startup assets…" | "One morning with Adam. Two weeks to your first paying customer — or a Plan B strong enough to leave the day job on your terms." |
| Register eyebrow | "Strategic Foundation Workshop · $197" | "Launch Day with Adam · $197 · Norcross, GA" |
| Register H1 | "Reserve your seat — $197." | "The fastest legal way to your first paying customer." |
| Register aside | "Small cohort, working session…" | "You leave with a live business — offer priced, first channel open, first outreach sent. Not a folder of PDFs." |
| Webinar H1 | (current) | "Launch your business live on Zoom. Two weeks to revenue." |
| One-on-one H1 | (current) | "Skip the build. Adam launches your business *for* you — live in 14 days." |
| Services H1 | (capability list) | "Already live? Here's how Adam's team scales you from first dollar to first hire." |
| AccessModeDialog title | "Three ways to work with Adam" | "Three ways to launch with Adam" |
| Chatbot "what is this?" | capability paragraph | Outcome paragraph led by 14-day launch promise. |

## What I won't change

- Backend field names, DB columns, deliverable keys, admin UI, workflow internals, pricing numbers, or the underlying framework structure. This is a copy/positioning pass on user-facing marketing surfaces only.
- The "startup" vs "business" noun rule stays: the *thing being built* is still "your startup"; the *outcome* is "a profitable business / real income."

## Technical notes

Pure string edits in React components and a few `.ts` copy modules. No schema, no routes, no logic. Chatbot knowledge update requires editing both `src/lib/chatbot-knowledge.ts` and the mirrored `supabase/functions/venture-chatbot/knowledge.ts` (edge function auto-deploys on save).

## Open questions before I start

1. **"14 days"** — is that a promise you'll stand behind publicly, or should I hedge to "2 weeks" / "by month-end"? The number is load-bearing for the whole reframe.
2. **"Plan B" language** — safe to lean into "keep your day job, build your Plan B on the side"? It broadens the audience beyond full-time founders but changes who shows up.
3. Any headlines above you want to lock, kill, or rewrite before I roll them across all surfaces?

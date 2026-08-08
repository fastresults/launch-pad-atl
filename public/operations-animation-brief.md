# Operations — animation brief

Everything needed to animate the **Operations** section of the Startup Labs framework. Live reference: https://startuplabs.online (framework section, Stage 03).

---

## 1. What is "Operations" and its subcomponents?

**Operations is Stage 03 of the Startup Labs framework — what you build, sell, and ship, week after week.**

It's a mentored working session, not a lecture. The founder brings their current workflow, offer, and sales conversations. Staff apply a chief-of-staff lens, question where the founder is the bottleneck, and redirect until the startup could survive without them touching every step. Operations turns Strategy's plan into a machine that runs on repeat.

The assets inside Operations (verbatim from the site):

| # | Asset | What it changes for you |
|---|---|---|
| 01 | **What you'll launch, in what order** | A clear sequence of what you'll launch, in what order, over the next twelve months. You'll stop building features no one asked for, ship the things that drive revenue first, and have a calendar customers can trust. |
| 02 | **How the week actually runs** | The week-by-week workflow that turns your offer into something you can deliver reliably. You'll stop reinventing every order, free up hours each week, and have something a future hire can actually be trained to run. |
| 03 | **What to say to close the sale** | A repeatable script — discovery questions, objections, asks, closes — that moves a stranger to a signed deal. Close more conversations and stop discounting under pressure. |
| 04 | **Where your customers come from** | Your channels, monthly spend, content cadence, and the metrics that tell you what's working. You spend dollars where they return dollars and quietly turn off everything that doesn't. |
| 05 | **How you deliver order #1** | The step-by-step of how order one through ten actually gets delivered — with time and cost per unit. Ship the first sale without scrambling and know your true margin. |
| 06 | **How you answer customers fast** | A shared support inbox, response SLA, canned replies, and refund and return rules — ready before day fifteen problems arrive. Answer the first question inside an hour and never lose a buyer to silence. |
| 07 | **A real link to book a call** | Cal.com or Calendly event types tuned to your sales motion — discovery, working session, onboarding — with routing, reminders, and confirmation copy. |
| 08 | **Every call captured and summarized** | Fathom, Grain, or Fireflies wired up with an AI summary template, tagging convention, and a call-to-content pipeline. Every conversation becomes product and marketing fuel. |
| 09 | **An AI helper for easy questions** | A Chatbase or Intercom Fin bot trained on your own docs, with guardrails and escalation to your support inbox. Deflect the easy 60% of tickets and only see what needs a human. |
| 10 | **5 things you'll stop doing by hand** | Five n8n, Zapier, or Make workflows tuned to your stack — lead → CRM + Slack, sale → welcome + review ask, weekly KPI digest, form → booking, review → wall-of-love. |
| 11 | **Your top 5–10 suppliers, vetted** | *Physical-product startups only.* A shortlist with MOQ, unit cost, lead time, pros/cons, and a first-outreach message you can paste today. |
| 12 | **What each unit really costs you** | *Physical-product startups only.* Bill of materials, unit cost stack, freight/duty/landed-cost math, and break-even units at your current price. |

**For the 30-second cut, animate the first eight.** Assets 11 and 12 are conditional (physical product) — hold them for a longer cut or a product-startup variant.

---

## 2. Design system

Use the site's own tokens — do not invent a palette.

**Typefaces**
- Display / headlines: **Outfit** (300–700), tight tracking, semibold for titles.
- Body / UI: **DM Sans** (300–700).

**Color (dark theme is the default surface)**

| Token | Dark | Light |
|---|---|---|
| Background | `oklch(0.14 0.02 280)` — near-black violet | `oklch(0.99 0 0)` |
| Foreground (ink) | `oklch(0.98 0 0)` | `oklch(0.18 0.02 280)` |
| Primary / accent | `oklch(0.68 0.28 290)` — electric violet | `oklch(0.58 0.28 290)` |
| Muted surface | `oklch(0.28 0.04 290)` | `oklch(0.94 0.02 290)` |

**Shape & motion**
- Base radius `0.75rem`; cards step up to `1.25–1.5rem`. No hard corners.
- Each framework stage carries a hand-drawn animated line mark (single-weight strokes, self-drawing paths, small looping accents in the primary violet, `currentColor` for ink). Operations' mark is a gear-and-loop idea — machinery that keeps turning. Match that language: line-drawn, restrained, no gradients-on-white, no generic 3D.
- Motion vocabulary: stroke-draw in, gentle 4–6s loops, easing `cubic-bezier(0.22, 1, 0.36, 1)`. Honor `prefers-reduced-motion` by holding the resting frame.
- Operations-specific motif: a five-column Kanban that fills left to right (intake → produce → deliver → invoice → follow-up), and a loop arrow that closes the cycle.

---

## 3. Video format

**16:9 landscape** — primary, sits inside the framework section on desktop.
Also deliver a **9:16 vertical** cut for social (same beats, stacked type, safe margins for platform UI).

---

## 4. Length

**~30 seconds.** A 4-second open, eight assets at ~2.5s each, and a 5-second close on the CTA. A 15-second cutdown (open + weekly loop / sales script / channels / first-hire + CTA) is a useful bonus for paid social.

---

## 5. Who is it for?

**Prospects visiting the site.** Specifically:
- First-time founders with an idea and no coherent plan.
- Plan-B seekers about to go full-time on a side hustle.
- Main Street and trades operators who are the bottleneck in their own week.
- Family and couple operators building together.

They are not investors and not technical. They're already busy. They want the week to run without them holding every piece.

---

## 6. Tone of copy

**Punchy & bold.** Short declaratives. Second person. No hype adjectives.

House rules that must hold:
- Say **startup**, never "business."
- Say **asset**, never "document."
- Say **framework**, never "template."
- Never frame the offer as a plan, blueprint, playbook, roadmap, or deliverables. It's a **done-with-you build** — name the real artifact (a mapped weekly loop, a written sales script, a booking link that works).

---

## 7. Beat-by-beat (30s, 16:9)

| Time | On screen | Copy |
|---|---|---|
| 0:00–0:04 | Dark field; a violet line draws a gear, then a loop arrow closes around it | "Every order is a fire drill." |
| 0:04–0:07 | Mark settles top-left; "03 · OPERATIONS" kicker types in | "Stage 03." |
| 0:07–0:26 | Eight cards slide up in sequence, each with its line mark and title | Asset titles, one per beat |
| 0:26–0:30 | Cards snap into a five-column Kanban; the loop arrow completes one turn | "Walk out with a week that runs without you." → **Reserve your seat — $297** |

Close card: wordmark, `startuplabs.online`, and the seat CTA.

---

## 8. Screenshots

Markdown cannot carry image attachments. Visual reference:
- Live framework section: https://startuplabs.online — scroll to "The framework," Stage 03.
- Layout: dark full-bleed section, left column holds the stage number, name, and one-line intro; right column is a two-up grid of asset cards, each a bordered rounded card with a line icon in a tinted violet square, a two-digit index, and the asset title in Outfit semibold.
- The animated stage marks live beside each stage heading and are the visual anchor to carry into the video.

---

# Attendee brief — your Operations session

*For founders registered for a Startup Labs Operations workshop.*

### What Operations is

Stage 03 — the business runs on repeat, not on you. This is a mentored working session, not a drafting stage. You bring your current workflow, your offer, and how your sales conversations actually go. Staff apply a chief-of-staff lens, question every place you're the bottleneck, and redirect until a teammate could take pieces off your plate.

### Before you arrive

Bring your Foundation and Strategy work. Bring the honest version of how a job runs today — how an order comes in, who touches it, what tool it lives in, how you get paid. Bring your last three sales conversations, including the ones you lost. Notes on a napkin are fine; a fictional process is not.

### In the room — the 25-minute core block

The signature build, in this order:

1. **Weekly Ops Loop** — drag your workflow into five Kanban columns: intake → produce → deliver → invoice → follow-up. Owner and tool named for every step.
2. **12-month roadmap** — sequence what you'll launch, revenue-weighted, so the money-making work ships first.
3. **Sales script** — five discovery questions, your top three objections with rebuttal language, and your close.
4. **Channel spend planner** — monthly spend per channel and the one metric you'll watch for each.

Then staff run the Operations Playbook generator on your inputs. The Playbook PDF and Weekly Ops SOP land in your dashboard before you leave the room.

### The assets you walk out with

1. **What you'll launch, in what order** — twelve months sequenced, revenue-weighted.
2. **How the week actually runs** — the five-column loop with owner and tool per step.
3. **What to say to close the sale** — discovery, objections, close, written out.
4. **Where your customers come from** — channels, spend, cadence, one metric each.
5. **How you deliver order #1** — orders one through ten, with time and cost per unit.
6. **How you answer customers fast** — support inbox, SLA, canned replies, refund rules.
7. **A real link to book a call** — event types, routing, reminders, confirmation copy.
8. **Every call captured and summarized** — recorder wired up with summaries and tagging.
9. **An AI helper for easy questions** — trained on your docs, with escalation.
10. **5 things you'll stop doing by hand** — five automations live on your stack.

Physical-product startups also build a **vetted supplier shortlist** and a **true unit-cost stack** with break-even math.

Also released with them: the **Operations Playbook PDF (~15 pages)**, the **Weekly Ops SOP** as a Google Doc and Notion framework with checkboxes ready to run, and a printable **1-page First-Hire SOP** a helper can onboard from in thirty minutes.

### Where the work lives

Everything writes back to your dashboard under the Operations stage. It's editable forever, and Finance reads your unit costs, channel spend, and roadmap straight from here instead of asking you to re-enter them.

### Your first week after

- Run one full week of the Weekly Ops SOP end to end. Log where it breaks on Friday.
- Use the sales script on three real conversations; rewrite the rebuttals from what you actually hear.
- Turn off any channel that misses its one metric for thirty days.

### How you know it worked

You can hand one column of the loop to someone else and the week still ships. And you can name the metric that decides whether next month's spend goes up or off.

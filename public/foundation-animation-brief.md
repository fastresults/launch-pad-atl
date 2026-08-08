# Foundation — animation brief

Everything needed to animate the **Foundation** section of the Startup Labs framework. Live reference: https://startuplabs.online (framework section, Stage 01).

---

## 1. What is "Foundation" and its subcomponents?

**Foundation is Stage 01 of the Startup Labs framework — the bedrock every defensible startup is built on.**

It is the one *drafting* stage. The founder writes the one-page story of their startup — vision, problem, value prop — with worksheet support and AI sharpening in the room. Every stage after Foundation switches modes: those are mentored working sessions that inherit the Foundation language and pressure-test whatever the founder brings in.

The eight assets inside Foundation (verbatim from the site):

| # | Asset | What it changes for you |
|---|---|---|
| 01 | **Your one-page story** | A one-page snapshot of your startup — what you do, who it's for, how you make money, and why now. Hand it to a banker, partner, or future hire and they understand the business in 60 seconds flat. |
| 02 | **What you stand for** | The north-star statement that keeps every decision pointed the same direction. You stop chasing shiny ideas, say no faster, and rally people around a story they want to be part of. |
| 03 | **The problem you solve** | A crisp account of the painful problem and exactly how your offer removes it — in plain language that makes customers nod and buy faster. |
| 04 | **Why customers pick you** | The single sentence explaining why a customer picks you over every alternative, including doing nothing. Homepage, pitch, business card. |
| 05 | **Your day-by-day launch plan** | The dated sprint that sequences every other asset into fourteen blocks — owner, output, and "done" for each. |
| 06 | **Your AI toolkit, picked for you** | Your named AI-first stack: writing, site building, CRM, calendar, email, analytics, support, automation, ads, reviews. No week-one SaaS comparison shopping. |
| 07 | **25 ready-to-use AI prompts** | Twenty-five copy-paste prompts tuned to your venture — cold email, ad hook, weekly recap, competitor scan, invoice draft, refund reply. |
| 08 | **Your weekly rhythm** | Monday plan, daily 10-minute AI standup, Friday retro, and a KPI dashboard with metrics named and sourced. You run the startup on numbers, not vibes. |

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
- Each framework stage already carries a hand-drawn animated line mark (single-weight strokes, self-drawing paths, small looping accents in the primary violet, `currentColor` for ink). Match that: line-drawn, restrained, no gradients-on-white, no generic 3D.
- Motion vocabulary: stroke-draw in, gentle 4–6s loops, easing `cubic-bezier(0.22, 1, 0.36, 1)`. Honor `prefers-reduced-motion` by holding the resting frame.

---

## 3. Video format

**16:9 landscape** — primary, sits inside the framework section on desktop.
Also deliver a **9:16 vertical** cut for social (same beats, stacked type, safe margins for platform UI).

---

## 4. Length

**~30 seconds.** Enough for a 4-second open, eight assets at ~2.5s each, and a 5-second close on the CTA. A 15-second cutdown (open + four assets + CTA) is a useful bonus for paid social.

---

## 5. Who is it for?

**Prospects visiting the site.** Specifically:
- First-time founders with an idea and no coherent plan.
- Plan-B seekers about to go full-time on a side hustle.
- Main Street and trades operators who need a real foundation, not a Shark Tank pitch.
- Family and couple operators building together.

They are not investors and not technical. They are tired of research and want to leave with something real.

---

## 6. Tone of copy

**Punchy & bold.** Short declaratives. Second person. No hype adjectives, no "unlock your potential."

House rules that must hold:
- Say **startup**, never "business."
- Say **asset**, never "document."
- Say **framework**, never "template."
- Never frame the offer as a plan, blueprint, playbook, roadmap, or deliverables. It is a **done-with-you build** — name the real artifact.

---

## 7. Beat-by-beat (30s, 16:9)

| Time | On screen | Copy |
|---|---|---|
| 0:00–0:04 | Dark field, single violet line draws itself into the Foundation mark | "You have an idea. You don't have a foundation." |
| 0:04–0:07 | Mark settles top-left; "01 · FOUNDATION" kicker types in | "Stage 01." |
| 0:07–0:26 | Eight cards slide up in sequence, each with its line mark and title | Asset titles, one per beat |
| 0:26–0:30 | Cards collapse into a single stacked page; violet underline sweeps | "Walk in with an idea. Walk out with the foundation." → **Reserve your seat — $297** |

Close card: wordmark, `startuplabs.online`, and the seat CTA.

---

## 8. Screenshots

Markdown cannot carry image attachments. Visual reference:
- Live framework section: https://startuplabs.online — scroll to "The framework," Stage 01.
- Layout: dark full-bleed section, left column holds the stage number, name, and one-line intro; right column is a two-up grid of asset cards, each a bordered rounded card with a line icon in a tinted violet square, a two-digit index, and the asset title in Outfit semibold.
- The animated stage marks live beside each stage heading and are the visual anchor to carry into the video.

---

# Attendee brief — your Foundation session

*For founders registered for a Startup Labs Foundation workshop.*

### What Foundation is

Stage 01 — the bedrock every defensible startup is built on. It's the one drafting stage of the whole framework. You write the one-page story of your startup with worksheet support and AI sharpening. Every stage after this one is a mentored working session that inherits your Foundation language and pressure-tests what you bring in. Get this right and everything downstream gets easier.

### Before you arrive

Bring the idea, an open laptop, and any copy you've already written — a landing page draft, a note in your phone, a half-finished pitch. No prep deck. No research homework. Showing up with an unfinished idea is the normal starting condition.

### In the room — the 25-minute core block

You draft the Foundation four, in this order:

1. **Why customers pick you** — written first, using the frame *[Who] + [Problem] + [Outcome] + [Unfair advantage]*. One sentence. Rewrite it until a stranger can repeat it.
2. **Vision and mission, side by side** — the ten-year picture next to what you do every day.
3. **The problem you solve** — named in the customer's own words, not yours.
4. **Your one-page story** — written last, because it's a distillation of the other three.

You'll be pushed on specificity. Vague answers get sent back.

### The eight assets you walk out with

1. **Your one-page story** — the 60-second version of your startup, sharp enough to open any conversation.
2. **What you stand for** — the north star that makes saying no fast and easy.
3. **The problem you solve** — the pain, in plain language, and how you remove it.
4. **Why customers pick you** — the one line that beats every alternative, including doing nothing.
5. **Your day-by-day launch plan** — fourteen dated blocks with owner, output, and "done."
6. **Your AI toolkit, picked for you** — the named stack, so Day 2 starts with links, not tabs.
7. **25 ready-to-use AI prompts** — tuned to your venture, reusable every week.
8. **Your weekly rhythm** — Monday plan, daily 10-minute standup, Friday retro, KPIs with sources.

### Where the work lives

Every asset lands in your dashboard under the Foundation stage the moment it's written. It's yours, editable forever, and every downstream stage reads from it as the source of truth. Change your positioning in month three and the rest follows.

### Your first 48 hours after

- Paste the "why customers pick you" line into your homepage hero.
- Test your one-page story on three people who fit your buyer profile. Refine wherever they get confused — confusion is data, not rejection.

### How you know it worked

A stranger can repeat your one-liner back to you correctly. That's the bar. Nothing else in Foundation matters if that fails, and almost nothing downstream is hard once it passes.

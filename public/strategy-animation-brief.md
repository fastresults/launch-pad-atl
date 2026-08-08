# Strategy — animation brief

Everything needed to animate the **Strategy** section of the Startup Labs framework. Live reference: https://startuplabs.online (framework section, Stage 02).

---

## 1. What is "Strategy" and its subcomponents?

**Strategy is Stage 02 of the Startup Labs framework — how you win, and how you compound the lead.**

It's a mentored working session, not a lecture. The founder brings their Foundation plus a first attempt at market, buyer, and wedge. Staff apply an operator's lens, redirect what's fuzzy, and sharpen the plan live. Strategy turns Foundation's truth into the moves that put real customers on the calendar.

The eight assets inside Strategy (verbatim from the site):

| # | Asset | What it changes for you |
|---|---|---|
| 01 | **How big the opportunity is** | A grounded read of the real opportunity in your city, category, and price band. You stop guessing if demand exists and start sizing spend, hiring, and pricing with numbers behind you. |
| 02 | **Who you're selling to** | Vivid profiles of the two or three people most likely to buy — pain, budget, vocabulary, buying triggers. Every ad, email, and call lands with someone you can picture by name. |
| 03 | **How you beat the alternatives** | An honest map of who else is in the ring and the wedge only you can own. You stop competing on price and win the comparison conversation. |
| 04 | **Your first 90 days** | The exact sequence of channels, offers, and moves from zero to first paying customers — mapped step by step. |
| 05 | **How you sound everywhere** | Core message, tone, and proof points so site, social, sales calls, and packaging finally line up as one voice. |
| 06 | **Your first 50 people to call** | Fifty named prospects with contact, angle, and the specific ask. A pipeline, not a persona — first conversations start the same afternoon. |
| 07 | **A 48-hour demand test** | A deposit, LOI, or paid pilot that proves real demand before the full site ships. You build for buyers you've already met. |
| 08 | **A place to track every deal** | A ready-to-import CRM (Attio, Folk, or HubSpot Free) with stages, fields, saved views, and your First-50 pre-loaded. |

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

Strategy's stage accent on the site leans magenta (`--brand-magenta`) against the same violet primary — use it sparingly for the stage kicker and the wedge/target motif.

**Shape & motion**
- Base radius `0.75rem`; cards step up to `1.25–1.5rem`. No hard corners.
- Each framework stage carries a hand-drawn animated line mark (single-weight strokes, self-drawing paths, small looping accents in the primary violet, `currentColor` for ink). Strategy's mark is a target/crosshair-and-path idea — match that language: line-drawn, restrained, no gradients-on-white, no generic 3D.
- Motion vocabulary: stroke-draw in, gentle 4–6s loops, easing `cubic-bezier(0.22, 1, 0.36, 1)`. Honor `prefers-reduced-motion` by holding the resting frame.

---

## 3. Video format

**16:9 landscape** — primary, sits inside the framework section on desktop.
Also deliver a **9:16 vertical** cut for social (same beats, stacked type, safe margins for platform UI).

---

## 4. Length

**~30 seconds.** A 4-second open, eight assets at ~2.5s each, and a 5-second close on the CTA. A 15-second cutdown (open + market/buyer/wedge/90-days + CTA) is a useful bonus for paid social.

---

## 5. Who is it for?

**Prospects visiting the site.** Specifically:
- First-time founders with an idea and no coherent plan.
- Plan-B seekers about to go full-time on a side hustle.
- Main Street and trades operators who need a real strategy, not a Shark Tank pitch.
- Family and couple operators building together.

They are not investors and not technical. They've read enough. They want customers on the calendar.

---

## 6. Tone of copy

**Punchy & bold.** Short declaratives. Second person. No hype adjectives.

House rules that must hold:
- Say **startup**, never "business."
- Say **asset**, never "document."
- Say **framework**, never "template."
- Never frame the offer as a plan, blueprint, playbook, roadmap, or deliverables. It's a **done-with-you build** — name the real artifact (sized market, fifty named prospects, a signed pilot).

---

## 7. Beat-by-beat (30s, 16:9)

| Time | On screen | Copy |
|---|---|---|
| 0:00–0:04 | Dark field; a violet line draws a target, then a path cuts across it | "Everyone's competing. Almost nobody has a wedge." |
| 0:04–0:07 | Mark settles top-left; "02 · STRATEGY" kicker types in | "Stage 02." |
| 0:07–0:26 | Eight cards slide up in sequence, each with its line mark and title | Asset titles, one per beat |
| 0:26–0:30 | Cards collapse into a 90-day ribbon; fifty small dots resolve into a list | "Walk out with a sized market, fifty names, and the first ninety days." → **Reserve your seat — $297** |

Close card: wordmark, `startuplabs.online`, and the seat CTA.

---

## 8. Screenshots

Markdown cannot carry image attachments. Visual reference:
- Live framework section: https://startuplabs.online — scroll to "The framework," Stage 02.
- Layout: dark full-bleed section, left column holds the stage number, name, and one-line intro; right column is a two-up grid of asset cards, each a bordered rounded card with a line icon in a tinted violet square, a two-digit index, and the asset title in Outfit semibold.
- The animated stage marks live beside each stage heading and are the visual anchor to carry into the video.

---

# Attendee brief — your Strategy session

*For founders registered for a Startup Labs Strategy workshop.*

### What Strategy is

Stage 02 — sized market, named buyer, first 90 days. Unlike Foundation, this is not a drafting stage: it's a mentored working session. You bring your Foundation and a first attempt at market, buyer, and wedge. Staff question what's fuzzy and sharpen the plan on screen with you. You leave with reviewed working drafts, not blank worksheets.

### Before you arrive

Bring your Foundation four (one-page story, what you stand for, the problem you solve, why customers pick you). Bring your ZIP code, your category, and the price band you think you'll charge. If you've had even one real customer conversation, bring the transcript or your notes — it becomes your persona canvas in the room.

### In the room — the 25-minute core block

The signature build, in this order:

1. **Size the market** — enter ZIP + category + price band; TAM/SAM/SOM is sized on screen with cited sources.
2. **Name the buyer** — paste one customer interview transcript; two personas come out with pain, budget, and vocabulary.
3. **Find the wedge** — score three alternatives; the wedge statement gets written from the gaps.
4. **Sequence the first 90 days** — week by week: channel, offer, one metric.

Then staff run the Strategy Brief generator on your inputs. The Brief PDF and your five outreach messages land in your dashboard before you leave the room.

### The eight assets you walk out with

1. **How big the opportunity is** — TAM/SAM/SOM sized for your ZIP, category, and price band, with sources.
2. **Who you're selling to** — two or three personas with pain, budget, vocabulary, and buying triggers.
3. **How you beat the alternatives** — competitive matrix plus the wedge statement only you can own.
4. **Your first 90 days** — a week-by-week GTM sequencer: channel, offer, one metric.
5. **How you sound everywhere** — core message, tone, and proof points, consistent across every surface.
6. **Your first 50 people to call** — named, with contact, angle, and the specific ask.
7. **A 48-hour demand test** — a deposit, LOI, or paid pilot you can run this week.
8. **A place to track every deal** — CRM configured with stages, fields, saved views, and your First-50 pre-loaded.

Also released with them: the **Strategy Brief PDF (8–10 pages)**, a **5-message outreach pack** (cold email, LinkedIn DM, warm intro ask, referral request, follow-up) written in your voice, and printable **Persona Cards** for the wall.

### Where the work lives

Everything writes back to your dashboard under the Strategy stage. It's editable forever, and downstream stages — Operations, Brand, Marketing — read from your personas, wedge, and 90-day sequence rather than asking you to repeat yourself.

### Your first week after

- **Monday:** send outreach message #1 to ten people who fit your persona.
- Log every response in the 90-Day Sequencer; refine your hooks on Friday.
- Test your "why customers pick you" line on three real buyers this week.

### How you know it worked

You can say who your buyer is, why they pick you over the alternatives, and what you're doing in week three — without hedging. And there are ten real names in your pipeline by the end of the first Monday.

# Finance — animation brief

Everything needed to animate the **Finance** section of the Startup Labs framework. Live reference: https://startuplabs.online (framework section, Stage 04).

---

## 1. What is "Finance" and its subcomponents?

**Finance is Stage 04 of the Startup Labs framework — the numbers investors, banks, and you can trust.**

It's a mentored working session, not a lecture. The founder brings pricing, cost, cadence, and a funding hypothesis. Staff apply a CFO-and-investor lens, challenge assumptions, and redirect until the model, the unit economics, and the capital path hold up under real scrutiny. Finance turns Operations' machine into a model you can defend in a money conversation.

The eight assets inside Finance (verbatim from the site):

| # | Asset | What it changes for you |
|---|---|---|
| 01 | **Your 12-month money picture** | A twelve-month P&L and cash flow you can defend to a banker, partner, or yourself. You'll see exactly when cash gets tight, what a slow month does, and the few levers that actually change the trajectory. |
| 02 | **What one customer is really worth** | The math on what one customer truly costs to win and what they pay back over time. You'll price with confidence, kill unprofitable offers, and finally know whether spending more on marketing makes you more money or less. |
| 03 | **How you'll pay for growth** | A clear-eyed plan for how you'll fund the startup — bootstrap, savings, grants, a loan, friends and family, or investors. You'll stop chasing the wrong kind of money and pursue the cheapest capital that actually fits. |
| 04 | **What you'll spend, month by month** | A line-by-line budget and forecast tied to real assumptions about your market and pricing. You'll walk into a bank, an SBA meeting, or a landlord conversation with the asset they expect. |
| 05 | **Your story on 10 slides** | A tight slide-by-slide outline of the story that gets a partner, investor, or first big customer to lean in. A narrative spine you reuse for every important conversation. |
| 06 | **A live way to take money** | A live Stripe account, tax and payout wired, receipts branded, and one working checkout link tied to your offer. You'll collect money on day fourteen instead of promising invoices you can't send. |
| 07 | **A business bank, books, and a debit card** | Bank account opened, debit card in hand, books tool connected, and a clean chart of accounts seeded to your model. Personal and business separated from dollar one. |
| 08 | **Your prices, in writing** | Your packaged tiers, terms, what's included and what's not — the artifact your checkout link points at and your sales conversations close against. Stop negotiating from scratch; protect your margin. |

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
- Each framework stage carries a hand-drawn animated line mark (single-weight strokes, self-drawing paths, small looping accents in the primary violet, `currentColor` for ink). Finance's mark is a rising line-chart-and-coin idea. Match that language: line-drawn, restrained, no gradients-on-white, no generic 3D. No stock-ticker clichés, no dollar-sign confetti.
- Motion vocabulary: stroke-draw in, gentle 4–6s loops, easing `cubic-bezier(0.22, 1, 0.36, 1)`. Honor `prefers-reduced-motion` by holding the resting frame.
- Finance-specific motif: a twelve-column bar strip that fills month by month, with a cash line dipping and recovering — the "when cash gets tight" moment is the emotional beat.

---

## 3. Video format

**16:9 landscape** — primary, sits inside the framework section on desktop.
Also deliver a **9:16 vertical** cut for social (same beats, stacked type, safe margins for platform UI).

---

## 4. Length

**~30 seconds.** A 4-second open, eight assets at ~2.5s each, and a 5-second close on the CTA. A 15-second cutdown (open + money picture / unit economics / funding path / checkout link + CTA) is a useful bonus for paid social.

---

## 5. Who is it for?

**Prospects visiting the site.** Specifically:
- First-time founders with an idea and no coherent plan.
- Plan-B seekers about to go full-time on a side hustle.
- Main Street and trades operators heading into a bank or SBA meeting.
- Family and couple operators building together.

They are not accountants and not investors. Spreadsheets intimidate them. They want to know when cash gets tight and how they'll pay for growth — in plain language.

---

## 6. Tone of copy

**Punchy & bold.** Short declaratives. Second person. No hype adjectives, no finance jargon that needs a footnote.

House rules that must hold:
- Say **startup**, never "business."
- Say **asset**, never "document."
- Say **framework**, never "template."
- Never frame the offer as a plan, blueprint, playbook, roadmap, or deliverables. It's a **done-with-you build** — name the real artifact (a live P&L, a working checkout link, a business bank account).

---

## 7. Beat-by-beat (30s, 16:9)

| Time | On screen | Copy |
|---|---|---|
| 0:00–0:04 | Dark field; a violet line draws twelve rising bars, then a cash line dips below zero | "Most founders find out too late." |
| 0:04–0:07 | Mark settles top-left; "04 · FINANCE" kicker types in | "Stage 04." |
| 0:07–0:26 | Eight cards slide up in sequence, each with its line mark and title | Asset titles, one per beat |
| 0:26–0:30 | Cards collapse into a P&L sheet; a checkout link pings and the cash line lifts | "Walk out with numbers you can defend — and a link that takes money." → **Reserve your seat — $297** |

Close card: wordmark, `startuplabs.online`, and the seat CTA.

---

## 8. Screenshots

Markdown cannot carry image attachments. Visual reference:
- Live framework section: https://startuplabs.online — scroll to "The framework," Stage 04.
- Layout: dark full-bleed section, left column holds the stage number, name, and one-line intro; right column is a two-up grid of asset cards, each a bordered rounded card with a line icon in a tinted violet square, a two-digit index, and the asset title in Outfit semibold.
- The animated stage marks live beside each stage heading and are the visual anchor to carry into the video.

---

# Attendee brief — your Finance session

*For founders registered for a Startup Labs Finance workshop.*

### What Finance is

Stage 04 — bank-ready numbers, the cheapest capital, and deck v1. This is a mentored working session, not a drafting stage. You bring pricing, cost, cadence, and a funding hypothesis. Staff apply a CFO-and-investor lens, challenge the assumptions that don't hold, and rebuild the model with you on screen until it survives scrutiny.

### Before you arrive

Bring your Operations work — unit costs, channel spend, and roadmap. Bring your actual prices, your best guess at monthly costs (rent, tools, contractors, materials), your expected order cadence, and how you *think* you'll fund the first year. If you have any real revenue or receipts, bring them. Guesses are fine as long as you can say where they came from.

### In the room — the 25-minute core block

The signature build, in this order:

1. **12-month P&L** — enter pricing, cost, and cadence; revenue, COGS, opex, cash, and runway calculate live with real formulas.
2. **CAC / LTV** — enter channel spend and close rate; what a customer costs and what they pay back, computed for your first channel.
3. **Funding decision tree** — six questions return your cheapest capital path (bootstrap, SBA, grants, friends and family, equity) with next-step contacts.
4. **10-slide pitch outline** — auto-populated from your Foundation story, market size, and the model you just built: problem, solution, market, offer, traction, model, GTM, team, ask, use of funds.

Then staff run the Finance Packet generator on your inputs. It lands in your dashboard before you leave the room.

### The eight assets you walk out with

1. **Your 12-month money picture** — P&L and cash flow with live formulas; change one price and the model updates.
2. **What one customer is really worth** — CAC and LTV, calculated, not guessed.
3. **How you'll pay for growth** — your cheapest capital path, chosen, with contacts.
4. **What you'll spend, month by month** — line-by-line budget tied to real assumptions.
5. **Your story on 10 slides** — the narrative spine you reuse in every money conversation.
6. **A live way to take money** — Stripe live, tax and payouts wired, one working checkout link.
7. **A business bank, books, and a debit card** — accounts separated from dollar one, chart of accounts seeded.
8. **Your prices, in writing** — packaged tiers and terms your checkout points at.

Also released with them: the **12-Month Pro Forma XLSX** with live formulas, the **Funding Strategy Memo PDF**, **Pitch Deck v1** (PPTX + Google Slides), and a **Unit Economics XLSX** you tune monthly.

### Where the work lives

Everything writes back to your dashboard under the Finance stage. It's editable forever, and Governance reads your entity assumptions and revenue model from here instead of asking you to repeat yourself.

### Your first week after

- **Book one banker or SBA meeting this week** using the Pro Forma and the Funding Memo.
- Send Pitch Deck v1 to one warm connection for feedback inside seven days.
- Tune Unit Economics on the dashboard as real numbers come in — monthly, not annually.

### How you know it worked

You can say, without hedging, which month cash gets tight, what one customer is worth, and exactly how you'll fund the gap. And someone can pay you today through a link you own.

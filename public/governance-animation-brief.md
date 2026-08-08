# Governance — animation brief

Everything needed to animate the **Governance** section of the Startup Labs framework. Live reference: https://startuplabs.online (framework section, Stage 05).

---

## 1. What is "Governance" and its subcomponents?

**Governance is Stage 05 of the Startup Labs framework — the legal and risk scaffolding that keeps you bankable.**

It is a mentored working session, not a drafting stage. You bring your revenue plan, ownership picture, and top worries. Staff apply a small-business-counsel lens, redirect on entity choice, walk you through the filings live, and pressure-test the risks you're most exposed to. The stage one-liner: **legally live this week.**

The six assets inside Governance (verbatim from the site):

| # | Asset | What it changes for you |
|---|---|---|
| 01 | **How to set the business up right** | A plain-English recommendation on entity, ownership, and the contracts you actually need on day one. You set the startup up correctly the first time, protect your personal assets, and avoid the legal cleanup bills founders pay later. |
| 02 | **What could go wrong — and the fix** | An honest list of what could derail the startup — and the specific moves that defuse each one. You sleep better, get insurance priced right, and stop being blindsided by predictable problems. |
| 03 | **The advisors in your corner** | A lightweight structure for advisors, mentors, or partners who hold you accountable and open doors. Smarter outside counsel in the room, faster decisions, credibility with banks and serious customers. |
| 04 | **The customer-facing legal set** | Terms of service, privacy policy, and refund policy tuned to your offer. You pass Stripe review, procurement, and app review the first time. |
| 05 | **The insurance customers ask about** | A general-liability and E&O quote path with the exact coverage buyers, landlords, and venues ask about. You answer the first COI request the same day. |
| 06 | **Contracts for your first hire** | MSA, statement of work, W-9, and IP assignment — ready to send to your first contractor before they touch anything. Hire fast, protect the work, file cleanly at year-end. |

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

**Governance motif:** a line-drawn shield built from a stamped seal and a balance beam — the seal draws itself, the beam settles level, a stamp taps once and locks. Filing-doc corners tick into place as each asset lands.

---

## 3. Video format

**16:9 landscape** — primary, sits inside the framework section on desktop.
Also deliver a **9:16 vertical** cut for social (same beats, stacked type, safe margins for platform UI).

---

## 4. Length

**~30 seconds.** A 4-second open, six assets at ~3s each, and a 6-second close on the CTA. A 15-second cutdown (open + three assets + CTA) is a useful bonus for paid social.

---

## 5. Who is it for?

**Prospects visiting the site.** Specifically:
- First-time founders operating with no entity and no paperwork.
- Plan-B seekers about to put personal assets behind a side hustle.
- Main Street and trades operators who get asked for a COI and don't have one.
- Family and couple operators splitting ownership on a handshake.

They are not lawyers and not investors. They want to be legally live this week, not to study corporate law.

---

## 6. Tone of copy

**Punchy & bold.** Short declaratives. Second person. No hype adjectives, no legalese theater.

House rules that must hold:
- Say **startup**, never "business."
- Say **asset**, never "document."
- Say **framework**, never "template."
- Never frame the offer as a plan, blueprint, playbook, roadmap, or deliverables. It is a **done-with-you build** — name the real artifact (EIN issued, formation doc pre-filled, contracts signable).

---

## 7. Beat-by-beat (30s, 16:9)

| Time | On screen | Copy |
|---|---|---|
| 0:00–0:04 | Dark field; a violet line draws a seal, then a shield closes around it | "One bad day shouldn't reach your house." |
| 0:04–0:07 | Mark settles top-left; "05 · GOVERNANCE" kicker types in | "Stage 05." |
| 0:07–0:11 | Entity decision tree: five questions collapse into one answer chip — LLC | "Structure chosen. Live." |
| 0:11–0:15 | Formation doc fills itself; a stamp taps; EIN letter slides in | "EIN applied for in the room." |
| 0:15–0:19 | Risk grid: eight dots plotted on likelihood × impact, top three light violet | "Top risks named. Top three defused." |
| 0:19–0:26 | Remaining asset cards stack up — legal set, insurance, first-hire contracts, advisors | Asset titles, one per beat |
| 0:26–0:30 | Cards collapse into a signed folio; violet underline sweeps | "Walk in exposed. Walk out legally live." → **Reserve your seat — $297** |

Close card: wordmark, `startuplabs.online`, and the seat CTA.

---

## 8. Screenshots

Markdown cannot carry image attachments. Visual reference:
- Live framework section: https://startuplabs.online — scroll to "The framework," Stage 05.
- Layout: dark full-bleed section, left column holds the stage number, name, and one-line intro; right column is a two-up grid of asset cards, each a bordered rounded card with a line icon in a tinted violet square, a two-digit index, and the asset title in Outfit semibold.
- The animated stage marks live beside each stage heading and are the visual anchor to carry into the video.

---

# Attendee brief — your Governance session

*For founders registered for a Startup Labs Governance workshop.*

### What Governance is

Stage 05 — the structure that lets you sleep, and lets the startup outlive a bad week. It's a **mentored working session**, 25 minutes of core build time. You bring the material; staff apply a small-business-counsel lens, redirect on entity choice, walk the filings with you live, and pressure-test the risks you're most exposed to. Governance protects what Finance is building.

### Before you arrive

Bring:
- Your revenue plan and rough salary expectation for year one (this drives the entity answer).
- The ownership picture — who owns what, and any promises already made verbally.
- Your top three worries about what could go wrong.
- Legal name spelling, home/business address, and SSN or ITIN for the EIN application.
- A laptop and a card for the state filing fee if you want to submit the same day.

No legal research homework. Showing up unincorporated is the normal starting condition.

### In the room — the 25-minute core block

**Signature build — entity, filing, EIN, risk**

1. **Entity decision tree** — five questions tuned to your revenue and salary plans produce a plain-English recommendation: LLC, S-Corp, or Sole Prop.
2. **State filing** — confirm your name on the Secretary of State business search, set a registered agent, and pre-fill the formation doc (all 50 states walked).
3. **EIN, applied for live** — submitted through the IRS portal in the room; the confirmation letter is saved to your dashboard.
4. **Risk Register** — score your top eight risks on likelihood × impact; the top three get mitigations drafted on the spot.

Vague answers get sent back. "We'll figure out equity later" is not an answer.

### The six assets you walk out with

1. **How to set the startup up right** — entity, ownership, and day-one contracts, in plain English.
2. **What could go wrong — and the fix** — a scored Risk Register with the top three mitigations drafted.
3. **The advisors in your corner** — a lightweight advisory structure plus three personalized outreach emails.
4. **The customer-facing legal set** — Terms of Service, Privacy Policy, and refund terms tuned to your offer and state.
5. **The insurance customers ask about** — a GL and E&O quote path with the coverage your buyers actually request.
6. **Contracts for your first hire** — MSA, SOW, W-9, and IP assignment, ready to send.

Staff run the Legal Kit generator after the block: Operating Agreement DOCX customized to your members and ownership split, Terms + Privacy, a 1-page Service Agreement / SOW, the Risk Register PDF, and three advisor outreach emails — all staff-reviewed before release to your dashboard.

### Where the work lives

Every asset lands in your dashboard under the Governance stage. It's yours, editable forever. These are working assets — use them as-is to move this week, or hand them to your own counsel for review.

### Your first 48 hours after

- Submit your state's formation doc and filing fee from home (~10 minutes — skip if Sole Prop).
- Open the business bank account once the entity is approved (1–7 days).
- File your local business license and sales-tax registration.
- Send one advisor outreach email this week.

### How you know it worked

You can legally sign a contract, take money, and answer a COI request without scrambling. EIN in hand, formation doc filed, top three risks with a named mitigation each. That's the bar.

# The full framework — single-animation value prompt

One animation. Eight phases. The whole Startup Labs build, end to end — plus the website, the social channels, the campaigns, the Second Brain, and the back-field support from Evove that keeps it all running after you leave the room.

Live reference: https://startuplabs.online

---

## 1. What this animation is

A single ~60-second film that shows a founder walking in with an idea and walking out with a running startup. It is not eight separate videos stitched together — it is one continuous line that keeps drawing: each phase hands its artifact to the next, the artifacts accumulate on screen, and by the close the whole system is visibly wired together and live.

The promise the film has to land: **you don't leave with a plan. You leave with the thing built.**

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
- Hand-drawn animated line marks: single-weight strokes, self-drawing paths, small looping accents in the primary violet, `currentColor` for ink. No gradients-on-white, no generic 3D, no stock iconography.
- Motion vocabulary: stroke-draw in, gentle 4–6s loops, easing `cubic-bezier(0.22, 1, 0.36, 1)`. Honor `prefers-reduced-motion` by holding the resting frame.

**Master motif — the continuous line**

A single violet stroke enters at frame one and never breaks. It draws each phase's mark in turn, and as it leaves each mark the artifact it produced stays behind as a small line card that docks into a growing constellation at the edge of frame. By the final beat, the line has closed a loop around every artifact — and the loop starts pulsing, because the system is now running on its own.

**Per-phase marks (carry the existing stage marks from the site):**

| Phase | Mark |
|---|---|
| 01 Foundation | A cornerstone block setting; scattered fragments snapping into one shape |
| 02 Strategy | A wedge driving into a crowded field; 50 dots lighting up |
| 03 Operations | Interlocking gears turning a weekly loop |
| 04 Finance | A cash line dipping, then recovering above the zero rule |
| 05 Governance | A shield drawn over a balance beam |
| 06 Brand | A swatch fan opening into an emblem |
| 07 Marketing | A wireframe browser assembling itself, then going live |
| 08 Social & Content | A post card emitting concentric ripples over a 90-cell calendar |
| Second Brain | A radial mind map blooming from the center, branches labeling themselves |
| Evove back-field | Hands off-frame drawing in the parts the founder didn't — a quiet second stroke |

---

## 3. Format

**16:9 landscape** — primary, sits at the top of the framework section on desktop.
Also deliver a **9:16 vertical** cut (same beats, stacked type, safe margins for platform UI) and a **15-second cutdown** for paid social: open + Website/Social/Second Brain + CTA.

---

## 4. Length

**~60 seconds.** A 5-second open, eight phases at ~4s each, a 12-second system block (website, channels, campaigns, Second Brain, Evove), and a 7-second close on the CTA.

---

## 5. Who it's for

Prospects visiting the site:
- First-time founders who have been "about to start" for months.
- Plan-B seekers who need something real before they can leave the job.
- Main Street and trades operators running on a Facebook page and a phone number.
- Family and couple operators who got a $20K agency quote and quietly walked away.

They are not marketers, designers, or developers. They want a startup that exists — with a site, an audience, and someone in their corner.

---

## 6. Tone of copy

**Punchy & bold.** Short declaratives. Second person. No hype adjectives, no agency-speak.

House rules that must hold:
- Say **startup**, never "business."
- Say **asset**, never "document."
- Say **framework**, never "template."
- Never frame the offer as a plan, blueprint, playbook, roadmap, or deliverables. It is a **done-with-you build** — name the real artifact (entity filed, page published, first message sent).

---

## 7. Beat-by-beat (60s, 16:9)

| Time | Phase | On screen | Copy |
|---|---|---|---|
| 0:00–0:05 | Open | Dark field. One violet stroke enters and hesitates — a blank frame, nothing in it | "You've had the idea long enough." |
| 0:05–0:09 | 01 Foundation | Fragments snap into a cornerstone; a one-liner types itself beneath | "Foundation. Who you're for, in one line." |
| 0:09–0:13 | 02 Strategy | A wedge drives into a crowded field; 50 dots light up in sequence | "Strategy. Your wedge, and the first 50 names." |
| 0:13–0:17 | 03 Operations | Gears mesh; a week grid fills with repeating blocks | "Operations. The week that runs itself." |
| 0:17–0:21 | 04 Finance | A cash line dips below the rule, then climbs; CAC and LTV pin to the curve | "Finance. Know the number before you spend it." |
| 0:21–0:25 | 05 Governance | A shield draws over a balance beam; an EIN stamps in | "Governance. Filed, insured, bankable." |
| 0:25–0:29 | 06 Brand | A swatch fan opens; type locks; an emblem resolves | "Brand. A look that charges more." |
| 0:29–0:33 | 07 Marketing | Wireframe browser assembles; a prompt pastes; the frame fills with a real page | "Marketing. A site that ships." |
| 0:33–0:37 | 08 Social & Content | A post card ripples outward; a 90-cell calendar fills; 14 cells flip to written posts | "Social. Ninety days planned, fourteen written." |
| 0:37–0:41 | The website | The page goes live; a violet underline sweeps the URL; a checkout confirm pings | "Your site is live. It can take money today." |
| 0:41–0:45 | The channels | Handles, bios, and links click into place across four platforms; profiles stop looking abandoned | "Your channels, claimed and consistent." |
| 0:45–0:49 | The campaigns | Twelve ad units deal out like cards; three light up as spend routes to what pays back | "Campaigns running. Spend that pays back." |
| 0:49–0:54 | Second Brain | A radial mind map blooms from center — every asset you built becomes a labeled node; a question types in and the map answers | "Your Second Brain. Every decision you made, ready to ask." |
| 0:54–0:57 | Evove back-field | A quiet second stroke draws in the parts the founder didn't — reviews, filings, deliverability, fixes | "And Evove behind you. Full back-field support." |
| 0:57–1:00 | Close | The line closes the loop around every artifact; the loop pulses | "Walk in with an idea. Walk out running." → **Reserve your seat — $297** |

Close card: wordmark, `startuplabs.online`, and the seat CTA.

---

## 8. The 8 phases, in one page

| # | Phase | What gets built in the room | The artifact you leave with |
|---|---|---|---|
| 01 | **Foundation** | The one-liner, value prop, and personas that everything else is generated from | Your startup stated in one sentence a stranger understands |
| 02 | **Strategy** | The wedge you win first and the named list of who to reach | A First-50 list with real names, not a segment |
| 03 | **Operations** | The weekly cadence, the 12-month roadmap, and the scripts you run | A week that repeats without you reinventing it |
| 04 | **Finance** | P&L model, CAC/LTV math, pricing floor, and a funding memo | The number that tells you when to spend and when to stop |
| 05 | **Governance** | Entity choice, state filing, EIN, insurance, and a risk register | A startup that can open a bank account and sign a contract |
| 06 | **Brand** | Purpose, promise, messaging house, palette, type, and logo direction | An identity that lets you price like the premium option |
| 07 | **Marketing** | Sitemap, Website PRD, copy deck, domain, email, and analytics | A live site with a working offer and tracking behind it |
| 08 | **Social & Content** | Pillars, 90-day calendar, first 14 posts, launch week, ads, referrals | A distribution engine you can actually keep up with |

---

## 9. The system that comes with it

Four things the film must make undeniable — because they're what separates this from a workshop that hands you a binder.

**Your website.** Not a mockup. A real page, on your domain, with your brand tokens, a working form, confirmation emails, and analytics wired before you spend a dollar. A stranger can land on it, understand the offer in ten seconds, and pay you without talking to you.

**Your social channels.** The right handles, bios, and links on the platforms your buyer actually uses — cleaned up, consistent, and pointed at the same place. Stale profiles stop leaking customers.

**Your campaigns.** Twelve ad units mapped to Meta, Google, TikTok, and LinkedIn; target segments, hooks, and budget guardrails tuned to your offer. Launch small, keep what pays back, cut what doesn't.

**Your Second Brain.** Every asset you build becomes a node in a living map of your startup — Foundation feeding Strategy, Strategy feeding Marketing, all of it queryable in plain language. Ask it what your pricing floor was and why, and it answers with the work you actually did. Edit one asset and the rest re-draft around it.

**Full back-field support from Evove.** You are not handed a login and wished luck. Staff review every asset before it hits your dashboard, run the generators between sessions, fix what the AI got wrong, and stay in your corner while you publish, file, wire email, and send the first message. The build is done *with* you — the back field is covered.

---

## 10. Production notes

- One take, one line — never cut to black between phases. Transitions are the stroke traveling, not a fade.
- Vary phase pacing: Foundation and Governance get a beat of stillness; Marketing and Social move fast. Robotic four-second uniformity kills it.
- Artifacts must accumulate — the constellation at frame edge should be visibly heavier at 0:37 than at 0:13. That growth *is* the argument.
- Type: kicker in DM Sans uppercase with wide tracking; headline in Outfit semibold, no more than six words per beat.
- Reduced motion: hold the closing frame — the full constellation with the loop drawn — as the static poster.

---

## 11. Cutdowns

- **15s paid social (9:16):** open (0:00–0:03) → website live (0:03–0:07) → channels + campaigns (0:07–0:10) → Second Brain (0:10–0:12) → CTA (0:12–0:15).
- **6s bumper:** the line closing the loop + "Walk in with an idea. Walk out running." + seat CTA.

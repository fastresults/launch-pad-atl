# Social & Content — animation brief

Everything needed to animate the **Social & Content** section of the Startup Labs framework. Live reference: https://startuplabs.online (framework section, Stage 08).

---

## 1. What is "Social & Content" and its subcomponents?

**Social & Content is Stage 08 of the Startup Labs framework — the distribution engine that earns attention on repeat.**

It is a mentored working session on distribution, not a social-media lecture. You bring your Strategy and Brand. Staff apply a distribution lens, redirect your pillars, sharpen your hooks, and direct a 90-day plan you can actually keep up with. The stage one-liner: **distribution engine live — 14 posts written, 90-day calendar ready.**

The eleven assets inside Social & Content (verbatim from the site):

| # | Asset | What it changes for you |
|---|---|---|
| 01 | **Your social accounts, cleaned up** | A clean review of your current accounts plus the right handles, bios, and links across the platforms your customers actually use. You show up looking professional everywhere — and stop losing customers to a stale profile. |
| 02 | **What you'll post about** | Three to five content themes that consistently attract your buyer and reinforce your positioning. You stop posting random updates and have a topic every time you sit down. |
| 03 | **90 days of posts, planned** | Ninety days of post ideas, hooks, and formats mapped out so you never stare at a blank calendar. You show up consistently and free hours every week. |
| 04 | **Everything you need for launch week** | Ready-to-publish announcement posts, captions, emails, and graphics for your opening week. You launch loud instead of quietly. |
| 05 | **How to reply, DM, and thank people** | Rules and scripts for replies, DMs, reviews, and customer moments that turn followers into fans — word-of-mouth no ad budget can buy. |
| 06 | **A note to send to partners** | A short brief for local influencers, complementary brands, and community partners. Collaborations that put you in front of warm audiences for free. |
| 07 | **Your first paid ad campaign, ready** | Starter ad targets, hooks, and budgets tuned to your offer and buyer. You launch without burning rent money and scale only what pays back. |
| 08 | **How you collect reviews on day 1** | Request templates, direct links to Google, Yelp, or G2, a video-ask script, and a wall-of-love page ready to embed. Public proof from your first happy customer. |
| 09 | **What to send to your first 50** | Cold and warm outreach scripts tied to your First-50 list — opener, follow-up, and the ask. You work the pipeline instead of hoping content does it. |
| 10 | **12 ads ready to run** | Twelve ad units — 4 static image prompts, 4 short-form video scripts, 4 headline+body pairs — mapped to Meta, Google, TikTok, and LinkedIn. |
| 11 | **How happy customers bring you more** | Rewardful, Tolt, or a manual program with terms, invite email, tracking convention, and a first-10-advocates list. Your cheapest channel, running by Day 15. |

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
- Each framework stage carries a hand-drawn animated line mark (single-weight strokes, self-drawing paths, small looping accents in the primary violet, `currentColor` for ink). Match that: line-drawn, restrained, no gradients-on-white, no generic 3D.
- Motion vocabulary: stroke-draw in, gentle 4–6s loops, easing `cubic-bezier(0.22, 1, 0.36, 1)`. Honor `prefers-reduced-motion` by holding the resting frame.

**Social & Content motif:** a line-drawn broadcast ripple — a single post card draws itself, then emits concentric violet rings that pick up small satellite cards (like, reply, share, DM) as they travel outward. Behind it, a 90-cell calendar grid fills in cell by cell, left to right, and a rising engagement line traces above it. Nothing spins; everything propagates.

---

## 3. Video format

**16:9 landscape** — primary, sits inside the framework section on desktop.
Also deliver a **9:16 vertical** cut for social (same beats, stacked type, safe margins for platform UI).

---

## 4. Length

**~30 seconds.** A 4-second open, the asset beats through the middle, and a 6-second close on the CTA. A 15-second cutdown (open + three assets + CTA) is a useful bonus for paid social.

---

## 5. Who is it for?

**Prospects visiting the site.** Specifically:
- First-time founders who post twice, hear nothing, and quit.
- Plan-B seekers who need attention before they can quit the day job.
- Main Street and trades operators with a stale Facebook page and no reviews.
- Family and couple operators who don't have ten hours a week to "do content."

They are not marketers. They want customers, not follower counts.

---

## 6. Tone of copy

**Punchy & bold.** Short declaratives. Second person. No hype adjectives, no agency-speak.

House rules that must hold:
- Say **startup**, never "business."
- Say **asset**, never "document."
- Say **framework**, never "template."
- Never frame the offer as a plan, blueprint, playbook, roadmap, or deliverables. It is a **done-with-you build** — name the real artifact (pillars locked, 14 posts written, calendar exported, first message sent).

---

## 7. Beat-by-beat (30s, 16:9)

| Time | On screen | Copy |
|---|---|---|
| 0:00–0:04 | Dark field; a lone post card draws itself and sends a ripple that fades to nothing | "You post. Nobody answers." |
| 0:04–0:07 | Mark settles top-left; "08 · SOCIAL & CONTENT" kicker types in | "Stage 08." |
| 0:07–0:11 | Four pillar columns rise; each labels itself from positioning and personas | "Three to five pillars. Locked." |
| 0:11–0:16 | A 90-cell calendar grid fills cell by cell; 14 cells flip to written post cards | "Ninety days planned. Fourteen posts written." |
| 0:16–0:20 | Launch Week folder opens — announcement, captions, emails, five graphics fan out | "Launch week, ready to publish." |
| 0:20–0:26 | Remaining asset cards click into orbit — engagement rules, partner note, ads starter, reviews, first-50 outreach, 12 ad units, referrals | Asset titles, one per beat |
| 0:26–0:30 | Ripples now return inbound — replies, saves, a review star, a sale ping | "Walk in with an idea. Walk out with an audience." → **Reserve your seat — $297** |

Close card: wordmark, `startuplabs.online`, and the seat CTA.

---

## 8. Screenshots

Markdown cannot carry image attachments. Visual reference:
- Live framework section: https://startuplabs.online — scroll to "The framework," Stage 08.
- Layout: dark full-bleed section, left column holds the stage number, name, and one-line intro; right column is a two-up grid of asset cards, each a bordered rounded card with a line icon in a tinted violet square, a two-digit index, and the asset title in Outfit semibold.
- The animated stage marks live beside each stage heading and are the visual anchor to carry into the video.

---

# Attendee brief — your Social & Content session

*For founders registered for a Startup Labs Social & Content workshop.*

### What Social & Content is

Stage 08 — the bonus distribution stage that turns a finished startup into one people actually hear about. It's a **mentored working session**. You bring Strategy and Brand; staff apply a distribution lens, redirect your pillars, sharpen your hooks, and direct a 90-day plan you can keep up with at your real hours.

### Before you arrive

Bring:
- Your Foundation (one-liner, personas), Strategy (wedge, First-50 list), and Brand (palette, type, voice).
- Logins for the accounts you already have — even the abandoned ones.
- Your honest weekly time budget for content: 1, 3, or 5 hours. Be honest; the calendar is built to it.
- Your launch date, or the week you want it to be.
- Ten photos or clips from your actual work — real beats stock every time.

No editing skills, no camera gear. "I hate being on camera" is a valid input, not a problem.

### In the room — the core block

**Signature build — pillars, 14 posts, Launch Week**

1. **Pillars** — three to five content themes generated from your positioning and personas, then pressure-tested against your buyer.
2. **90-day calendar** — auto-drafted with hooks, formats, and visual notes; exported as a CSV that imports into Buffer, Later, or Notion.
3. **First 14 posts** — fully written, in LinkedIn and Instagram variants, in your brand voice.
4. **Launch Week kit** — announcement post, five captions, three emails, a share-with-friends message, and five launch graphics.

Vague answers get sent back. "We'll post whenever we have something" is not a cadence.

### The eleven assets you walk out with

1. **Your social accounts, cleaned up** — handles, bios, and links on the platforms your buyer uses.
2. **What you'll post about** — three to five locked pillars.
3. **90 days of posts, planned** — calendar CSV with hooks, formats, and visuals.
4. **Everything you need for launch week** — posts, captions, emails, graphics.
5. **How to reply, DM, and thank people** — engagement rules and scripts.
6. **A note to send to partners** — a short collaboration brief.
7. **Your first paid ad campaign, ready** — 3 target segments, 5 hooks, budget guardrails.
8. **How you collect reviews on day 1** — request scripts, review links, video-ask, wall-of-love page.
9. **What to send to your first 50** — cold and warm outreach with opener, follow-up, and ask.
10. **12 ads ready to run** — 4 image prompts, 4 video scripts, 4 headline+body pairs for Meta, Google, TikTok, LinkedIn.
11. **How happy customers bring you more** — referral program terms, invite email, tracking, first-10 advocates.

Staff release the reviewed Distribution Kit afterward: Content Pillars (PDF), 90-Day Calendar (CSV), First 14 Posts (DOCX), Launch Week Kit, Paid Ads Starter, and five launch graphics (PNG) — all staff-reviewed before they hit your dashboard.

### Where the work lives

Every asset lands in your dashboard under the Social & Content stage. It's yours, editable forever. Edit a pillar and the calendar re-drafts around it.

### Your first 48 hours after

- Schedule the first 14 posts from the calendar CSV.
- Send your announcement email Tuesday morning.
- Send the first ten messages from your First-50 outreach scripts.
- Launch the paid-ads starter test once your site is live.

### What success looks like

Ninety days out, you're not asking what to post. You're posting on a cadence you can hold, replies are coming in, the first reviews are public, and your cheapest channel is a customer telling someone else.

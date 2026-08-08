# Marketing — animation brief

Everything needed to animate the **Marketing** section of the Startup Labs framework. Live reference: https://startuplabs.online (framework section, Stage 07).

---

## 1. What is "Marketing" and its subcomponents?

**Marketing is Stage 07 of the Startup Labs framework — the AI-builder PRD that helps ship your site fast.**

It is a mentored working session on your website plan, not a design critique. You bring your Foundation, Strategy, and Brand. Staff apply a product-and-web lens, review sitemap and calls to action, and direct you toward a build spec you can actually scaffold in an afternoon with an AI builder. The stage one-liner: **a site that ships, not a site that drifts.**

The six assets inside Marketing (verbatim from the site):

| # | Asset | What it changes for you |
|---|---|---|
| 01 | **The build brief for your website** | A complete product requirements asset — pages, copy, sections, calls to action — written so an AI builder can build your site fast. You skip the blank-page guessing and hand a builder the exact structure it needs. |
| 02 | **Domain, business email, and setup** | Domain purchased, business email live, SPF, DKIM, and DMARC set — and a support alias routed to the right person. Your outreach lands in inboxes instead of spam, and you look like a real company from your first email. |
| 03 | **A way to see what's working** | GA4, the ad pixels your channels need, conversion events, and a UTM convention wired before you spend a dollar. You know what actually converted, cut spend that doesn't pay back, and double down on what does. |
| 04 | **The Day-4 page PRD** | A one-page offer-test PRD — sections, copy, form, and calls to action — so your validation page can be built quickly. You have the hook and structure ready before you spend time or money driving traffic. |
| 05 | **The build brief for your pre-sell page** | A scoped one-page PRD — sections, copy, form spec, confirmation emails, analytics, brand tokens — written so Lovable, v0, or Bolt scaffolds your pre-sell page in one shot. Ship in an afternoon, not a weekend. |
| 06 | **Business email that reaches the inbox** | Resend, Loops, or Beehiiv wired to your domain with SPF/DKIM/DMARC, a 5-email welcome sequence, first broadcast, and a deliverability warm-up plan. You stop landing in spam and start owning the audience that keeps buying. |

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

**Marketing motif:** a line-drawn browser frame that assembles itself from a wireframe sitemap — boxes snap into a page, a violet cursor drops into the URL bar, and a publish arrow sweeps the frame live. Small orbiting nodes (domain, email, analytics) click into their sockets around the frame.

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
- First-time founders who have been "about to build the website" for four months.
- Plan-B seekers who need a page that can take money before they commit further.
- Main Street and trades operators running on a Facebook page and a phone number.
- Family and couple operators who got a $20K agency quote and quietly walked away.

They are not developers. They want a live site that sells — not a lesson in web stacks.

---

## 6. Tone of copy

**Punchy & bold.** Short declaratives. Second person. No hype adjectives, no agency-speak.

House rules that must hold:
- Say **startup**, never "business."
- Say **asset**, never "document."
- Say **framework**, never "template."
- Never frame the offer as a plan, blueprint, playbook, roadmap, or deliverables. It is a **done-with-you build** — name the real artifact (PRD assembled, prompt pasted, page published, first email delivered).

---

## 7. Beat-by-beat (30s, 16:9)

| Time | On screen | Copy |
|---|---|---|
| 0:00–0:04 | Dark field; a violet line draws a wireframe browser frame, blank | "Four months. Still no website." |
| 0:04–0:07 | Mark settles top-left; "07 · MARKETING" kicker types in | "Stage 07." |
| 0:07–0:11 | Three sitemap options fan out; one is chosen, pages stack into a tree | "Sitemap picked. Model-matched." |
| 0:11–0:15 | PRD assembles itself — page rows fill with sections, copy blocks, CTAs, image briefs | "Every page, section, and CTA — specified." |
| 0:15–0:19 | Prompt pack: three chips labeled Lovable · Bolt · v0; one is copied, the browser frame fills with a real page | "Paste the prompt. Watch it scaffold." |
| 0:19–0:26 | Remaining asset cards click into sockets — domain + email, analytics, Day-4 page, pre-sell page, welcome sequence | Asset titles, one per beat |
| 0:26–0:30 | Frame goes live; a violet underline sweeps under the URL | "Walk in with an idea. Walk out ready to publish." → **Reserve your seat — $297** |

Close card: wordmark, `startuplabs.online`, and the seat CTA.

---

## 8. Screenshots

Markdown cannot carry image attachments. Visual reference:
- Live framework section: https://startuplabs.online — scroll to "The framework," Stage 07.
- Layout: dark full-bleed section, left column holds the stage number, name, and one-line intro; right column is a two-up grid of asset cards, each a bordered rounded card with a line icon in a tinted violet square, a two-digit index, and the asset title in Outfit semibold.
- The animated stage marks live beside each stage heading and are the visual anchor to carry into the video.

---

# Attendee brief — your Marketing session

*For founders registered for a Startup Labs Marketing workshop.*

### What Marketing is

Stage 07 — the build brief that turns everything you've made into a live site that takes money. It's a **mentored working session**, 25 minutes of core build time. You bring the raw material; staff apply a product-and-web lens, review your sitemap and calls to action, and direct you toward a spec an AI builder can scaffold quickly. Brand supplies the tokens; Marketing turns them into pages.

### Before you arrive

Bring:
- Your Foundation (one-liner, value prop, personas), Strategy (wedge, first 50), and Brand (palette, type, voice).
- Your domain if you own one — plus two backups if you don't.
- Your offer and price, exactly as you'd put it on a page.
- Three sites you'd be happy to be compared to, and one you'd hate.
- A laptop and a card if you want to buy the domain and start scaffolding in-room.

No code, no design files. Showing up with nothing but a napkin sketch is the normal starting condition.

### In the room — the 25-minute core block

**Signature build — sitemap, PRD, Copy Deck**

1. **Sitemap** — pick from three structures matched to your business model. Pages, hierarchy, and primary conversion path locked in one pass.
2. **CTAs and integrations** — choose payments, email, and analytics from the recommended stack, and name the one action every page drives toward.
3. **PRD auto-assembly** — the Website PRD builds from your Foundation, Strategy, and Brand: pages, sections, copy blocks, CTAs, and image briefs.
4. **Copy Deck** — every H1, H2, and body block written in your brand voice, ready to paste.

Vague answers get sent back. "We'll figure out the homepage later" is not a sitemap.

### The six assets you walk out with

1. **The build brief for your website** — the full Website PRD: pages, sections, copy, CTAs, image briefs.
2. **Domain, business email, and setup** — domain, business email, SPF/DKIM/DMARC, and a routed support alias.
3. **A way to see what's working** — GA4, ad pixels, conversion events, and a UTM convention.
4. **The Day-4 page PRD** — a one-page offer test with sections, copy, form, and calls to action.
5. **The build brief for your pre-sell page** — a scoped one-shot PRD with form spec, confirmation emails, analytics, and brand tokens.
6. **Business email that reaches the inbox** — provider wired to your domain, a 5-email welcome sequence, first broadcast, and a warm-up plan.

Staff run the Website Package generator after the block: Website PRD (PDF), an AI-builder Prompt Pack with three tuned prompts for Lovable, Bolt, and v0, the Copy Deck (DOCX), and a Fast Build Checklist — all staff-reviewed before release to your dashboard.

### Where the work lives

Every asset lands in your dashboard under the Marketing stage. It's yours, editable forever. Edit the PRD before you build — the prompt pack regenerates from whatever the PRD says.

### Your first 48 hours after

- Paste your prompt into Lovable, Bolt, or v0 and scaffold the site.
- Connect payments, email, and analytics from the recommended stack.
- Publish v1 against a named deadline — imperfect and live beats perfect and pending.
- Send your first broadcast to whoever is already on your list, even if that's twelve people.

### How you know it worked

A stranger can land on your site, understand the offer in ten seconds, and pay you without talking to you. Your email reaches an inbox, not a spam folder. And your analytics can tell you which channel sent the person who bought. That's the bar.

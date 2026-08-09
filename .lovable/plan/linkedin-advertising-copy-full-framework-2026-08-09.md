# LinkedIn advertising copy — full framework

Create `public/full-framework-linkedin-ads.md` (live at `/full-framework-linkedin-ads.md`), the LinkedIn ad companion to `public/full-framework-animation-brief.md`.

## What goes in it

**1. Targeting + setup notes**
- Audience: Atlanta metro (+30mi Norcross), first-time founders, Plan-B seekers with day jobs, Main Street/trades owners, family/couple operators.
- Suggested objectives: video views for the 60s film, conversions for the seat CTA. Placement notes for the 16:9 and 9:16 cuts.

**2. Single Image / Document ads (5 variants)**
Each with: intro text (first 150 chars carry the hook before "see more"), headline (≤70 chars), description, CTA button choice, destination `startuplabs.online`.
Angles, one per variant:
- The idea you've had too long
- Walk out running (artifacts, not a plan)
- Your site is live and can take money today
- Second Brain — every decision, ready to ask
- Evove back-field: you're not handed a login and wished luck

**3. Video ad copy (3 variants)**
Paired to the 60s film, the 15s cutdown, and the 6s bumper — intro text tuned to each length, plus headline overlays.

**4. Thought-leader / organic-boost post (2 long-form)**
Personal-voice posts built for boosting: 900–1200 chars, first 210 chars doing the work, no link in the first line.

**5. Message ad (1)**
Subject + body, ≤500 words, single CTA.

**6. Retargeting set (2 short variants)**
For video-viewers and site visitors: shorter, seat-scarcity framing, one price mention.

## Copy rules enforced throughout
- "startup" not "business"; "asset" not "document"; "framework" not "template".
- Never a plan/blueprint/playbook/roadmap/deliverables — it is a done-with-you build; name the real artifact (entity filed, page published, first message sent).
- Price ($297) appears at most once per unit. No hype adjectives. Second person, short declaratives.
- Hashtags: 2–3 inline, matching the LinkedIn spec in `src/lib/caption-specs.ts` (3000 char limit, 210-char fold).

## Technical notes
- Markdown only, no code or route changes.
- Mirrors the structure of the existing `public/*-copy.md` files so it can be pasted straight into Campaign Manager.
